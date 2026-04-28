import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';
import {
  HistoricalDataPointDto,
  ParsedHistoricalData,
  TrainingResult,
  PredictionResult,
  AdvancedPredictionFeaturesDto,
  AdvancedPredictionResult,
} from '../dto/historical-data.dto';
import { Material } from '../entities/material.entity';

interface MaterialModel {
  model: tf.LayersModel;
  trainedAt: Date;
  sampleSize: number;
  averageConsumption: number;
  loss: number;
  useAdvancedFeatures: boolean;
}

@Injectable()
export class MLTrainingService {
  private readonly logger = new Logger(MLTrainingService.name);

  private materialModels: Map<string, MaterialModel> = new Map();
  private historicalData: Map<string, HistoricalDataPointDto[]> = new Map();

  private weatherEncoding: Map<string, number> = new Map([
    ['sunny', 0],
    ['rainy', 1],
    ['cloudy', 2],
    ['stormy', 3],
    ['snowy', 4],
    ['windy', 5],
  ]);

  private projectTypeEncoding: Map<string, number> = new Map([
    ['residential', 0],
    ['commercial', 1],
    ['infrastructure', 2],
    ['industrial', 3],
    ['renovation', 4],
  ]);

  /**
   * Parse CSV file content to historical data
   * Expected CSV format:
   * hour,stock,consumption,project,hourOfDay,dayOfWeek,siteActivityLevel,weather,projectType
   * 2026-04-01 08:00,100,5,A,8,1,0.8,sunny,residential
   */
  parseCSV(csvContent: string, materialId: string): ParsedHistoricalData {
    try {
      console.log('📄 parseCSV called with content length:', csvContent.length);
      console.log('📄 First 300 chars:', csvContent.substring(0, 300));

      const lines = csvContent.trim().split('\n');
      console.log('📄 Total lines:', lines.length);

      if (lines.length < 2) {
        throw new Error(
          'CSV file must have a header and at least one data row',
        );
      }

      const header = lines[0]
        .toLowerCase()
        .split(',')
        .map((h) => h.trim());
      console.log('📄 Header columns:', header);

      const requiredColumns = ['hour', 'stock', 'consumption'];
      const missingColumns = requiredColumns.filter(
        (col) => !header.includes(col),
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(', ')}`,
        );
      }

      const hourIndex = header.indexOf('hour');
      const stockIndex = header.indexOf('stock');
      const consumptionIndex = header.indexOf('consumption');
      const projectIndex = header.indexOf('project');

      const hourOfDayIndex = header.indexOf('hourofday');
      const dayOfWeekIndex = header.indexOf('dayofweek');
      const siteActivityLevelIndex = header.indexOf('siteactivitylevel');
      const weatherIndex = header.indexOf('weather');
      const projectTypeIndex = header.indexOf('projecttype');

      console.log(
        '📄 Indices - hour:',
        hourIndex,
        'stock:',
        stockIndex,
        'consumption:',
        consumptionIndex,
        'project:',
        projectIndex,
      );
      console.log(
        '📄 New features - hourOfDay:',
        hourOfDayIndex,
        'dayOfWeek:',
        dayOfWeekIndex,
        'siteActivity:',
        siteActivityLevelIndex,
        'weather:',
        weatherIndex,
        'projectType:',
        projectTypeIndex,
      );

      const data: HistoricalDataPointDto[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());
        console.log(`📄 Line ${i}:`, values);

        if (values.length < 3) {
          errors.push(`Line ${i + 1}: Invalid number of columns`);
          continue;
        }

        try {
          const hour = values[hourIndex];
          const stock = parseFloat(values[stockIndex]);
          const consumption = parseFloat(values[consumptionIndex]);
          const project = projectIndex >= 0 ? values[projectIndex] : undefined;

          if (isNaN(stock) || isNaN(consumption)) {
            errors.push(
              `Line ${i + 1}: Invalid numeric values (stock:${stock}, consumption:${consumption})`,
            );
            continue;
          }

          const hourOfDay =
            hourOfDayIndex >= 0 && values[hourOfDayIndex]
              ? parseInt(values[hourOfDayIndex], 10)
              : undefined;
          const dayOfWeek =
            dayOfWeekIndex >= 0 && values[dayOfWeekIndex]
              ? parseInt(values[dayOfWeekIndex], 10)
              : undefined;
          const siteActivityLevel =
            siteActivityLevelIndex >= 0 && values[siteActivityLevelIndex]
              ? parseFloat(values[siteActivityLevelIndex])
              : undefined;
          const weather = weatherIndex >= 0 ? values[weatherIndex] : undefined;
          const projectType =
            projectTypeIndex >= 0 ? values[projectTypeIndex] : undefined;

          data.push({
            hour,
            stock,
            consumption,
            project,
            hourOfDay: !isNaN(hourOfDay as number) ? hourOfDay : undefined,
            dayOfWeek: !isNaN(dayOfWeek as number) ? dayOfWeek : undefined,
            siteActivityLevel: !isNaN(siteActivityLevel as number)
              ? siteActivityLevel
              : undefined,
            weather,
            projectType,
          });
        } catch (e) {
          errors.push(`Line ${i + 1}: Parse error - ${e.message}`);
        }
      }

      console.log('📄 Parsed data length:', data.length);
      console.log('📄 First 3 records:', data.slice(0, 3));

      if (data.length === 0) {
        throw new Error(
          `No valid data rows found in CSV. Errors: ${errors.join('; ')}`,
        );
      }

      const consumptions = data.map((d) => d.consumption);
      const averageConsumption =
        consumptions.reduce((a, b) => a + b, 0) / consumptions.length;

      data.sort(
        (a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime(),
      );

      this.historicalData.set(materialId, data);

      this.logger.log(
        `✅ Parsed CSV for material ${materialId}: ${data.length} records`,
      );

      return {
        materialId,
        data,
        totalRecords: data.length,
        dateRange: {
          start: data[0].hour,
          end: data[data.length - 1].hour,
        },
        averageConsumption,
      };
    } catch (error) {
      this.logger.error(`❌ Error parsing CSV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Train TensorFlow.js model on historical data for a specific material
   * Uses real consumption patterns from CSV
   */
  async trainModel(
    materialId: string,
    materialName: string,
    currentStock: number,
    reorderPoint: number,
  ): Promise<TrainingResult> {
    const historicalData = this.historicalData.get(materialId);

    if (!historicalData || historicalData.length < 2) {
      throw new Error('No historical data available. Please upload CSV first.');
    }

    const useAdvancedFeatures = this.hasAdvancedFeatures(historicalData);
    this.logger.log(
      `🧠 Training model for material ${materialId} with ${historicalData.length} data points, useAdvancedFeatures: ${useAdvancedFeatures}`,
    );

    try {
      this.logger.log(
        `🧠 Training model for material ${materialId} with ${historicalData.length} data points`,
      );

      const model = tf.sequential();

      let inputShape: number;
      const xs: number[][] = [];
      const ys: number[] = [];

      if (useAdvancedFeatures) {
        inputShape = 5;
        model.add(
          tf.layers.dense({
            inputShape: [5],
            units: 64,
            activation: 'relu',
            kernelInitializer: 'glorotNormal',
          }),
        );

        model.add(
          tf.layers.dense({
            units: 32,
            activation: 'relu',
          }),
        );

        model.add(
          tf.layers.dense({
            units: 16,
            activation: 'relu',
          }),
        );
      } else {
        inputShape = 2;
        model.add(
          tf.layers.dense({
            inputShape: [2],
            units: 32,
            activation: 'relu',
            kernelInitializer: 'glorotNormal',
          }),
        );

        model.add(
          tf.layers.dense({
            units: 16,
            activation: 'relu',
          }),
        );

        model.add(
          tf.layers.dense({
            units: 8,
            activation: 'relu',
          }),
        );
      }

      model.add(
        tf.layers.dense({
          units: 1,
          activation: 'linear',
        }),
      );

      model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
        metrics: ['mae'],
      });

      if (useAdvancedFeatures) {
        historicalData.forEach((point) => {
          const weatherEncoded = point.weather
            ? (this.weatherEncoding.get(point.weather.toLowerCase()) ?? 0)
            : 0;
          const projectTypeEncoded = point.projectType
            ? (this.projectTypeEncoding.get(point.projectType.toLowerCase()) ??
              0)
            : 0;

          xs.push([
            (point.hourOfDay ?? 0) / 23,
            (point.dayOfWeek ?? 0) / 6,
            point.siteActivityLevel ?? 0.5,
            weatherEncoded / (this.weatherEncoding.size - 1),
            projectTypeEncoded / (this.projectTypeEncoding.size - 1),
          ]);
          ys.push(point.consumption);
        });
      } else {
        const projectEncoding = this.encodeProjects(historicalData);
        historicalData.forEach((point, index) => {
          xs.push([
            index,
            projectEncoding.get(point.project || 'default') || 0,
          ]);
          ys.push(point.stock);
        });
      }

      const xsTensor = tf.tensor2d(xs, [xs.length, inputShape]);
      const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

      // Train the model
      const history = await model.fit(xsTensor, ysTensor, {
        epochs: 50,
        batchSize: Math.min(32, Math.floor(xs.length / 2)),
        validationSplit: 0.2,
        verbose: 0,
      });

      // Calculate final loss
      const finalLoss =
        (history.history.loss[history.history.loss.length - 1] as number) || 0;

      // Calculate accuracy (inverse of normalized loss)
      const maxStock = Math.max(...ys);
      const accuracy =
        maxStock > 0 ? Math.max(0, 1 - finalLoss / (maxStock * maxStock)) : 0.5;

      // Store the trained model
      this.materialModels.set(materialId, {
        model,
        trainedAt: new Date(),
        sampleSize: historicalData.length,
        averageConsumption:
          historicalData.reduce((sum, d) => sum + d.consumption, 0) /
          historicalData.length,
        loss: finalLoss,
        useAdvancedFeatures,
      });

      // Cleanup tensors
      xsTensor.dispose();
      ysTensor.dispose();

      this.logger.log(
        `✅ Model trained successfully for material ${materialId}. Loss: ${finalLoss.toFixed(4)}`,
      );

      return {
        materialId,
        success: true,
        epochs: 50,
        loss: finalLoss,
        accuracy: Math.min(1, accuracy),
        sampleSize: historicalData.length,
        trainedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `❌ Training failed for material ${materialId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Encode project names to numeric values
   */
  private encodeProjects(data: HistoricalDataPointDto[]): Map<string, number> {
    const projects = new Set(data.map((d) => d.project || 'default'));
    const encoding = new Map<string, number>();

    let index = 0;
    projects.forEach((project) => {
      encoding.set(project, index++);
    });

    return encoding;
  }

  /**
   * Check if historical data has advanced features
   */
  private hasAdvancedFeatures(data: HistoricalDataPointDto[]): boolean {
    if (!data || data.length === 0) return false;

    const firstRow = data[0];
    return !!(
      firstRow.hourOfDay !== undefined ||
      firstRow.dayOfWeek !== undefined ||
      firstRow.siteActivityLevel !== undefined ||
      firstRow.weather ||
      firstRow.projectType
    );
  }

  /** Quantité suggérée pour couvrir ~48h + stock de sécurité (reorder). */
  private recommendedOrderQuantity(
    currentStock: number,
    consumptionRate: number,
    reorderPoint: number,
  ): number {
    const rate = consumptionRate > 0 ? consumptionRate : 1;
    const leadHours = 48;
    return Math.max(
      0,
      Math.ceil(rate * leadHours + reorderPoint - currentStock),
    );
  }

  /**
   * Predict stock at a future hour using trained model
   */
  async predictStock(
    materialId: string,
    hoursAhead: number,
    currentStock: number,
    reorderPoint: number,
  ): Promise<PredictionResult> {
    const materialModel = this.materialModels.get(materialId);
    const historicalData = this.historicalData.get(materialId);

    // Calculate consumption rate from historical data
    let consumptionRate = 1;
    let modelTrained = false;
    let confidence = 0.3;

    if (historicalData && historicalData.length > 0) {
      const consumptions = historicalData.map((d) => d.consumption);
      consumptionRate =
        consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
    }

    // If model is trained, use it for prediction
    if (materialModel) {
      modelTrained = true;
      confidence = Math.min(0.95, Math.max(0.5, 1 - materialModel.loss / 100));

      try {
        const inputTensor = tf.tensor2d([[hoursAhead, 0]]);
        const prediction = materialModel.model.predict(
          inputTensor,
        ) as tf.Tensor;
        const predictedStock = (await prediction.data())[0];

        inputTensor.dispose();
        prediction.dispose();

        // Calculate hours to depletion based on model prediction or fallback
        const hoursToOutOfStock =
          predictedStock > 0 ? currentStock / consumptionRate : 0;

        const hoursToLowStock = (currentStock - reorderPoint) / consumptionRate;

        return {
          materialId,
          materialName: '',
          currentStock,
          predictedStock: Math.max(0, Math.round(predictedStock)),
          hoursToLowStock: Math.max(0, Math.floor(hoursToLowStock)),
          hoursToOutOfStock: Math.max(0, Math.floor(hoursToOutOfStock)),
          consumptionRate: Math.round(consumptionRate * 100) / 100,
          modelTrained,
          confidence: Math.round(confidence * 100) / 100,
          status: this.determineStatus(hoursToOutOfStock),
          trainingDataAvailable: true,
          message: this.generateMessage(hoursToOutOfStock, hoursToLowStock),
          recommendedOrderQuantity: this.recommendedOrderQuantity(
            currentStock,
            consumptionRate,
            reorderPoint,
          ),
        };
      } catch (error) {
        this.logger.warn('ML prediction failed, using fallback calculation');
      }
    }

    // Fallback: Mathematical calculation
    const hoursToOutOfStock =
      consumptionRate > 0 ? currentStock / consumptionRate : 999;

    const hoursToLowStock =
      consumptionRate > 0
        ? (currentStock - reorderPoint) / consumptionRate
        : 999;

    return {
      materialId,
      materialName: '',
      currentStock,
      predictedStock: Math.max(0, currentStock - consumptionRate * hoursAhead),
      hoursToLowStock: Math.max(0, Math.floor(hoursToLowStock)),
      hoursToOutOfStock: Math.max(0, Math.floor(hoursToOutOfStock)),
      consumptionRate: Math.round(consumptionRate * 100) / 100,
      modelTrained: false,
      confidence: 0.3,
      status: this.determineStatus(hoursToOutOfStock),
      trainingDataAvailable: !!historicalData,
      message: this.generateMessage(hoursToOutOfStock, hoursToLowStock),
      recommendedOrderQuantity: this.recommendedOrderQuantity(
        currentStock,
        consumptionRate,
        reorderPoint,
      ),
    };
  }

  /**
   * Predict stock with advanced contextual features
   * Uses hourOfDay, dayOfWeek, siteActivityLevel, weather, projectType
   */
  async predictStockAdvanced(
    materialId: string,
    features: AdvancedPredictionFeaturesDto,
    currentStock: number,
    reorderPoint: number,
  ): Promise<AdvancedPredictionResult> {
    const materialModel = this.materialModels.get(materialId);
    const historicalData = this.historicalData.get(materialId);

    let consumptionRate = 1;
    let modelTrained = false;
    let confidence = 0.3;
    let predictedStock = currentStock;
    let hoursToOutOfStock = currentStock;

    if (historicalData && historicalData.length > 0) {
      const consumptions = historicalData.map((d) => d.consumption);
      consumptionRate =
        consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
    }

    if (materialModel && materialModel.useAdvancedFeatures) {
      modelTrained = true;
      confidence = Math.min(0.95, Math.max(0.5, 1 - materialModel.loss / 100));

      try {
        const weatherEncoded =
          this.weatherEncoding.get(features.weather.toLowerCase()) ?? 0;
        const projectTypeEncoded =
          this.projectTypeEncoding.get(features.projectType.toLowerCase()) ?? 0;

        const inputFeatures = [
          [
            features.hourOfDay / 23,
            features.dayOfWeek / 6,
            features.siteActivityLevel,
            weatherEncoded / (this.weatherEncoding.size - 1),
            projectTypeEncoded / (this.projectTypeEncoding.size - 1),
          ],
        ];

        const inputTensor = tf.tensor2d(inputFeatures);
        const prediction = materialModel.model.predict(
          inputTensor,
        ) as tf.Tensor;
        const predictedValue = (await prediction.data())[0];

        predictedStock = Math.max(0, predictedValue);

        inputTensor.dispose();
        prediction.dispose();

        hoursToOutOfStock =
          consumptionRate > 0 ? predictedStock / consumptionRate : 999;
      } catch (error) {
        this.logger.warn(
          'Advanced ML prediction failed, using fallback calculation',
        );
        hoursToOutOfStock =
          consumptionRate > 0 ? currentStock / consumptionRate : 999;
      }
    } else {
      hoursToOutOfStock =
        consumptionRate > 0 ? currentStock / consumptionRate : 999;
    }

    const recommendedOrderQuantity = Math.max(
      0,
      Math.ceil(consumptionRate * 48 - currentStock),
    );
    const estimatedRuptureDate = new Date(
      Date.now() + hoursToOutOfStock * 3600000,
    ).toISOString();
    const status = this.determineStatus(hoursToOutOfStock);
    const message = this.generateAdvancedMessage(
      status,
      hoursToOutOfStock,
      recommendedOrderQuantity,
    );

    return {
      materialId,
      materialName: '',
      currentStock,
      predictedStock: Math.round(predictedStock),
      hoursToOutOfStock: Math.floor(hoursToOutOfStock),
      consumptionRate: Math.round(consumptionRate * 100) / 100,
      modelTrained,
      confidence: Math.round(confidence * 100) / 100,
      status,
      recommendedOrderQuantity,
      estimatedRuptureDate,
      message,
    };
  }

  /**
   * Generate advanced message with recommendations
   */
  private generateAdvancedMessage(
    status: 'safe' | 'warning' | 'critical',
    hoursToOutOfStock: number,
    recommendedQuantity: number,
  ): string {
    if (status === 'safe') {
      return `✅ Stock sécurisé pour ${Math.floor(hoursToOutOfStock)}h. Quantité recommandée: ${recommendedQuantity} unités.`;
    } else if (status === 'warning') {
      return `⚠️ Alerte! Stock faible. Rupture dans ${Math.floor(hoursToOutOfStock)}h. Commander ${recommendedQuantity} unités.`;
    } else {
      return `🚨 CRITIQUE! Rupture imminente dans ${Math.floor(hoursToOutOfStock)}h! Commander URGEMMENT ${recommendedQuantity} unités!`;
    }
  }

  /**
   * Determine status based on hours to out of stock
   */
  private determineStatus(
    hoursToOutOfStock: number,
  ): 'safe' | 'warning' | 'critical' {
    if (hoursToOutOfStock >= 72) return 'safe';
    if (hoursToOutOfStock >= 24) return 'warning';
    return 'critical';
  }

  /**
   * Generate status message
   */
  private generateMessage(
    hoursToOutOfStock: number,
    hoursToLowStock: number,
  ): string {
    if (hoursToOutOfStock >= 72) {
      return `✅ Stock sécurisé. ${Math.floor(hoursToOutOfStock)}h avant rupture.`;
    } else if (hoursToOutOfStock >= 24) {
      return `⚠️ Alerte! Stock faible. ${Math.floor(hoursToOutOfStock)}h avant rupture.`;
    } else {
      return `🚨 CRITIQUE! Rupture imminente dans ${Math.floor(hoursToOutOfStock)}h!`;
    }
  }

  /**
   * Check if model is trained for a material
   */
  hasModel(materialId: string): boolean {
    return this.materialModels.has(materialId);
  }

  /**
   * Get model info
   */
  getModelInfo(materialId: string): {
    trained: boolean;
    sampleSize?: number;
    trainedAt?: Date;
  } {
    const model = this.materialModels.get(materialId);
    if (model) {
      return {
        trained: true,
        sampleSize: model.sampleSize,
        trainedAt: model.trainedAt,
      };
    }
    return { trained: false };
  }

  /**
   * Get historical data info
   */
  hasHistoricalData(materialId: string): boolean {
    return this.historicalData.has(materialId);
  }

  /**
   * Clear model and data for a material
   */
  clearMaterial(materialId: string): void {
    const model = this.materialModels.get(materialId);
    if (model) {
      model.model.dispose();
    }
    this.materialModels.delete(materialId);
    this.historicalData.delete(materialId);
    this.logger.log(`🧹 Cleared model and data for material ${materialId}`);
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.materialModels.forEach((model) => model.model.dispose());
    this.materialModels.clear();
    this.historicalData.clear();
    this.logger.log('🧹 ML Training service cleaned up');
  }
}
