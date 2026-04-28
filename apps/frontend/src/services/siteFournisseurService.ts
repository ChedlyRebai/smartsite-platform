// frontend/src/services/siteFournisseurService.ts
import axios from 'axios';

// Use relative paths that will be proxied to the correct backend ports
const SITE_API_URL = '/api/gestion-sites';
const FOURNISSEUR_API_URL = '/fournisseurs';

// Helper to extract MongoDB _id to string
const extractId = (data: any): string => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.$oid) return data.$oid;
  return String(data);
};

// Helper to extract coordinates (handles MongoDB format { "$numberDouble": "36.64" } or plain numbers)
const extractCoordinates = (data: any): { lat: number; lng: number } | undefined => {
  if (!data) return undefined;
  
  let lat: any = data.lat ?? data.latitude;
  let lng: any = data.lng ?? data.longitude;
  
  if (lat?.$numberDouble) lat = parseFloat(lat.$numberDouble);
  else if (lat?.$numberInt) lat = parseInt(lat.$numberInt);
  else if (typeof lat === 'string') lat = parseFloat(lat);
  
  if (lng?.$numberDouble) lng = parseFloat(lng.$numberDouble);
  else if (lng?.$numberInt) lng = parseInt(lng.$numberInt);
  else if (typeof lng === 'string') lng = parseFloat(lng);
  
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return undefined;
  }
  return { lat, lng };
};

const apiClient = axios.create({
  baseURL: SITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Site {
  _id: string;
  nom: string;
  adresse: string;
  localisation?: string;
  coordinates?: { lat: number; lng: number };
  budget: number;
  status: string;
  isActif: boolean;
  area?: number;
  progress?: number;
  workStartDate?: string;
  projectId?: string;
}

export interface Fournisseur {
  _id: string;
  nom: string;
  adresse: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  categories?: string[];
  coordinates?: { lat: number; lng: number };
  estActif: boolean;
}

// Transform site data from API format
const transformSite = (data: any): Site => {
  if (!data) return { _id: '', nom: '', adresse: '', budget: 0, status: '', isActif: true };
  const id = data._id || data.id || '';
  return {
    _id: extractId(id),
    nom: data.nom || data.name || '',
    adresse: data.adresse || data.address || '',
    localisation: data.localisation,
    coordinates: extractCoordinates(data.coordinates),
    budget: Number(data.budget) || 0,
    status: data.status || 'planning',
    isActif: data.isActif ?? data.estActif ?? true,
    area: data.area,
    progress: data.progress,
    workStartDate: data.workStartDate,
    projectId: data.projectId,
  };
};

// Transform fournisseur data from API format
const transformFournisseur = (data: any): Fournisseur => {
  if (!data) return { _id: '', nom: '', adresse: '', estActif: true };
  return {
    _id: extractId(data._id),
    nom: data.nom || '',
    adresse: data.adresse || '',
    ville: data.ville,
    pays: data.pays,
    telephone: data.telephone,
    email: data.email,
    categories: Array.isArray(data.categories) ? data.categories : [],
    coordinates: extractCoordinates(data.coordinates),
    estActif: data.estActif ?? true,
  };
};

export const siteService = {
  async getSites(): Promise<Site[]> {
    try {
      console.log('🔍 Fetching sites from:', SITE_API_URL);
      const response = await apiClient.get('?limit=100');
      console.log('🔍 Sites response:', response);
      console.log('🔍 Sites data:', response.data);
      
      let sites = [];
      if (Array.isArray(response.data)) {
        sites = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        sites = response.data.data;
      } else if (response.data && response.data.sites) {
        sites = response.data.sites;
      }
      
      console.log('🔍 Sites extracted:', sites);
      console.log('🔍 Sample site with coordinates:', sites.find(s => s.coordinates));
      return sites.map(transformSite);
    } catch (error: any) {
      console.error('❌ Erreur getSites:', error.message, error.response?.data);
      return [];
    }
  },

  async getSiteById(id: string): Promise<Site | null> {
    try {
      const response = await apiClient.get(`/${id}`);
      return transformSite(response.data);
    } catch (error) {
      console.error('Erreur getSiteById:', error);
      return null;
    }
  },

  async getActiveSites(): Promise<Site[]> {
    try {
      const response = await apiClient.get('/active');
      let sites = [];
      if (Array.isArray(response.data)) {
        sites = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        sites = response.data.data;
      }
      return sites.map(transformSite);
    } catch (error) {
      console.error('Erreur getActiveSites:', error);
      return [];
    }
  },
};

const fournisseurApiClient = axios.create({
  baseURL: FOURNISSEUR_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

fournisseurApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fournisseurService = {
  async getFournisseurs(): Promise<Fournisseur[]> {
    try {
      console.log('🔍 Fetching fournisseurs from:', FOURNISSEUR_API_URL);
      const response = await fournisseurApiClient.get('');
      console.log('🔍 Raw response:', response);
      console.log('🔍 Response data:', response.data);
      let fournisseurs = [];
      if (Array.isArray(response.data)) {
        fournisseurs = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        fournisseurs = response.data.data;
      }
      console.log('🔍 Fournisseurs extracted:', fournisseurs);
      console.log('🔍 Sample fournisseur with coordinates:', fournisseurs.find(f => f.coordinates));
      return fournisseurs.map(transformFournisseur);
    } catch (error: any) {
      console.error('❌ Erreur getFournisseurs:', error.message, error.response?.data);
      return [];
    }
  },

  async getFournisseurById(id: string): Promise<Fournisseur | null> {
    try {
      const response = await fournisseurApiClient.get(`/${id}`);
      return transformFournisseur(response.data);
    } catch (error) {
      console.error('Erreur getFournisseurById:', error);
      return null;
    }
  },

  async getFournisseursActifs(): Promise<Fournisseur[]> {
    try {
      const response = await fournisseurApiClient.get('?actif=true');
      let fournisseurs = [];
      if (Array.isArray(response.data)) {
        fournisseurs = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        fournisseurs = response.data.data;
      }
      return fournisseurs.map(transformFournisseur);
    } catch (error) {
      console.error('Erreur getFournisseursActifs:', error);
      return [];
    }
  },

  async getFournisseursParCategorie(categorie: string): Promise<Fournisseur[]> {
    try {
      const response = await fournisseurApiClient.get(`/categorie/${categorie}`);
      let fournisseurs = [];
      if (Array.isArray(response.data)) {
        fournisseurs = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        fournisseurs = response.data.data;
      }
      return fournisseurs.map(transformFournisseur);
    } catch (error) {
      console.error('Erreur getFournisseursParCategorie:', error);
      return [];
    }
  },
};

export default { siteService, fournisseurService };