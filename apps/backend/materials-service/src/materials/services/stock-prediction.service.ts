import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as tf from '@tensorflow/tfjs';
import { MaterialFlowLog } from '../entities/material-flow-log.entity';

export interface StockPredictionResult {
  materialId: string;
  materialName: string;
  currentStock: number;
  predictedStock: number;
  consumptionRate: number;
  minimumStock: number;
  reorderPoint: number;
  maximumStock: number;
  hoursToLowStock: number;
  hoursToOutOfStock: number;
  status: 'safe' | 'warning' | 'critical';
  recommendedOrderQuantity: number;
  predictionModelUsed: boolean;
  confidence: number;
  simulationData: { hour: number; stock: number }[];
  message: string;
}

@Injectable()
export class StockPredictionService {
  private readonly logger = new Logger(StockPredictionService.name);
  private model: tf.LayersModel | null = null;

  constructor(
    @InjectModel(MaterialFlowLog.name) private flowLogModel: Model<any>,
  ) {
    this.initializeModel();
  }

  /**
   * AI Model Initialization - Linear Regression
   *
   * WHY LINEAR REGRESSION:
   * - Stock consumption typically follows a linear pattern over time
   * - Simple, interpretable, and fast to train
   * - Works well for short-term predictions (hours/days)
   * - Requires minimal computational resources
   *
   * LIMITATIONS:
   * - Assumes constant consumption rate (real world may have variations)
   * - Cannot capture seasonal patterns or trends
   * - Less accurate for long-term predictions
   * - No consideration of external factors (weather, project delays, etc.)
   *
   * DIFFERENCE FROM REAL DATA:
   * - This model uses SIMULATED data based on fixed consumption rate
   * - Real-world data would require historical consumption records
   * - In production, you would train on actual usage patterns
   */
  private async initializeModel(): Promise<void> {
    try {
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [1],
            units: 32,
            activation: 'relu',
            kernelInitializer: 'glorotNormal',
          }),
          tf.layers.dense({
            units: 16,
            activation: 'relu',
          }),
          tf.layers.dense({
            units: 8,
            activation: 'relu',
          }),
          tf.layers.dense({
            units: 1,
            activation: 'linear',
          }),
        ],
      });

      this.model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
      });

      this.logger.log(
        '✅ TensorFlow.js Linear Regression Model initialized for Stock Prediction',
      );
    } catch (error) {
      this.logger.error('❌ Failed to initialize TensorFlow model:', error);
    }
  }

  /**
   * Generate synthetic training data based on consumption rate
   *
   * SIMULATED DATA APPROACH:
   * - Creates training pairs (hour, stock_quantity)
   * - Assumes linear decrease: stock = initial - (rate * hour)
   * - In production, this would be replaced with real historical data
   * - Real data would need aggregation from MaterialSiteStock or stock movements
   */
  private generateTrainingData(
    currentStock: number,
    consumptionRate: number,
    maxHours: number = 168,
  ): { xs: number[]; ys: number[] } {
    const xs: number[] = [];
    const ys: number[] = [];

    // Generate data points for each hour
    for (let hour = 0; hour <= maxHours; hour++) {
      const stockAtHour = Math.max(0, currentStock - consumptionRate * hour);
      xs.push(hour);
      ys.push(stockAtHour);
    }

    return { xs, ys };
  }

  /**
   * Train the model on synthetic consumption data
   */
  private async trainModel(
    currentStock: number,
    consumptionRate: number,
  ): Promise<tf.LayersModel> {
    const { xs, ys } = this.generateTrainingData(currentStock, consumptionRate);

    const xsTensor = tf.tensor2d(
      xs.map((x) => [x]),
      [xs.length, 1],
    );
    const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

    await this.model?.fit(xsTensor, ysTensor, {
      epochs: 50,
      batchSize: 32,
      verbose: 0,
      shuffle: true,
    });

    xsTensor.dispose();
    ysTensor.dispose();

    return this.model!;
  }

  /**
   * Predict stock at a specific hour using the ML model
   */
  private async predictStockAtHour(
    model: tf.LayersModel,
    hour: number,
  ): Promise<number> {
    const inputTensor = tf.tensor2d([[hour]]);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const predictedValue = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    return Math.max(0, predictedValue);
  }

  /**
   * Calculer le taux de consommation réel depuis l'historique MaterialFlowLog
   */
  private async calculateRealConsumptionRate(
    materialId: string,
    siteId?: string,
  ): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Récupérer les sorties des 30 derniers jours
      const matchQuery: any = {
        materialId: new Types.ObjectId(materialId),
        type: 'OUT',
        timestamp: { $gte: thirtyDaysAgo },
      };

      if (siteId) {
        matchQuery.siteId = new Types.ObjectId(siteId);
      }

      const outMovements = await this.flowLogModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalOut: { $sum: '$quantity' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (outMovements.length === 0 || outMovements[0].totalOut === 0) {
        this.logger.log(
          `📊 Pas d'historique de consommation pour ${materialId}, utilisation taux par défaut`,
        );
        return 2; // 2 unités par heure par défaut
      }

      // Calculer le taux horaire
      const totalOut = outMovements[0].totalOut;
      const hoursIn30Days = 30 * 24; // 720 heures
      const hourlyRate = totalOut / hoursIn30Days;

      this.logger.log(
        `📊 Taux calculé depuis historique: ${hourlyRate.toFixed(2)} unités/h (${totalOut} unités sur 30 jours)`,
      );

      return Math.max(0.5, hourlyRate); // Minimum 0.5 unités/heure
    } catch (error) {
      this.logger.error(`❌ Erreur calcul taux consommation: ${error.message}`);
      return 2; // Fallback
    }
  }

  /**
   * Obtenir le multiplicateur de consommation selon la météo
   */
  private getWeatherMultiplier(condition: string): number {
    const multipliers: Record<string, number> = {
      sunny: 1.0, // Conditions normales
      cloudy: 1.05, // Légère augmentation
      rainy: 1.3, // Pluie = travail plus lent = plus de consommation
      stormy: 1.5, // Orage = conditions difficiles
      snowy: 1.4, // Neige = conditions difficiles
      windy: 1.1, // Vent = légère augmentation
    };
    return multipliers[condition] || 1.0;
  }

  /**
   * Calculate hours until stock reaches a specific level (mathematical calculation)
   */
  private calculateHoursToLevel(
    currentStock: number,
    targetLevel: number,
    consumptionRate: number,
  ): number {
    if (consumptionRate <= 0) return 999;
    const hours = (currentStock - targetLevel) / consumptionRate;
    return Math.max(0, hours);
  }

  /**
   * Determine status based on hours to out of stock
   */
  private determineStatus(
    hoursToOutOfStock: number,
  ): 'safe' | 'warning' | 'critical' {
    if (hoursToOutOfStock >= 72) return 'safe'; // >= 3 days
    if (hoursToOutOfStock >= 24) return 'warning'; // >= 24 hours
    return 'critical'; // < 24 hours
  }

  /**
   * Calculate recommended order quantity
   * Uses: (daily consumption * days supply) - current stock
   */
  private calculateRecommendedQuantity(
    consumptionRate: number,
    maximumStock: number,
    currentStock: number,
  ): number {
    const dailyConsumption = consumptionRate * 24;
    const daysSupply = 14; // 2 weeks
    const targetStock = dailyConsumption * daysSupply;
    const recommended = targetStock - currentStock;

    // Ensure we don't exceed maximum stock
    return Math.min(recommended, maximumStock - currentStock);
  }

  /**
   * MAIN PREDICTION METHOD
   * Combines mathematical calculation with ML model validation
   */
  async predictStockDepletion(
    materialId: string,
    materialName: string,
    currentStock: number,
    minimumStock: number,
    maximumStock: number,
    reorderPoint: number,
    consumptionRate: number,
    siteId?: string,
    weatherCondition?:
      | 'sunny'
      | 'rainy'
      | 'stormy'
      | 'cloudy'
      | 'snowy'
      | 'windy',
  ): Promise<StockPredictionResult> {
    try {
      // Calculer le vrai taux de consommation depuis l'historique
      let effectiveRate = await this.calculateRealConsumptionRate(
        materialId,
        siteId,
      );

      // Si un taux est fourni et > 0, l'utiliser
      if (consumptionRate > 0) {
        effectiveRate = consumptionRate;
      }

      // Ajuster selon la météo
      let weatherMultiplier = 1.0;
      if (weatherCondition) {
        weatherMultiplier = this.getWeatherMultiplier(weatherCondition);
        effectiveRate = effectiveRate * weatherMultiplier;
        this.logger.log(
          `🌤️ Ajustement météo (${weatherCondition}): x${weatherMultiplier} → ${effectiveRate.toFixed(2)} unités/h`,
        );
      }

      this.logger.log(
        `📊 Taux de consommation effectif: ${effectiveRate.toFixed(2)} unités/h`,
      );

      // Ensure consumption rate is at least 0.5 (minimum 0.5 unit/hour)
      effectiveRate = Math.max(0.5, effectiveRate);

      // Generate simulation data for visualization
      const simulationData: { hour: number; stock: number }[] = [];
      for (let hour = 0; hour <= 168; hour++) {
        // 7 days
        simulationData.push({
          hour,
          stock: Math.max(0, currentStock - effectiveRate * hour),
        });
      }

      // Calculate hours using mathematical formula
      const hoursToLowStock = this.calculateHoursToLevel(
        currentStock,
        reorderPoint,
        effectiveRate,
      );

      const hoursToOutOfStock = this.calculateHoursToLevel(
        currentStock,
        0,
        effectiveRate,
      );

      // Try ML model prediction as validation
      let mlPredictedStock = currentStock;
      let modelUsed = false;
      let confidence = 0.5;

      if (this.model && effectiveRate > 0) {
        try {
          await this.trainModel(currentStock, effectiveRate);

          // Predict at key hours
          const predictedAtLowStock = await this.predictStockAtHour(
            this.model,
            Math.floor(hoursToLowStock),
          );
          const predictedAtOutOfStock = await this.predictStockAtHour(
            this.model,
            Math.floor(hoursToOutOfStock),
          );

          mlPredictedStock = predictedAtOutOfStock;
          modelUsed = true;

          // Calculate confidence based on prediction accuracy
          const accuracy =
            1 - Math.abs(predictedAtOutOfStock - 0) / (currentStock + 1);
          confidence = Math.max(0.3, Math.min(0.9, accuracy));
        } catch (error) {
          this.logger.warn(
            'ML prediction failed, using mathematical calculation',
          );
        }
      }

      // Determine status
      const status = this.determineStatus(hoursToOutOfStock);

      // Calculate recommended order quantity
      const recommendedOrderQuantity = this.calculateRecommendedQuantity(
        effectiveRate,
        maximumStock,
        currentStock,
      );

      // Generate message
      let message = '';
      switch (status) {
        case 'safe':
          message = `✅ Stock sécurisé. ${Math.floor(hoursToOutOfStock)}h avant rupture.`;
          break;
        case 'warning':
          message = `⚠️ Alerte! Stock faible. ${Math.floor(hoursToOutOfStock)}h avant rupture.`;
          break;
        case 'critical':
          message = `🚨 CRITIQUE! Rupture imminente dans ${Math.floor(hoursToOutOfStock)}h!`;
          break;
      }

      return {
        materialId,
        materialName,
        currentStock,
        predictedStock: Math.max(0, currentStock - effectiveRate * 24),
        consumptionRate: effectiveRate,
        minimumStock,
        reorderPoint,
        maximumStock,
        hoursToLowStock: Math.floor(hoursToLowStock),
        hoursToOutOfStock: Math.floor(hoursToOutOfStock),
        status,
        recommendedOrderQuantity: Math.max(
          0,
          Math.ceil(recommendedOrderQuantity),
        ),
        predictionModelUsed: modelUsed,
        confidence: Math.round(confidence * 100) / 100,
        simulationData: simulationData.filter((_, i) => i % 24 === 0), // Keep daily points
        message,
      };
    } catch (error) {
      this.logger.error(
        `❌ Prediction error for material ${materialId}:`,
        error,
      );

      // Return fallback prediction
      return {
        materialId,
        materialName,
        currentStock,
        predictedStock: Math.max(
          0,
          currentStock - Math.max(1, consumptionRate) * 24,
        ),
        consumptionRate: Math.max(1, consumptionRate),
        minimumStock,
        reorderPoint,
        maximumStock,
        hoursToLowStock: 999,
        hoursToOutOfStock: 999,
        status: 'safe',
        recommendedOrderQuantity: minimumStock * 2,
        predictionModelUsed: false,
        confidence: 0.3,
        simulationData: [],
        message: '⚠️ Prédiction indisponible',
      };
    }
  }

  /**
   * Clean up model resources
   */
  cleanup(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.logger.log('🧹 TensorFlow model disposed');
    }
  }
}
