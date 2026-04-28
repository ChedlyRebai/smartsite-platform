import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConsumptionHistory, FlowType, AnomalyType, AnomalySeverity } from '../entities/consumption-history.entity';
import { Material } from '../entities/material.entity';
import { CreateConsumptionHistoryDto } from '../dto/create-consumption-history.dto';
import { HistoryFiltersDto, StatisticsFiltersDto } from '../dto/history-filters.dto';
import {
  SyncReport,
  PaginationResult,
  ConsumptionStatistics,
  MaterialTrend,
  TimelineDataPoint,
  FlowTypeBreakdown,
  AnomalyBreakdown,
  TopMaterial,
  StatisticsSummary,
  TrendAnalysis,
  MaterialTrendDataPoint,
} from '../types/consumption-history.types';

@Injectable()
export class ConsumptionHistoryService {
  private readonly logger = new Logger(ConsumptionHistoryService.name);
  private readonly SITES_SERVICE_URL = process.env.SITES_SERVICE_URL || 'http://localhost:3001';

  constructor(
    @InjectModel(ConsumptionHistory.name) private historyModel: Model<ConsumptionHistory>,
    @InjectModel(Material.name) private materialModel: Model<Material>,
    @InjectModel('MaterialFlowLog') private flowLogModel: Model<any>,
    @InjectModel('DailyConsumptionLog') private consumptionLogModel: Model<any>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Synchronise les données existantes depuis MaterialFlowLog et DailyConsumptionLog
   */
  async syncFromExistingData(): Promise<SyncReport> {
    const report: SyncReport = { synced: 0, skipped: 0, errors: 0 };

    try {
      // Synchroniser MaterialFlowLog
      const flowLogs = await this.flowLogModel.find().lean().exec();
      this.logger.log(`📦 ${flowLogs.length} entrées trouvées dans MaterialFlowLog`);

      for (const log of flowLogs) {
        try {
          // Vérifier si déjà synchronisé
          const existing = await this.historyModel.findOne({
            sourceCollection: 'MaterialFlowLog',
            sourceId: log._id,
          }).exec();

          if (existing) {
            report.skipped++;
            continue;
          }

          // Enrichir avec les données du matériau
          const material = await this.materialModel.findById(log.materialId).lean().exec();
          if (!material) {
            report.errors++;
            this.logger.warn(`⚠️ Matériau ${log.materialId} introuvable pour FlowLog ${log._id}`);
            continue;
          }

          // Enrichir avec le nom du site
          const siteName = await this.getSiteName(log.siteId?.toString());

          // Créer l'entrée d'historique
          await this.historyModel.create({
            materialId: log.materialId,
            materialName: material.name,
            materialCode: material.code,
            materialCategory: material.category,
            materialUnit: material.unit,
            siteId: log.siteId,
            siteName: siteName || undefined,
            date: log.date || log.createdAt,
            quantity: log.quantity,
            flowType: this.mapFlowType(log.type),
            expectedQuantity: 0,
            anomalyScore: 0,
            anomalyType: AnomalyType.NONE,
            anomalySeverity: AnomalySeverity.NONE,
            stockBefore: log.stockBefore || 0,
            stockAfter: log.stockAfter || 0,
            sourceCollection: 'MaterialFlowLog',
            sourceId: log._id,
            recordedBy: log.recordedBy,
            reason: log.reason,
            reference: log.reference,
          });

          report.synced++;
        } catch (error) {
          report.errors++;
          this.logger.error(`❌ Erreur FlowLog ${log._id}: ${error.message}`);
        }
      }

      // Synchroniser DailyConsumptionLog
      const consumptionLogs = await this.consumptionLogModel.find().lean().exec();
      this.logger.log(`📊 ${consumptionLogs.length} entrées trouvées dans DailyConsumptionLog`);

      for (const log of consumptionLogs) {
        try {
          // Vérifier si déjà synchronisé
          const existing = await this.historyModel.findOne({
            sourceCollection: 'DailyConsumptionLog',
            sourceId: log._id,
          }).exec();

          if (existing) {
            report.skipped++;
            continue;
          }

          // Enrichir avec les données du matériau
          const material = await this.materialModel.findById(log.materialId).lean().exec();
          if (!material) {
            report.errors++;
            this.logger.warn(`⚠️ Matériau ${log.materialId} introuvable pour ConsumptionLog ${log._id}`);
            continue;
          }

          // Enrichir avec le nom du site
          const siteName = await this.getSiteName(log.siteId?.toString());

          // Mapper le type d'anomalie
          const anomalyType = this.mapAnomalyType(log.anomalyType);
          const anomalySeverity = this.calculateAnomalySeverity(log.anomalyScore || 0, anomalyType);

          // Créer l'entrée d'historique
          await this.historyModel.create({
            materialId: log.materialId,
            materialName: material.name,
            materialCode: material.code,
            materialCategory: material.category,
            materialUnit: material.unit,
            siteId: log.siteId,
            siteName: siteName || undefined,
            date: log.date || log.createdAt,
            quantity: log.quantityUsed,
            flowType: FlowType.DAILY_CONSUMPTION,
            expectedQuantity: log.expectedConsumption || 0,
            anomalyScore: log.anomalyScore || 0,
            anomalyType,
            anomalySeverity,
            stockBefore: 0,
            stockAfter: 0,
            sourceCollection: 'DailyConsumptionLog',
            sourceId: log._id,
            recordedBy: log.recordedBy,
            reason: log.anomalyReason,
          });

          report.synced++;
        } catch (error) {
          report.errors++;
          this.logger.error(`❌ Erreur ConsumptionLog ${log._id}: ${error.message}`);
        }
      }

      this.logger.log(`✅ Synchronisation terminée: ${report.synced} synced, ${report.skipped} skipped, ${report.errors} errors`);
      return report;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la synchronisation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle entrée dans l'historique
   */
  async addEntry(dto: CreateConsumptionHistoryDto): Promise<ConsumptionHistory> {
    try {
      // Enrichir avec le nom du site si non fourni
      if (!dto.siteName && dto.siteId) {
        const siteName = await this.getSiteName(dto.siteId);
        dto.siteName = siteName || undefined;
      }

      const entry = await this.historyModel.create(dto);
      this.logger.log(`✅ Entrée ajoutée: ${dto.materialName} - ${dto.quantity} ${dto.materialUnit} (${dto.flowType})`);
      return entry;
    } catch (error) {
      // Ne pas faire échouer l'opération principale
      this.logger.error(`❌ Erreur lors de l'ajout d'entrée: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'historique paginé avec filtres
   */
  async getHistory(filters: HistoryFiltersDto): Promise<PaginationResult<ConsumptionHistory>> {
    const { page = 1, limit = 50, sortBy = 'date', sortOrder = 'desc', ...queryFilters } = filters;

    // Construction de la requête
    const query: any = {};

    if (queryFilters.materialId) {
      query.materialId = new Types.ObjectId(queryFilters.materialId);
    }

    if (queryFilters.siteId) {
      query.siteId = new Types.ObjectId(queryFilters.siteId);
    }

    if (queryFilters.startDate || queryFilters.endDate) {
      query.date = {};
      if (queryFilters.startDate) query.date.$gte = queryFilters.startDate;
      if (queryFilters.endDate) query.date.$lte = queryFilters.endDate;
    }

    if (queryFilters.flowType && queryFilters.flowType.length > 0) {
      query.flowType = { $in: queryFilters.flowType };
    }

    if (queryFilters.anomalyType && queryFilters.anomalyType.length > 0) {
      query.anomalyType = { $in: queryFilters.anomalyType };
    }

    if (queryFilters.anomalySeverity && queryFilters.anomalySeverity.length > 0) {
      query.anomalySeverity = { $in: queryFilters.anomalySeverity };
    }

    if (queryFilters.materialCategory) {
      query.materialCategory = queryFilters.materialCategory;
    }

    if (queryFilters.searchText) {
      query.$or = [
        { materialName: { $regex: queryFilters.searchText, $options: 'i' } },
        { materialCode: { $regex: queryFilters.searchText, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Exécution de la requête
    const [data, total] = await Promise.all([
      this.historyModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean().exec(),
      this.historyModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as any,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      appliedFilters: queryFilters,
    };
  }

  /**
   * Récupère les statistiques pour graphiques
   */
  async getStatistics(filters: StatisticsFiltersDto): Promise<ConsumptionStatistics> {
    const { siteId, materialId, startDate, endDate, groupBy = 'day' } = filters;

    // Construction de la requête de base
    const matchQuery: any = {};
    if (siteId) matchQuery.siteId = new Types.ObjectId(siteId);
    if (materialId) matchQuery.materialId = new Types.ObjectId(materialId);
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = startDate;
      if (endDate) matchQuery.date.$lte = endDate;
    }

    // Utiliser $facet pour exécuter plusieurs agrégations en une seule requête
    const result: any = await this.historyModel.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          timeline: this.buildTimelineAggregation(groupBy) as any,
          flowTypeBreakdown: this.buildFlowTypeBreakdown() as any,
          anomalyBreakdown: this.buildAnomalyBreakdown() as any,
          topMaterials: this.buildTopMaterialsAggregation() as any,
          summary: this.buildSummaryAggregation() as any,
        },
      },
    ]).exec();

    const data = result[0];

    // Calculer la tendance
    const trend = this.calculateTrend(data.timeline);

    return {
      timeline: data.timeline,
      flowTypeBreakdown: data.flowTypeBreakdown,
      anomalyBreakdown: data.anomalyBreakdown,
      topMaterials: data.topMaterials,
      summary: data.summary[0] || this.getDefaultSummary(),
      trend,
    };
  }

  /**
   * Récupère la tendance d'un matériau sur X jours
   */
  async getMaterialTrend(materialId: string, days: number = 30): Promise<MaterialTrend> {
    const material = await this.materialModel.findById(materialId).lean().exec();
    if (!material) {
      throw new NotFoundException(`Matériau ${materialId} introuvable`);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await this.historyModel.aggregate([
      {
        $match: {
          materialId: new Types.ObjectId(materialId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          consumed: {
            $sum: {
              $cond: [
                { $in: ['$flowType', [FlowType.OUT, FlowType.DAILY_CONSUMPTION]] },
                '$quantity',
                0,
              ],
            },
          },
          received: {
            $sum: {
              $cond: [{ $eq: ['$flowType', FlowType.IN] }, '$quantity', 0],
            },
          },
          stockLevel: { $last: '$stockAfter' },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    const trendData: MaterialTrendDataPoint[] = data.map((d) => ({
      date: d._id,
      consumed: d.consumed,
      received: d.received,
      stockLevel: d.stockLevel,
    }));

    // Calculer la tendance
    const trend = this.calculateSimpleTrend(trendData.map((d) => d.consumed));

    return {
      materialId,
      materialName: material.name,
      days,
      data: trendData,
      trend,
    };
  }

  /**
   * Récupère une entrée par ID
   */
  async getById(id: string): Promise<ConsumptionHistory> {
    const entry = await this.historyModel.findById(id).exec();
    if (!entry) {
      throw new NotFoundException(`Entrée ${id} introuvable`);
    }
    return entry;
  }

  /**
   * Nettoie les entrées avant une date donnée
   */
  async cleanup(beforeDate?: Date): Promise<{ deleted: number }> {
    const query: any = {};
    if (beforeDate) {
      query.date = { $lt: beforeDate };
    }

    const result = await this.historyModel.deleteMany(query).exec();
    this.logger.log(`🧹 ${result.deletedCount} entrées supprimées`);
    return { deleted: result.deletedCount };
  }

  // ==================== MÉTHODES PRIVÉES ====================

  private async getSiteName(siteId: string): Promise<string | null> {
    if (!siteId) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.SITES_SERVICE_URL}/api/gestion-sites/${siteId}`),
      );
      return response.data?.nom || response.data?.name || null;
    } catch (error) {
      this.logger.warn(`⚠️ Impossible de récupérer le site ${siteId}`);
      return null;
    }
  }

  private mapFlowType(type: string): FlowType {
    const mapping: Record<string, FlowType> = {
      IN: FlowType.IN,
      OUT: FlowType.OUT,
      ADJUSTMENT: FlowType.ADJUSTMENT,
      DAMAGE: FlowType.DAMAGE,
      RETURN: FlowType.RETURN,
      RESERVE: FlowType.RESERVE,
    };
    return mapping[type] || FlowType.OUT;
  }

  private mapAnomalyType(type: string): AnomalyType {
    const mapping: Record<string, AnomalyType> = {
      vol: AnomalyType.VOL,
      probleme: AnomalyType.PROBLEME,
      normal: AnomalyType.NORMAL,
    };
    return mapping[type] || AnomalyType.NONE;
  }

  private calculateAnomalySeverity(score: number, type: AnomalyType): AnomalySeverity {
    if (type === AnomalyType.NONE || type === AnomalyType.NORMAL) {
      return AnomalySeverity.NONE;
    }
    if (score >= 80) return AnomalySeverity.CRITICAL;
    if (score >= 50) return AnomalySeverity.WARNING;
    return AnomalySeverity.LOW;
  }

  private buildTimelineAggregation(groupBy: string) {
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-W%V' : '%Y-%m';

    return [
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          totalConsumed: {
            $sum: {
              $cond: [
                { $in: ['$flowType', [FlowType.OUT, FlowType.DAILY_CONSUMPTION]] },
                '$quantity',
                0,
              ],
            },
          },
          totalReceived: {
            $sum: {
              $cond: [{ $eq: ['$flowType', FlowType.IN] }, '$quantity', 0],
            },
          },
          totalDamaged: {
            $sum: {
              $cond: [{ $eq: ['$flowType', FlowType.DAMAGE] }, '$quantity', 0],
            },
          },
          anomalyCount: {
            $sum: {
              $cond: [{ $ne: ['$anomalyType', AnomalyType.NONE] }, 1, 0],
            },
          },
          avgAnomalyScore: { $avg: '$anomalyScore' },
        },
      },
      {
        $project: {
          period: '$_id',
          totalConsumed: 1,
          totalReceived: 1,
          totalDamaged: 1,
          netFlow: { $subtract: ['$totalReceived', '$totalConsumed'] },
          anomalyCount: 1,
          avgAnomalyScore: { $round: ['$avgAnomalyScore', 2] },
        },
      },
      { $sort: { period: 1 } },
    ];
  }

  private buildFlowTypeBreakdown() {
    return [
      {
        $group: {
          _id: '$flowType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          totalQuantity: 1,
        },
      },
    ];
  }

  private buildAnomalyBreakdown() {
    return [
      {
        $match: { anomalyType: { $ne: AnomalyType.NONE } },
      },
      {
        $group: {
          _id: '$anomalyType',
          count: { $sum: 1 },
          severity: { $first: '$anomalySeverity' },
        },
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          severity: 1,
        },
      },
    ];
  }

  private buildTopMaterialsAggregation() {
    return [
      {
        $match: {
          flowType: { $in: [FlowType.OUT, FlowType.DAILY_CONSUMPTION] },
        },
      },
      {
        $group: {
          _id: '$materialId',
          materialName: { $first: '$materialName' },
          totalConsumed: { $sum: '$quantity' },
          anomalyCount: {
            $sum: {
              $cond: [{ $ne: ['$anomalyType', AnomalyType.NONE] }, 1, 0],
            },
          },
          avgAnomalyScore: { $avg: '$anomalyScore' },
        },
      },
      { $sort: { totalConsumed: -1 } },
      { $limit: 10 },
      {
        $project: {
          materialId: { $toString: '$_id' },
          materialName: 1,
          totalConsumed: 1,
          anomalyCount: 1,
          avgAnomalyScore: { $round: ['$avgAnomalyScore', 2] },
        },
      },
    ];
  }

  private buildSummaryAggregation() {
    return [
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalConsumed: {
            $sum: {
              $cond: [
                { $in: ['$flowType', [FlowType.OUT, FlowType.DAILY_CONSUMPTION]] },
                '$quantity',
                0,
              ],
            },
          },
          totalReceived: {
            $sum: {
              $cond: [{ $eq: ['$flowType', FlowType.IN] }, '$quantity', 0],
            },
          },
          totalDamaged: {
            $sum: {
              $cond: [{ $eq: ['$flowType', FlowType.DAMAGE] }, '$quantity', 0],
            },
          },
          anomalyCount: {
            $sum: {
              $cond: [{ $ne: ['$anomalyType', AnomalyType.NONE] }, 1, 0],
            },
          },
          criticalAnomalies: {
            $sum: {
              $cond: [{ $eq: ['$anomalySeverity', AnomalySeverity.CRITICAL] }, 1, 0],
            },
          },
          minDate: { $min: '$date' },
          maxDate: { $max: '$date' },
        },
      },
      {
        $project: {
          _id: 0,
          totalEntries: 1,
          totalConsumed: 1,
          totalReceived: 1,
          totalDamaged: 1,
          anomalyRate: {
            $multiply: [{ $divide: ['$anomalyCount', '$totalEntries'] }, 100],
          },
          criticalAnomalies: 1,
          periodDays: {
            $divide: [{ $subtract: ['$maxDate', '$minDate'] }, 1000 * 60 * 60 * 24],
          },
          avgDailyConsumption: {
            $divide: [
              '$totalConsumed',
              { $divide: [{ $subtract: ['$maxDate', '$minDate'] }, 1000 * 60 * 60 * 24] },
            ],
          },
        },
      },
    ];
  }

  private calculateTrend(timeline: TimelineDataPoint[]): TrendAnalysis {
    if (timeline.length < 2) {
      return {
        direction: 'stable',
        percentage: 0,
        interpretation: 'Données insuffisantes pour calculer une tendance',
      };
    }

    const midpoint = Math.floor(timeline.length / 2);
    const firstHalf = timeline.slice(0, midpoint);
    const secondHalf = timeline.slice(midpoint);

    const avgFirst = firstHalf.reduce((sum, d) => sum + d.totalConsumed, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, d) => sum + d.totalConsumed, 0) / secondHalf.length;

    const percentage = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    let direction: 'increasing' | 'decreasing' | 'stable';
    let interpretation: string;

    if (Math.abs(percentage) < 5) {
      direction = 'stable';
      interpretation = 'La consommation est stable sur la période';
    } else if (percentage > 0) {
      direction = 'increasing';
      interpretation = `La consommation augmente de ${percentage.toFixed(1)}%`;
    } else {
      direction = 'decreasing';
      interpretation = `La consommation diminue de ${Math.abs(percentage).toFixed(1)}%`;
    }

    return { direction, percentage: Math.round(percentage * 10) / 10, interpretation };
  }

  private calculateSimpleTrend(values: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    if (values.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);

    const avgFirst = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const percentage = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(percentage) < 5) {
      direction = 'stable';
    } else if (percentage > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return { direction, percentage: Math.round(percentage * 10) / 10 };
  }

  private getDefaultSummary(): StatisticsSummary {
    return {
      totalEntries: 0,
      totalConsumed: 0,
      totalReceived: 0,
      totalDamaged: 0,
      anomalyRate: 0,
      criticalAnomalies: 0,
      avgDailyConsumption: 0,
      periodDays: 0,
    };
  }
}
