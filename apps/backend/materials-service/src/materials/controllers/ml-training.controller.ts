import { Controller, Post, Get, Param, Body, Logger } from '@nestjs/common';
import { MLTrainingEnhancedService } from '../services/ml-training-enhanced.service';

@Controller('ml-training')
export class MLTrainingController {
  private readonly logger = new Logger(MLTrainingController.name);

  constructor(private readonly mlTrainingService: MLTrainingEnhancedService) {}

  /**
   * 🤖 Entraîner le modèle de prédiction de stock (bouton dans l'interface)
   */
  @Post('train-stock-prediction/:materialId')
  async trainStockPrediction(@Param('materialId') materialId: string) {
    this.logger.log(`🤖 Training stock prediction model for: ${materialId}`);
    return this.mlTrainingService.trainModelOnDemand(materialId);
  }

  /**
   * 🚨 Détecter les anomalies de consommation
   */
  @Post('detect-anomaly/:materialId')
  async detectAnomaly(
    @Param('materialId') materialId: string,
    @Body() body: { consumption: number }
  ) {
    this.logger.log(`🚨 Detecting anomaly for material: ${materialId}, consumption: ${body.consumption}`);
    return this.mlTrainingService.detectConsumptionAnomaly(materialId, body.consumption);
  }

  /**
   * 📊 Obtenir la prédiction de stock actuelle
   */
  @Get('stock-prediction/:materialId')
  async getStockPrediction(@Param('materialId') materialId: string) {
    this.logger.log(`📊 Getting stock prediction for: ${materialId}`);
    return this.mlTrainingService.trainStockPredictionModel(materialId);
  }
}