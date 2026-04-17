import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  @Get()
  async findAll(@Query() query: QueryAuditLogsDto, @Req() req: any) {
    const currentUserId = req?.user?.sub || req?.user?.userId;
    const currentUser = await this.userModel
      .findById(currentUserId)
      .populate('role')
      .exec();
    const currentUserRole = (currentUser as any)?.role?.name;

    if (currentUserRole !== 'super_admin') {
      throw new ForbiddenException('Access denied: super_admin only');
    }

    return this.auditLogsService.findAll(query);
  }

  @Get('retention')
  async getRetention(@Req() req: any) {
    const currentUserId = req?.user?.sub || req?.user?.userId;
    const currentUser = await this.userModel
      .findById(currentUserId)
      .populate('role')
      .exec();
    const currentUserRole = (currentUser as any)?.role?.name;
    if (currentUserRole !== 'super_admin') {
      throw new ForbiddenException('Access denied: super_admin only');
    }
    return {
      retentionDays: this.auditLogsService.getRetentionDays(),
      deletionPolicy: 'manual_delete_disabled',
    };
  }

  @Post('track')
  async trackEvent(@Body() dto: CreateAuditLogDto, @Req() req: any) {
    const currentUserId = req?.user?.sub || req?.user?.userId;
    const currentUser = await this.userModel
      .findById(currentUserId)
      .populate('role')
      .exec();
    return this.auditLogsService.createLog({
      userId: String((currentUser as any)?._id || ''),
      userCin: (currentUser as any)?.cin,
      userName:
        `${(currentUser as any)?.firstname || ''} ${(currentUser as any)?.lastname || ''}`.trim(),
      userRole: (currentUser as any)?.role?.name,
      actionType: dto.actionType || 'view',
      actionLabel: dto.actionLabel || 'Tracked event',
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      status: dto.status || 'success',
      severity: dto.severity || 'normal',
      details: dto.details,
      ipAddress: req?.ip,
    });
  }
}
