import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL_MATERIALS || 'http://localhost:3002/api';

console.log('🔧 Materials API URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📡 Requête ${config.method?.toUpperCase()} ${config.url} - Token présent`);
    } else {
      console.warn(`⚠️ Requête ${config.method?.toUpperCase()} ${config.url} - Token manquant`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Réponse ${response.status} - ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ Erreur ${error.response.status}:`, error.response.data);
      if (error.response.status === 401) {
        console.error('🚫 Token invalide ou expiré');
      }
    } else if (error.request) {
      console.error('❌ Pas de réponse du serveur:', error.request);
    }
    return Promise.reject(error);
  }
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
  // Récupérer tous les matériaux
  async getMaterials(params?: MaterialQueryParams): Promise<{ data: Material[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await apiClient.get('/materials', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getMaterials:', error);
      throw error;
    }
  },

  // Créer un matériau
  async createMaterial(data: CreateMaterialData): Promise<Material> {
    try {
      console.log('📝 Création matériau:', data);
      const response = await apiClient.post('/materials', data);
      console.log('✅ Matériau créé:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur createMaterial:', error);
      throw error;
    }
  },

  // Récupérer un matériau par ID
  async getMaterial(id: string): Promise<Material> {
    try {
      const response = await apiClient.get(`/materials/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getMaterial:', error);
      throw error;
    }
  },

  // Mettre à jour un matériau
  async updateMaterial(id: string, data: Partial<CreateMaterialData>): Promise<Material> {
    try {
      console.log('📝 Mise à jour matériau:', id, data);
      const response = await apiClient.put(`/materials/${id}`, data);
      console.log('✅ Matériau mis à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur updateMaterial:', error);
      throw error;
    }
  },

  // Supprimer un matériau
  async deleteMaterial(id: string): Promise<void> {
    try {
      await apiClient.delete(`/materials/${id}`);
      console.log('✅ Matériau supprimé:', id);
    } catch (error) {
      console.error('Erreur deleteMaterial:', error);
      throw error;
    }
  },

  // Mettre à jour le stock
  async updateStock(id: string, data: UpdateStockData): Promise<{ material: Material; movement: any }> {
    try {
      console.log('📦 Mise à jour stock:', id, data);
      const response = await apiClient.put(`/materials/${id}/stock`, data);
      console.log('✅ Stock mis à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur updateStock:', error);
      throw error;
    }
  },

  // Récupérer les alertes
  async getAlerts(): Promise<any[]> {
    try {
      const response = await apiClient.get('/materials/alerts');
      return response.data;
    } catch (error) {
      console.error('Erreur getAlerts:', error);
      throw error;
    }
  },

  // Récupérer les statistiques du dashboard
  async getDashboard(): Promise<any> {
    try {
      const response = await apiClient.get('/materials/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur getDashboard:', error);
      throw error;
    }
  },

  // Récupérer les prévisions
  async getForecast(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/materials/forecast/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getForecast:', error);
      throw error;
    }
  },

  // Récupérer les mouvements
  async getMovements(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/materials/movements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getMovements:', error);
      throw error;
    }
  },

  // Commander un matériau
  async reorderMaterial(id: string): Promise<any> {
    try {
      console.log('🔄 Commande matériau:', id);
      const response = await apiClient.post(`/materials/${id}/reorder`);
      console.log('✅ Commande créée:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur reorderMaterial:', error);
      throw error;
    }
  },

  // Rechercher par code-barres
  async findByBarcode(barcode: string): Promise<Material> {
    try {
      const response = await apiClient.get(`/materials/search/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur findByBarcode:', error);
      throw error;
    }
  },

  // Rechercher par QR code
  async findByQRCode(qrCode: string): Promise<Material> {
    try {
      const response = await apiClient.get(`/materials/search/qrcode/${encodeURIComponent(qrCode)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur findByQRCode:', error);
      throw error;
    }
  },

  // Scanner QR code (image)
  async scanQRCode(file: File): Promise<{ success: boolean; qrData: string; material: Material | null }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/materials/scan-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur scanQRCode:', error);
      throw error;
    }
  },

  // Scanner QR code (texte)
  async scanQRCodeText(qrCode: string): Promise<{ success: boolean; qrData: string; material: Material | null }> {
    try {
      const response = await apiClient.post('/materials/scan-qr-text', { qrCode });
      return response.data;
    } catch (error) {
      console.error('Erreur scanQRCodeText:', error);
      throw error;
    }
  },

  // Générer QR code
  async generateQRCode(id: string): Promise<{ qrCode: string; material: Material }> {
    try {
      console.log('🏷️ Génération QR code pour:', id);
      const response = await apiClient.post(`/materials/${id}/generate-qr`);
      console.log('✅ QR code généré');
      return response.data;
    } catch (error) {
      console.error('Erreur generateQRCode:', error);
      throw error;
    }
  },

  // Matériaux en stock bas
  async getLowStockMaterials(): Promise<Material[]> {
    try {
      const response = await apiClient.get('/materials/low-stock');
      return response.data;
    } catch (error) {
      console.error('Erreur getLowStockMaterials:', error);
      throw error;
    }
  },

  // Matériaux proches d'expiration
  async getExpiringMaterials(): Promise<Material[]> {
    try {
      const response = await apiClient.get('/materials/expiring');
      return response.data;
    } catch (error) {
      console.error('Erreur getExpiringMaterials:', error);
      throw error;
    }
  },

  // Création en masse
  async bulkCreate(materials: CreateMaterialData[]): Promise<Material[]> {
    try {
      console.log('📦 Création en masse:', materials.length, 'matériaux');
      const response = await apiClient.post('/materials/bulk', materials);
      console.log('✅ Création en masse réussie');
      return response.data;
    } catch (error) {
      console.error('Erreur bulkCreate:', error);
      throw error;
    }
  }
};

export default materialService;