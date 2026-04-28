import axios from 'axios';

const API_URL = '/api/flows';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export enum FlowType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  RETURN = 'RETURN',
  RESERVE = 'RESERVE',
}

export enum AnomalyType {
  NONE = 'NONE',
  EXCESSIVE_OUT = 'EXCESSIVE_OUT',
  EXCESSIVE_IN = 'EXCESSIVE_IN',
  UNEXPECTED_MOVEMENT = 'UNEXPECTED_MOVEMENT',
  BELOW_SAFETY_STOCK = 'BELOW_SAFETY_STOCK',
}

export interface MaterialFlow {
  _id: string;
  siteId: string;
  materialId: string;
  type: FlowType;
  quantity: number;
  timestamp: Date;
  userId: string;
  previousStock: number;
  newStock: number;
  reason?: string;
  anomalyDetected: AnomalyType;
  emailSent: boolean;
  anomalyMessage?: string;
  projectId?: string;
  reference?: string;
  materialName?: string;
  siteName?: string;
  userName?: string;
}

export interface FlowAggregateStats {
  totalEntries: number;
  totalExits: number;
  netFlow: number;
  totalAnomalies: number;
  lastMovement: Date | null;
  breakdownByType: Array<{ _id: FlowType; totalQuantity: number; count: number }>;
}

export interface CreateMaterialFlowDto {
  siteId: string;
  materialId: string;
  type: FlowType;
  quantity: number;
  reason?: string;
  projectId?: string;
  reference?: string;
}

export interface FlowQueryParams {
  siteId?: string;
  materialId?: string;
  type?: FlowType;
  anomalyDetected?: AnomalyType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

const materialFlowService = {
  async recordMovement(data: CreateMaterialFlowDto): Promise<MaterialFlow> {
    try {
      const response = await apiClient.post('', data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur recordMovement:', error.response?.data || error.message);
      throw error;
    }
  },

  async getFlows(params?: FlowQueryParams): Promise<{ data: MaterialFlow[]; total: number }> {
    try {
      const response = await apiClient.get('', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getFlows:', error);
      throw error;
    }
  },

  async getAnomalies(): Promise<MaterialFlow[]> {
    try {
      const response = await apiClient.get('/anomalies');
      return response.data;
    } catch (error) {
      console.error('Erreur getAnomalies:', error);
      return [];
    }
  },

  async getFlowStatistics(materialId: string, siteId: string, days: number = 30): Promise<any> {
    try {
      const response = await apiClient.get(`/stats/${materialId}/${siteId}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getFlowStatistics:', error);
      return null;
    }
  },

  async getAggregateStats(materialId: string, siteId?: string): Promise<FlowAggregateStats> {
    try {
      const params = new URLSearchParams();
      if (siteId) params.append('siteId', siteId);
      const response = await apiClient.get(`/aggregate/${materialId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getAggregateStats:', error);
      throw error;
    }
  },

  async getEnrichedFlows(params: {
    materialId?: string;
    siteId?: string;
    type?: FlowType;
    anomalyDetected?: AnomalyType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: MaterialFlow[]; total: number }> {
    try {
      const response = await apiClient.get('/enriched', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getEnrichedFlows:', error);
      throw error;
    }
  },

  async recordEntry(materialId: string, siteId: string, quantity: number, reason?: string): Promise<MaterialFlow> {
    return this.recordMovement({
      siteId,
      materialId,
      type: FlowType.IN,
      quantity,
      reason: reason || 'Entrée stock',
    });
  },

  async recordExit(materialId: string, siteId: string, quantity: number, reason?: string, projectId?: string): Promise<MaterialFlow> {
    return this.recordMovement({
      siteId,
      materialId,
      type: FlowType.OUT,
      quantity,
      reason: reason || 'Sortie stock',
      projectId,
    });
  },
};

export default materialFlowService;