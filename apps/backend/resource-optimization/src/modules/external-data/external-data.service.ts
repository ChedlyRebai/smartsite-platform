import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SiteData {
  _id: string;
  nom: string;
  localisation: string;
  description?: string;
  status: string;
  budget: number;
  projectId?: string;
  dateDebut: Date;
  dateFin?: Date;
  isActif: boolean;
  teamIds: string[];
}

export interface ProjectData {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  status: string;
  priority?: string;
  budget?: number;
  actualCost?: number;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  siteCount?: number;
  clientName?: string;
}

export interface ProjectSiteData {
  id: string;
  name: string;
  localisation?: string;
  budget?: number;
  status?: string;
  progress?: number;
  teamIds?: string[];
  projectId?: string;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  siteIds?: string[];
  isActif: boolean;
}

export interface TaskData {
  _id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: string;
  siteId?: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export interface MilestoneData {
  _id: string;
  title: string;
  status: string;
  siteId: string;
  startDate: Date;
  dueDate: Date;
  completedAt?: Date;
}

export interface IncidentData {
  _id: string;
  type: 'safety' | 'quality' | 'delay' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  siteId?: string;
  projectId?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface ExternalDataResponse {
  site: SiteData | null;
  teams: UserData[];
  tasks: TaskData[];
  milestones: MilestoneData[];
  incidents: IncidentData[];
  siteStats: {
    totalBudget: number;
    teamSize: number;
    activeTasks: number;
    completedTasks: number;
    pendingMilestones: number;
    openIncidents: number;
    criticalIncidents: number;
  };
}

export interface ProjectContextResponse {
  project: ProjectData | null;
  sites: ProjectSiteData[];
  site: SiteData | null;
  teams: UserData[];
  tasks: TaskData[];
  milestones: MilestoneData[];
  incidents: IncidentData[];
  projectStats: {
    totalBudget: number;
    totalSitesBudget: number;
    taskCount: number;
    completedTasks: number;
    pendingMilestones: number;
    openIncidents: number;
    criticalIncidents: number;
  };
  siteStats?: ExternalDataResponse['siteStats'];
}

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);

  private readonly GESTION_SITE_URL: string;
  private readonly GESTION_PROJECT_URL: string;
  private readonly AUTH_API_URL: string;
  private readonly PLANNING_URL: string;
  private readonly INCIDENT_URL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.GESTION_SITE_URL = this.configService.get('GESTION_SITE_URL') || 'http://localhost:3001/api';
    this.GESTION_PROJECT_URL = this.configService.get('GESTION_PROJECT_URL') || 'http://localhost:3010';
    this.AUTH_API_URL = this.configService.get('AUTH_API_URL') || 'http://localhost:3000';
    this.PLANNING_URL = this.configService.get('PLANNING_URL') || 'http://localhost:3002';
    this.INCIDENT_URL = this.configService.get('INCIDENT_URL') || 'http://localhost:3003';
  }

  async getSiteData(siteId: string): Promise<SiteData | null> {
    if (!siteId) return null;

    try {
      const url = `${this.GESTION_SITE_URL}/gestion-sites/${siteId}`;
      this.logger.log(`Fetching site from: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch site ${siteId}: ${error.message} — URL: ${this.GESTION_SITE_URL}/gestion-sites/${siteId}`);
      return null;
    }
  }

  async getSiteTeams(siteId: string): Promise<UserData[]> {
    if (!siteId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<UserData[]>(`${this.GESTION_SITE_URL}/gestion-sites/${siteId}/teams`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch teams for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getSiteTasks(siteId: string): Promise<TaskData[]> {
    if (!siteId) return [];

    try {
      // Tasks are linked to milestones, not directly to sites
      // Get milestones for the site first, then get tasks for each milestone
      const milestones = await this.getSiteMilestones(siteId);
      if (!milestones.length) return [];

      const taskArrays = await Promise.all(
        milestones.map(async (m) => {
          try {
            const response = await firstValueFrom(
              this.httpService.get<any[]>(`${this.PLANNING_URL}/task/milestone/${m._id}`)
            );
            const raw = response.data || [];
            // flatten grouped response if needed
            if (Array.isArray(raw) && raw.length > 0 && raw[0]?.tasks) {
              return raw.flatMap((g: any) => g.tasks || []);
            }
            return raw;
          } catch {
            return [];
          }
        })
      );
      return taskArrays.flat();
    } catch (error) {
      this.logger.error(`Failed to fetch tasks for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getSiteMilestones(siteId: string): Promise<MilestoneData[]> {
    if (!siteId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<MilestoneData[]>(`${this.PLANNING_URL}/milestone?siteId=${siteId}&limit=100`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch milestones for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getSiteIncidents(siteId: string): Promise<IncidentData[]> {
    if (!siteId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<IncidentData[]>(`${this.INCIDENT_URL}/incidents/by-site/${siteId}`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch incidents for site ${siteId}: ${error.message}`);
      return [];
    }
  }

  async getProjectIncidents(projectId: string): Promise<IncidentData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<IncidentData[]>(`${this.INCIDENT_URL}/incidents/by-project/${projectId}`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch incidents for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getAllSiteData(siteId: string): Promise<ExternalDataResponse> {
    const [site, teams, tasks, milestones, incidents] = await Promise.all([
      this.getSiteData(siteId),
      this.getSiteTeams(siteId),
      this.getSiteTasks(siteId),
      this.getSiteMilestones(siteId),
      this.getSiteIncidents(siteId),
    ]);

    const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingMilestones = milestones.filter(m => m.status !== 'completed').length;
    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;

    return {
      site,
      teams,
      tasks,
      milestones,
      incidents,
      siteStats: {
        totalBudget: site?.budget || 0,
        teamSize: teams.length,
        activeTasks,
        completedTasks,
        pendingMilestones,
        openIncidents,
        criticalIncidents,
      },
    };
  }

  async getProjectData(projectId: string): Promise<ProjectData | null> {
    if (!projectId) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.GESTION_PROJECT_URL}/projects/${projectId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch project ${projectId}: ${error.message}`);
      return null;
    }
  }

  async getProjectSites(projectId: string): Promise<ProjectSiteData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.GESTION_SITE_URL}/gestion-sites?projectId=${projectId}&limit=200`)
      );
      const payload = response.data?.data || response.data || [];
      return (payload || []).map((site: any) => ({
        id: site._id || site.id,
        name: site.nom || site.name,
        localisation: site.localisation,
        budget: site.budget || 0,
        status: site.status,
        progress: site.progress || 0,
        teamIds: site.teamIds || [],
        projectId: site.projectId,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch sites for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getProjectTasks(projectId: string): Promise<TaskData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<TaskData[]>(`${this.PLANNING_URL}/task/gantt/${projectId}`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch tasks for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getProjectMilestones(projectId: string): Promise<MilestoneData[]> {
    if (!projectId) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<MilestoneData[]>(`${this.PLANNING_URL}/milestone/project/${projectId}`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch milestones for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  async getProjectContext(projectId: string, siteId?: string): Promise<ProjectContextResponse> {
    const [project, sites, tasks, milestones, site, teams, projectIncidents, siteIncidents] = await Promise.all([
      this.getProjectData(projectId),
      this.getProjectSites(projectId),
      this.getProjectTasks(projectId),
      this.getProjectMilestones(projectId),
      siteId ? this.getSiteData(siteId) : Promise.resolve(null),
      siteId ? this.getSiteTeams(siteId) : Promise.resolve([]),
      this.getProjectIncidents(projectId),
      siteId ? this.getSiteIncidents(siteId) : Promise.resolve([]),
    ]);

    // Merge incidents (deduplicate by _id)
    const incidentMap = new Map<string, IncidentData>();
    [...projectIncidents, ...siteIncidents].forEach(i => incidentMap.set(i._id, i));
    const incidents = Array.from(incidentMap.values());

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingMilestones = milestones.filter(m => m.status !== 'completed').length;
    const totalSitesBudget = sites.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);
    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;

    const siteTasks = siteId ? tasks.filter(t => t.siteId === siteId) : [];
    const siteMilestones = siteId ? milestones.filter(m => m.siteId === siteId) : [];
    const siteIncidentsFiltered = siteId ? incidents.filter(i => i.siteId === siteId) : [];
    const siteActiveTasks = siteTasks.filter(t => t.status === 'in_progress').length;
    const siteCompletedTasks = siteTasks.filter(t => t.status === 'completed').length;
    const sitePendingMilestones = siteMilestones.filter(m => m.status !== 'completed').length;
    const siteOpenIncidents = siteIncidentsFiltered.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const siteCriticalIncidents = siteIncidentsFiltered.filter(i => i.severity === 'critical' || i.severity === 'high').length;

    const siteStats = siteId ? {
      totalBudget: Number(site?.budget) || 0,
      teamSize: teams.length,
      activeTasks: siteActiveTasks,
      completedTasks: siteCompletedTasks,
      pendingMilestones: sitePendingMilestones,
      openIncidents: siteOpenIncidents,
      criticalIncidents: siteCriticalIncidents,
    } : undefined;

    return {
      project,
      sites,
      site,
      teams,
      tasks,
      milestones,
      incidents,
      projectStats: {
        totalBudget: Number(project?.budget) || 0,
        totalSitesBudget,
        taskCount: tasks.length,
        completedTasks,
        pendingMilestones,
        openIncidents,
        criticalIncidents,
      },
      siteStats,
    };
  }

  async getUsers(): Promise<UserData[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<UserData[]>(`${this.AUTH_API_URL}/users`)
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      return [];
    }
  }
}
