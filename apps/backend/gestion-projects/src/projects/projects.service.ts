import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project, ProjectDocument, ProjectStatus, ProjectPriority } from "./entities/project.entity";
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from "./dto/project.dto";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

@Injectable()
export class ProjectsService {
  private readonly gestionSitesUrl = process.env.GESTION_SITES_URL || "http://localhost:3001/api";

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async findAll(filter: ProjectFilterDto): Promise<{ projects: Project[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
        { location: { $regex: filter.search, $options: "i" } },
      ];
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.priority) {
      query.priority = filter.priority;
    }

    if (filter.startDateFrom !== undefined || filter.startDateTo !== undefined) {
      query.startDate = {};
      if (filter.startDateFrom !== undefined) {
        query.startDate.$gte = new Date(filter.startDateFrom);
      }
      if (filter.startDateTo !== undefined) {
        query.startDate.$lte = new Date(filter.startDateTo);
      }
    }

    if (filter.minBudget !== undefined || filter.maxBudget !== undefined) {
      query.budget = {};
      if (filter.minBudget !== undefined) {
        query.budget.$gte = filter.minBudget;
      }
      if (filter.maxBudget !== undefined) {
        query.budget.$lte = filter.maxBudget;
      }
    }

    if (filter.manager) {
      query.manager = new Types.ObjectId(filter.manager);
    }

    if (filter.client) {
      query.client = new Types.ObjectId(filter.client);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const sort: any = {};
    if (filter.sortBy) {
      sort[filter.sortBy] = filter.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const projects = await this.projectModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("manager", "name email")
      .populate("client", "name")
      .exec();

    const total = await this.projectModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return { projects, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      throw new NotFoundException("Project not found");
    }
    return project;
  }

  async findAllWithSites(): Promise<any[]> {
    const projects = await this.projectModel
      .find()
      .sort({ createdAt: -1 })
      .populate("manager", "firstName lastName email")
      .populate("client", "name")
      .exec();

    const projectIds = projects.map((p) => p._id);
    const sitesByProject: Record<string, any[]> = {};

    if (projectIds.length > 0) {
      try {
        const sitesResponse = await axios.get(`${this.gestionSitesUrl}/gestion-sites?limit=100`, {
          timeout: 5000,
        });
        const responseData = sitesResponse.data;
        const sites = responseData?.data || responseData || [];
        
        sites.forEach((site: any) => {
          if (!site.projectId) return;
          const pid = String(site.projectId);
          if (!sitesByProject[pid]) {
            sitesByProject[pid] = [];
          }
          sitesByProject[pid].push({
            id: site._id || site.id,
            name: site.nom || site.name,
            address: site.adresse || site.address,
            localisation: site.localisation || site.localisation,
            budget: site.budget || 0,
            status: site.status || "planning",
            progress: site.progress || 0,
            teams: site.teams || [],
            teamIds: site.teamIds || [],
            clientName: site.clientName || null,
          });
        });
      } catch (e) {
        console.error("Could not fetch sites from API:", e);
      }
    }

    return projects.map((project) => ({
      id: project._id,
      name: project.name,
      description: project.description,
      location: project.location,
      status: project.status,
      priority: project.priority,
      budget: project.budget || 0,
      actualCost: project.actualCost,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: project.progress || 0,
      manager: project.manager,
      client: project.client,
      clientName: project.clientName,
      sites: sitesByProject[String(project._id)] || [],
      totalSitesBudget: (sitesByProject[String(project._id)] || []).reduce(
        (sum, s) => sum + (s.budget || 0),
        0
      ),
    }));
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const payload: Partial<Project> = {
      name: dto.name,
      description: dto.description,
      location: dto.location,
      status: dto.status || ProjectStatus.PLANNING,
      priority: dto.priority || ProjectPriority.MEDIUM,
      budget: dto.budget,
      actualCost: dto.actualCost,
      progress: dto.progress || 0,
      siteCount: dto.siteCount || 0,
      clientName: dto.clientName,
      clientContact: dto.clientContact,
      clientEmail: dto.clientEmail,
    };

    if (dto.startDate) {
      payload.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      payload.endDate = new Date(dto.endDate);
    }
    if (dto.manager && Types.ObjectId.isValid(dto.manager)) {
      payload.manager = new Types.ObjectId(dto.manager);
    }
    if (dto.client && Types.ObjectId.isValid(dto.client)) {
      payload.client = new Types.ObjectId(dto.client);
    }
    if (dto.sites && dto.sites.length > 0) {
      payload.sites = dto.sites.filter(s => Types.ObjectId.isValid(s)).map(s => new Types.ObjectId(s));
    }
    if (dto.teamMembers && dto.teamMembers.length > 0) {
      payload.teamMembers = dto.teamMembers.filter(m => Types.ObjectId.isValid(m)).map(m => new Types.ObjectId(m));
    }

    const created = new this.projectModel(payload);
    return created.save();
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const updatePayload: any = { ...dto };

    if (dto.startDate) {
      updatePayload.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updatePayload.endDate = new Date(dto.endDate);
    }
    if (dto.manager && Types.ObjectId.isValid(dto.manager)) {
      updatePayload.manager = new Types.ObjectId(dto.manager);
    }
    if (dto.client && Types.ObjectId.isValid(dto.client)) {
      updatePayload.client = new Types.ObjectId(dto.client);
    }
    if (dto.sites && dto.sites.length > 0) {
      updatePayload.sites = dto.sites.filter(s => Types.ObjectId.isValid(s)).map(s => new Types.ObjectId(s));
    }
    if (dto.teamMembers && dto.teamMembers.length > 0) {
      updatePayload.teamMembers = dto.teamMembers.filter(m => Types.ObjectId.isValid(m)).map(m => new Types.ObjectId(m));
    }

    const updated = await this.projectModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .populate("manager", "name email")
      .populate("client", "name")
      .exec();

    if (!updated) {
      throw new NotFoundException("Project not found");
    }
    return updated;
  }

  async remove(id: string): Promise<{ removed: boolean }> {
    const res = await this.projectModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Project not found");
    }
    return { removed: true };
  }

  async exportPdf(filter?: ProjectFilterDto): Promise<Buffer> {
    const query: any = {};

    if (filter?.status) {
      query.status = filter.status;
    }
    if (filter?.priority) {
      query.priority = filter.priority;
    }

    const projects = await this.projectModel
      .find(query)
      .populate("manager", "name")
      .exec();

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Projects Report", 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = projects.map(p => [
      p.name,
      p.status,
      p.priority,
      p.location || "-",
      p.budget ? `${p.budget} DT` : "-",
      p.progress !== undefined ? `${p.progress}%` : "-",
    ]);

    autoTable(doc, {
      head: [["Name", "Status", "Priority", "Location", "Budget", "Progress"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    const buffer = doc.output("arraybuffer");
    return Buffer.from(buffer);
  }
}
