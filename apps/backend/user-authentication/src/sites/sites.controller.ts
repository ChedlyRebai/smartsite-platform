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
  Req,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CreateSiteInput, UpdateSiteInput } from './dto/site.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('sites')
@Controller('sites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new site' })
  async create(@Body() createSiteDto: CreateSiteInput, @Req() req: any) {
    const userId = req.user.userId;
    return this.sitesService.create(createSiteDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sites (filtered by role)' })
  async findAll(@Req() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0]?.name || req.user.role;
    return this.sitesService.findAll(userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0]?.name || req.user.role;
    return this.sitesService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update site' })
  async update(
    @Param('id') id: string,
    @Body() updateSiteDto: UpdateSiteInput,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0]?.name || req.user.role;
    return this.sitesService.update(id, updateSiteDto, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete site (deactivate)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0]?.name || req.user.role;
    return this.sitesService.softDelete(id, userId, userRole);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a deactivated site' })
  async reactivate(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    const userRole = req.user.roles?.[0]?.name || req.user.role;
    return this.sitesService.reactivate(id, userId, userRole);
  }
}
