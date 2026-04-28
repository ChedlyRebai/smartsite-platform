import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConsumptionAnomalyService } from '../services/consumption-anomaly.service';
import { CreateDailyConsumptionDto } from '../dto/daily-consumption.dto';

@Controller('consumption')
export class ConsumptionController {
  constructor(private readonly anomalyService: ConsumptionAnomalyService) {}

  @Post('record')
  @HttpCode(HttpStatus.CREATED)
  async recordConsumption(@Body() createDto: CreateDailyConsumptionDto) {
    const result = await this.anomalyService.recordConsumption(createDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('site/:siteId')
  async getBySite(
    @Param('siteId') siteId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const consumptions = await this.anomalyService.getConsumptionsBySite(
      siteId,
      start,
      end,
    );
    return {
      success: true,
      data: consumptions,
      count: consumptions.length,
    };
  }

  @Get('material/:materialId')
  async getByMaterial(
    @Param('materialId') materialId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const consumptions = await this.anomalyService.getConsumptionsByMaterial(
      materialId,
      start,
      end,
    );
    return {
      success: true,
      data: consumptions,
      count: consumptions.length,
    };
  }

  @Get('anomalies/active')
  async getActiveAnomalies() {
    const anomalies = await this.anomalyService.getActiveAnomalies();
    return {
      success: true,
      data: anomalies,
      count: anomalies.length,
    };
  }

  @Get('anomalies/stats')
  async getAnomalyStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const stats = await this.anomalyService.getAnomalyStats(
      new Date(startDate),
      new Date(endDate),
    );
    return {
      success: true,
      data: stats,
    };
  }

  @Post(':recordId/resend-alert')
  @HttpCode(HttpStatus.OK)
  async resendAlert(@Param('recordId') recordId: string) {
    await this.anomalyService.resendAlert(recordId);
    return { success: true };
  }
}
