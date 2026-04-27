import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from '@/schemas/recommendation.schema';
import { Alert } from '@/schemas/alert.schema';
import { ReportingService } from '../reporting/reporting.service';

export interface PowerBiDashboardData {
  // Real-time metrics
  realTimeMetrics: {
    activeRecommendations: number;
    pendingApprovals: number;
    activeAlerts: number;
    criticalAlerts: number;
    liveSavings: number;
    liveCO2Reduction: number;
  };

  // Historical data for trends
  trends: {
    recommendationsByDay: Array<{ date: string; count: number; savings: number }>;
    alertsByHour: Array<{ hour: string; count: number; severity: string }>;
    performanceByWeek: Array<{ week: string; savings: number; co2: number }>;
  };

  // KPI indicators
  kpis: {
    roi: number;
    efficiencyScore: number;
    sustainabilityIndex: number;
    budgetVariance: number;
  };

  // Recommendations analysis
  recommendationsAnalysis: {
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    topPerforming: Array<{ type: string; savings: number; impact: number }>;
  };

  // Alerts analysis
  alertsAnalysis: {
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    responseTimes: Array<{ alertType: string; avgResponseTime: number }>;
  };

  // Predictive insights
  predictiveInsights: {
    nextWeekSavings: number;
    riskAlerts: Array<{ type: string; probability: number; impact: string }>;
    optimizationOpportunities: Array<{ area: string; potentialSavings: number }>;
  };

  lastUpdated: string;
}

@Injectable()
export class PowerBiService {
  private readonly logger = new Logger(PowerBiService.name);

  constructor(
    @InjectModel(Recommendation.name)
    private recommendationModel: Model<Recommendation>,
    @InjectModel(Alert.name)
    private alertModel: Model<Alert>,
    private reportingService: ReportingService,
  ) {}

  async getDashboardData(siteId: string, _refresh: boolean = false): Promise<PowerBiDashboardData> {
    try {
      // Get base dashboard data
      const dashboard = await this.reportingService.generateDashboard(siteId);

      // Get real-time metrics
      const realTimeMetrics = await this.getRealTimeMetrics(siteId);

      // Get trends data
      const trends = await this.getTrendsData(siteId);

      // Calculate KPIs
      const kpis = await this.calculateKPIs(siteId, dashboard);

      // Get recommendations analysis
      const recommendationsAnalysis = await this.getRecommendationsAnalysis(siteId);

      // Get alerts analysis
      const alertsAnalysis = await this.getAlertsAnalysis(siteId);

      // Generate predictive insights
      const predictiveInsights = await this.getPredictiveInsights(siteId, dashboard);

      return {
        realTimeMetrics,
        trends,
        kpis,
        recommendationsAnalysis,
        alertsAnalysis,
        predictiveInsights,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generating Power BI dashboard data:', error);
      throw error;
    }
  }

  private async getRealTimeMetrics(siteId: string) {
    const [recommendations, alerts] = await Promise.all([
      this.recommendationModel.find({ siteId }).lean().exec(),
      this.alertModel.find({ siteId, status: 'pending' }).lean().exec(),
    ]);

    const activeRecommendations = recommendations.filter(r => r.status === 'pending' || r.status === 'approved').length;
    const pendingApprovals = recommendations.filter(r => r.status === 'pending').length;
    const activeAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    const liveSavings = recommendations
      .filter(r => r.status === 'implemented')
      .reduce((sum, r) => sum + (r.estimatedSavings || 0), 0);

    const liveCO2Reduction = recommendations
      .filter(r => r.status === 'implemented')
      .reduce((sum, r) => sum + (r.estimatedCO2Reduction || 0), 0);

    return {
      activeRecommendations,
      pendingApprovals,
      activeAlerts,
      criticalAlerts,
      liveSavings,
      liveCO2Reduction,
    };
  }

  private async getTrendsData(siteId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recommendations, alerts] = await Promise.all([
      this.recommendationModel
        .find({ siteId, createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: 1 })
        .lean()
        .exec(),
      this.alertModel
        .find({ siteId, createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: 1 })
        .lean()
        .exec(),
    ]);

    // Recommendations by day
    const recommendationsByDay = this.groupByDate(recommendations, 'createdAt');

    // Alerts by hour (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentAlerts = alerts.filter(a => a.createdAt >= oneDayAgo);
    const alertsByHour = this.groupByHour(recentAlerts);

    // Performance by week
    const performanceByWeek = await this.calculateWeeklyPerformance(siteId);

    return {
      recommendationsByDay,
      alertsByHour,
      performanceByWeek,
    };
  }

  private async calculateKPIs(_siteId: string, dashboard: any) {
    const realizedSavings = parseFloat(dashboard.financial?.realizedSavings || '0');
    const totalCosts = parseFloat(dashboard.financial?.currentResourcesCosts || '0');
    const co2Reduction = parseFloat(dashboard.environmental?.actualCO2Reduction || '0');
    const totalCO2 = parseFloat(dashboard.environmental?.currentCO2Emissions || '0');

    const roi = totalCosts > 0 ? (realizedSavings / totalCosts) * 100 : 0;
    const efficiencyScore = dashboard.recommendations?.total > 0
      ? (dashboard.recommendations?.implemented / dashboard.recommendations?.total) * 100
      : 0;
    const sustainabilityIndex = totalCO2 > 0 ? (co2Reduction / totalCO2) * 100 : 0;
    const budgetVariance = dashboard.financial?.breakdown ? this.calculateBudgetVariance(dashboard.financial.breakdown) : 0;

    return {
      roi,
      efficiencyScore,
      sustainabilityIndex,
      budgetVariance,
    };
  }

  private async getRecommendationsAnalysis(siteId: string) {
    const recommendations = await this.recommendationModel.find({ siteId }).lean().exec();

    const byType = recommendations.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = recommendations.reduce((acc, r) => {
      const priorityRange = r.priority >= 8 ? 'high' : r.priority >= 5 ? 'medium' : 'low';
      acc[priorityRange] = (acc[priorityRange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = recommendations.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPerforming = this.calculateTopPerformingRecommendations(recommendations);

    return {
      byType,
      byPriority,
      byStatus,
      topPerforming,
    };
  }

  private async getAlertsAnalysis(siteId: string) {
    const alerts = await this.alertModel.find({ siteId }).lean().exec();

    const byType = alerts.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = alerts.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const responseTimes = this.calculateAverageResponseTimes(alerts);

    return {
      byType,
      bySeverity,
      responseTimes,
    };
  }

  private async getPredictiveInsights(siteId: string, dashboard: any) {
    // Simple predictive logic based on current trends
    const recentRecommendations = await this.recommendationModel
      .find({ siteId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
      .lean()
      .exec();

    const weeklyAverageSavings = recentRecommendations
      .filter(r => r.status === 'implemented')
      .reduce((sum, r) => sum + (r.estimatedSavings || 0), 0) / 7;

    const nextWeekSavings = weeklyAverageSavings * 7;

    // Risk alerts based on current patterns
    const riskAlerts = this.generateRiskAlerts(dashboard);

    // Optimization opportunities
    const optimizationOpportunities = this.identifyOptimizationOpportunities(dashboard);

    return {
      nextWeekSavings,
      riskAlerts,
      optimizationOpportunities,
    };
  }

  async getRecommendationsStream(siteId: string) {
    // Return streaming data for real-time updates
    const recommendations = await this.recommendationModel
      .find({ siteId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return {
      data: recommendations.map(r => ({
        id: r._id,
        type: r.type,
        title: r.title,
        status: r.status,
        estimatedSavings: r.estimatedSavings,
        estimatedCO2Reduction: r.estimatedCO2Reduction,
        priority: r.priority,
        createdAt: r.createdAt,
        timestamp: new Date().toISOString(),
      })),
      total: recommendations.length,
    };
  }

  async getAlertsStream(siteId: string) {
    const alerts = await this.alertModel
      .find({ siteId, status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    return {
      data: alerts.map(a => ({
        id: a._id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        isRead: a.isRead,
        createdAt: a.createdAt,
        timestamp: new Date().toISOString(),
      })),
      total: alerts.length,
    };
  }

  async getPerformanceMetrics(siteId: string, period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recommendations = await this.recommendationModel
      .find({ siteId, createdAt: { $gte: startDate } })
      .lean()
      .exec();

    const metrics = {
      totalRecommendations: recommendations.length,
      implementedCount: recommendations.filter(r => r.status === 'implemented').length,
      totalSavings: recommendations
        .filter(r => r.status === 'implemented')
        .reduce((sum, r) => sum + (r.estimatedSavings || 0), 0),
      totalCO2Reduction: recommendations
        .filter(r => r.status === 'implemented')
        .reduce((sum, r) => sum + (r.estimatedCO2Reduction || 0), 0),
      averagePriority: recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + (r.priority || 0), 0) / recommendations.length
        : 0,
      period: `${days} days`,
    };

    return metrics;
  }

  // Helper methods
  private groupByDate(items: any[], dateField: string): Array<{ date: string; count: number; savings: number }> {
    const grouped = items.reduce((acc: Record<string, { date: string; count: number; savings: number }>, item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, count: 0, savings: 0 };
      acc[date].count++;
      acc[date].savings += item.estimatedSavings || 0;
      return acc;
    }, {} as Record<string, { date: string; count: number; savings: number }>);

    return Object.values(grouped);
  }

  private groupByHour(items: any[]): Array<{ hour: string; count: number; severity: string }> {
    const grouped = items.reduce((acc: Record<string, { hour: string; count: number; severity: string }>, item) => {
      const hour = new Date(item.createdAt).getHours().toString().padStart(2, '0') + ':00';
      if (!acc[hour]) acc[hour] = { hour, count: 0, severity: 'low' };
      acc[hour].count++;
      if (item.severity === 'critical' && acc[hour].severity !== 'critical') {
        acc[hour].severity = 'critical';
      } else if (item.severity === 'high' && acc[hour].severity === 'low') {
        acc[hour].severity = 'high';
      }
      return acc;
    }, {} as Record<string, { hour: string; count: number; severity: string }>);

    return Object.values(grouped);
  }

  private async calculateWeeklyPerformance(siteId: string): Promise<Array<{ week: string; savings: number; co2: number }>> {
    const weeks: Array<{ week: string; savings: number; co2: number }> = [];
    for (let i = 4; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i + 1) * 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - i * 7);

      const recommendations = await this.recommendationModel
        .find({
          siteId,
          status: 'implemented',
          implementedAt: { $gte: startDate, $lt: endDate }
        })
        .lean()
        .exec();

      const savings = recommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0);
      const co2 = recommendations.reduce((sum, r) => sum + (r.estimatedCO2Reduction || 0), 0);

      weeks.push({
        week: `Week ${5 - i}`,
        savings,
        co2,
      });
    }

    return weeks;
  }

  private calculateBudgetVariance(breakdown: any) {
    // Calculate variance from optimal budget distribution
    const optimalEquipment = 0.4;
    const optimalWorkers = 0.6;

    const actualEquipment = breakdown.equipmentPercentage / 100 || 0;
    const actualWorkers = breakdown.workersPercentage / 100 || 0;

    const variance = Math.abs(actualEquipment - optimalEquipment) + Math.abs(actualWorkers - optimalWorkers);
    return Math.round(variance * 100);
  }

  private calculateTopPerformingRecommendations(recommendations: any[]) {
    return recommendations
      .filter(r => r.status === 'implemented')
      .sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0))
      .slice(0, 5)
      .map(r => ({
        type: r.type,
        savings: r.estimatedSavings || 0,
        impact: r.estimatedCO2Reduction || 0,
      }));
  }

  private calculateAverageResponseTimes(alerts: any[]) {
    const responseTimes = alerts
      .filter(a => a.resolvedAt && a.createdAt)
      .map(a => (new Date(a.resolvedAt).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60)) // hours
      .reduce((acc, hours) => {
        const alertType = 'general'; // Could be enhanced with specific types
        if (!acc[alertType]) acc[alertType] = { total: 0, count: 0 };
        acc[alertType].total += hours;
        acc[alertType].count++;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(responseTimes).map(([alertType, data]) => ({
      alertType,
      avgResponseTime: data.count > 0 ? data.total / data.count : 0,
    }));
  }

  private generateRiskAlerts(dashboard: any) {
    const risks: Array<{ type: string; probability: number; impact: string }> = [];
    const pendingRecommendations = Number(dashboard?.recommendations?.pending) || 0;
    const totalRecommendations = Number(dashboard?.recommendations?.total) || 0;
    const pendingRatio = totalRecommendations > 0 ? pendingRecommendations / totalRecommendations : 0;
    const roi = Number.parseFloat(String(dashboard?.financial?.roi ?? '0')) || 0;
    const reductionPercentage = Number.parseFloat(String(dashboard?.environmental?.reductionPercentage ?? '0')) || 0;

    if (pendingRecommendations >= 5 || pendingRatio >= 0.5) {
      risks.push({
        type: 'approval_backlog',
        probability: pendingRecommendations >= 8 ? 0.9 : 0.75,
        impact: 'high',
      });
    }

    if (roi > 0 && roi < 50) {
      risks.push({
        type: 'low_roi',
        probability: roi < 25 ? 0.8 : 0.6,
        impact: 'medium',
      });
    }

    if (reductionPercentage > 0 && reductionPercentage < 15) {
      risks.push({
        type: 'low_environmental_progress',
        probability: reductionPercentage < 8 ? 0.75 : 0.55,
        impact: 'medium',
      });
    }

    return risks;
  }

  private identifyOptimizationOpportunities(dashboard: any) {
    const opportunities: Array<{ area: string; potentialSavings: number }> = [];
    const equipmentPercentage = Number(dashboard?.financial?.breakdown?.equipmentPercentage) || 0;
    const pendingRecommendations = Number(dashboard?.recommendations?.pending) || 0;
    const totalRecommendations = Number(dashboard?.recommendations?.total) || 0;
    const realizedSavings = Number.parseFloat(String(dashboard?.financial?.realizedSavings ?? '0')) || 0;
    const currentCosts = Number.parseFloat(String(dashboard?.financial?.currentResourcesCosts ?? '0')) || 0;
    const savingsGap = Math.max(currentCosts - realizedSavings, 0);

    if (equipmentPercentage > 0 && equipmentPercentage < 35) {
      opportunities.push({
        area: 'equipment_investment',
        potentialSavings: Math.max(5000, Math.round(savingsGap * 0.15)),
      });
    }

    if (pendingRecommendations > 3) {
      opportunities.push({
        area: 'process_automation',
        potentialSavings: Math.max(7000, pendingRecommendations * 1800),
      });
    }

    if (totalRecommendations > 0 && pendingRecommendations / totalRecommendations > 0.4) {
      opportunities.push({
        area: 'approval_workflow_optimization',
        potentialSavings: Math.max(4000, pendingRecommendations * 1200),
      });
    }

    return opportunities;
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([hdw])$/);
    if (!match) return 7; // default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h': return Math.ceil(value / 24);
      case 'd': return value;
      case 'w': return value * 7;
      default: return 7;
    }
  }
}