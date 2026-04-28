import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConsumptionHistory, FlowType, AnomalyType } from '../entities/consumption-history.entity';
import { Material } from '../entities/material.entity';

export interface ConsumptionAnalysisReport {
  materialId: string;
  materialName: string;
  materialCode: string;
  siteId: string;
  siteName: string;
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  totalConsumption: number;
  averageDailyConsumption: number;
  expectedConsumption: number;
  consumptionStatus: 'NORMAL' | 'OVER_CONSUMPTION' | 'UNDER_CONSUMPTION';
  deviationPercentage: number;
  alerts: ConsumptionAlert[];
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  possibleIssues: string[];
}

export interface ConsumptionAlert {
  type: 'NORMAL' | 'GASPILLAGE' | 'VOL_POSSIBLE' | 'OVER_CONSUMPTION' | 'ANOMALIE';
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';
  message: string;
  date: Date;
  quantity: number;
  expectedQuantity: number;
  deviation: number;
}

@Injectable()
export class ConsumptionAIAnalyzerService {
  private readonly logger = new Logger(ConsumptionAIAnalyzerService.name);

  constructor(
    @InjectModel(ConsumptionHistory.name) private historyModel: Model<ConsumptionHistory>,
    @InjectModel(Material.name) private materialModel: Model<Material>,
  ) {}

  /**
   * Génère un rapport d'analyse IA de la consommation
   */
  async generateConsumptionReport(
    materialId: string,
    siteId: string,
    days: number = 30,
  ): Promise<ConsumptionAnalysisReport> {
    this.logger.log(`🤖 Génération du rapport IA pour material=${materialId}, site=${siteId}, days=${days}`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Récupérer l'historique
    const history = await this.historyModel
      .find({
        materialId: new Types.ObjectId(materialId),
        siteId: new Types.ObjectId(siteId),
        date: { $gte: startDate, $lte: endDate },
        flowType: FlowType.OUT, // Seulement les sorties (consommations)
      })
      .sort({ date: 1 })
      .exec();

    if (history.length === 0) {
      throw new Error('Aucune donnée de consommation trouvée pour cette période');
    }

    // 2. Récupérer les infos du matériau
    const material = await this.materialModel.findById(materialId).exec();
    if (!material) {
      throw new Error('Matériau non trouvé');
    }

    // 3. Calculer les statistiques
    const totalConsumption = history.reduce((sum, entry) => sum + entry.quantity, 0);
    const averageDailyConsumption = totalConsumption / days;

    // 4. Calculer la consommation attendue (basée sur la moyenne historique)
    const expectedConsumption = this.calculateExpectedConsumption(history, days);
    const deviationPercentage = expectedConsumption > 0
      ? ((totalConsumption - expectedConsumption) / expectedConsumption) * 100
      : 0;

    // 5. Déterminer le statut de consommation
    let consumptionStatus: 'NORMAL' | 'OVER_CONSUMPTION' | 'UNDER_CONSUMPTION' = 'NORMAL';
    if (deviationPercentage > 20) {
      consumptionStatus = 'OVER_CONSUMPTION';
    } else if (deviationPercentage < -20) {
      consumptionStatus = 'UNDER_CONSUMPTION';
    }

    // 6. Analyser les anomalies et générer des alertes
    const alerts = this.analyzeAnomalies(history, averageDailyConsumption);

    // 7. Générer des recommandations
    const recommendations = this.generateRecommendations(
      consumptionStatus,
      deviationPercentage,
      alerts,
      averageDailyConsumption,
    );

    // 8. Évaluer le niveau de risque
    const riskLevel = this.calculateRiskLevel(consumptionStatus, alerts, deviationPercentage);

    // 9. Identifier les problèmes possibles
    const possibleIssues = this.identifyPossibleIssues(alerts, deviationPercentage, history);

    const report: ConsumptionAnalysisReport = {
      materialId,
      materialName: material.name,
      materialCode: material.code,
      siteId,
      siteName: '', // Sera rempli si disponible
      period: {
        startDate,
        endDate,
        days,
      },
      totalConsumption,
      averageDailyConsumption,
      expectedConsumption,
      consumptionStatus,
      deviationPercentage,
      alerts,
      recommendations,
      riskLevel,
      possibleIssues,
    };

    this.logger.log(`✅ Rapport généré: ${consumptionStatus}, risque=${riskLevel}, alertes=${alerts.length}`);
    return report;
  }

  /**
   * Calcule la consommation attendue basée sur l'historique
   */
  private calculateExpectedConsumption(history: ConsumptionHistory[], days: number): number {
    if (history.length === 0) return 0;

    // Utiliser la médiane pour éviter les valeurs aberrantes
    const quantities = history.map(h => h.quantity).sort((a, b) => a - b);
    const median = quantities[Math.floor(quantities.length / 2)];
    
    return median * days;
  }

  /**
   * Analyse les anomalies dans l'historique
   */
  private analyzeAnomalies(
    history: ConsumptionHistory[],
    averageDailyConsumption: number,
  ): ConsumptionAlert[] {
    const alerts: ConsumptionAlert[] = [];
    const threshold = averageDailyConsumption * 2; // Seuil: 2x la moyenne

    for (const entry of history) {
      const deviation = ((entry.quantity - averageDailyConsumption) / averageDailyConsumption) * 100;

      // Consommation excessive (>200% de la moyenne)
      if (entry.quantity > threshold) {
        let alertType: ConsumptionAlert['type'] = 'OVER_CONSUMPTION';
        let severity: ConsumptionAlert['severity'] = 'WARNING';

        // Si >300% de la moyenne, possibilité de vol ou gaspillage
        if (entry.quantity > averageDailyConsumption * 3) {
          alertType = 'VOL_POSSIBLE';
          severity = 'CRITICAL';
        } else if (entry.quantity > averageDailyConsumption * 2.5) {
          alertType = 'GASPILLAGE';
          severity = 'DANGER';
        }

        alerts.push({
          type: alertType,
          severity,
          message: this.getAlertMessage(alertType, entry.quantity, averageDailyConsumption),
          date: entry.date,
          quantity: entry.quantity,
          expectedQuantity: averageDailyConsumption,
          deviation,
        });
      }

      // Consommation normale
      if (Math.abs(deviation) <= 20) {
        alerts.push({
          type: 'NORMAL',
          severity: 'INFO',
          message: `Consommation normale: ${entry.quantity} ${entry.materialUnit}`,
          date: entry.date,
          quantity: entry.quantity,
          expectedQuantity: averageDailyConsumption,
          deviation,
        });
      }
    }

    return alerts;
  }

  /**
   * Génère un message d'alerte approprié
   */
  private getAlertMessage(
    type: ConsumptionAlert['type'],
    quantity: number,
    expected: number,
  ): string {
    const diff = quantity - expected;
    const percentage = ((diff / expected) * 100).toFixed(1);

    switch (type) {
      case 'VOL_POSSIBLE':
        return `🚨 VOL POSSIBLE: Consommation anormalement élevée (${quantity} vs ${expected.toFixed(1)} attendu, +${percentage}%). Vérification urgente recommandée.`;
      case 'GASPILLAGE':
        return `⚠️ GASPILLAGE DÉTECTÉ: Consommation excessive (${quantity} vs ${expected.toFixed(1)} attendu, +${percentage}%). Vérifier les pratiques de travail.`;
      case 'OVER_CONSUMPTION':
        return `📊 SURCONSOMMATION: Consommation supérieure à la normale (${quantity} vs ${expected.toFixed(1)} attendu, +${percentage}%).`;
      case 'ANOMALIE':
        return `🔍 ANOMALIE: Comportement inhabituel détecté dans la consommation.`;
      default:
        return `✅ Consommation normale: ${quantity} unités.`;
    }
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  private generateRecommendations(
    status: 'NORMAL' | 'OVER_CONSUMPTION' | 'UNDER_CONSUMPTION',
    deviation: number,
    alerts: ConsumptionAlert[],
    averageDaily: number,
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'OVER_CONSUMPTION') {
      recommendations.push('🔍 Effectuer un audit de consommation sur le chantier');
      recommendations.push('📋 Vérifier les bons de sortie et les justificatifs');
      recommendations.push('👥 Former le personnel aux bonnes pratiques de gestion des matériaux');
      
      const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
      if (criticalAlerts.length > 0) {
        recommendations.push('🚨 URGENT: Enquête immédiate recommandée pour vol possible');
        recommendations.push('📹 Vérifier les caméras de surveillance si disponibles');
      }

      const wasteAlerts = alerts.filter(a => a.type === 'GASPILLAGE');
      if (wasteAlerts.length > 0) {
        recommendations.push('♻️ Mettre en place un système de récupération des chutes');
        recommendations.push('📊 Optimiser les quantités commandées pour réduire le gaspillage');
      }
    } else if (status === 'NORMAL') {
      recommendations.push('✅ Consommation dans les normes, continuer le suivi régulier');
      recommendations.push(`📈 Consommation moyenne: ${averageDaily.toFixed(2)} unités/jour`);
    } else {
      recommendations.push('📉 Sous-consommation détectée, vérifier l\'avancement du projet');
    }

    // Recommandations générales
    recommendations.push('📱 Activer les alertes en temps réel pour les anomalies');
    recommendations.push('📊 Consulter le tableau de bord hebdomadaire');

    return recommendations;
  }

  /**
   * Calcule le niveau de risque global
   */
  private calculateRiskLevel(
    status: 'NORMAL' | 'OVER_CONSUMPTION' | 'UNDER_CONSUMPTION',
    alerts: ConsumptionAlert[],
    deviation: number,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
    const dangerAlerts = alerts.filter(a => a.severity === 'DANGER').length;

    if (criticalAlerts > 0 || deviation > 100) {
      return 'CRITICAL';
    }
    if (dangerAlerts > 2 || deviation > 50) {
      return 'HIGH';
    }
    if (status === 'OVER_CONSUMPTION' || deviation > 20) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Identifie les problèmes possibles
   */
  private identifyPossibleIssues(
    alerts: ConsumptionAlert[],
    deviation: number,
    history: ConsumptionHistory[],
  ): string[] {
    const issues: string[] = [];

    const volAlerts = alerts.filter(a => a.type === 'VOL_POSSIBLE');
    if (volAlerts.length > 0) {
      issues.push('🚨 Vol de matériaux possible');
    }

    const wasteAlerts = alerts.filter(a => a.type === 'GASPILLAGE');
    if (wasteAlerts.length > 2) {
      issues.push('♻️ Gaspillage récurrent détecté');
    }

    if (deviation > 50) {
      issues.push('📊 Écart important par rapport aux prévisions');
    }

    // Vérifier les pics de consommation
    const quantities = history.map(h => h.quantity);
    const max = Math.max(...quantities);
    const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    if (max > avg * 3) {
      issues.push('📈 Pics de consommation anormaux détectés');
    }

    if (issues.length === 0) {
      issues.push('✅ Aucun problème majeur détecté');
    }

    return issues;
  }
}
