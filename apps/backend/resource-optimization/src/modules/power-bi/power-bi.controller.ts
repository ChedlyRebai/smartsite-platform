import { Controller, Get, Param, Query } from '@nestjs/common';
import { PowerBiService } from './power-bi.service';

@Controller('power-bi')
export class PowerBiController {
  constructor(private readonly powerBiService: PowerBiService) {}

  @Get('dashboard-data/:siteId')
  async getDashboardData(@Param('siteId') siteId: string, @Query('refresh') refresh?: boolean) {
    return this.powerBiService.getDashboardData(siteId, !!refresh);
  }

  @Get('recommendations-stream/:siteId')
  async getRecommendationsStream(@Param('siteId') siteId: string) {
    return this.powerBiService.getRecommendationsStream(siteId);
  }

  @Get('alerts-stream/:siteId')
  async getAlertsStream(@Param('siteId') siteId: string) {
    return this.powerBiService.getAlertsStream(siteId);
  }

  @Get('performance-metrics/:siteId')
  async getPerformanceMetrics(@Param('siteId') siteId: string, @Query('period') period: string = '7d') {
    return this.powerBiService.getPerformanceMetrics(siteId, period);
  }
}