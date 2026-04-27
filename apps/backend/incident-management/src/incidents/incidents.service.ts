import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import {
  Incident,
  IncidentDocument,
  IncidentSeverity,
  IncidentStatus,
} from "./entities/incident.entity";
import { IncidentEventsService } from "./incidents-events.service";

type DashboardBucket = {
  label: string;
  value: number;
};

type DashboardEntityStats = {
  label: string;
  total: number;
  open: number;
  critical: number;
  resolved: number;
};

type IncidentDashboardStats = {
  summary: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
    critical: number;
    high: number;
    assigned: number;
    unassigned: number;
    resolutionRate: number;
  };
  bySeverity: DashboardBucket[];
  byStatus: DashboardBucket[];
  byType: DashboardBucket[];
  byUser: DashboardEntityStats[];
  byProject: DashboardEntityStats[];
  bySite: DashboardEntityStats[];
  trend: Array<{
    date: string;
    total: number;
    resolved: number;
    critical: number;
  }>;
  updatedAt: string;
};

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    private readonly eventsService: IncidentEventsService,
  ) { }

  async findAll(): Promise<Incident[]> {
    return this.incidentModel.find().exec();
  }

  async findOne(id: string): Promise<Incident> {
    const inc = await this.incidentModel.findById(id).exec();
    if (!inc) {
      throw new NotFoundException("Incident not found");
    }
    return inc;
  }

  async create(dto: CreateIncidentDto): Promise<Incident> {
    const payload: Partial<Incident> = {
      type: dto.type,
      severity: dto.severity ?? IncidentSeverity.MEDIUM,
      title: dto.title,
      description: dto.description ?? undefined,
      reporterName: dto.reporterName,
      reporterPhone: dto.reporterPhone,
      imageUrl: (dto as any).imageUrl,
      assignedToCin: (dto as any).assignedToCin,
      assignedUserRole: (dto as any).assignedUserRole,
      status: dto.status as IncidentStatus || IncidentStatus.OPEN,
    };

    // projectId est optionnel
    if (dto.projectId && Types.ObjectId.isValid(dto.projectId)) {
      (payload as any).project = new Types.ObjectId(dto.projectId);
    }

    // siteId est optionnel
    if (dto.siteId && Types.ObjectId.isValid(dto.siteId)) {
      (payload as any).site = new Types.ObjectId(dto.siteId);
    }

      // Gérer reportedBy - utiliser la chaîne directement (CIN) si fournie
      if (dto.reportedBy) {
        (payload as any).reportedBy = String(dto.reportedBy);
        console.log('✅ reportedBy défini comme chaîne:', dto.reportedBy);
      }

    if (dto.assignedTo && Types.ObjectId.isValid(dto.assignedTo)) {
      (payload as any).assignedTo = new Types.ObjectId(dto.assignedTo);
    }

    const created = new this.incidentModel(payload);
    const saved = await created.save();

    // Emit notification if assigned to a user
    if ((payload as any).assignedToCin) {
      this.eventsService.notifyIncidentAssigned((payload as any).assignedToCin, saved);
    }

    return saved;
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    const updatePayload: any = { ...dto };

    // projectId est optionnel
    if (dto.projectId !== undefined) {
      if (dto.projectId && Types.ObjectId.isValid(dto.projectId)) {
        updatePayload.project = new Types.ObjectId(dto.projectId);
      } else {
        updatePayload.project = null; // Permet de dissocier le projet
      }
      delete updatePayload.projectId;
    }

    // siteId est optionnel (peut être null pour retirer l'affectation)
    if (dto.siteId !== undefined) {
      if (dto.siteId && Types.ObjectId.isValid(dto.siteId)) {
        updatePayload.site = new Types.ObjectId(dto.siteId);
      } else {
        updatePayload.site = null; // Permet de dissocier le site
      }
      delete updatePayload.siteId;
    }

    // Handle reportedBy as string (CIN)
    if (dto.reportedBy !== undefined) {
      updatePayload.reportedBy = String(dto.reportedBy);
    }
    if (dto.assignedTo && Types.ObjectId.isValid(dto.assignedTo)) {
      updatePayload.assignedTo = new Types.ObjectId(dto.assignedTo);
    }
    if (dto.assignedUserRole !== undefined) {
      updatePayload.assignedUserRole = dto.assignedUserRole;
    }

    const updated = await this.incidentModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Incident not found");
    }

    // Emit notification based on what was updated
    if (updatePayload.assignedToCin) {
      // New assignment
      this.eventsService.notifyIncidentAssigned(updatePayload.assignedToCin, updated);
    } else if (updatePayload.status === IncidentStatus.RESOLVED || updatePayload.status === 'resolved') {
      // Incident resolved - notify whoever had it assigned
      if ((updated as any).assignedToCin) {
        this.eventsService.notifyIncidentUpdated((updated as any).assignedToCin, updated, 'resolved');
      }
      // Broadcast to everyone
      this.eventsService.broadcastIncidentUpdate(updated, 'resolved');
    }

    return updated;
  }

  async removeAll() {
    const res = await this.incidentModel.deleteMany({}).exec();
    return { deletedCount: res.deletedCount };
  }

  async remove(id: string): Promise<{ removed: boolean }> {
    const res = await this.incidentModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Incident not found");
    }
    return { removed: true };
  }

  async findBySite(siteId: string): Promise<Incident[]> {
    if (!Types.ObjectId.isValid(siteId)) {
      return [];
    }
    return this.incidentModel
      .find({ site: new Types.ObjectId(siteId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProject(projectId: string): Promise<Incident[]> {
    if (!Types.ObjectId.isValid(projectId)) {
      return [];
    }
    return this.incidentModel
      .find({ project: new Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countBySite(siteId: string): Promise<number> {
    if (!Types.ObjectId.isValid(siteId)) {
      return 0;
    }
    return this.incidentModel
      .countDocuments({ site: new Types.ObjectId(siteId) })
      .exec();
  }

  async countByProject(projectId: string): Promise<number> {
    if (!Types.ObjectId.isValid(projectId)) {
      return 0;
    }
    return this.incidentModel
      .countDocuments({ project: new Types.ObjectId(projectId) })
      .exec();
  }

  async findOpenByAssignedUserCin(userCin: string): Promise<Incident[]> {
    if (!userCin) {
      return [];
    }

    return this.incidentModel
      .find({
        assignedToCin: userCin,
        status: { $ne: IncidentStatus.RESOLVED },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDashboardStats(filters?: {
    assignedToCin?: string;
    projectId?: string;
    siteId?: string;
  }): Promise<IncidentDashboardStats> {
    const baseMatch: any = {};

    if (filters?.assignedToCin) {
      baseMatch.assignedToCin = filters.assignedToCin;
    }
    if (filters?.projectId && Types.ObjectId.isValid(filters.projectId)) {
      baseMatch.project = new Types.ObjectId(filters.projectId);
    }
    if (filters?.siteId && Types.ObjectId.isValid(filters.siteId)) {
      baseMatch.site = new Types.ObjectId(filters.siteId);
    }

    const [summaryRow] = await this.incidentModel
      .aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: {
              $sum: {
                $cond: [{ $eq: ["$status", IncidentStatus.OPEN] }, 1, 0],
              },
            },
            investigating: {
              $sum: {
                $cond: [{ $eq: ["$status", IncidentStatus.INVESTIGATING] }, 1, 0],
              },
            },
            resolved: {
              $sum: {
                $cond: [{ $eq: ["$status", IncidentStatus.RESOLVED] }, 1, 0],
              },
            },
            closed: {
              $sum: {
                $cond: [{ $eq: ["$status", IncidentStatus.CLOSED] }, 1, 0],
              },
            },
            critical: {
              $sum: {
                $cond: [{ $eq: ["$severity", IncidentSeverity.CRITICAL] }, 1, 0],
              },
            },
            high: {
              $sum: {
                $cond: [{ $eq: ["$severity", IncidentSeverity.HIGH] }, 1, 0],
              },
            },
            assigned: {
              $sum: {
                $cond: [{ $ifNull: ["$assignedToCin", false] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    const total = summaryRow?.total ?? 0;
    const resolvedLike = (summaryRow?.resolved ?? 0) + (summaryRow?.closed ?? 0);

    const summary = {
      total,
      open: summaryRow?.open ?? 0,
      investigating: summaryRow?.investigating ?? 0,
      resolved: summaryRow?.resolved ?? 0,
      closed: summaryRow?.closed ?? 0,
      critical: summaryRow?.critical ?? 0,
      high: summaryRow?.high ?? 0,
      assigned: summaryRow?.assigned ?? 0,
      unassigned: Math.max(0, total - (summaryRow?.assigned ?? 0)),
      resolutionRate: total > 0 ? Math.round((resolvedLike / total) * 1000) / 10 : 0,
    };

    const [severityRows, statusRows, typeRows, userRows, projectRows, siteRows, trendRows] =
      await Promise.all([
        this.incidentModel
          .aggregate([
            { $match: baseMatch },
            { $group: { _id: "$severity", value: { $sum: 1 } } },
          ])
          .exec(),
        this.incidentModel
          .aggregate([
            { $match: baseMatch },
            { $group: { _id: "$status", value: { $sum: 1 } } },
          ])
          .exec(),
        this.incidentModel
          .aggregate([
            { $match: baseMatch },
            { $group: { _id: "$type", value: { $sum: 1 } } },
          ])
          .exec(),
        this.incidentModel
          .aggregate([
            { $match: baseMatch },
            {
              $addFields: {
                entityKey: { $ifNull: ["$assignedToCin", "unassigned"] },
              },
            },
            {
              $group: {
                _id: "$entityKey",
                total: { $sum: 1 },
                open: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                critical: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$severity",
                          [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                resolved: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { total: -1 } },
            { $limit: 8 },
          ])
          .exec(),
        this.incidentModel
          .aggregate([
            { $match: baseMatch },
            {
              $addFields: {
                entityKey: {
                  $cond: [
                    { $ifNull: ["$project", false] },
                    { $toString: "$project" },
                    "no-project",
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$entityKey",
                total: { $sum: 1 },
                open: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                critical: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$severity",
                          [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                resolved: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { total: -1 } },
            { $limit: 8 },
          ])
          .exec(),
        this.incidentModel
          .aggregate([
            { $match: baseMatch },
            {
              $addFields: {
                entityKey: {
                  $cond: [
                    { $ifNull: ["$site", false] },
                    { $toString: "$site" },
                    "no-site",
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$entityKey",
                total: { $sum: 1 },
                open: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                critical: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$severity",
                          [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                resolved: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { total: -1 } },
            { $limit: 8 },
          ])
          .exec(),
        this.incidentModel
          .aggregate([
            {
              $match: {
                ...baseMatch,
                createdAt: {
                  $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                  },
                },
                total: { $sum: 1 },
                resolved: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                critical: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$severity",
                          [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .exec(),
      ]);

    const toBucket = (rows: Array<{ _id: string; value: number }>) =>
      rows.map((r) => ({ label: r._id || "unknown", value: r.value }));

    const toEntityBuckets = (
      rows: Array<{
        _id: string;
        total: number;
        open: number;
        critical: number;
        resolved: number;
      }>,
    ) =>
      rows.map((r) => ({
        label: r._id || "unknown",
        total: r.total ?? 0,
        open: r.open ?? 0,
        critical: r.critical ?? 0,
        resolved: r.resolved ?? 0,
      }));

    return {
      summary,
      bySeverity: toBucket(severityRows),
      byStatus: toBucket(statusRows),
      byType: toBucket(typeRows),
      byUser: toEntityBuckets(userRows),
      byProject: toEntityBuckets(projectRows),
      bySite: toEntityBuckets(siteRows),
      trend: trendRows.map((r) => ({
        date: r._id,
        total: r.total ?? 0,
        resolved: r.resolved ?? 0,
        critical: r.critical ?? 0,
      })),
      updatedAt: new Date().toISOString(),
    };
  }
}
