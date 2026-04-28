import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { SupplierRatingService } from '../services/supplier-rating.service';
import type { CreateRatingDto } from '../services/supplier-rating.service';

@Controller('supplier-ratings')
export class SupplierRatingController {
  private readonly logger = new Logger(SupplierRatingController.name);

  constructor(private readonly supplierRatingService: SupplierRatingService) {}

  @Post()
  async createRating(@Body() createDto: CreateRatingDto) {
    this.logger.log(`📝 Creating supplier rating: ${createDto.supplierId}`);
    return this.supplierRatingService.createRating(createDto);
  }

  @Get('check/:materialId')
  async checkRatingNeeded(
    @Param('materialId') materialId: string,
    @Query('userId') userId: string,
  ) {
    this.logger.log(`🔍 Checking rating needed for material: ${materialId}, user: ${userId}`);
    return this.supplierRatingService.checkIfRatingNeeded(materialId, userId);
  }

  @Get('supplier/:supplierId/stats')
  async getSupplierStats(@Param('supplierId') supplierId: string) {
    return this.supplierRatingService.getSupplierStats(supplierId);
  }

  @Get('supplier/:supplierId')
  async getSupplierRatings(@Param('supplierId') supplierId: string) {
    return this.supplierRatingService.getSupplierRatings(supplierId);
  }

  @Get('reclamations')
  async getReclamations(@Query('status') status?: string) {
    return this.supplierRatingService.getAllReclamations(status);
  }

  @Get('stats/global')
  async getGlobalStats() {
    return this.supplierRatingService.getGlobalStats();
  }
}