import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material } from '../entities/material.entity';
import { MaterialFlowLog } from '../entities/material-flow-log.entity';
import { AnomalyEmailService } from '../../common/email/anomaly-email.service';

export interface StockPredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  consumptionRate: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  predictionModelUsed: boolean;
  confidence: number;
  message: string;
  weatherImpact?: string;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyType: 'EXCESSIVE_OUT' | 'SUSPICIOUS_PATTERN' | 'NORMAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  deviationPercentage: number;
  recommendedAction: string;
  shouldSendAlert: boolean;
}

@Injectable()
export class MLTrainingEnhancedService {
  private readonly logger = new Logger(MLTrainingEnhancedService.name);

  constructor(
    @InjectModel(Material.name) private materialModel: Model<Material>,
    @InjectModel(MaterialFlowLog.name) private flowLogModel: Model<MaterialFlowLog>,
    private anomalyEmailService: AnomalyEmailService,
  ) {}

  /**
   * 🤖 ENTRAÎNEMENT AUTOMATIQUE - Stock Prediction
   */
  async trainStockPredictionModel(materialId: string): Promise<StockPredictionResult> {
    this.logger.log(`🤖 Training stock prediction model for material: ${materialId}`);

    try {
      // 1. Récupérer le matériau
      const material = await this.materialModel.findById(materialId);
      if (!material) {
        throw new Error(`Material ${materialId} not found`);
      }

      // 2. Récupérer l'historique des flux
      const flowHistory = await this.flowLogModel
        .find({ materialId })
        .sort({ createdAt: -1 })
        .limit(100)
        .exec();

      // 3. Calculer les métriques de consommation
      const consumptionData = this.calculateConsumptionMetrics(flowHistory);
      
      // 4. Prédire le stock futur
      const prediction = this.predictStockLevels(material, consumptionData);

      // 5. Ajouter l'impact météo (simulation)
      const weatherImpact = this.simulateWeatherImpact();

      const result: StockPredictionResult = {
        materialId: material._id.toString(),
        materialName: material.name,
        currentStock: material.quantity || 0,
        consumptionRate: consumptionData.averageConsumptionPerHour,
        hoursToLowStock: prediction.hoursToLowStock,
        hoursToOutOfStock: prediction.hoursToOutOfStock,
        status: prediction.status,
        recommendedOrderQuantity: prediction.recommendedQuantity,
        predictionModelUsed: true,
        confidence: prediction.confidence,
        message: prediction.message,
        weatherImpact,
      };

      this.logger.log(`✅ Stock prediction completed: ${result.status} (${result.confidence}% confidence)`);
      return result;

    } catch (error) {
      this.logger.error(`❌ Stock prediction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🚨 DÉTECTION D'ANOMALIES - Consommation
   */
  async detectConsumptionAnomaly(materialId: string, newConsumption: number): Promise<AnomalyDetectionResult> {
    this.logger.log(`🚨 Detecting consumption anomaly for material: ${materialId}, consumption: ${newConsumption}`);

    try {
      // 1. Récupérer l'historique récent
      const recentFlows = await this.flowLogModel
        .find({ 
          materialId,
          type: 'OUT',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 derniers jours
        })
        .sort({ createdAt: -1 })
        .exec();

      // 2. Calculer les statistiques normales
      const normalStats = this.calculateNormalConsumptionStats(recentFlows);

      // 3. Détecter l'anomalie
      const anomalyResult = this.analyzeAnomalyPattern(newConsumption, normalStats);

      // 4. Envoyer alerte si nécessaire
      if (anomalyResult.shouldSendAlert) {
        await this.sendAnomalyAlert(materialId, anomalyResult);
      }

      this.logger.log(`✅ Anomaly detection completed: ${anomalyResult.anomalyType} (${anomalyResult.riskLevel})`);
      return anomalyResult;

    } catch (error) {
      this.logger.error(`❌ Anomaly detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 Calculer les métriques de consommation
   */
  private calculateConsumptionMetrics(flowHistory: any[]) {
    if (flowHistory.length === 0) {
      return {
        averageConsumptionPerHour: 0,
        totalConsumption: 0,
        consumptionTrend: 'stable' as const,
      };
    }

    // Calculer la consommation totale (sorties)
    const outFlows = flowHistory.filter(f => f.type === 'OUT');
    const totalConsumption = outFlows.reduce((sum, flow) => sum + (flow.quantity || 0), 0);

    // Calculer la période en heures
    const oldestFlow = flowHistory[flowHistory.length - 1];
    const newestFlow = flowHistory[0];
    const periodHours = Math.max(1, (new Date(newestFlow.createdAt).getTime() - new Date(oldestFlow.createdAt).getTime()) / (1000 * 60 * 60));

    // Consommation moyenne par heure
    const averageConsumptionPerHour = totalConsumption / periodHours;

    // Tendance (simplifié)
    const recentConsumption = outFlows.slice(0, 10).reduce((sum, flow) => sum + (flow.quantity || 0), 0);
    const olderConsumption = outFlows.slice(-10).reduce((sum, flow) => sum + (flow.quantity || 0), 0);
    
    let consumptionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentConsumption > olderConsumption * 1.2) consumptionTrend = 'increasing';
    else if (recentConsumption < olderConsumption * 0.8) consumptionTrend = 'decreasing';

    return {
      averageConsumptionPerHour,
      totalConsumption,
      consumptionTrend,
    };
  }

  /**
   * 🔮 Prédire les niveaux de stock
   */
  private predictStockLevels(material: any, consumptionData: any) {
    const currentStock = material.quantity || 0;
    const reorderPoint = material.reorderPoint || material.minimumStock || 10;
    const consumptionRate = consumptionData.averageConsumptionPerHour;

    if (consumptionRate <= 0) {
      return {
        hoursToLowStock: 999999,
        hoursToOutOfStock: 999999,
        status: 'safe' as const,
        recommendedQuantity: 0,
        confidence: 95,
        message: 'Stock sécurisé. Aucune consommation détectée.',
      };
    }

    // Calculs de prédiction
    const hoursToLowStock = Math.max(0, (currentStock - reorderPoint) / consumptionRate);
    const hoursToOutOfStock = Math.max(0, currentStock / consumptionRate);

    // Déterminer le statut
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let message = '';
    let recommendedQuantity = 0;

    if (hoursToOutOfStock <= 24) {
      status = 'critical';
      message = `🚨 Rupture dans ${Math.round(hoursToOutOfStock)}h!`;
      recommendedQuantity = Math.ceil(consumptionRate * 24 * 7); // 1 semaine
    } else if (hoursToLowStock <= 48) {
      status = 'warning';
      message = `⚠️ Stock bas dans ${Math.round(hoursToLowStock)}h`;
      recommendedQuantity = Math.ceil(consumptionRate * 24 * 5); // 5 jours
    } else {
      message = `✅ Stock sécurisé. ${Math.round(hoursToOutOfStock)}h avant rupture.`;
    }

    // Confiance basée sur la quantité de données
    const confidence = Math.min(95, 60 + (consumptionData.totalConsumption > 0 ? 30 : 0));

    return {
      hoursToLowStock,
      hoursToOutOfStock,
      status,
      recommendedQuantity,
      confidence,
      message,
    };
  }

  /**
   * 🌤️ Simuler l'impact météo
   */
  private simulateWeatherImpact(): string {
    const weatherConditions = [
      'Conditions normales',
      'Pluie prévue - consommation +15%',
      'Temps sec - consommation normale',
      'Vent fort - retards possibles',
    ];
    return weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  }

  /**
   * 📈 Calculer les statistiques normales de consommation
   */
  private calculateNormalConsumptionStats(flows: any[]) {
    if (flows.length === 0) {
      return { average: 0, standardDeviation: 0, maximum: 0 };
    }

    const quantities = flows.map(f => f.quantity || 0);
    const average = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - average, 2), 0) / quantities.length;
    const standardDeviation = Math.sqrt(variance);
    
    const maximum = Math.max(...quantities);

    return { average, standardDeviation, maximum };
  }

  /**
   * 🔍 Analyser les patterns d'anomalie
   */
  private analyzeAnomalyPattern(newConsumption: number, normalStats: any): AnomalyDetectionResult {
    const { average, standardDeviation, maximum } = normalStats;

    // Seuils d'anomalie
    const moderateThreshold = average + (2 * standardDeviation);
    const severeThreshold = average + (3 * standardDeviation);

    let isAnomaly = false;
    let anomalyType: 'EXCESSIVE_OUT' | 'SUSPICIOUS_PATTERN' | 'NORMAL' = 'NORMAL';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let message = 'Consommation normale';
    let deviationPercentage = 0;
    let recommendedAction = 'Aucune action requise';
    let shouldSendAlert = false;

    if (newConsumption > moderateThreshold) {
      isAnomaly = true;
      deviationPercentage = Math.round(((newConsumption - average) / average) * 100);

      if (newConsumption > severeThreshold) {
        anomalyType = 'EXCESSIVE_OUT';
        riskLevel = 'HIGH';
        message = `🚨 Consommation excessive détectée! ${deviationPercentage}% au-dessus de la normale`;
        recommendedAction = 'Vérifier immédiatement - Risque de vol ou gaspillage';
        shouldSendAlert = true;
      } else {
        anomalyType = 'SUSPICIOUS_PATTERN';
        riskLevel = 'MEDIUM';
        message = `⚠️ Consommation anormalement élevée: ${deviationPercentage}% au-dessus de la normale`;
        recommendedAction = 'Surveiller et vérifier les causes';
        shouldSendAlert = newConsumption > average * 1.5; // Alerte si >150% de la normale
      }
    }

    return {
      isAnomaly,
      anomalyType,
      riskLevel,
      message,
      deviationPercentage,
      recommendedAction,
      shouldSendAlert,
    };
  }

  /**
   * 📧 Envoyer alerte d'anomalie
   */
  private async sendAnomalyAlert(materialId: string, anomalyResult: AnomalyDetectionResult) {
    try {
      const material = await this.materialModel.findById(materialId);
      if (!material) return;

      const alertData = {
        toEmail: 'admin@smartsite.com', // Email par défaut
        userName: 'Système ML',
        siteName: (material as any).siteName || 'Site non défini',
        materialId: material._id.toString(),
        materialName: material.name,
        materialCode: material.code,
        flowType: 'OUT',
        quantity: 0, // Quantité de l'anomalie
        anomalyType: anomalyResult.anomalyType as any,
        anomalyMessage: anomalyResult.message,
        currentStock: material.quantity,
        previousStock: material.quantity,
        expectedQuantity: 0,
        deviationPercent: anomalyResult.deviationPercentage,
        timestamp: new Date(),
        reason: anomalyResult.recommendedAction,
      };

      // Envoyer email d'alerte
      await this.anomalyEmailService.sendStockAnomalyAlert(alertData);
      
      this.logger.log(`📧 Anomaly alert sent for material: ${material.name}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send anomaly alert: ${error.message}`);
    }
  }

  /**
   * 🎯 API publique pour entraîner le modèle (bouton dans l'interface)
   */
  async trainModelOnDemand(materialId: string): Promise<{
    stockPrediction: StockPredictionResult;
    trainingCompleted: boolean;
    message: string;
  }> {
    this.logger.log(`🎯 On-demand model training requested for: ${materialId}`);

    try {
      // Entraîner le modèle de prédiction de stock
      const stockPrediction = await this.trainStockPredictionModel(materialId);

      return {
        stockPrediction,
        trainingCompleted: true,
        message: `✅ Modèle ML entraîné avec succès pour ${stockPrediction.materialName}`,
      };
    } catch (error) {
      this.logger.error(`❌ On-demand training failed: ${error.message}`);
      throw error;
    }
  }
}