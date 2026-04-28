import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('permissions')
//@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Post()
  async create(@Body() createPermissionDto: any) {
    try {
      return await this.permissionsService.create(createPermissionDto);
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  @Get()
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.permissionsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePermissionDto: any) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
