import axios from 'axios';

const API_URL = '/api/materials';

export interface AutoOrderRecommendation {
  materialId: string;
  materialName: string;
  materialCode: string;
  currentStock: number;
  consumptionRate: number;
  predictedHoursToOutOfStock: number;
  autoSuggestOrder: boolean;
  recommendedQuantity: number;
  leadTimeDays: number;
  safetyStock: number;
  urgencyLevel: 'critical' | 'warning' | 'info';
  message: string;
  reason: string;
}

export interface SupplierSuggestion {
  supplierId: string;
  supplierName: string;
  estimatedDeliveryDays: number;
  price?: number;
  isPreferred: boolean;
}

const intelligentOrderService = {
  async getAutoOrderRecommendations(siteId?: string): Promise<AutoOrderRecommendation[]> {
    try {
      const url = siteId
        ? `${API_URL}/auto-order/recommendations?siteId=${siteId}`
        : `${API_URL}/auto-order/recommendations`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur getAutoOrderRecommendations:', error);
      return [];
    }
  },

  async checkAutoOrder(materialId: string): Promise<AutoOrderRecommendation | null> {
    try {
      const response = await axios.get(`${API_URL}/${materialId}/auto-order`);
      return response.data;
    } catch (error) {
      console.error('Erreur checkAutoOrder:', error);
      return null;
    }
  },

  async getSupplierSuggestions(materialId: string): Promise<SupplierSuggestion[]> {
    try {
      const response = await axios.get(`${API_URL}/${materialId}/suppliers`);
      return response.data;
    } catch (error) {
      console.error('Erreur getSupplierSuggestions:', error);
      return [];
    }
  },
};

export default intelligentOrderService;
