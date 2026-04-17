import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaterialInput, UpdateMaterialInput } from './dto/material.dto';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  async create(@Body() createMaterialDto: CreateMaterialInput) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'true';
    return this.materialsService.findAll(includeInactiveBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Get('suppliers/active')
  async getActiveSuppliers() {
    return this.materialsService.getActiveSuppliers();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialInput,
  ) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.materialsService.softDelete(id);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('id') id: string) {
    return this.materialsService.reactivate(id);
  }
}
