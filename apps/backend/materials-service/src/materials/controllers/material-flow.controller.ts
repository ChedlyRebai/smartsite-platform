import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MaterialFlowService } from '../services/material-flow.service';
import {
  CreateMaterialFlowDto,
  MaterialFlowQueryDto,
} from '../dto/material-flow.dto';

@Controller('material-flow')
export class MaterialFlowController {
  constructor(private readonly flowService: MaterialFlowService) {}

  /**
   * Enregistrer un mouvement de stock
   * POST /api/flows
   */
  @Post()
  async recordMovement(
    @Body() createFlowDto: CreateMaterialFlowDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.flowService.recordMovement(createFlowDto, userId);
  }

  /**
   * Obtenir tous les flux
   * GET /api/flows
   */
  @Get()
  async getFlows(@Query() query: MaterialFlowQueryDto) {
    return this.flowService.getFlows(query);
  }

  /**
   * Obtenir les anomalies non résolues
   * GET /api/flows/anomalies
   */
  @Get('anomalies')
  async getUnresolvedAnomalies() {
    return this.flowService.getUnresolvedAnomalies();
  }

  /**
   * Obtenir les statistiques de flux pour un matériau
   * GET /api/flows/stats/:materialId/:siteId
   */
  @Get('stats/:materialId/:siteId')
  async getFlowStatistics(
    @Param('materialId') materialId: string,
    @Param('siteId') siteId: string,
    @Query('days') days: string = '30',
  ) {
    return this.flowService.getFlowStatistics(
      materialId,
      siteId,
      parseInt(days),
    );
  }

  /**
   * Obtenir les statistiques agrégées (entrées/sorties) pour un matériau
   * GET /api/flows/aggregate/:materialId?siteId=:siteId
   */
  @Get('aggregate/:materialId')
  async getAggregateStats(
    @Param('materialId') materialId: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.flowService.getAggregateStats(materialId, siteId);
  }

  /**
   * Obtenir les flux enrichis avec infos matériau/site/utilisateur
   * GET /api/flows/enriched?materialId=...&siteId=...
   */
  @Get('enriched')
  async getEnrichedFlows(@Query() query: MaterialFlowQueryDto) {
    return this.flowService.getEnrichedFlows(query);
  }
}
