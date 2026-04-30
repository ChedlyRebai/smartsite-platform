import axios from 'axios';

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyType: 'EXCESSIVE_OUT' | 'SUSPICIOUS_PATTERN' | 'NORMAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  deviationPercentage: number;
  recommendedAction: string;
  shouldSendAlert: boolean;
}

class AnomalyDetectionService {
  /**
   * 🚨 Détecter les anomalies de consommation
   */
  async detectConsumptionAnomaly(materialId: string, consumption: number): Promise<AnomalyDetectionResult> {
    try {
      const response = await axios.post(`/api/ml-training/detect-anomaly/${materialId}`, {
        consumption
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting anomaly:', error);
      throw error;
    }
  }

  /**
   * 📊 Simuler la détection d'anomalie (pour test)
   */
  simulateAnomalyDetection(consumption: number, materialName: string): AnomalyDetectionResult {
    // Simulation basée sur des seuils
    let result: AnomalyDetectionResult;

    if (consumption > 100) {
      result = {
        isAnomaly: true,
        anomalyType: 'EXCESSIVE_OUT',
        riskLevel: 'HIGH',
        message: `🚨 Consommation excessive détectée! ${Math.round((consumption - 50) / 50 * 100)}% au-dessus de la normale`,
        deviationPercentage: Math.round((consumption - 50) / 50 * 100),
        recommendedAction: 'Vérifier immédiatement - Risque de vol ou gaspillage',
        shouldSendAlert: true,
      };
    } else if (consumption > 75) {
      result = {
        isAnomaly: true,
        anomalyType: 'SUSPICIOUS_PATTERN',
        riskLevel: 'MEDIUM',
        message: `⚠️ Consommation anormalement élevée: ${Math.round((consumption - 50) / 50 * 100)}% au-dessus de la normale`,
        deviationPercentage: Math.round((consumption - 50) / 50 * 100),
        recommendedAction: 'Surveiller et vérifier les causes',
        shouldSendAlert: true,
      };
    } else if (consumption > 60) {
      result = {
        isAnomaly: true,
        anomalyType: 'SUSPICIOUS_PATTERN',
        riskLevel: 'LOW',
        message: `⚡ Consommation légèrement élevée: ${Math.round((consumption - 50) / 50 * 100)}% au-dessus de la normale`,
        deviationPercentage: Math.round((consumption - 50) / 50 * 100),
        recommendedAction: 'Surveiller l\'évolution',
        shouldSendAlert: false,
      };
    } else {
      result = {
        isAnomaly: false,
        anomalyType: 'NORMAL',
        riskLevel: 'LOW',
        message: 'Consommation normale',
        deviationPercentage: 0,
        recommendedAction: 'Aucune action requise',
        shouldSendAlert: false,
      };
    }

    return result;
  }

  /**
   * 🔔 Émettre une alerte d'anomalie (simulation WebSocket)
   */
  emitAnomalyAlert(materialId: string, materialName: string, anomalyResult: AnomalyDetectionResult) {
    // Simuler l'émission d'un événement WebSocket
    const event = new CustomEvent('anomalyDetected', {
      detail: {
        materialId,
        materialName,
        anomalyResult,
        timestamp: new Date(),
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * 📧 Simuler l'envoi d'email d'alerte
   */
  async sendAnomalyEmail(materialId: string, materialName: string, anomalyResult: AnomalyDetectionResult): Promise<boolean> {
    try {
      // En production, ceci ferait un appel API réel
      console.log('📧 Sending anomaly email:', {
        materialId,
        materialName,
        anomalyResult
      });

      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Error sending anomaly email:', error);
      return false;
    }
  }

  /**
   * 🎯 Traitement complet d'une anomalie détectée
   */
  async processAnomalyDetection(
    materialId: string, 
    materialName: string, 
    consumption: number,
    useRealAPI: boolean = false
  ): Promise<AnomalyDetectionResult> {
    let anomalyResult: AnomalyDetectionResult;

    if (useRealAPI) {
      // Utiliser l'API réelle
      anomalyResult = await this.detectConsumptionAnomaly(materialId, consumption);
    } else {
      // Utiliser la simulation
      anomalyResult = this.simulateAnomalyDetection(consumption, materialName);
    }

    // Si c'est une anomalie, émettre l'alerte
    if (anomalyResult.isAnomaly) {
      this.emitAnomalyAlert(materialId, materialName, anomalyResult);

      // Envoyer email si nécessaire
      if (anomalyResult.shouldSendAlert) {
        await this.sendAnomalyEmail(materialId, materialName, anomalyResult);
      }
    }

    return anomalyResult;
  }
}

export default new AnomalyDetectionService();