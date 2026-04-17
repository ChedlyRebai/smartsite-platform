import axios from 'axios';
import type { Site } from '../types';
import { authApi } from '../store/authStore';
import { getAllTeams } from './team.action';

// Ensure token is attached to every request (fallback if authApi defaults not set)
authApi.interceptors.request.use((config) => {
  try {
    const persisted = localStorage.getItem('smartsite-auth');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      const token = parsed?.state?.user?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Map backend site data to frontend site format
const mapBackendSiteToFrontend = (backendSite: any): Site => {
  return {
    id: backendSite._id?.toString() || backendSite.id?.toString() || '',
    name: backendSite.name || backendSite.nom || '',
    address: backendSite.address || backendSite.adresse || '',
    coordinates: backendSite.coordinates || { lat: 0, lng: 0 },
    area: backendSite.area || 0,
    status: backendSite.status || 'planning',
    workStartDate: backendSite.workStartDate || backendSite.work_start_date || new Date().toISOString(),
    workEndDate: backendSite.workEndDate || backendSite.work_end_date,
    projectId: backendSite.projectId || backendSite.project_id?.toString() || '',
    budget: backendSite.budget || 0,
    progress: backendSite.progress || 0,
    createdAt: backendSite.createdAt || backendSite.created_at || new Date().toISOString(),
    updatedAt: backendSite.updatedAt || backendSite.updated_at || new Date().toISOString(),
    teams: backendSite.teams || backendSite.teamIds || [],
    is_active: backendSite.is_active ?? true,
  };
};

export const fetchSites = async (): Promise<Site[]> => {
  try {
    const response = await authApi.get('/sites');
    const data = response.data;
    const sitesArray = Array.isArray(data) ? data : data.data || [];
    return sitesArray.map(mapBackendSiteToFrontend);
  } catch (error) {
    console.error('Error fetching sites:', error);
    throw error;
  }
};

export const fetchSiteById = async (id: string): Promise<Site> => {
  try {
    const response = await authApi.get(`/sites/${id}`);
    return mapBackendSiteToFrontend(response.data);
  } catch (error) {
    console.error('Error fetching site:', error);
    throw error;
  }
};

export const createSite = async (site: Partial<Site>): Promise<Site> => {
  try {
    const backendData = {
      name: site.name,
      address: site.address,
      coordinates: site.coordinates,
      area: site.area,
      status: site.status || 'planning',
      workStartDate: site.workStartDate,
      workEndDate: site.workEndDate,
      projectId: site.projectId,
      budget: site.budget,
      progress: site.progress || 0,
    };
    const response = await authApi.post('/sites', backendData);
    return mapBackendSiteToFrontend(response.data);
  } catch (error) {
    console.error('Error creating site:', error);
    throw error;
  }
};

export const updateSite = async (id: string, updateData: Partial<Site>): Promise<Site> => {
  try {
    const response = await authApi.patch(`/sites/${id}`, updateData);
    return mapBackendSiteToFrontend(response.data);
  } catch (error) {
    console.error('Error updating site:', error);
    throw error;
  }
};

export const deleteSite = async (id: string): Promise<void> => {
  try {
    await authApi.delete(`/sites/${id}`);
  } catch (error) {
    console.error('Error deleting site:', error);
    throw error;
  }
};

// Get mapping of teamId -> site assignment (for Teams page compatibility)
// In current architecture, each team has a `site` field (ObjectId reference to Site)
// Returns mapping: teamId -> { siteId, siteName }
export const getAssignedTeamIds = async (): Promise<Record<string, { siteId: string; siteName: string }>> => {
  try {
    const teams = await getAllTeams();
    const result: Record<string, { siteId: string; siteName: string }> = {};

    // Handle both array and { data: [] } responses
    const teamsArray = Array.isArray(teams) ? teams : (teams as any)?.data || [];

    for (const team of teamsArray) {
      if (team.site) {
        const siteId = typeof team.site === 'object' ? (team.site._id || team.site.id) : team.site;
        result[team._id] = {
          siteId: siteId?.toString() || '',
          siteName: team.name || '',
        };
      }
    }
    return result;
  } catch (error) {
    console.error('Error getting assigned team IDs:', error);
    return {};
  }
};
