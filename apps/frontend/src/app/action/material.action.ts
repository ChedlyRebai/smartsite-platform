import axios from 'axios';

// Base URL pour le microservice materials (port 3006)
const api = axios.create({
  baseURL: 'http://localhost:3006',
  timeout: 10000,
});

// Récupération du token depuis Zustand/localStorage
function getAuthToken(): string | null {
  const directToken = localStorage.getItem('access_token');
  if (directToken) return directToken;

  const persisted = localStorage.getItem('smartsite-auth');
  if (!persisted) return null;

  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
}

// Interceptor Authorization
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Material {
  _id: string;
  code: string;
  name: string;
  unit: 'bag' | 'kg' | 'm²' | 'ton' | 'piece';
  estimated_price: number;
  alert_threshold: number;
  supplier_id: string;
  supplier?: {
    _id: string;
    name: string;
    code: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  _id: string;
  name: string;
  code: string;
  email: string;
}

export const getMaterials = async (includeInactive = false): Promise<Material[]> => {
  const response = await api.get(`/materials?includeInactive=${includeInactive}`);
  return response.data;
};

export const getMaterialById = async (id: string): Promise<Material> => {
  const response = await api.get(`/materials/${id}`);
  return response.data;
};

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  const response = await api.get('/materials/suppliers/active');
  return response.data;
};

export const createMaterial = async (materialData: Partial<Material>): Promise<Material> => {
  const response = await api.post('/materials', materialData);
  return response.data;
};

export const updateMaterial = async (id: string, materialData: Partial<Material>): Promise<Material> => {
  const response = await api.patch(`/materials/${id}`, materialData);
  return response.data;
};

export const deleteMaterial = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/materials/${id}`);
  return response.data;
};

export const reactivateMaterial = async (id: string): Promise<Material> => {
  const response = await api.post(`/materials/${id}/reactivate`);
  return response.data;
};
