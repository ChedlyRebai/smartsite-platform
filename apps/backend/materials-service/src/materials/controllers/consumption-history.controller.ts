import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConsumptionHistoryService } from '../services/consumption-history.service';
import { ConsumptionAIAnalyzerService } from '../services/consumption-ai-analyzer.service';
import { HistoryFiltersDto, StatisticsFiltersDto, CleanupDto } from '../dto/history-filters.dto';

@Controller('consumption-history')
export class ConsumptionHistoryController {
  private readonly logger = new Logger(ConsumptionHistoryController.name);

  constructor(
    private readonly historyService: ConsumptionHistoryService,
    private readonly aiAnalyzerService: ConsumptionAIAnalyzerService,
  ) {}

  /**
   * GET /consumption-history
   * Récupère l'historique paginé avec filtres
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getHistory(@Query() filters: HistoryFiltersDto) {
    this.logger.log(`GET /consumption-history - Filtres: ${JSON.stringify(filters)}`);
    return this.historyService.getHistory(filters);
  }

  /**
   * GET /consumption-history/statistics
   * Récupère les statistiques pour graphiques
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(@Query() filters: StatisticsFiltersDto) {
    this.logger.log(`GET /consumption-history/statistics - Filtres: ${JSON.stringify(filters)}`);
    return this.historyService.getStatistics(filters);
  }

  /**
   * GET /consumption-history/material/:materialId/trend
   * Récupère la tendance d'un matériau
   */
  @Get('material/:materialId/trend')
  @HttpCode(HttpStatus.OK)
  async getMaterialTrend(
    @Param('materialId') materialId: string,
    @Query('days') days?: number,
  ) {
    this.logger.log(`GET /consumption-history/material/${materialId}/trend?days=${days || 30}`);
    return this.historyService.getMaterialTrend(materialId, days || 30);
  }

  /**
   * GET /consumption-history/:id
   * Récupère une entrée par ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') id: string) {
    this.logger.log(`GET /consumption-history/${id}`);
    return this.historyService.getById(id);
  }

  /**
   * POST /consumption-history/sync
   * Synchronise les données existantes
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync() {
    this.logger.log('POST /consumption-history/sync - Démarrage de la synchronisation');
    const report = await this.historyService.syncFromExistingData();
    this.logger.log(`✅ Synchronisation terminée: ${JSON.stringify(report)}`);
    return report;
  }

  /**
   * DELETE /consumption-history/cleanup
   * Nettoie les entrées anciennes
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanup(@Body() cleanupDto: CleanupDto) {
    this.logger.log(`DELETE /consumption-history/cleanup - beforeDate: ${cleanupDto.beforeDate}`);
    return this.historyService.cleanup(cleanupDto.beforeDate);
  }

  /**
   * GET /consumption-history/ai-report/:materialId/:siteId
   * Génère un rapport d'analyse IA de la consommation
   */
  @Get('ai-report/:materialId/:siteId')
  @HttpCode(HttpStatus.OK)
  async generateAIReport(
    @Param('materialId') materialId: string,
    @Param('siteId') siteId: string,
    @Query('days') days?: number,
  ) {
    this.logger.log(`GET /consumption-history/ai-report/${materialId}/${siteId}?days=${days || 30}`);
    try {
      const report = await this.aiAnalyzerService.generateConsumptionReport(
        materialId,
        siteId,
        days ? parseInt(days.toString()) : 30,
      );
      return {
        success: true,
        report,
        message: 'Rapport IA généré avec succès',
      };
    } catch (error) {
      this.logger.error(`❌ Erreur génération rapport IA:`, error);
      return {
        success: false,
        report: null,
        message: error.message || 'Erreur lors de la génération du rapport',
      };
    }
  }
}
