import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersSeedService } from './suppliers.seed';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('fournisseurs')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly seedService: SuppliersSeedService,
  ) {}

  @Post('seed')
  async seedSuppliers() {
    await this.seedService.seedSuppliers();
    return {
      success: true,
      message: 'Fournisseurs de test créés avec succès',
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    const supplier = await this.suppliersService.create(createSupplierDto);
    return {
      success: true,
      message: 'Fournisseur créé avec succès',
      data: supplier,
    };
  }

  @Get()
  async findAll() {
    const suppliers = await this.suppliersService.findAll();
    return {
      success: true,
      data: suppliers,
      count: suppliers.length,
    };
  }

  @Get('nearby')
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('maxDistance') maxDistance?: string,
  ) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const distance = maxDistance ? parseFloat(maxDistance) : 50;

    if (isNaN(lat) || isNaN(lon)) {
      return {
        success: false,
        message: 'Coordonnées invalides',
        data: [],
      };
    }

    const suppliers = await this.suppliersService.findNearby(lat, lon, distance);
    return {
      success: true,
      data: suppliers,
      count: suppliers.length,
    };
  }

  @Get('by-material/:materialId')
  async findByMaterial(@Param('materialId') materialId: string) {
    const suppliers = await this.suppliersService.findByMaterial(materialId);
    return {
      success: true,
      data: suppliers,
      count: suppliers.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const supplier = await this.suppliersService.findOne(id);
    return {
      success: true,
      data: supplier,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.suppliersService.update(id, updateSupplierDto);
    return {
      success: true,
      message: 'Fournisseur mis à jour avec succès',
      data: supplier,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.suppliersService.remove(id);
    return {
      success: true,
      message: 'Fournisseur supprimé avec succès',
    };
  }

  @Post(':supplierId/materials/:materialId')
  async addMaterial(
    @Param('supplierId') supplierId: string,
    @Param('materialId') materialId: string,
  ) {
    const supplier = await this.suppliersService.addMaterialToSupplier(supplierId, materialId);
    return {
      success: true,
      message: 'Matériau ajouté au fournisseur avec succès',
      data: supplier,
    };
  }

  @Delete(':supplierId/materials/:materialId')
  async removeMaterial(
    @Param('supplierId') supplierId: string,
    @Param('materialId') materialId: string,
  ) {
    const supplier = await this.suppliersService.removeMaterialFromSupplier(supplierId, materialId);
    return {
      success: true,
      message: 'Matériau retiré du fournisseur avec succès',
      data: supplier,
    };
  }
}