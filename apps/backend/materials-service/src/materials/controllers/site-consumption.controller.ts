import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SiteConsumptionService } from '../services/site-consumption.service';
import {
  CreateMaterialRequirementDto,
  UpdateConsumptionDto,
} from '../dto/material-requirement.dto';

@Controller('site-consumption')
export class SiteConsumptionController {
  private readonly logger = new Logger(SiteConsumptionController.name);

  constructor(private readonly consumptionService: SiteConsumptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRequirement(@Body() createDto: CreateMaterialRequirementDto) {
    this.logger.log(
      `POST /site-consumption - creation pour site=${createDto.siteId}, material=${createDto.materialId}`,
    );
    return this.consumptionService.createRequirement(createDto, null);
  }

  @Put(':siteId/:materialId')
  @HttpCode(HttpStatus.OK)
  async updateConsumption(
    @Param('siteId') siteId: string,
    @Param('materialId') materialId: string,
    @Body() updateDto: UpdateConsumptionDto,
  ) {
    this.logger.log(
      `PUT /site-consumption/${siteId}/${materialId} - consommation=${updateDto.consumedQuantity}`,
    );
    return this.consumptionService.updateConsumption(
      siteId,
      materialId,
      updateDto,
    );
  }

  @Post(':siteId/:materialId/add')
  @HttpCode(HttpStatus.OK)
  async addConsumption(
    @Param('siteId') siteId: string,
    @Param('materialId') materialId: string,
    @Body() body: { quantity: number; notes?: string },
  ) {
    this.logger.log(
      `POST /site-consumption/${siteId}/${materialId}/add - +${body.quantity}`,
    );
    return this.consumptionService.addConsumption(
      siteId,
      materialId,
      body.quantity,
      body.notes,
    );
  }

  @Get('site/:siteId')
  async getRequirementsBySite(@Param('siteId') siteId: string) {
    return this.consumptionService.getRequirementsBySite(siteId);
  }

  @Get('site/:siteId/stats')
  async getSiteStats(
    @Param('siteId') siteId: string,
    @Query('siteName') siteName?: string,
  ) {
    return this.consumptionService.getSiteConsumptionStats(siteId, siteName);
  }

  @Get('all')
  async getAllRequirements() {
    return this.consumptionService.getAllRequirementsWithSites();
  }

  @Get('high-consumption')
  async getHighConsumption(@Query('threshold') threshold?: string) {
    const thresholdNum = threshold ? parseInt(threshold, 10) : 80;
    return this.consumptionService.getHighConsumptionMaterials(thresholdNum);
  }

  @Delete(':siteId/:materialId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRequirement(
    @Param('siteId') siteId: string,
    @Param('materialId') materialId: string,
  ) {
    this.logger.log(`DELETE /site-consumption/${siteId}/${materialId}`);
    return this.consumptionService.deleteRequirement(siteId, materialId);
  }

  @Get(':siteId/:materialId')
  async getRequirement(
    @Param('siteId') siteId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.consumptionService.getRequirement(siteId, materialId);
  }
}
