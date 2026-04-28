import axios from 'axios';

const API_URL = '/api/materials';
const SITE_API_URL = '/api/site-materials';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes pour les opérations ML
  headers: {
    'Content-Type': 'application/json',
  },
});

const siteApiClient = axios.create({
  baseURL: SITE_API_URL,
  timeout: 30000, // 30 secondes pour les opérations ML
  headers: {
    'Content-Type': 'application/json',
  },
});

siteApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Material {
  _id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  qualityGrade?: number;
  location?: string;
  siteId?: string;
  siteName?: string;
  siteCoordinates?: { lat: number; lng: number };
  barcode?: string;
  qrCode?: string;
  manufacturer?: string;
  expiryDate?: string;
  lastOrdered?: string;
  lastReceived?: string;
  reservedQuantity?: number;
  damagedQuantity?: number;
  status: 'active' | 'discontinued' | 'obsolete';
  specifications?: Record<string, any>;
  assignedProjects?: string[];
  reorderCount?: number;
  lastCountDate?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMaterialData {
  name: string;
  code: string;
  category: string;
  unit: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  location?: string;
  manufacturer?: string;
  expiryDate?: string;
  qualityGrade?: number;
  specifications?: Record<string, any>;
  assignedProjects?: string[];
}

export interface UpdateStockData {
  quantity: number;
  operation: 'add' | 'remove' | 'reserve' | 'damage';
  reason?: string;
  projectId?: string;
}

export interface MaterialQueryParams {
  search?: string;
  category?: string;
  status?: string;
  location?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const materialService = {
  async getMaterials(params?: MaterialQueryParams): Promise<{ data: Material[]; total: number; page: number; totalPages: number } | Material[]> {
    try {
      console.log('📡 materialService.getMaterials called with params:', params);
      const response = await apiClient.get('', { params });
      console.log('📡 Raw response:', response);
      console.log('📡 Response data:', response.data);
      
      // Handle both paginated and array responses
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      return data;
    } catch (error: any) {
      console.error('Erreur getMaterials:', error.message, error.response?.data);
      throw error;
    }
  },

  async getMaterialById(id: string): Promise<Material> {
    try {
      const response = await apiClient.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur getMaterialById:', error.message);
      throw error;
    }
  },

  async getMaterialsWithSites(): Promise<Material[]> {
    try {
      const response = await siteApiClient.get('/all-with-sites');
      return response.data;
    } catch (error: any) {
      console.error('Erreur getMaterialsWithSites:', error.message);
      throw error;
    }
  },

  async createMaterial(data: CreateMaterialData): Promise<Material> {
    try {
      const response = await apiClient.post('', data);
      return response.data;
    } catch (error) {
      console.error('Erreur createMaterial:', error);
      throw error;
    }
  },

  async createMaterialWithSite(data: CreateMaterialData, siteId: string): Promise<Material> {
    try {
      const response = await siteApiClient.post('', { material: data, siteId });
      return response.data;
    } catch (error: any) {
      console.error('Erreur createMaterialWithSite:', error.message, error.response?.data);
      throw error;
    }
  },

  async deleteMaterial(id: string): Promise<void> {
    try {
      await apiClient.delete(`/${id}`);
    } catch (error) {
      console.error('Erreur deleteMaterial:', error);
      throw error;
    }
  },

  async updateMaterial(id: string, data: Partial<CreateMaterialData>): Promise<Material> {
    try {
      const response = await apiClient.put(`/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur updateMaterial:', error);
      throw error;
    }
  },

  async assignMaterialToSite(materialId: string, siteId: string): Promise<Material> {
    try {
      const response = await siteApiClient.post(`/${materialId}/assign/${siteId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur assignMaterialToSite:', error.message, error.response?.data);
      throw error;
    }
  },

  async updateStock(id: string, data: UpdateStockData): Promise<Material> {
    try {
      const response = await apiClient.put(`/materials/${id}/stock`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur updateStock:', error);
      throw error;
    }
  },

  async getAlerts(): Promise<any[]> {
    try {
      const response = await apiClient.get('/alerts');
      return response.data;
    } catch (error: any) {
      console.error('Erreur getAlerts:', error.message);
      throw error;
    }
  },

  async getDashboard(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error: any) {
      console.error('Erreur getDashboard:', error.message);
      throw error;
    }
  },

  async getForecast(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/forecast/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getForecast:', error);
      throw error;
    }
  },

  async getMovements(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/movements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getMovements:', error);
      throw error;
    }
  },

  async reorderMaterial(id: string): Promise<any> {
    try {
      const response = await apiClient.post(`/materials/${id}/reorder`);
      return response.data;
    } catch (error) {
      console.error('Erreur reorderMaterial:', error);
      throw error;
    }
  },

  async findByBarcode(barcode: string): Promise<Material> {
    try {
      const response = await apiClient.get(`/search/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur findByBarcode:', error);
      throw error;
    }
  },

  async findByQRCode(qrCode: string): Promise<Material> {
    try {
      const response = await apiClient.get(`/search/qrcode/${encodeURIComponent(qrCode)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur findByQRCode:', error);
      throw error;
    }
  },

  async scanQRCode(file: File): Promise<{ success: boolean; qrData: string; material: Material | null }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/scan-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur scanQRCode:', error);
      throw error;
    }
  },

  async scanQRCodeText(qrCode: string): Promise<{ success: boolean; qrData: string; material: Material | null }> {
    try {
      const response = await apiClient.post('/scan-qr-text', { qrCode });
      return response.data;
    } catch (error) {
      console.error('Erreur scanQRCodeText:', error);
      throw error;
    }
  },

  async generateQRCode(id: string): Promise<{ qrCode: string; material: Material }> {
    try {
      const response = await apiClient.post(`/${id}/generate-qr`);
      return response.data;
    } catch (error) {
      console.error('Erreur generateQRCode:', error);
      throw error;
    }
  },

  async getLowStockMaterials(): Promise<Material[]> {
    try {
      const response = await apiClient.get('/low-stock');
      return response.data;
    } catch (error) {
      console.error('Erreur getLowStockMaterials:', error);
      throw error;
    }
  },

  async getExpiringMaterials(days: number = 30): Promise<Material[]> {
    try {
      const response = await apiClient.get(`/expiring?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getExpiringMaterials:', error);
      throw error;
    }
  },

  async bulkCreate(materials: CreateMaterialData[]): Promise<Material[]> {
    try {
      const response = await apiClient.post('/materials/bulk', materials);
      return response.data;
    } catch (error) {
      console.error('Erreur bulkCreate:', error);
      throw error;
    }
  },

  async importFromExcel(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur importFromExcel:', error);
      throw error;
    }
  },

  async exportToExcel(materialIds?: string[]): Promise<Blob> {
    try {
      const response = await apiClient.post('/export/excel', 
        materialIds || [], 
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur exportToExcel:', error);
      throw error;
    }
  },

  async exportToPDF(materialIds?: string[]): Promise<Blob> {
    try {
      const response = await apiClient.post('/export/pdf', 
        materialIds || [], 
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur exportToPDF:', error);
      throw error;
    }
  },

  async downloadFile(blob: Blob, filename: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // ========== AI STOCK PREDICTION ==========
  async getStockPrediction(materialId: string): Promise<{
    materialId: string;
    materialName: string;
    currentStock: number;
    predictedStock: number;
    consumptionRate: number;
    minimumStock: number;
    reorderPoint: number;
    maximumStock: number;
    hoursToLowStock: number;
    hoursToOutOfStock: number;
    status: 'safe' | 'warning' | 'critical';
    recommendedOrderQuantity: number;
    predictionModelUsed: boolean;
    confidence: number;
    simulationData: { hour: number; stock: number }[];
    message: string;
  }> {
    try {
      // Utiliser un timeout plus long pour les prédictions ML (60 secondes)
      const response = await apiClient.get(`/${materialId}/prediction`, {
        timeout: 60000
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur getStockPrediction:', error);
      
      // Si timeout, retourner une prédiction par défaut
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn(`⚠️ Timeout pour la prédiction de ${materialId}, utilisation de valeurs par défaut`);
        
        // Récupérer les infos de base du matériau
        try {
          const material = await this.getMaterialById(materialId);
          return {
            materialId: material._id,
            materialName: material.name,
            currentStock: material.quantity,
            predictedStock: material.quantity,
            consumptionRate: 0,
            minimumStock: material.minimumStock || 10,
            reorderPoint: material.reorderPoint || material.stockMinimum || 20,
            maximumStock: material.maximumStock || 100,
            hoursToLowStock: 999,
            hoursToOutOfStock: 999,
            status: material.quantity > (material.stockMinimum || 20) ? 'safe' : 'warning',
            recommendedOrderQuantity: 0,
            predictionModelUsed: false,
            confidence: 0,
            simulationData: [],
            message: 'Prédiction non disponible (timeout)',
          };
        } catch (fallbackError) {
          throw error; // Si même le fallback échoue, propager l'erreur originale
        }
      }
      
      throw error;
    }
  },

  async getAllPredictions(): Promise<any[]> {
    try {
      const response = await apiClient.get('/prediction/all');
      return response.data;
    } catch (error) {
      console.error('Erreur getAllPredictions:', error);
      throw error;
    }
  },

  // ========== ML TRAINING - UPLOAD CSV ==========
  async uploadHistoricalData(materialId: string, file: File): Promise<{
    success: boolean;
    message: string;
    data: { totalRecords: number; dateRange: { start: string; end: string }; averageConsumption: number };
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/${materialId}/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur uploadHistoricalData:', error);
      throw error;
    }
  },

  async trainModel(materialId: string): Promise<{
    success: boolean;
    message: string;
    trainingResult: { epochs: number; loss: number; accuracy: number; sampleSize: number; trainedAt: Date };
  }> {
    try {
      const response = await apiClient.post(`/${materialId}/train`);
      return response.data;
    } catch (error) {
      console.error('Erreur trainModel:', error);
      throw error;
    }
  },

  async predictStock(materialId: string, hours: number = 24): Promise<{
    materialId: string;
    materialName: string;
    currentStock: number;
    predictedStock: number;
    hoursToLowStock: number;
    hoursToOutOfStock: number;
    consumptionRate: number;
    modelTrained: boolean;
    confidence: number;
    status: 'safe' | 'warning' | 'critical';
    trainingDataAvailable: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.get(`/${materialId}/predict?hours=${hours}`);
      return response.data;
    } catch (error) {
      console.error('Erreur predictStock:', error);
      throw error;
    }
  },

  async getModelInfo(materialId: string): Promise<{
    materialId: string;
    modelTrained: boolean;
    hasHistoricalData: boolean;
    sampleSize?: number;
    trainedAt?: Date;
  }> {
    try {
      const response = await apiClient.get(`/${materialId}/model-info`);
      return response.data;
    } catch (error) {
      console.error('Erreur getModelInfo:', error);
      throw error;
    }
  },

  // ========== ADVANCED PREDICTION ==========
  async predictStockAdvanced(
    materialId: string,
    features: { hourOfDay: number; dayOfWeek: number; siteActivityLevel: number; weather: string; projectType: string }
  ): Promise<{
    materialId: string;
    materialName: string;
    currentStock: number;
    predictedStock: number;
    hoursToOutOfStock: number;
    consumptionRate: number;
    modelTrained: boolean;
    confidence: number;
    status: 'safe' | 'warning' | 'critical';
    recommendedOrderQuantity: number;
    estimatedRuptureDate: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`/${materialId}/predict-advanced`, features);
      return response.data;
    } catch (error) {
      console.error('Erreur predictStockAdvanced:', error);
      throw error;
    }
  },
  // ========== SMART SCORE ==========
 /* async calculateMultipleSitesScores(sites: Array<{ id: string; name: string; progress: number }>): Promise<any[]> {
    try {
      const response = await apiClient.post('/smart-score/sites', { sites });
      return response.data;
    } catch (error) {
      console.error('Erreur calculateMultipleSitesScores:', error);
      throw error;
    }
  },

  async calculateSiteSmartScore(siteId: string, siteName: string, progress: number): Promise<any> {
    try {
      const response = await apiClient.post('/smart-score/site', { siteId, siteName, progress });
      return response.data;
    } catch (error) {
      console.error('Erreur calculateSiteSmartScore:', error);
      throw error;
    }
  },
*/
  // ✅ Nouvelle méthode pour récupérer toutes les prédictions IA
  /*async getAllPredictions(): Promise<any[]> {
    try {
      const response = await apiClient.get('/predictions');
      return response.data;
    } catch (error) {
      console.error('Erreur getAllPredictions:', error);
      throw error;
    }
  },*/

};

export default materialService;