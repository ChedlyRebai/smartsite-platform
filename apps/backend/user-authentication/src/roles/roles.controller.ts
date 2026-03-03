import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
//@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: any) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: any) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':roleId/permissions/:permissionId')
  async addPermissionToRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.addPermissionToRole(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  async removePermissionFromRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.removePermissionFromRole(roleId, permissionId);
  }
}
