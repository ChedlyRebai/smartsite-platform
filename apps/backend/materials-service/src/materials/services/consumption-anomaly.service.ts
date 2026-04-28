import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyConsumptionLog } from '../entities/daily-consumption.entity';
import { Material } from '../entities/material.entity';
import { CreateDailyConsumptionDto, ConsumptionAnomalyResult } from '../dto/daily-consumption.dto';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConsumptionHistoryService } from './consumption-history.service';
import { FlowType, SourceCollection, AnomalyType as HistoryAnomalyType, AnomalySeverity } from '../entities/consumption-history.entity';

@Injectable()
export class ConsumptionAnomalyService {
  private readonly logger = new Logger(ConsumptionAnomalyService.name);

  constructor(
    @InjectModel(DailyConsumptionLog.name)
    private consumptionModel: Model<DailyConsumptionLog>,
    @InjectModel(Material.name)
    private materialModel: Model<Material>,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => ConsumptionHistoryService))
    private readonly historyService: ConsumptionHistoryService,
  ) {}

  detectAnomaly(quantityUsed: number, expectedConsumption: number): {
    anomalyType: 'vol' | 'probleme' | 'normal';
    anomalyScore: number;
    severity: 'critical' | 'warning' | 'normal';
    message: string;
  } {
    const safeExpected = expectedConsumption <= 0 ? 1 : expectedConsumption;
    const ratio = quantityUsed / safeExpected;
    let anomalyScore = 0;
    let anomalyType: 'vol' | 'probleme' | 'normal' = 'normal';
    let severity: 'critical' | 'warning' | 'normal' = 'normal';
    let message = '';

    if (quantityUsed > safeExpected * 1.5) {
      anomalyType = 'vol';
      anomalyScore = Math.min(100, Math.round(((ratio - 1.5) / 1.5) * 100));
      severity = 'critical';
      message = `ALERTE VOL: Consommation anormalement elevee! Utilise: ${quantityUsed}, Attendu: ${safeExpected} (${Math.round(ratio * 100)}% de la normale)`;
    } else if (quantityUsed < safeExpected * 0.3) {
      anomalyType = 'probleme';
      anomalyScore = Math.min(100, Math.round(((0.3 - ratio) / 0.3) * 100));
      severity = 'warning';
      message = `ALERTE PROGRESSION: Consommation tres faible! Utilise: ${quantityUsed}, Attendu: ${safeExpected} (Seulement ${Math.round(ratio * 100)}% de la normale)`;
    } else {
      anomalyType = 'normal';
      anomalyScore = 0;
      severity = 'normal';
      message = `Consommation normale: ${quantityUsed} / ${safeExpected} (${Math.round(ratio * 100)}%)`;
    }

    return { anomalyType, anomalyScore, severity, message };
  }

  async recordConsumption(
    createDto: CreateDailyConsumptionDto,
    userId?: string,
  ): Promise<ConsumptionAnomalyResult> {
    const { materialId, siteId, date, quantityUsed, expectedConsumption } = createDto;

    const { anomalyType, anomalyScore, severity, message } = this.detectAnomaly(
      quantityUsed,
      expectedConsumption,
    );

    // Récupérer les informations du matériau pour l'historique
    const material = await this.materialModel.findById(materialId).lean().exec();
    if (!material) {
      throw new Error(`Matériau ${materialId} introuvable`);
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let consumption = await this.consumptionModel.findOne({
      materialId: new Types.ObjectId(materialId),
      siteId: new Types.ObjectId(siteId),
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (consumption) {
      consumption.quantityUsed = quantityUsed;
      consumption.expectedConsumption = expectedConsumption;
      consumption.anomalyScore = anomalyScore;
      consumption.anomalyType = anomalyType;
      consumption.anomalyReason = message;
      if (userId && Types.ObjectId.isValid(userId)) {
        consumption.recordedBy = new Types.ObjectId(userId);
      }
      await consumption.save();
    } else {
      consumption = new this.consumptionModel({
        materialId: new Types.ObjectId(materialId),
        siteId: new Types.ObjectId(siteId),
        date: startOfDay,
        quantityUsed,
        expectedConsumption,
        anomalyScore,
        anomalyType,
        anomalyReason: message,
        recordedBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
        emailSent: false,
      });
      await consumption.save();
    }

    // Ajouter à l'historique centralisé
    try {
      await this.historyService.addEntry({
        materialId: material._id.toString(),
        materialName: material.name,
        materialCode: material.code,
        materialCategory: material.category,
        materialUnit: material.unit,
        siteId: siteId,
        siteName: undefined, // Sera enrichi par le service
        date: startOfDay,
        quantity: quantityUsed,
        flowType: FlowType.DAILY_CONSUMPTION,
        expectedQuantity: expectedConsumption,
        anomalyScore: anomalyScore,
        anomalyType: this.mapToHistoryAnomalyType(anomalyType),
        anomalySeverity: this.calculateHistorySeverity(severity),
        stockBefore: 0,
        stockAfter: 0,
        sourceCollection: SourceCollection.DAILY_CONSUMPTION_LOG,
        sourceId: consumption._id.toString(),
        recordedBy: userId,
        reason: message,
      });
    } catch (error) {
      // Ne pas faire échouer l'opération principale
      this.logger.error(`⚠️ Erreur lors de l'ajout à l'historique: ${error.message}`);
    }

    this.logger.log(`Consommation enregistree: ${materialId} - ${anomalyType} (score: ${anomalyScore})`);

    if (severity !== 'normal' && !consumption.emailSent) {
      await this.sendAnomalyEmail(consumption, anomalyType, severity, message);
      consumption.emailSent = true;
      consumption.emailSentAt = new Date();
      await consumption.save();
    }

    return {
      consumption,
      anomalyType: anomalyType === 'vol' ? 'VOL_POSSIBLE' : anomalyType === 'probleme' ? 'CHANTIER_BLOQUE' : 'NORMAL',
      anomalyScore,
      message,
      severity,
    };
  }

  async resendAlert(recordId: string): Promise<void> {
    const consumption = await this.consumptionModel.findById(recordId);
    if (!consumption) return;
    if (consumption.anomalyType === 'normal') return;

    await this.sendAnomalyEmail(
      consumption,
      consumption.anomalyType,
      consumption.anomalyType === 'vol' ? 'critical' : 'warning',
      consumption.anomalyReason || '',
    );

    consumption.emailSent = true;
    consumption.emailSentAt = new Date();
    await consumption.save();
  }

  private async sendAnomalyEmail(
    consumption: DailyConsumptionLog,
    anomalyType: string,
    severity: string,
    message: string,
  ): Promise<void> {
    const material = await this.getMaterialInfo(consumption.materialId.toString());
    const site = await this.getSiteInfo(consumption.siteId.toString());
    const recipients = process.env.ALERT_EMAILS || 'admin@smartsite.com';

    // Adaptation locale: pas de EmailService dans ce microservice.
    // On journalise l'alerte pour garder un flux fonctionnel sans casser la compilation.
    this.logger.warn(
      `[ALERT:${severity}] ${anomalyType} -> ${recipients} | materiau=${material?.name || 'N/A'} | site=${site?.nom || 'N/A'} | ${message}`,
    );
  }

  async getConsumptionsBySite(siteId: string, startDate?: Date, endDate?: Date): Promise<DailyConsumptionLog[]> {
    const filter: any = { siteId: new Types.ObjectId(siteId) };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    return this.consumptionModel.find(filter).sort({ date: -1 }).exec();
  }

  async getConsumptionsByMaterial(materialId: string, startDate?: Date, endDate?: Date): Promise<DailyConsumptionLog[]> {
    const filter: any = { materialId: new Types.ObjectId(materialId) };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    return this.consumptionModel.find(filter).sort({ date: -1 }).exec();
  }

  async getActiveAnomalies(): Promise<DailyConsumptionLog[]> {
    return this.consumptionModel.find({
      anomalyType: { $in: ['vol', 'probleme'] },
      emailSent: true,
    }).sort({ date: -1 }).limit(50).exec();
  }

  async getAnomalyStats(startDate: Date, endDate: Date): Promise<any> {
    return this.consumptionModel.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$anomalyType',
          count: { $sum: 1 },
          avgAnomalyScore: { $avg: '$anomalyScore' },
        },
      },
    ]);
  }

  @Cron('0 20 * * *')
  async dailyAnomalyCheck() {
    this.logger.log('Execution du check quotidien des anomalies de consommation...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const anomalies = await this.consumptionModel.find({
      date: { $gte: yesterday, $lte: today },
      anomalyType: { $in: ['vol', 'probleme'] },
      emailSent: false,
    });

    for (const anomaly of anomalies) {
      await this.sendAnomalyEmail(
        anomaly,
        anomaly.anomalyType,
        anomaly.anomalyType === 'vol' ? 'critical' : 'warning',
        anomaly.anomalyReason || '',
      );
      anomaly.emailSent = true;
      anomaly.emailSentAt = new Date();
      await anomaly.save();
    }

    this.logger.log(`Check termine: ${anomalies.length} anomalies detectees`);
  }

  private async getMaterialInfo(materialId: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.get(`http://localhost:3002/api/materials/${materialId}`));
      return response.data;
    } catch {
      return null;
    }
  }

  private async getSiteInfo(siteId: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.get(`http://localhost:3001/api/gestion-sites/${siteId}`));
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Mapper le type d'anomalie vers ConsumptionHistory
   */
  private mapToHistoryAnomalyType(type: string): HistoryAnomalyType {
    if (type === 'vol') return HistoryAnomalyType.VOL;
    if (type === 'probleme') return HistoryAnomalyType.PROBLEME;
    if (type === 'normal') return HistoryAnomalyType.NORMAL;
    return HistoryAnomalyType.NONE;
  }

  /**
   * Calculer la sévérité de l'anomalie pour l'historique
   */
  private calculateHistorySeverity(severity: string): AnomalySeverity {
    if (severity === 'critical') return AnomalySeverity.CRITICAL;
    if (severity === 'warning') return AnomalySeverity.WARNING;
    if (severity === 'normal') return AnomalySeverity.NONE;
    return AnomalySeverity.LOW;
  }
}
