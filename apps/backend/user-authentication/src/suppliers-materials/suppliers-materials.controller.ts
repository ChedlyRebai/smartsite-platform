import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SuppliersMaterialsService } from './suppliers-materials.service';
import { CreateSupplierMaterialDto, UpdateSupplierMaterialDto, SupplierMaterialQueryDto } from './dto/supplier-material.dto';

@Controller('suppliers-materials')
export class SuppliersMaterialsController {
  constructor(private readonly service: SuppliersMaterialsService) {}

  @Post()
  create(@Body() createDto: CreateSupplierMaterialDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(@Query() query: SupplierMaterialQueryDto) {
    return this.service.findAll(query);
  }

  @Get('supplier/:supplierId')
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.service.findBySupplier(supplierId);
  }

  @Get('catalog-item/:catalogItemId')
  findByCatalogItem(@Param('catalogItemId') catalogItemId: string) {
    return this.service.findByCatalogItem(catalogItemId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSupplierMaterialDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}