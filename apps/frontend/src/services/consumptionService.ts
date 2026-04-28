import axios from 'axios';

const API_URL = '/api/site-consumption';
const ANOMALY_API_URL = '/api/consumption';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const anomalyApiClient = axios.create({
  baseURL: ANOMALY_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

anomalyApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MaterialRequirement {
  _id: string;
  siteId: string;
  siteName?: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  materialCategory: string;
  materialUnit: string;
  initialQuantity: number;
  consumedQuantity: number;
  remainingQuantity: number;
  progressPercentage: number;
  lastUpdated: string;
  notes?: string;
}

export interface SiteConsumptionStats {
  siteId: string;
  siteName: string;
  totalInitialQuantity: number;
  totalConsumedQuantity: number;
  totalRemainingQuantity: number;
  overallProgress: number;
  materialsCount: number;
  materials: MaterialRequirement[];
}

export interface CreateRequirementData {
  siteId: string;
  materialId: string;
  initialQuantity: number;
  notes?: string;
}

export interface UpdateConsumptionData {
  consumedQuantity: number;
  notes?: string;
}

export interface ConsumptionRecord {
  _id: string;
  materialId: string;
  siteId: string;
  date: string;
  quantityUsed: number;
  expectedConsumption: number;
  anomalyScore: number;
  anomalyType: 'vol' | 'probleme' | 'normal';
  anomalyReason: string;
  emailSent: boolean;
  emailSentAt?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnomalyResult {
  consumption: ConsumptionRecord;
  anomalyType: 'VOL_POSSIBLE' | 'CHANTIER_BLOQUE' | 'NORMAL';
  anomalyScore: number;
  message: string;
  severity: 'critical' | 'warning' | 'normal';
}

export interface CreateConsumptionData {
  materialId: string;
  siteId: string;
  date: string;
  quantityUsed: number;
  expectedConsumption: number;
}

const consumptionService = {
  async createRequirement(data: CreateRequirementData): Promise<MaterialRequirement> {
    try {
      const response = await apiClient.post('', data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur createRequirement:', error.message);
      throw error;
    }
  },

  async updateConsumption(
    siteId: string,
    materialId: string,
    data: UpdateConsumptionData
  ): Promise<MaterialRequirement> {
    try {
      const response = await apiClient.put(`/${siteId}/${materialId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur updateConsumption:', error.message);
      throw error;
    }
  },

  async addConsumption(
    siteId: string,
    materialId: string,
    quantity: number,
    notes?: string
  ): Promise<MaterialRequirement> {
    try {
      const response = await apiClient.post(`/${siteId}/${materialId}/add`, { quantity, notes });
      return response.data;
    } catch (error: any) {
      console.error('Erreur addConsumption:', error.message);
      throw error;
    }
  },

  async getRequirementsBySite(siteId: string): Promise<MaterialRequirement[]> {
    try {
      const response = await apiClient.get(`/site/${siteId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur getRequirementsBySite:', error.message);
      return [];
    }
  },

  async getSiteStats(siteId: string, siteName?: string): Promise<SiteConsumptionStats | null> {
    try {
      const response = await apiClient.get(`/site/${siteId}/stats`, {
        params: { siteName }
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur getSiteStats:', error.message);
      return null;
    }
  },

  async getAllRequirements(): Promise<MaterialRequirement[]> {
    try {
      const response = await apiClient.get('/all');
      return response.data;
    } catch (error: any) {
      console.error('Erreur getAllRequirements:', error.message);
      return [];
    }
  },

  async getHighConsumptionMaterials(threshold: number = 80): Promise<MaterialRequirement[]> {
    try {
      const response = await apiClient.get('/high-consumption', {
        params: { threshold }
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur getHighConsumptionMaterials:', error.message);
      return [];
    }
  },

  async deleteRequirement(siteId: string, materialId: string): Promise<void> {
    try {
      await apiClient.delete(`/${siteId}/${materialId}`);
    } catch (error: any) {
      console.error('Erreur deleteRequirement:', error.message);
      throw error;
    }
  },

  async getRequirement(siteId: string, materialId: string): Promise<MaterialRequirement | null> {
    try {
      const response = await apiClient.get(`/${siteId}/${materialId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur getRequirement:', error.message);
      return null;
    }
  },

  async recordConsumption(data: CreateConsumptionData): Promise<AnomalyResult> {
    const response = await anomalyApiClient.post('/record', data);
    return response.data.data;
  },

  async getBySite(siteId: string, startDate?: string, endDate?: string): Promise<ConsumptionRecord[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    const response = await anomalyApiClient.get(`/site/${siteId}${query ? `?${query}` : ''}`);
    return response.data.data;
  },

  async getByMaterial(materialId: string, startDate?: string, endDate?: string): Promise<ConsumptionRecord[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    const response = await anomalyApiClient.get(`/material/${materialId}${query ? `?${query}` : ''}`);
    return response.data.data;
  },

  async getActiveAnomalies(): Promise<ConsumptionRecord[]> {
    const response = await anomalyApiClient.get('/anomalies/active');
    return response.data.data;
  },

  async getAnomalyStats(startDate: string, endDate: string): Promise<any[]> {
    const response = await anomalyApiClient.get(`/anomalies/stats?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data;
  },

  async resendAlert(recordId: string): Promise<void> {
    await anomalyApiClient.post(`/${recordId}/resend-alert`);
  },
};

export default consumptionService;
