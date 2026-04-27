import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExternalDataService } from '../external-data/external-data.service';
import { AIRecommendation, AIRecommendationService } from '../../ai/ai-recommendation.service';
import { ResourceAnalysisService } from '../resource-analysis/resource-analysis.service';
import { AlertService } from '../alert/alert.service';

export interface CreateRecommendationDto {
  type: string;
  title: string;
  description: string;
  priority: number;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  confidenceScore: number;
  actionItems: string[];
  siteId?: string;
  projectId?: string;
  scope?: 'project' | 'site';
}

export interface UpdateRecommendationStatusDto {
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export interface Recommendation {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  estimatedSavings: number;
  estimatedCO2Reduction: number;
  priority: number;
  confidenceScore: number;
  actionItems: string[];
  siteId?: string;
  projectId?: string;
  scope?: 'project' | 'site';
  createdAt: string;
  approvedAt?: string;
  implementedAt?: string;
  beforeMetrics?: any;
  afterMetrics?: any;
  improvement?: any;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectModel('Recommendation') private recommendationModel: Model<Recommendation>,
    private readonly externalDataService: ExternalDataService,
    private readonly aiRecommendationService: AIRecommendationService,
    private readonly resourceAnalysisService: ResourceAnalysisService,
    private readonly alertService: AlertService,
  ) { }

  async create(createRecommendationDto: CreateRecommendationDto): Promise<Recommendation> {
    const newRecommendation = new this.recommendationModel({
      ...createRecommendationDto,
      scope: createRecommendationDto.scope || (createRecommendationDto.projectId ? 'project' : 'site'),
      status: 'pending',
      createdAt: new Date(),
    });
    return newRecommendation.save();
  }

  async findAll(
    siteId?: string,
    status?: string,
    projectId?: string,
    scope?: string,
  ): Promise<Recommendation[]> {
    const query: Record<string, string> = {};
    if (siteId) query.siteId = siteId;
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (scope) query.scope = scope;
    return this.recommendationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getSummary(siteId?: string, projectId?: string, scope?: string): Promise<{
    totalPotentialSavings: string;
    approvedSavings: string;
    realizedSavings: string;
    totalCO2Reduction: string;
  }> {
    const recs = await this.findAll(siteId, undefined, projectId, scope);
    const approved = recs.filter((r) => r.status === 'approved');
    const implemented = recs.filter((r) => r.status === 'implemented');
    return {
      totalPotentialSavings: String(
        recs.reduce((s, r) => s + (Number(r.estimatedSavings) || 0), 0),
      ),
      approvedSavings: String(
        approved.reduce((s, r) => s + (Number(r.estimatedSavings) || 0), 0),
      ),
      realizedSavings: String(
        implemented.reduce((s, r) => s + (Number(r.estimatedSavings) || 0), 0),
      ),
      totalCO2Reduction: String(
        recs.reduce((s, r) => s + (Number(r.estimatedCO2Reduction) || 0), 0),
      ),
    };
  }

  async findOne(id: string): Promise<Recommendation | null> {
    return this.recommendationModel.findById(id).exec();
  }

  async update(id: string, updateRecommendationDto: Partial<Recommendation>): Promise<Recommendation | null> {
    return this.recommendationModel
      .findByIdAndUpdate(id, updateRecommendationDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Recommendation | null> {
    return this.recommendationModel.findByIdAndDelete(id).exec();
  }

  async approveRecommendation(id: string): Promise<Recommendation> {
    // Get recommendation before approval
    const recommendation = await this.recommendationModel.findById(id);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Store "before" metrics for analytics
    const beforeMetrics = await this.captureCurrentMetrics(
      recommendation.siteId,
      recommendation.projectId,
      recommendation.scope,
    );

    // Update recommendation status
    const updatedRecommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedAt: new Date(),
        beforeMetrics: beforeMetrics,
      },
      { new: true }
    );

    this.logger.log(`Recommendation ${id} approved with before metrics captured`);
    return updatedRecommendation;
  }

  async implementRecommendation(id: string): Promise<Recommendation> {
    // Get recommendation
    const recommendation = await this.recommendationModel.findById(id);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Store "after" metrics for analytics
    const afterMetrics = await this.captureCurrentMetrics(
      recommendation.siteId,
      recommendation.projectId,
      recommendation.scope,
    );

    // Calculate improvement
    const improvement = this.calculateImprovement(
      recommendation.beforeMetrics,
      afterMetrics,
      recommendation.type
    );

    // Update recommendation with results
    const updatedRecommendation = await this.recommendationModel.findByIdAndUpdate(
      id,
      {
        status: 'implemented',
        implementedAt: new Date(),
        afterMetrics: afterMetrics,
        improvement: improvement,
      },
      { new: true }
    );

    this.logger.log(`Recommendation ${id} implemented with improvement: ${JSON.stringify(improvement)}`);
    return updatedRecommendation;
  }

  /**
   * Capture current metrics for a site
   */
  private async captureCurrentMetrics(
    siteId?: string,
    projectId?: string,
    scope?: 'project' | 'site',
  ): Promise<any> {
    try {
      const context = projectId
        ? await this.externalDataService.getProjectContext(projectId, siteId)
        : siteId
          ? await this.externalDataService.getAllSiteData(siteId)
          : null;

      const budgetScope: 'project' | 'site' = scope || (projectId ? 'project' : 'site');
      const siteData = (context as any)?.site || (context as any)?.siteData || null;
      const projectData = (context as any)?.project || null;
      const tasksData = (context as any)?.tasks || [];
      const teamsData = (context as any)?.teams || [];
      const budgetTotal = budgetScope === 'project'
        ? Number(projectData?.budget) || 0
        : Number(siteData?.budget) || 0;
      const spentBudget = this.calculateSpentBudget(tasksData) || 0;

      return {
        timestamp: new Date(),
        budget: {
          scope: budgetScope,
          total: budgetTotal,
          spent: spentBudget,
          remaining: budgetTotal - spentBudget,
        },
        tasks: {
          total: tasksData.length,
          completed: tasksData.filter(t => t.status === 'completed').length,
          inProgress: tasksData.filter(t => t.status === 'in_progress').length,
          overdue: tasksData.filter(t =>
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
          ).length,
          avgDuration: this.calculateAverageTaskDuration(tasksData),
        },
        teams: {
          total: teamsData.length,
          totalMembers: teamsData.reduce((sum, team) => sum + (team.members?.length || 0), 0),
          avgWorkload: this.calculateAverageWorkload(teamsData, tasksData),
        },
        efficiency: {
          taskCompletionRate: this.calculateTaskCompletionRate(tasksData),
          budgetUtilization: this.calculateBudgetUtilization(budgetTotal, tasksData),
          teamProductivity: this.calculateTeamProductivity(teamsData, tasksData),
        }
      };
    } catch (error) {
      this.logger.error('Error capturing metrics:', error);
      return null;
    }
  }

  /**
   * Calculate improvement between before and after metrics
   */
  private calculateImprovement(before: any, after: any, recommendationType: string): any {
    if (!before || !after) return null;

    const improvement: any = {
      type: recommendationType,
      timestamp: new Date(),
    };

    switch (recommendationType) {
      case 'budget':
        improvement.budgetSavings = before.budget.spent - after.budget.spent;
        improvement.budgetUtilizationImprovement = before.efficiency.budgetUtilization
          ? ((after.efficiency.budgetUtilization - before.efficiency.budgetUtilization) /
            before.efficiency.budgetUtilization) * 100
          : 0;
        break;

      case 'task_distribution':
        improvement.workloadBalanceImprovement =
          Math.abs(after.teams.avgWorkload - before.teams.avgWorkload);
        improvement.productivityImprovement =
          after.efficiency.teamProductivity - before.efficiency.teamProductivity;
        break;

      case 'timeline':
        improvement.overdueTasksReduction =
          before.tasks.overdue - after.tasks.overdue;
        improvement.completionRateImprovement =
          after.efficiency.taskCompletionRate - before.efficiency.taskCompletionRate;
        break;

      case 'individual_task_management':
        improvement.taskDurationImprovement =
          before.tasks.avgDuration - after.tasks.avgDuration;
        improvement.personalEfficiencyImprovement =
          after.efficiency.taskCompletionRate - before.efficiency.taskCompletionRate;
        break;

      default:
        improvement.overallEfficiencyImprovement =
          after.efficiency.taskCompletionRate - before.efficiency.taskCompletionRate;
        break;
    }

    return improvement;
  }

  // Helper methods for calculations
  private calculateSpentBudget(tasks: any[]): number {
    return tasks.reduce((sum, task) => sum + (Number(task.budget) || 0), 0);
  }

  private calculateAverageTaskDuration(tasks: any[]): number {
    const completedTasks = tasks.filter(t =>
      t.status === 'completed' && t.startDate && t.endDate
    );
    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); // days
    }, 0);

    return totalDuration / completedTasks.length;
  }

  private calculateAverageWorkload(teams: any[], tasks: any[]): number {
    const totalTasks = tasks.length;
    const totalMembers = teams.reduce((sum, team) => {
      if (team?.members?.length) return sum + team.members.length;
      return sum + 1;
    }, 0);
    return totalMembers > 0 ? totalTasks / totalMembers : 0;
  }

  private calculateTaskCompletionRate(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  }

  private calculateBudgetUtilization(budget: number, tasks: any[]): number {
    if (!budget || budget === 0) return 0;
    const spent = this.calculateSpentBudget(tasks);
    return (spent / budget) * 100;
  }

  private calculateTeamProductivity(teams: any[], tasks: any[]): number {
    const totalMembers = teams.reduce((sum, team) => {
      if (team?.members?.length) return sum + team.members.length;
      return sum + 1;
    }, 0);
    if (totalMembers === 0) return 0;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return completedTasks / totalMembers;
  }

  /**
   * Cumulative budget-related series: each approval adds estimated savings;
   * optional spent snapshot from beforeMetrics captured at approval.
   */
  private buildBudgetInfluenceOnApprovals(recommendations: Recommendation[]): Array<{
    step: number;
    label: string;
    title: string;
    approvedAt: string | null;
    incrementalSavingsTnd: number;
    cumulativePotentialReliefTnd: number;
    budgetSpentSnapshotTnd: number | null;
    siteBudgetTotalTnd: number | null;
  }> {
    const list = recommendations.filter(
      (r) => r.status === 'approved' || r.status === 'implemented',
    );
    list.sort((a, b) => {
      const ta = new Date(a.approvedAt || a.createdAt).getTime();
      const tb = new Date(b.approvedAt || b.createdAt).getTime();
      return ta - tb;
    });

    let cumulative = 0;
    const points: Array<{
      step: number;
      label: string;
      title: string;
      approvedAt: string | null;
      incrementalSavingsTnd: number;
      cumulativePotentialReliefTnd: number;
      budgetSpentSnapshotTnd: number | null;
      siteBudgetTotalTnd: number | null;
    }> = [];

    if (list.length === 0) {
      return points;
    }

    const bm0 = list[0].beforeMetrics;
    const initialSpent =
      bm0?.budget?.spent != null ? Number(bm0.budget.spent) : null;
    const initialTotal =
      bm0?.budget?.total != null
        ? Number(bm0.budget.total)
        : bm0?.budget?.remaining != null && bm0?.budget?.spent != null
          ? Number(bm0.budget.remaining) + Number(bm0.budget.spent)
          : null;

    points.push({
      step: 0,
      label: 'Start',
      title: 'Before first approval',
      approvedAt: null,
      incrementalSavingsTnd: 0,
      cumulativePotentialReliefTnd: 0,
      budgetSpentSnapshotTnd: initialSpent,
      siteBudgetTotalTnd: initialTotal,
    });

    list.forEach((r, idx) => {
      const inc = Number(r.estimatedSavings) || 0;
      cumulative += inc;
      const bm = r.beforeMetrics;
      const spent = bm?.budget?.spent != null ? Number(bm.budget.spent) : null;
      const total =
        bm?.budget?.total != null
          ? Number(bm.budget.total)
          : bm?.budget?.remaining != null && bm?.budget?.spent != null
            ? Number(bm.budget.remaining) + Number(bm.budget.spent)
            : null;
      points.push({
        step: idx + 1,
        label: `Approval ${idx + 1}`,
        title: r.title,
        approvedAt: r.approvedAt
          ? new Date(r.approvedAt).toISOString()
          : r.createdAt
            ? new Date(r.createdAt).toISOString()
            : null,
        incrementalSavingsTnd: inc,
        cumulativePotentialReliefTnd: cumulative,
        budgetSpentSnapshotTnd: spent,
        siteBudgetTotalTnd: total,
      });
    });

    return points;
  }

  /**
   * Get analytics data for a site
   */
  async getAnalytics(siteId?: string, projectId?: string, scope?: string): Promise<any> {
    const recommendations = await this.findAll(siteId, undefined, projectId, scope);

    const analytics = {
      totalRecommendations: recommendations.length,
      approvedRecommendations: recommendations.filter(r => r.status === 'approved').length,
      implementedRecommendations: recommendations.filter(r => r.status === 'implemented').length,

      /** Approuvées mais pas encore mises en œuvre : snapshot pris à l’approbation (courbe « après » au prochain jalon) */
      pendingImplementationSnapshots: recommendations
        .filter(r => r.status === 'approved' && r.beforeMetrics && !r.afterMetrics)
        .map(r => ({
          recommendationId: r._id,
          type: r.type,
          title: r.title,
          baselineAtApproval: r.beforeMetrics,
        })),

      // Calculate total improvements
      totalImprovements: {
        budgetSavings: 0,
        taskCompletionImprovement: 0,
        efficiencyGains: 0,
      },

      // Before/After comparisons (référence à l’approbation vs mesure après mise en œuvre)
      beforeAfterComparisons: recommendations
        .filter(r => r.beforeMetrics && r.afterMetrics)
        .map(r => ({
          recommendationId: r._id,
          type: r.type,
          title: r.title,
          before: r.beforeMetrics,
          after: r.afterMetrics,
          improvement: r.improvement,
        })),

      /** Curve: cumulative estimated savings vs approval order; spent snapshot from approval-time metrics */
      budgetInfluenceOnApprovals: this.buildBudgetInfluenceOnApprovals(recommendations),
    };

    // Calculate total improvements
    recommendations.forEach(r => {
      if (r.improvement) {
        if (r.improvement.budgetSavings) {
          analytics.totalImprovements.budgetSavings += r.improvement.budgetSavings;
        }
        if (r.improvement.completionRateImprovement) {
          analytics.totalImprovements.taskCompletionImprovement += r.improvement.completionRateImprovement;
        }
        if (r.improvement.overallEfficiencyImprovement) {
          analytics.totalImprovements.efficiencyGains += r.improvement.overallEfficiencyImprovement;
        }
      }
    });

    return analytics;
  }

  private mapPriority(priority: string): number {
    const scores: Record<string, number> = { urgent: 10, high: 8, medium: 5, low: 3 };
    return scores[priority] || 5;
  }

  private mapAIToCreateDto(
    recommendation: AIRecommendation,
    scope: 'project' | 'site',
    projectId?: string,
    siteId?: string,
  ): CreateRecommendationDto {
    return {
      type: recommendation.type,
      title: recommendation.title,
      description: recommendation.description,
      priority: this.mapPriority(recommendation.priority),
      estimatedSavings: Number(recommendation.estimatedSavings) || 0,
      estimatedCO2Reduction: 0,
      confidenceScore: 75,
      actionItems: recommendation.actionItems || [],
      projectId,
      siteId,
      scope,
    };
  }

  private buildEnergyRecommendations(siteId: string, siteBudget: number): CreateRecommendationDto[] {
    return [
      {
        type: 'energy',
        title: 'Reduire les pics de consommation',
        description: 'Lisser la consommation pendant les heures creuses pour reduire les couts.',
        priority: 8,
        estimatedSavings: Math.round((siteBudget || 0) * 0.03),
        estimatedCO2Reduction: 120,
        confidenceScore: 70,
        actionItems: [
          'Programmer les machines energivores sur les heures creuses',
          'Verifier les fuites et surconsommations',
        ],
        siteId,
        scope: 'site',
      },
    ];
  }

  private buildAlertRecommendations(siteId: string, summary: any, siteBudget: number): CreateRecommendationDto[] {
    const recommendations: CreateRecommendationDto[] = [];
    if (!summary) return recommendations;

    if (summary.byType?.budgetExceed > 0) {
      recommendations.push({
        type: 'budget',
        title: 'Alerte depassement budget',
        description: 'Des alertes budget ont ete detectees. Renforcer le controle des depenses.',
        priority: 9,
        estimatedSavings: Math.round((siteBudget || 0) * 0.05),
        estimatedCO2Reduction: 0,
        confidenceScore: 80,
        actionItems: [
          'Verifier les postes de depenses critiques',
          'Revoir les fournisseurs prioritaires',
          'Mettre a jour les seuils d\'alerte budget',
        ],
        siteId,
        scope: 'site',
      });
    }

    if (summary.byType?.energySpike > 0) {
      recommendations.push({
        type: 'energy',
        title: 'Alerte pic energie',
        description: 'Des pics d\'energie ont ete detectes. Optimiser les plages de fonctionnement.',
        priority: 7,
        estimatedSavings: Math.round((siteBudget || 0) * 0.02),
        estimatedCO2Reduction: 80,
        confidenceScore: 75,
        actionItems: [
          'Analyser les equipements responsables',
          'Activer les modes economie d\'energie',
        ],
        siteId,
        scope: 'site',
      });
    }

    return recommendations;
  }

  async generateForProject(projectId: string, siteId?: string): Promise<Recommendation[]> {
    const context = await this.externalDataService.getProjectContext(projectId, siteId);
    const saved: Recommendation[] = [];

    if (context.project) {
      const projectRecs = await this.aiRecommendationService.generateRecommendations({
        projectId,
        siteId,
        project: context.project,
        site: context.site,
        sites: context.sites,
        tasks: context.tasks,
        teams: context.teams,
        incidents: context.incidents,
        budget: Number(context.project?.budget) || 0,
        budgetScope: 'project',
        totalSitesBudget: context.projectStats.totalSitesBudget,
      });

      for (const rec of projectRecs) {
        const dto = this.mapAIToCreateDto(rec, 'project', projectId, siteId);
        saved.push(await this.create(dto));
      }
    }

    if (context.site && siteId) {
      const siteTasks = context.tasks.filter(t => t.siteId === siteId);
      const siteIncidents = context.incidents.filter(i => i.siteId === siteId);
      const siteRecs = await this.aiRecommendationService.generateRecommendations({
        projectId,
        siteId,
        project: context.project,
        site: context.site,
        sites: context.sites,
        tasks: siteTasks,
        teams: context.teams,
        incidents: siteIncidents,
        budget: Number(context.site?.budget) || 0,
        budgetScope: 'site',
      });

      for (const rec of siteRecs) {
        const dto = this.mapAIToCreateDto(rec, 'site', projectId, siteId);
        saved.push(await this.create(dto));
      }

      const energyAnalysis = await this.resourceAnalysisService.analyzeEnergyConsumption(siteId, 30);
      if (energyAnalysis.peakPeriods.length > 0) {
        const extra = this.buildEnergyRecommendations(siteId, Number(context.site?.budget) || 0);
        for (const dto of extra) {
          saved.push(await this.create(dto));
        }
      }

      const alertSummary = await this.alertService.getAlertsSummary(siteId).catch(() => null);
      const alertRecs = this.buildAlertRecommendations(siteId, alertSummary, Number(context.site?.budget) || 0);
      for (const dto of alertRecs) {
        saved.push(await this.create(dto));
      }
    }

    return saved;
  }

  async generateForSite(siteId: string): Promise<Recommendation[]> {
    const context = await this.externalDataService.getAllSiteData(siteId);
    const saved: Recommendation[] = [];

    const siteRecs = await this.aiRecommendationService.generateRecommendations({
      siteId,
      site: context.site,
      tasks: context.tasks,
      teams: context.teams,
      incidents: context.incidents,
      budget: Number(context.site?.budget) || 0,
      budgetScope: 'site',
    });

    for (const rec of siteRecs) {
      const dto = this.mapAIToCreateDto(rec, 'site', undefined, siteId);
      saved.push(await this.create(dto));
    }

    // Recommandations basées sur les milestones
    const milestoneRecs = this.buildMilestoneRecommendations(siteId, context.milestones);
    for (const dto of milestoneRecs) {
      saved.push(await this.create(dto));
    }

    // Recommandations basées sur les tâches
    const taskRecs = this.buildTaskRecommendations(siteId, context.tasks);
    for (const dto of taskRecs) {
      saved.push(await this.create(dto));
    }

    const energyAnalysis = await this.resourceAnalysisService.analyzeEnergyConsumption(siteId, 30);
    if (energyAnalysis.peakPeriods.length > 0) {
      const extra = this.buildEnergyRecommendations(siteId, Number(context.site?.budget) || 0);
      for (const dto of extra) {
        saved.push(await this.create(dto));
      }
    }

    const alertSummary = await this.alertService.getAlertsSummary(siteId).catch(() => null);
    const alertRecs = this.buildAlertRecommendations(siteId, alertSummary, Number(context.site?.budget) || 0);
    for (const dto of alertRecs) {
      saved.push(await this.create(dto));
    }

    return saved;
  }

  private buildMilestoneRecommendations(siteId: string, milestones: any[]): CreateRecommendationDto[] {
    const recs: CreateRecommendationDto[] = [];
    if (!milestones || milestones.length === 0) return recs;

    const now = new Date();
    const overdue = milestones.filter(m =>
      m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < now
    );
    const upcoming = milestones.filter(m =>
      m.status !== 'completed' && m.dueDate &&
      new Date(m.dueDate) >= now &&
      (new Date(m.dueDate).getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    const completed = milestones.filter(m => m.status === 'completed');
    const completionRate = milestones.length > 0 ? (completed.length / milestones.length) * 100 : 0;

    if (overdue.length > 0) {
      recs.push({
        type: 'timeline',
        title: `${overdue.length} jalon(s) en retard — action requise`,
        description: `${overdue.length} jalon(s) sur ${milestones.length} sont dépassés. Taux de complétion actuel : ${completionRate.toFixed(0)}%. Réorganisation du planning recommandée.`,
        priority: 9,
        estimatedSavings: overdue.length * 500,
        estimatedCO2Reduction: 0,
        confidenceScore: 85,
        actionItems: [
          'Identifier les causes de retard pour chaque jalon',
          'Réaffecter des ressources aux jalons critiques',
          'Négocier des extensions de délais si nécessaire',
          'Mettre en place un suivi hebdomadaire des jalons',
        ],
        siteId,
        scope: 'site',
      });
    }

    if (upcoming.length > 0) {
      recs.push({
        type: 'timeline',
        title: `${upcoming.length} jalon(s) à échéance dans 7 jours`,
        description: `${upcoming.length} jalon(s) arrivent à échéance cette semaine. Vérifiez l'avancement et mobilisez les équipes.`,
        priority: 7,
        estimatedSavings: upcoming.length * 200,
        estimatedCO2Reduction: 0,
        confidenceScore: 80,
        actionItems: [
          'Vérifier l\'avancement de chaque jalon urgent',
          'Mobiliser les équipes concernées',
          'Préparer les livrables en avance',
        ],
        siteId,
        scope: 'site',
      });
    }

    if (completionRate < 30 && milestones.length >= 3) {
      recs.push({
        type: 'resource_allocation',
        title: `Faible taux de complétion des jalons (${completionRate.toFixed(0)}%)`,
        description: `Seulement ${completed.length} jalon(s) sur ${milestones.length} sont complétés. Renforcement des ressources recommandé.`,
        priority: 8,
        estimatedSavings: milestones.length * 300,
        estimatedCO2Reduction: 0,
        confidenceScore: 75,
        actionItems: [
          'Analyser les blocages sur les jalons en cours',
          'Renforcer les équipes sur les jalons prioritaires',
          'Réviser le planning global du site',
        ],
        siteId,
        scope: 'site',
      });
    }

    return recs;
  }

  private buildTaskRecommendations(siteId: string, tasks: any[]): CreateRecommendationDto[] {
    const recs: CreateRecommendationDto[] = [];
    if (!tasks || tasks.length === 0) return recs;

    const now = new Date();
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done');
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'in progress');
    const overdue = tasks.filter(t =>
      t.status !== 'completed' && t.status !== 'done' &&
      t.endDate && new Date(t.endDate) < now
    );
    const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

    if (overdue.length > 0) {
      recs.push({
        type: 'task_distribution',
        title: `${overdue.length} tâche(s) en retard sur ${tasks.length} au total`,
        description: `${overdue.length} tâche(s) ont dépassé leur date de fin. Taux de complétion : ${completionRate.toFixed(0)}%. Redistribution des priorités recommandée.`,
        priority: 8,
        estimatedSavings: overdue.length * 150,
        estimatedCO2Reduction: 0,
        confidenceScore: 80,
        actionItems: [
          'Prioriser les tâches en retard',
          'Identifier les dépendances bloquantes',
          'Redistribuer la charge de travail',
          'Mettre à jour les dates de fin réalistes',
        ],
        siteId,
        scope: 'site',
      });
    }

    if (inProgress.length > 10) {
      recs.push({
        type: 'task_distribution',
        title: `Trop de tâches en cours simultanément (${inProgress.length})`,
        description: `${inProgress.length} tâches sont en cours en même temps. Limiter le travail en cours améliore la productivité.`,
        priority: 6,
        estimatedSavings: inProgress.length * 100,
        estimatedCO2Reduction: 0,
        confidenceScore: 70,
        actionItems: [
          'Appliquer la méthode Kanban pour limiter le WIP',
          'Terminer les tâches en cours avant d\'en commencer de nouvelles',
          'Prioriser les tâches à fort impact',
        ],
        siteId,
        scope: 'site',
      });
    }

    return recs;
  }
}
