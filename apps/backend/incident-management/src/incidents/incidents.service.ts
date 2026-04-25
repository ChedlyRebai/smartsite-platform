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

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
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
    return created.save();
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
}
