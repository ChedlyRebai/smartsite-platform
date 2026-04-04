import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) { }

  async createLog(payload: Partial<AuditLog>) {
    // Rétention automatique: purge des logs plus anciens que N jours
    const retentionDays = Number(process.env.AUDIT_LOG_RETENTION_DAYS || 365);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await this.auditLogModel.deleteMany({ createdAt: { $lt: cutoff } }).exec();

    const log = new this.auditLogModel({
      status: 'success',
      severity: 'normal',
      ...payload,
    });
    return log.save();
  }

  async findAll(query: QueryAuditLogsDto) {
    const mongoQuery: any = {};

    if (query.userId) mongoQuery.userId = query.userId;
    if (query.userCin) mongoQuery.userCin = { $regex: query.userCin, $options: 'i' };
    if (query.actionType) mongoQuery.actionType = query.actionType;
    if (query.severity) mongoQuery.severity = query.severity;
    if (query.status) mongoQuery.status = query.status;

    if (query.startDate || query.endDate) {
      mongoQuery.createdAt = {};
      if (query.startDate) mongoQuery.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) mongoQuery.createdAt.$lte = new Date(query.endDate);
    }

    if (query.keyword) {
      mongoQuery.$or = [
        { actionLabel: { $regex: query.keyword, $options: 'i' } },
        { details: { $regex: query.keyword, $options: 'i' } },
        { userName: { $regex: query.keyword, $options: 'i' } },
        { userCin: { $regex: query.keyword, $options: 'i' } },
        { resourceType: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    return this.auditLogModel.find(mongoQuery).sort({ createdAt: -1 }).limit(1000).exec();
  }

  async findLatestLogin(userId: string, sessionId?: string) {
    const q: any = {
      userId,
      actionType: 'login',
      status: 'success',
    };
    if (sessionId) q.sessionId = sessionId;
    return this.auditLogModel.findOne(q).sort({ createdAt: -1 }).exec();
  }

  getRetentionDays() {
    return Number(process.env.AUDIT_LOG_RETENTION_DAYS || 365);
  }
}
