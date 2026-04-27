import { Injectable, Logger } from '@nestjs/common';

export interface RecommendationRequest {
  projectId?: string;
  siteId?: string;
  project?: any;
  site?: any;
  sites?: any[];
  tasks: any[];
  teams: any[];
  incidents?: any[];
  budget: number;
  budgetScope?: 'project' | 'site';
  totalSitesBudget?: number;
}

export interface AIRecommendation {
  type: 'budget' | 'task_distribution' | 'timeline' | 'resource_allocation' | 'individual_task_management';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedSavings: number;
  actionItems: string[];
  reasoning: string;
  targetMember?: string; // Pour les recommandations individuelles
  currentTasks?: string[]; // Tâches actuelles du membre
  suggestedDuration?: number; // Durée suggérée en jours
}

@Injectable()
export class AIRecommendationService {
  private readonly logger = new Logger(AIRecommendationService.name);

  async generateRecommendations(request: RecommendationRequest): Promise<AIRecommendation[]> {
    try {
      // Analyse des données du projet
      const analysis = this.analyzeProjectData(request);

      // Génération des recommandations basées sur l'analyse
      const recommendations: AIRecommendation[] = [
        ...this.generateBudgetRecommendations(analysis),
        ...this.generateTaskDistributionRecommendations(analysis),
        ...this.generateTimelineRecommendations(analysis),
        ...this.generateResourceAllocationRecommendations(analysis),
        ...this.generateIndividualTaskManagementRecommendations(analysis),
        ...this.generateIncidentRecommendations(request.incidents || [], request.budget, request.budgetScope || 'site'),
      ];

      // Tri par priorité
      return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
    } catch (error) {
      this.logger.error('Error generating AI recommendations:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  private analyzeProjectData(request: RecommendationRequest) {
    const tasks: any[] = Array.isArray(request.tasks) ? request.tasks : [];
    const teams: any[] = Array.isArray(request.teams) ? request.teams : [];
    const { budget, budgetScope, totalSitesBudget } = request;

    // Analyse de la répartition des tâches
    const taskAnalysis = this.analyzeTaskDistribution(tasks, teams);

    // Analyse du budget
    const budgetAnalysis = this.analyzeBudgetUsage(budget, tasks);

    // Analyse des délais
    const timelineAnalysis = this.analyzeTimeline(tasks);

    // Analyse des ressources
    const resourceAnalysis = this.analyzeResources(teams, tasks);

    return {
      taskAnalysis,
      budgetAnalysis,
      timelineAnalysis,
      resourceAnalysis,
      teams,
      tasks,
      totalTeamMembers: teams.length,
      budgetPerTask: tasks.length > 0 ? budget / tasks.length : 0,
      budgetPerTeamMember: teams.length > 0 ? budget / teams.length : 0,
      budgetScope: budgetScope || 'site',
      totalSitesBudget: Number(totalSitesBudget) || 0,
      budgetScopeLabel: budgetScope === 'project' ? 'projet' : 'site',
    };
  }

  private analyzeTaskDistribution(tasks: any[], teams: any[]) {
    const taskDistribution: Record<string, number> = {};
    const teamWorkload: Record<string, number> = {};

    tasks.forEach(task => {
      const taskId = task._id;
      const assignedMembers = task.assignedTo ? [task.assignedTo] : [];

      taskDistribution[taskId] = assignedMembers.length;

      assignedMembers.forEach(memberId => {
        teamWorkload[memberId] = (teamWorkload[memberId] || 0) + 1;
      });
    });

    // Calcul des pourcentages de répartition
    const distributionPercentages: Record<string, number> = {};
    const totalMembers = teams.length;
    Object.entries(taskDistribution).forEach(([taskId, memberCount]) => {
      distributionPercentages[taskId] = totalMembers > 0 ? (memberCount / totalMembers) * 100 : 0;
    });

    // Identification des problèmes de répartition
    const workloads = Object.values(teamWorkload);
    const avgWorkload = workloads.length > 0 ? workloads.reduce((sum, load) => sum + load, 0) / workloads.length : 0;
    const overloadedMembers = workloads.filter(load => load > avgWorkload * 1.5).length;
    const underloadedMembers = workloads.filter(load => load < avgWorkload * 0.5).length;

    return {
      distributionPercentages,
      teamWorkload,
      avgWorkload,
      overloadedMembers,
      underloadedMembers,
      isUnbalanced: overloadedMembers > 0 || underloadedMembers > 0,
    };
  }

  private analyzeBudgetUsage(budget: number, tasks: any[]) {
    const budgetPerTask = tasks.length > 0 ? budget / tasks.length : 0;

    // Simulation de l'utilisation du budget par tâche
    const taskBudgetUsage = tasks.map(task => ({
      taskId: task._id,
      estimatedCost: budgetPerTask * (task.priority === 'urgent' ? 1.5 : task.priority === 'high' ? 1.2 : 1),
      priority: task.priority,
    }));

    const totalEstimatedCost = taskBudgetUsage.reduce((sum, task) => sum + task.estimatedCost, 0);
    const budgetOverrun = totalEstimatedCost - budget;
    const overrunPercentage = budget > 0 ? (budgetOverrun / budget) * 100 : 0;

    return {
      budgetPerTask,
      taskBudgetUsage,
      totalEstimatedCost,
      budgetOverrun,
      overrunPercentage,
      isOverBudget: budgetOverrun > 0,
    };
  }

  private analyzeTimeline(tasks: any[]) {
    const now = new Date();

    // Ne considérer que les tâches non complétées avec une dueDate valide
    const activeTasks = tasks.filter(t =>
      t.status !== 'completed' &&
      t.dueDate &&
      !isNaN(new Date(t.dueDate).getTime())
    );

    const taskAnalysis = activeTasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0;
      const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

      return {
        taskId: task._id,
        dueDate,
        daysUntilDue,
        isOverdue,
        isUrgent,
        priority: task.priority,
      };
    });

    const overdueTasks = taskAnalysis.filter(task => task.isOverdue);
    const urgentTasks = taskAnalysis.filter(task => task.isUrgent);

    // Moyenne uniquement sur les tâches futures (daysUntilDue > 0)
    const futureTasks = taskAnalysis.filter(t => t.daysUntilDue > 0);
    const avgDaysUntilDue = futureTasks.length > 0
      ? futureTasks.reduce((sum, task) => sum + task.daysUntilDue, 0) / futureTasks.length
      : 999; // Pas de tâches futures → pas d'alerte délai

    return {
      taskAnalysis,
      overdueTasks: overdueTasks.length,
      urgentTasks: urgentTasks.length,
      avgDaysUntilDue,
      hasTimelineIssues: overdueTasks.length > 0 || urgentTasks.length > 2,
    };
  }

  private analyzeResources(teams: any[], tasks: any[]) {
    const totalTasks = tasks.length;
    const totalMembers = teams.length;
    const tasksPerMember = totalMembers > 0 ? totalTasks / totalMembers : 0;

    // Analyse des compétences (simulation)
    const skillGaps: string[] = [];
    const highPriorityTasks = tasks.filter(task => task.priority === 'urgent' || task.priority === 'high');

    if (highPriorityTasks.length > totalMembers) {
      skillGaps.push('Manque de personnel pour les tâches haute priorité');
    }

    if (tasksPerMember > 5) {
      skillGaps.push('Surcharge de travail par membre d\'équipe');
    }

    return {
      tasksPerMember,
      totalMembers,
      totalTasks,
      skillGaps,
      isResourceConstrained: skillGaps.length > 0,
    };
  }

  private generateBudgetRecommendations(analysis: any): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { budgetAnalysis } = analysis;
    const scopeLabel = analysis.budgetScopeLabel || 'site';

    if (budgetAnalysis.isOverBudget) {
      recommendations.push({
        type: 'budget',
        title: `Optimisation du budget ${scopeLabel} nécessaire`,
        description: `Le budget ${scopeLabel} est dépassé de ${budgetAnalysis.overrunPercentage.toFixed(1)}%. Réallocation nécessaire.`,
        priority: 'high',
        estimatedSavings: Math.abs(budgetAnalysis.budgetOverrun) * 0.8,
        actionItems: [
          'Réviser les priorités des tâches',
          'Négocier des délais supplémentaires',
          'Optimiser l\'allocation des ressources',
        ],
        reasoning: `Analyse des coûts par tâche montre une surutilisation du budget ${scopeLabel} disponible`,
      });
    }

    if (budgetAnalysis.budgetPerTask > 1000) {
      recommendations.push({
        type: 'budget',
        title: `Répartition inefficiente du budget ${scopeLabel}`,
        description: `Le budget ${scopeLabel} par tâche semble excessif, possibilité d\'optimisation`,
        priority: 'medium',
        estimatedSavings: budgetAnalysis.budgetPerTask * 0.2,
        actionItems: [
          'Analyser les coûts réels par tâche',
          'Identifier les tâches sur-budgétisées',
          'Réallouer le budget aux tâches critiques',
        ],
        reasoning: `Le budget moyen ${scopeLabel} par tâche est supérieur aux recommandations standards`,
      });
    }

    if (analysis.budgetScope === 'project' && analysis.totalSitesBudget > 0) {
      const delta = analysis.totalSitesBudget - (budgetAnalysis.totalEstimatedCost || 0);
      if (analysis.totalSitesBudget > budgetAnalysis.totalEstimatedCost) {
        recommendations.push({
          type: 'budget',
          title: 'Aligner budgets sites et projet',
          description: `Le total des budgets des sites (${analysis.totalSitesBudget.toFixed(0)}) depasse les besoins projet estimes (${budgetAnalysis.totalEstimatedCost.toFixed(0)}).`,
          priority: 'medium',
          estimatedSavings: Math.max(0, delta) * 0.2,
          actionItems: [
            'Revoir la repartition des budgets par site',
            'Realigner les enveloppes sur les besoins reels',
            'Renegocier les couts fournisseurs si possible',
          ],
          reasoning: 'Incoherence entre budgets sites et besoins projet',
        });
      }
    }

    return recommendations;
  }

  private generateTaskDistributionRecommendations(analysis: any): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { taskAnalysis } = analysis;

    if (taskAnalysis.isUnbalanced) {
      recommendations.push({
        type: 'task_distribution',
        title: 'Répartition déséquilibrée des tâches',
        description: `${taskAnalysis.overloadedMembers} membres surchargés et ${taskAnalysis.underloadedMembers} sous-utilisés`,
        priority: 'high',
        estimatedSavings: analysis.budgetPerTask * 0.3,
        actionItems: [
          'Redistribuer les tâches des membres surchargés',
          'Assigner plus de tâches aux membres sous-utilisés',
          'Mettre en place un système de rotation',
        ],
        reasoning: 'La répartition actuelle crée des goulots d\'étranglement et du gaspillage de ressources',
      });
    }

    // Vérifier les tâches avec trop ou trop peu de membres
    Object.entries(taskAnalysis.distributionPercentages).forEach(([, percentage]) => {
      const percentageValue = Number(percentage);
      if (percentageValue > 80) {
        recommendations.push({
          type: 'task_distribution',
          title: `Tâche sur-staffée`,
          description: `${percentageValue.toFixed(1)}% des ressources allouées à une seule tâche`,
          priority: 'medium',
          estimatedSavings: analysis.budgetPerTask * 0.15,
          actionItems: [
            'Réduire l\'équipe assignée à cette tâche',
            'Réallouer les membres excédentaires',
            'Automatiser une partie de la tâche si possible',
          ],
          reasoning: 'Sur-allocation de ressources inefficace pour cette tâche spécifique',
        });
      } else if (percentageValue < 20 && percentageValue > 0) {
        recommendations.push({
          type: 'task_distribution',
          title: `Tâche sous-staffée`,
          description: `Seulement ${percentageValue.toFixed(1)}% des ressources allouées`,
          priority: 'medium',
          estimatedSavings: analysis.budgetPerTask * 0.1,
          actionItems: [
            'Augmenter l\'équipe assignée à cette tâche',
            'Vérifier si la tâche nécessite plus de ressources',
            'Réévaluer la complexité de la tâche',
          ],
          reasoning: 'Sous-allocation risque de retarder l\'achèvement de cette tâche',
        });
      }
    });

    return recommendations;
  }

  private generateTimelineRecommendations(analysis: any): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { timelineAnalysis } = analysis;

    if (timelineAnalysis.hasTimelineIssues) {
      recommendations.push({
        type: 'timeline',
        title: 'Problèmes de délais détectés',
        description: `${timelineAnalysis.overdueTasks} tâches en retard et ${timelineAnalysis.urgentTasks} tâches urgentes`,
        priority: 'urgent',
        estimatedSavings: analysis.budgetPerTask * 0.5,
        actionItems: [
          'Reprioriser les tâches en retard',
          'Allouer des ressources supplémentaires aux tâches urgentes',
          'Négocier des extensions de délais',
        ],
        reasoning: 'Les délais non respectés impactent directement le budget et la qualité',
      });
    }

    if (timelineAnalysis.avgDaysUntilDue < 3 && timelineAnalysis.avgDaysUntilDue < 999) {
      recommendations.push({
        type: 'timeline',
        title: 'Délais critiques — moins de 3 jours en moyenne',
        description: `Le délai moyen restant sur les tâches actives est de ${timelineAnalysis.avgDaysUntilDue.toFixed(0)} jour(s). Risque élevé de retards en cascade.`,
        priority: 'high',
        estimatedSavings: analysis.budgetPerTask * 0.25,
        actionItems: [
          'Réviser l\'estimation des délais',
          'Prioriser les tâches critiques',
          'Considérer l\'ajout de personnel',
        ],
        reasoning: 'Les délais très courts créent des risques de retards en cascade',
      });
    }

    return recommendations;
  }

  private generateResourceAllocationRecommendations(analysis: any): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const { resourceAnalysis } = analysis;

    if (resourceAnalysis.isResourceConstrained) {
      recommendations.push({
        type: 'resource_allocation',
        title: 'Contraintes de ressources',
        description: resourceAnalysis.skillGaps.join(', '),
        priority: 'high',
        estimatedSavings: analysis.budgetPerTask * 0.35,
        actionItems: [
          'Recruter du personnel supplémentaire',
          'Former les membres existants',
          'Externaliser certaines tâches',
        ],
        reasoning: 'Les ressources actuelles ne permettent pas d\'atteindre les objectifs dans les délais',
      });
    }

    if (resourceAnalysis.tasksPerMember > 8) {
      recommendations.push({
        type: 'resource_allocation',
        title: 'Surcharge de travail',
        description: `Chaque membre gère en moyenne ${resourceAnalysis.tasksPerMember.toFixed(1)} tâches`,
        priority: 'medium',
        estimatedSavings: analysis.budgetPerTask * 0.2,
        actionItems: [
          'Réduire le nombre de tâches par membre',
          'Optimiser les processus de travail',
          'Automatiser les tâches répétitives',
        ],
        reasoning: 'La surcharge mène à une baisse de qualité et au burn-out',
      });
    }

    return recommendations;
  }

  /**
   * Générer des recommandations basées sur les incidents assignés au site/projet
   */
  private generateIncidentRecommendations(
    incidents: any[],
    budget: number,
    scopeLabel: 'project' | 'site',
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    if (!incidents || incidents.length === 0) return recommendations;

    // Ne prendre en compte QUE les incidents actifs (open ou investigating)
    // Les routes /by-site/ et /by-project/ garantissent déjà le bon scope
    const relevantIncidents = incidents.filter(i =>
      i.status === 'open' || i.status === 'investigating'
    );

    if (relevantIncidents.length === 0) return recommendations;

    const criticalIncidents = relevantIncidents.filter(i => i.severity === 'critical');
    const highIncidents = relevantIncidents.filter(i => i.severity === 'high');
    const safetyIncidents = relevantIncidents.filter(i => i.type === 'safety');
    const delayIncidents = relevantIncidents.filter(i => i.type === 'delay');
    const qualityIncidents = relevantIncidents.filter(i => i.type === 'quality');

    // Incidents critiques non résolus → risque budget et délai majeur
    if (criticalIncidents.length > 0) {
      const budgetImpact = Math.round(budget * 0.15 * criticalIncidents.length);
      recommendations.push({
        type: 'budget',
        title: `${criticalIncidents.length} incident(s) critique(s) — risque budget élevé`,
        description: `Des incidents critiques non résolus peuvent entraîner des surcoûts estimés à ${budgetImpact} TND. Résolution prioritaire requise.`,
        priority: 'urgent',
        estimatedSavings: budgetImpact,
        actionItems: [
          'Affecter immédiatement une équipe dédiée à la résolution',
          'Évaluer l\'impact financier de chaque incident critique',
          'Mettre en place un suivi quotidien jusqu\'à résolution',
          'Documenter les causes racines pour éviter la récurrence',
        ],
        reasoning: `${criticalIncidents.length} incident(s) critique(s) actif(s) génèrent un risque direct sur le budget ${scopeLabel}`,
      });
    }

    // Incidents de sécurité → arrêt potentiel du chantier = perte de temps
    if (safetyIncidents.length > 0) {
      const openSafety = safetyIncidents.filter(i => i.status === 'open' || i.status === 'investigating');
      if (openSafety.length > 0) {
        const timeSavingsDays = openSafety.length * 2; // 2 jours perdus par incident sécurité
        const timeSavingsBudget = Math.round(budget * 0.05 * openSafety.length);
        recommendations.push({
          type: 'timeline',
          title: `${openSafety.length} incident(s) sécurité ouverts — risque d'arrêt chantier`,
          description: `Les incidents de sécurité non résolus peuvent provoquer des arrêts de chantier estimés à ${timeSavingsDays} jours de retard et ${timeSavingsBudget} TND de surcoût.`,
          priority: 'urgent',
          estimatedSavings: timeSavingsBudget,
          actionItems: [
            'Résoudre immédiatement les incidents sécurité ouverts',
            'Mettre en place des mesures préventives sur le chantier',
            'Former les équipes aux procédures de sécurité',
            'Inspecter les zones à risque identifiées',
          ],
          reasoning: 'Les incidents sécurité non traités entraînent des arrêts réglementaires coûteux',
        });
      }
    }

    // Incidents de délai → impact direct sur le planning
    if (delayIncidents.length > 0) {
      const openDelays = delayIncidents.filter(i => i.status === 'open' || i.status === 'investigating');
      if (openDelays.length > 0) {
        const delaySavings = Math.round(budget * 0.08 * openDelays.length);
        recommendations.push({
          type: 'timeline',
          title: `${openDelays.length} incident(s) de retard — optimisation du planning nécessaire`,
          description: `${openDelays.length} incident(s) de type "délai" actifs. Réorganiser le planning pour récupérer ${openDelays.length * 3} jours estimés et économiser ${delaySavings} TND.`,
          priority: 'high',
          estimatedSavings: delaySavings,
          actionItems: [
            'Identifier les tâches bloquées par ces incidents',
            'Réorganiser le planning pour paralléliser les tâches non bloquées',
            'Allouer des ressources supplémentaires aux tâches critiques',
            'Négocier des délais avec les parties prenantes si nécessaire',
          ],
          reasoning: 'Les incidents de délai non traités ont un effet cascade sur le planning global',
        });
      }
    }

    // Incidents qualité → reprises coûteuses
    if (qualityIncidents.length > 0) {
      const openQuality = qualityIncidents.filter(i => i.status === 'open' || i.status === 'investigating');
      if (openQuality.length > 0) {
        const qualitySavings = Math.round(budget * 0.06 * openQuality.length);
        recommendations.push({
          type: 'budget',
          title: `${openQuality.length} incident(s) qualité — réduction des reprises`,
          description: `Les incidents qualité non résolus génèrent des reprises estimées à ${qualitySavings} TND. Mise en place de contrôles qualité recommandée.`,
          priority: 'high',
          estimatedSavings: qualitySavings,
          actionItems: [
            'Mettre en place des points de contrôle qualité intermédiaires',
            'Identifier les causes des non-conformités récurrentes',
            'Former les équipes aux standards qualité du projet',
            'Documenter les procédures pour éviter les reprises',
          ],
          reasoning: 'Les reprises dues aux incidents qualité représentent 6-12% du budget projet',
        });
      }
    }

    // Trop d'incidents ouverts en général → surcharge équipe
    if (relevantIncidents.length > 5) {
      const overloadSavings = Math.round(budget * 0.04);
      recommendations.push({
        type: 'resource_allocation',
        title: `${relevantIncidents.length} incidents ouverts — surcharge de l'équipe de gestion`,
        description: `Un volume élevé d'incidents ouverts (${relevantIncidents.length}) indique une surcharge. Renforcer l'équipe de gestion des incidents pour économiser ${overloadSavings} TND.`,
        priority: 'medium',
        estimatedSavings: overloadSavings,
        actionItems: [
          'Prioriser les incidents par impact budget et délai',
          'Affecter un responsable dédié à la gestion des incidents',
          'Mettre en place un tableau de bord de suivi des incidents',
          'Définir des SLA de résolution par niveau de sévérité',
        ],
        reasoning: 'Un backlog d\'incidents élevé ralentit la résolution et augmente les coûts',
      });
    }

    // Incidents récurrents (high + critical) → problème systémique
    if (highIncidents.length + criticalIncidents.length > 3) {
      const systemicSavings = Math.round(budget * 0.10);
      recommendations.push({
        type: 'resource_allocation',
        title: 'Incidents graves récurrents — analyse systémique recommandée',
        description: `${highIncidents.length + criticalIncidents.length} incidents graves détectés. Une analyse des causes racines permettrait d'économiser ${systemicSavings} TND sur le long terme.`,
        priority: 'high',
        estimatedSavings: systemicSavings,
        actionItems: [
          'Conduire une analyse des causes racines (RCA)',
          'Identifier les patterns récurrents entre incidents',
          'Mettre en place des mesures préventives systémiques',
          'Réviser les processus de travail pour éliminer les risques',
        ],
        reasoning: 'Les incidents graves récurrents signalent des problèmes systémiques non adressés',
      });
    }

    return recommendations;
  }

  private getPriorityScore(priority: string): number {
    const scores = { urgent: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }

  private getFallbackRecommendations(request: RecommendationRequest): AIRecommendation[] {
    return [
      {
        type: 'budget',
        title: 'Optimisation du budget recommandée',
        description: 'Analysez l\'allocation du budget pour identifier les économies possibles',
        priority: 'medium',
        estimatedSavings: request.budget * 0.1,
        actionItems: [
          'Examiner les dépenses par tâche',
          'Identifier les coûts superflus',
          'Négocier avec les fournisseurs',
        ],
        reasoning: 'Recommandation générique basée sur les meilleures pratiques',
      },
      {
        type: 'task_distribution',
        title: 'Améliorer la répartition des tâches',
        description: 'Assurez-vous une distribution équilibrée de la charge de travail',
        priority: 'medium',
        estimatedSavings: request.budget * 0.05,
        actionItems: [
          'Évaluer la charge de travail actuelle',
          'Redistribuer les tâches si nécessaire',
          'Mettre en place un suivi régulier',
        ],
        reasoning: 'Une bonne répartition améliore l\'efficacité globale',
      },
    ];
  }

  /**
   * Générer des recommandations individuelles pour chaque membre
   */
  private generateIndividualTaskManagementRecommendations(analysis: any): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const teams: any[] = Array.isArray(analysis.teams) ? analysis.teams : [];
    const tasks: any[] = Array.isArray(analysis.tasks) ? analysis.tasks : [];

    teams.forEach((team: any) => {
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach((member: any) => {
          const memberTasks = tasks.filter((task: any) =>
            task.assignedTo === member._id ||
            (task.assignedMembers && task.assignedMembers.includes(member._id))
          );
          const memberRecommendations = this.analyzeMemberTasks(member, memberTasks, analysis);
          recommendations.push(...memberRecommendations);
        });
      }
    });

    return recommendations;
  }

  /**
   * Analyser les tâches d'un membre et générer des recommandations
   */
  private analyzeMemberTasks(member: any, memberTasks: any[], analysis: any): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Membre';

    // Si le membre n'a pas de tâches
    if (memberTasks.length === 0) {
      recommendations.push({
        type: 'individual_task_management',
        title: `Aucune tâche assignée - ${memberName}`,
        description: `${memberName} n'a actuellement aucune tâche assignée. Cela peut indiquer une sous-utilisation des compétences.`,
        priority: 'medium',
        estimatedSavings: analysis.budgetPerTask * 0.1,
        actionItems: [
          'Assigner des tâches appropriées au membre',
          'Vérifier si le membre est disponible pour de nouvelles missions',
          'Considérer la formation si nécessaire',
        ],
        reasoning: 'Chaque membre devrait avoir des tâches pour optimiser l\'utilisation des ressources',
        targetMember: memberName,
        currentTasks: [],
      });
      return recommendations;
    }

    // Analyser la charge de travail
    const totalEstimatedDuration = memberTasks.reduce((sum: number, task: any) => {
      const duration = this.estimateTaskDuration(task);
      return sum + duration;
    }, 0);

    // Analyser les priorités
    const highPriorityTasks = memberTasks.filter((task: any) =>
      task.priority === 'urgent' || task.priority === 'high'
    );
    const overdueTasks = memberTasks.filter((task: any) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date();
    });

    // Recommandation si trop de tâches haute priorité
    if (highPriorityTasks.length > 3) {
      recommendations.push({
        type: 'individual_task_management',
        title: `Surcharge de priorité - ${memberName}`,
        description: `${memberName} a ${highPriorityTasks.length} tâches haute priorité. Risque de surcharge et de baisse de qualité.`,
        priority: 'high',
        estimatedSavings: analysis.budgetPerTask * 0.2,
        actionItems: [
          'Réévaluer les priorités des tâches',
          'Déléguer certaines tâches si possible',
          'Étaler les deadlines pour les tâches moins critiques',
        ],
        reasoning: 'Trop de tâches haute priorité mène au burn-out et à la baisse de productivité',
        targetMember: memberName,
        currentTasks: memberTasks.map((task: any) => task.title || task.name),
      });
    }

    // Recommandation si tâches en retard
    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'individual_task_management',
        title: `Tâches en retard - ${memberName}`,
        description: `${memberName} a ${overdueTasks.length} tâches en retard. Action immédiate requise.`,
        priority: 'urgent',
        estimatedSavings: analysis.budgetPerTask * 0.3,
        actionItems: [
          'Prioriser les tâches en retard',
          'Allouer des ressources supplémentaires',
          'Réévaluer les deadlines si nécessaire',
        ],
        reasoning: 'Les retards impactent directement le projet et les autres membres',
        targetMember: memberName,
        currentTasks: overdueTasks.map((task: any) => task.title || task.name),
      });
    }

    // Recommandation sur la durée des tâches
    const avgTaskDuration = totalEstimatedDuration / memberTasks.length;
    if (avgTaskDuration > 10) { // Plus de 10 jours en moyenne
      recommendations.push({
        type: 'individual_task_management',
        title: `Durée des tâches trop longue - ${memberName}`,
        description: `La durée moyenne des tâches (${avgTaskDuration.toFixed(1)} jours) semble excessive. Découpage recommandé.`,
        priority: 'medium',
        estimatedSavings: analysis.budgetPerTask * 0.15,
        actionItems: [
          'Décomposer les tâches longues en sous-tâches',
          'Identifier les blocages et les goulots d\'étranglement',
          'Optimiser les processus de travail',
        ],
        reasoning: 'Des tâches plus courtes sont plus faciles à gérer et à compléter',
        targetMember: memberName,
        currentTasks: memberTasks.map((task: any) => task.title || task.name),
        suggestedDuration: 7, // Suggérer 7 jours maximum
      });
    }

    // Recommandation d'optimisation personnalisée
    const taskComplexity = this.analyzeTaskComplexity(memberTasks);
    if (taskComplexity.high > taskComplexity.medium + taskComplexity.low) {
      recommendations.push({
        type: 'individual_task_management',
        title: `Équilibre complexité - ${memberName}`,
        description: `${memberName} a trop de tâches complexes. Mélangez avec des tâches plus simples pour maintenir la motivation.`,
        priority: 'medium',
        estimatedSavings: analysis.budgetPerTask * 0.1,
        actionItems: [
          'Équilibrer les tâches complexes et simples',
          'Prévoir des pauses entre les tâches difficiles',
          'Fournir un support supplémentaire si nécessaire',
        ],
        reasoning: 'Un bon équilibre de complexité maintient l\'engagement et la productivité',
        targetMember: memberName,
        currentTasks: memberTasks.map((task: any) => task.title || task.name),
      });
    }

    return recommendations;
  }

  /**
   * Estimer la durée optimale d'une tâche en jours
   */
  private estimateTaskDuration(task: any): number {
    // Base duration selon la priorité
    let baseDuration = 5; // 5 jours par défaut

    switch (task.priority) {
      case 'urgent':
        baseDuration = 2;
        break;
      case 'high':
        baseDuration = 3;
        break;
      case 'medium':
        baseDuration = 5;
        break;
      case 'low':
        baseDuration = 7;
        break;
    }

    // Ajustement selon la complexité (si disponible)
    if (task.complexity) {
      switch (task.complexity) {
        case 'simple':
          baseDuration *= 0.5;
          break;
        case 'medium':
          baseDuration *= 1;
          break;
        case 'complex':
          baseDuration *= 2;
          break;
      }
    }

    // Ajustement selon le nombre de sous-tâches
    if (task.subtasks && Array.isArray(task.subtasks)) {
      baseDuration += task.subtasks.length * 0.5;
    }

    return Math.max(1, baseDuration); // Minimum 1 jour
  }

  /**
   * Analyser la complexité des tâches d'un membre
   */
  private analyzeTaskComplexity(tasks: any[]): { high: number; medium: number; low: number } {
    const complexity = { high: 0, medium: 0, low: 0 };

    tasks.forEach(task => {
      // Estimer la complexité selon la priorité et la durée
      const estimatedDuration = this.estimateTaskDuration(task);

      if (task.priority === 'urgent' || estimatedDuration > 7) {
        complexity.high++;
      } else if (task.priority === 'high' || estimatedDuration > 3) {
        complexity.medium++;
      } else {
        complexity.low++;
      }
    });

    return complexity;
  }
}
