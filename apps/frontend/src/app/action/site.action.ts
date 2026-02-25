import type { Site } from '../types';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Try to get token from auth store persist
  const authData = localStorage.getItem('smartsite-auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.state?.user?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.state.user.access_token}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config;
});

// Map backend site data to frontend site format
const mapBackendSiteToFrontend = (backendSite: any): Site => {
  return {
    id: backendSite.id || backendSite._id?.toString(),
    name: backendSite.nom || backendSite.name || '',
    address: backendSite.adresse || backendSite.address || '',
    coordinates: backendSite.coordinates || { lat: 0, lng: 0 },
    area: backendSite.area || 0,
    status: backendSite.status || 'planning',
    workStartDate: backendSite.workStartDate || new Date().toISOString(),
    workEndDate: backendSite.workEndDate,
    projectId: backendSite.projectId || '',
    budget: backendSite.budget || 0,
    progress: backendSite.progress || 0,
    createdAt: backendSite.createdAt || new Date().toISOString(),
    updatedAt: backendSite.updatedAt || new Date().toISOString(),
  };
};

// Create site data format for backend
const mapFrontendSiteToBackend = (site: Partial<Site>): any => {
  return {
    nom: site.name,
    adresse: site.address,
    localisation: site.address, // Using address as localisation
    budget: site.budget,
    area: site.area,
    status: site.status,
    progress: site.progress,
    workStartDate: site.workStartDate,
    workEndDate: site.workEndDate,
    projectId: site.projectId,
    coordinates: site.coordinates,
    estActif: true, // Required field for backend
  };
};

export interface SiteFilters {
  page?: number;
  limit?: number;
  nom?: string;
  localisation?: string;
  status?: string;
  estActif?: boolean;
  budgetMin?: number;
  budgetMax?: number;
}

export interface PaginatedSitesResponse {
  data: Site[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Get all sites with optional filters
export const fetchSites = async (filters?: SiteFilters): Promise<PaginatedSitesResponse> => {
  try {
    const params: Record<string, string> = {};
    
    if (filters?.page) params.page = filters.page.toString();
    if (filters?.limit) params.limit = filters.limit.toString();
    if (filters?.nom) params.nom = filters.nom;
    if (filters?.localisation) params.localisation = filters.localisation;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.estActif !== undefined) params.estActif = filters.estActif.toString();
    if (filters?.budgetMin) params.budgetMin = filters.budgetMin.toString();
    if (filters?.budgetMax) params.budgetMax = filters.budgetMax.toString();

    const response = await api.get('/gestion-sites', { params });
    
    // Map backend data to frontend format
    return {
      ...response.data,
      data: response.data.data.map(mapBackendSiteToFrontend),
    };
  } catch (error) {
    console.error('Error fetching sites:', error);
    throw error;
  }
};

// Get a single site by ID
export const fetchSiteById = async (id: string): Promise<Site> => {
  try {
    const response = await api.get(`/gestion-sites/${id}`);
    return mapBackendSiteToFrontend(response.data);
  } catch (error) {
    console.error('Error fetching site:', error);
    throw error;
  }
};

// Create a new site
export const createSite = async (site: Partial<Site>): Promise<Site> => {
  try {
    const response = await api.post('/gestion-sites', mapFrontendSiteToBackend(site));
    return mapBackendSiteToFrontend(response.data);
  } catch (error) {
    console.error('Error creating site:', error);
    throw error;
  }
};

// Update an existing site
export const updateSite = async (id: string, site: Partial<Site>): Promise<Site> => {
  try {
    const response = await api.put(`/gestion-sites/${id}`, mapFrontendSiteToBackend(site));
    return mapBackendSiteToFrontend(response.data);
  } catch (error) {
    console.error('Error updating site:', error);
    throw error;
  }
};

// Delete a site (hard delete - permanent removal from database)
export const deleteSite = async (id: string): Promise<void> => {
  try {
    await api.delete(`/gestion-sites/${id}`);
  } catch (error) {
    console.error('Error deleting site:', error);
    throw error;
  }
};

// Get site statistics
export const fetchSiteStatistics = async () => {
  try {
    const response = await api.get('/gestion-sites/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

// Get active sites only
export const fetchActiveSites = async (): Promise<Site[]> => {
  try {
    const response = await api.get('/gestion-sites/active');
    return response.data.map(mapBackendSiteToFrontend);
  } catch (error) {
    console.error('Error fetching active sites:', error);
    throw error;
  }
};
