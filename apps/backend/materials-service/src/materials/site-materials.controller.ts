import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SiteMaterialsService } from './services/site-materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';

@Controller('site-materials')
export class SiteMaterialsController {
  private readonly logger = new Logger(SiteMaterialsController.name);

  constructor(private readonly siteMaterialsService: SiteMaterialsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMaterialWithSite(
    @Body() body: { material: CreateMaterialDto; siteId: string },
  ) {
    console.log('📥 createMaterialWithSite received:', {
      siteId: body.siteId,
      materialName: body.material?.name,
    });
    const userId = 'system';
    return this.siteMaterialsService.createMaterialWithSite(
      body.material,
      body.siteId,
      userId,
    );
  }

  @Post(':materialId/assign/:siteId')
  @HttpCode(HttpStatus.OK)
  async assignMaterialToSite(
    @Param('materialId') materialId: string,
    @Param('siteId') siteId: string,
  ) {
    console.log('📥 assignMaterialToSite:', { materialId, siteId });
    return this.siteMaterialsService.assignMaterialToSite(materialId, siteId);
  }

  @Delete(':materialId/remove/:siteId')
  @HttpCode(HttpStatus.OK)
  async removeMaterialFromSite(
    @Param('materialId') materialId: string,
    @Param('siteId') siteId: string,
  ) {
    return this.siteMaterialsService.removeMaterialFromSite(materialId, siteId);
  }

  @Get('site/:siteId')
  async getMaterialsBySite(@Param('siteId') siteId: string) {
    return this.siteMaterialsService.getMaterialsBySite(siteId);
  }

  @Get('site/:siteId/reorder')
  async getMaterialsNeedingReorder(@Param('siteId') siteId: string) {
    return this.siteMaterialsService.getMaterialsNeedingReorderBySite(siteId);
  }

  @Get('site/:siteId/low-stock')
  async getLowStockMaterials(@Param('siteId') siteId: string) {
    return this.siteMaterialsService.getLowStockMaterialsBySite(siteId);
  }

  @Get('site/:siteId/out-of-stock')
  async getOutOfStockMaterials(@Param('siteId') siteId: string) {
    return this.siteMaterialsService.getOutOfStockMaterialsBySite(siteId);
  }

  @Get('availability/:materialId/site/:siteId')
  async getMaterialAvailability(
    @Param('materialId') materialId: string,
    @Param('siteId') siteId: string,
  ) {
    return this.siteMaterialsService.getMaterialAvailabilityForSite(
      materialId,
      siteId,
    );
  }

  @Get('all-with-sites')
  async getAllMaterialsWithSiteInfo() {
    return this.siteMaterialsService.getAllMaterialsWithSiteInfo();
  }

  @Get('category/:category/site/:siteId')
  async getMaterialsByCategory(
    @Param('category') category: string,
    @Param('siteId') siteId: string,
  ) {
    return this.siteMaterialsService.getMaterialsByCategoryAndSite(
      category,
      siteId,
    );
  }

  @Post(':materialId/stock')
  @HttpCode(HttpStatus.OK)
  async updateStock(
    @Param('materialId') materialId: string,
    @Body() body: { quantity: number; operation: 'add' | 'remove' },
  ) {
    return this.siteMaterialsService.updateMaterialStock(
      materialId,
      body.quantity,
      body.operation,
    );
  }
}
