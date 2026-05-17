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
  Res,
} from '@nestjs/common';
import { ConsumptionHistoryService } from '../services/consumption-history.service';
import { ConsumptionAIAnalyzerService } from '../services/consumption-ai-analyzer.service';
import {
  HistoryFiltersDto,
  StatisticsFiltersDto,
  CleanupDto,
} from '../dto/history-filters.dto';
import type { Response } from 'express';

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
    this.logger.log(
      `GET /consumption-history - Filtres: ${JSON.stringify(filters)}`,
    );
    return this.historyService.getHistory(filters);
  }

  /**
   * GET /consumption-history/export
   * Exporte l'historique en Excel
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  async exportHistory(
    @Query() filters: HistoryFiltersDto,
    @Res() res: Response,
  ) {
    this.logger.log(`GET /consumption-history/export - Filtres: ${JSON.stringify(filters)}`);
    try {
      const result = await this.historyService.getHistory({ ...filters, limit: 10000, page: 1 });
      const entries = result.data;

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historique Consommation');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 22 },
        { header: 'Matériau', key: 'materialName', width: 30 },
        { header: 'Code', key: 'materialCode', width: 15 },
        { header: 'Catégorie', key: 'materialCategory', width: 18 },
        { header: 'Unité', key: 'materialUnit', width: 10 },
        { header: 'Site', key: 'siteName', width: 25 },
        { header: 'Type', key: 'flowType', width: 15 },
        { header: 'Quantité', key: 'quantity', width: 12 },
        { header: 'Stock Avant', key: 'stockBefore', width: 12 },
        { header: 'Stock Après', key: 'stockAfter', width: 12 },
        { header: 'Anomalie', key: 'anomalyType', width: 15 },
        { header: 'Sévérité', key: 'anomalySeverity', width: 12 },
        { header: 'Raison', key: 'reason', width: 35 },
        { header: 'Enregistré par', key: 'recordedBy', width: 20 },
      ];

      entries.forEach((entry: any) => {
        worksheet.addRow({
          date: entry.date ? new Date(entry.date).toLocaleString('fr-FR') : '',
          materialName: entry.materialName || '',
          materialCode: entry.materialCode || '',
          materialCategory: entry.materialCategory || '',
          materialUnit: entry.materialUnit || '',
          siteName: entry.siteName || '',
          flowType: entry.flowType || '',
          quantity: entry.quantity || 0,
          stockBefore: entry.stockBefore ?? '',
          stockAfter: entry.stockAfter ?? '',
          anomalyType: entry.anomalyType || 'NONE',
          anomalySeverity: entry.anomalySeverity || 'NONE',
          reason: entry.reason || '',
          recordedBy: entry.recordedBy || '',
        });
      });

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Color anomaly rows
      entries.forEach((entry: any, index: number) => {
        const row = worksheet.getRow(index + 2);
        if (entry.anomalyType && entry.anomalyType !== 'NONE') {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' },
          };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historique_consommation_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (error) {
      this.logger.error(`❌ Export failed: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /consumption-history/statistics
   * Récupère les statistiques pour graphiques
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(@Query() filters: StatisticsFiltersDto) {
    this.logger.log(
      `GET /consumption-history/statistics - Filtres: ${JSON.stringify(filters)}`,
    );
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
    this.logger.log(
      `GET /consumption-history/material/${materialId}/trend?days=${days || 30}`,
    );
    return this.historyService.getMaterialTrend(materialId, days || 30);
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
    this.logger.log(
      `GET /consumption-history/ai-report/${materialId}/${siteId}?days=${days || 30}`,
    );
    try {
      const report = await this.aiAnalyzerService.generateConsumptionReport(
        materialId,
        siteId,
        days ? Number.parseInt(days.toString(), 10) : 30,
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
    this.logger.log(
      'POST /consumption-history/sync - Démarrage de la synchronisation',
    );
    const report = await this.historyService.syncFromExistingData();
    this.logger.log(`✅ Synchronisation terminée: ${JSON.stringify(report)}`);
    return { success: true, ...report };
  }

  /**
   * DELETE /consumption-history/cleanup
   * Nettoie les entrées anciennes
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanup(@Body() cleanupDto: CleanupDto) {
    this.logger.log(
      `DELETE /consumption-history/cleanup - beforeDate: ${cleanupDto.beforeDate}`,
    );
    return this.historyService.cleanup(cleanupDto.beforeDate);
  }
}
