import axios from "axios";
import { GESTION_SITE_API_URL } from "../../lib/gestion-site-api-url";
import { PLANNING_API_URL } from "../../lib/planning-api-url";
import { AUTH_API_URL } from "../../lib/auth-api-url";
import { GESTION_PROJECTS_API_URL } from "../../lib/gestion-projects-api-url";

const projectsApi = axios.create({
  baseURL: PLANNING_API_URL,
});

export const gestionProjectsApi = axios.create({
  baseURL: GESTION_PROJECTS_API_URL,
});

const sitesApi = axios.create({
  baseURL: GESTION_SITE_API_URL,
});

const usersApi = axios.create({
  baseURL: AUTH_API_URL,
});

function getAuthToken(): string | null {
  const directToken = localStorage.getItem("access_token");
  if (directToken) return directToken;
  const persisted = localStorage.getItem("smartsite-auth");
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
}

[projectsApi, sitesApi, usersApi, gestionProjectsApi].forEach((api) => {
  api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});

export interface Site {
  _id: string;
  name: string;
  localisation: string;
  status: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
}

export interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string | { name: string; permissions: string[] };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncedProject {
  _id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  priority: string;
  deadline: string;
  assignedTo: string;
  assignedToName: string;
  assignedToRole: string;
  tasks: unknown[];
  createdAt: string;
  updatedAt: string;
  projectManagerName: string;
  budget?: number;
  assignedTeam?: TeamMember[];
  assignedSites?: Site[];
  teamSize?: number;
  siteCount?: number;
  totalTeamBudget?: number;
  totalSiteBudget?: number;
}

export interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

function normalizeSite(raw: Record<string, unknown>): Site {
  const id = raw._id ?? raw.id;
  return {
    _id: String(id ?? ""),
    name: String(raw.nom ?? raw.name ?? ""),
    localisation: String(
      raw.localisation ?? raw.adresse ?? raw.address ?? "",
    ),
    status: String(raw.status ?? (raw.isActif ? "in_progress" : "planning")),
    budget: Number(raw.budget ?? 0),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    projectId: raw.projectId != null ? String(raw.projectId) : undefined,
  };
}

function normalizeUser(raw: Record<string, unknown>): TeamMember {
  const id = raw._id ?? raw.id ?? raw.cin;
  const status = String(raw.status ?? "active");
  return {
    _id: String(id ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    email: String(raw.email ?? ""),
    role: raw.role as TeamMember["role"],
    isActive: status === "active" && raw.isActive !== false,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export const getAllProjectsForSuperAdmin = async (): Promise<SyncedProject[]> => {
  try {
    const response = await projectsApi.get("/projects/all");
    const data = response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching all projects for super admin:", error);
    return [];
  }
};

export const getUrgentTasks = async (): Promise<Task[]> => {
  try {
    const response = await projectsApi.get("/tasks/urgent");
    const data = response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching urgent tasks:", error);
    return [];
  }
};

export interface ProjectWithSites {
  id: string;
  name: string;
  description?: string;
  location?: string;
  status: string;
  priority: string;
  budget: number;
  actualCost?: number;
  startDate?: string;
  endDate?: string;
  progress: number;
  clientName?: string;
  sites: Site[];
  totalSitesBudget: number;
}

export const getProjectsWithSites = async (): Promise<ProjectWithSites[]> => {
  try {
    // Fetch projects and sites in parallel from their respective services
    const [projectsResponse, sitesResponse] = await Promise.allSettled([
      gestionProjectsApi.get("/projects?limit=100&page=1"),
      sitesApi.get("/gestion-sites?limit=200"),
    ]);

    const projectsData =
      projectsResponse.status === "fulfilled"
        ? projectsResponse.value.data?.projects ?? projectsResponse.value.data ?? []
        : [];

    const sitesRaw =
      sitesResponse.status === "fulfilled"
        ? sitesResponse.value.data?.data ?? sitesResponse.value.data ?? []
        : [];

    // Normalize sites
    const allSites: Array<{
      id: string;
      name: string;
      address: string;
      localisation: string;
      budget: number;
      status: string;
      progress: number;
      teams: any[];
      teamIds: any[];
      projectId?: string;
      clientName?: string;
    }> = sitesRaw.map((site: any) => ({
      id: site._id || site.id,
      name: site.nom || site.name || "",
      address: site.adresse || site.address || "",
      localisation: site.localisation || site.adresse || site.address || "",
      budget: site.budget || 0,
      status: site.status || "planning",
      progress: site.progress || 0,
      teams: site.teams || [],
      teamIds: site.teamIds || [],
      projectId: site.projectId ? String(site.projectId) : undefined,
      clientName: site.clientName || null,
    }));

    // Build a map: projectId → sites[]
    const sitesByProject: Record<string, typeof allSites> = {};
    allSites.forEach((site) => {
      if (!site.projectId) return;
      if (!sitesByProject[site.projectId]) sitesByProject[site.projectId] = [];
      sitesByProject[site.projectId].push(site);
    });

    return projectsData.map((project: any) => {
      const pid = String(project._id || project.id);
      const projectSites = sitesByProject[pid] || [];
      return {
        id: pid,
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
        clientName: project.clientName,
        sites: projectSites,
        totalSitesBudget: projectSites.reduce((sum, s) => sum + (s.budget || 0), 0),
      };
    });
  } catch (error) {
    console.error("Error fetching projects with sites:", error);
    return [];
  }
};

export const getAllSites = async (): Promise<Site[]> => {
  try {
    const response = await sitesApi.get("/gestion-sites?limit=100");
    const payload = response.data?.data ?? response.data;
    const rows = Array.isArray(payload) ? payload : payload?.items ?? [];
    return rows.map((r: Record<string, unknown>) => normalizeSite(r));
  } catch (error) {
    console.error("Error fetching sites:", error);
    return [];
  }
};

export const getAllTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const response = await usersApi.get("/users");
    const raw = response.data?.data ?? response.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((u: Record<string, unknown>) => normalizeUser(u));
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

export const getSyncedProjectsWithDetails = async (): Promise<SyncedProject[]> => {
  try {
    const [projects, sites, teamMembers] = await Promise.allSettled([
      getAllProjectsForSuperAdmin(),
      getAllSites(),
      getAllTeamMembers(),
    ]);

    const projectsData = projects.status === "fulfilled" ? projects.value : [];
    const sitesData = sites.status === "fulfilled" ? sites.value : [];
    const teamMembersData =
      teamMembers.status === "fulfilled" ? teamMembers.value : [];

    const syncedProjects = projectsData.map((project) => {
      const assignedTeam = teamMembersData.filter((member) => {
        const memberId = member._id;
        const projectAssignedTo = project.assignedTo;
        return (
          memberId === projectAssignedTo ||
          (typeof member.role === "object" &&
            (member.role as { name?: string }).name === "project_manager" &&
            member._id === projectAssignedTo)
        );
      });

      const pid = String(project._id);
      const assignedSites = sitesData.filter((site) => {
        if (site.projectId && site.projectId === pid) return true;
        const n = project.name.toLowerCase();
        return (
          site.name.toLowerCase().includes(n) ||
          site.localisation.toLowerCase().includes(n)
        );
      });

      const teamSize = assignedTeam.length;
      const siteCount = assignedSites.length;
      const totalTeamBudget = 0;
      const totalSiteBudget = assignedSites.reduce(
        (sum, site) => sum + (site.budget || 0),
        0,
      );

      return {
        ...project,
        assignedTeam,
        assignedSites,
        teamSize,
        siteCount,
        totalTeamBudget,
        totalSiteBudget,
      };
    });

    return syncedProjects;
  } catch (error) {
    console.error("Error syncing projects with details:", error);
    return [];
  }
};

export const getSyncedProjectStats = async () => {
  try {
    const projects = await getSyncedProjectsWithDetails();

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "en_cours").length,
      completedProjects: projects.filter((p) => p.status === "terminé").length,
      delayedProjects: projects.filter((p) => p.status === "en_retard").length,
      totalTeamMembers: projects.reduce((sum, p) => sum + (p.teamSize || 0), 0),
      totalSites: projects.reduce((sum, p) => sum + (p.siteCount || 0), 0),
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalSiteBudget: projects.reduce(
        (sum, p) => sum + (p.totalSiteBudget || 0),
        0,
      ),
      avgProgress:
        projects.length > 0
          ? Math.round(
              projects.reduce((sum, p) => sum + p.progress, 0) /
                projects.length,
            )
          : 0,
      urgentProjects: projects.filter((p) => p.priority === "urgent").length,
      highPriorityProjects: projects.filter((p) => p.priority === "high").length,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching synced project stats:", error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      delayedProjects: 0,
      totalTeamMembers: 0,
      totalSites: 0,
      totalBudget: 0,
      totalSiteBudget: 0,
      avgProgress: 0,
      urgentProjects: 0,
      highPriorityProjects: 0,
    };
  }
};
