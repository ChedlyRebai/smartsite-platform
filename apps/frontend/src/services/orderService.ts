// frontend/src/services/orderService.ts
import axios from 'axios';

// The backend materials service on port 3002 has orders controller at /api/orders
// The vite proxy handles /api/orders -> localhost:3002/api/orders
const API_URL = '/api/orders';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MaterialOrder {
  _id: string;
  orderNumber: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  destinationSiteId: string;
  destinationSiteName: string;
  destinationAddress: string;
  destinationCoordinates: { lat: number; lng: number };
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  supplierCoordinates: { lat: number; lng: number };
  estimatedDurationMinutes: number;
  remainingTimeMinutes: number;
  currentPosition: { lat: number; lng: number };
  progress: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  notes?: string;
  createdAt: string;
  // Champs paiement
  paymentId?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface CreateOrderData {
  materialId: string;
  quantity: number;
  destinationSiteId: string;
  supplierId: string;
  estimatedDurationMinutes: number;
  notes?: string;
}

export interface PaymentStatusResponse {
  hasPayment: boolean;
  paymentId?: string;
  amount?: number;
  method?: string;
  status?: string;
  error?: string;
}

export interface PaymentProcessResponse {
  success: boolean;
  payment: {
    paymentId: string;
    status: string;
    amount: number;
    paymentMethod: string;
    message: string;
    clientSecret?: string;
  };
  message: string;
}

export interface PaymentConfirmResponse {
  success: boolean;
  payment: any;
  message: string;
}

export interface InvoiceResponse {
  numeroFacture: string;
  paymentId: string;
  siteId: string;
  siteNom: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  description?: string;
  pdfPath?: string;
}

// Types pour le suivi global
export interface GlobalTrackingStats {
  totalOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredToday: number;
  delayedOrders: number;
  activeTrucks: number;
  totalDistance: number;
  averageDeliveryTime: number;
}

export interface OrderTrackingOverview {
  orderId: string;
  orderNumber: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  status: string;
  progress: number;
  currentPosition: { lat: number; lng: number };
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  supplierName: string;
  siteName: string;
  remainingTimeMinutes: number;
  eta: Date;
  route: {
    distance: number;
    duration: number;
    polyline: string;
  };
  createdAt: Date;
  actualDeparture?: Date;
  estimatedArrival?: Date;
}

export interface Site {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  activeOrders: number;
}

export interface Supplier {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  activeOrders: number;
}

export interface GlobalTrackingResponse {
  stats: GlobalTrackingStats;
  orders: OrderTrackingOverview[];
  sites: Site[];
  suppliers: Supplier[];
}

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<MaterialOrder> {
    try {
      console.log('📤 === FRONTEND orderService.createOrder ===');
      console.log('📤 data:', JSON.stringify(data));
      console.log('📤 materialId:', data.materialId);
      console.log('📤 typeof materialId:', typeof data.materialId);
      console.log('📤 materialId length:', data.materialId?.length);
      const response = await apiClient.post('', data);
      console.log('✅ Order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur createOrder:', error.message);
      throw error;
    }
  },

  async getAllOrders(filters?: { status?: string; siteId?: string; supplierId?: string }): Promise<MaterialOrder[]> {
    try {
      const response = await apiClient.get('', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Erreur getAllOrders:', error);
      throw error;
    }
  },

  async getActiveOrders(): Promise<MaterialOrder[]> {
    try {
      const response = await apiClient.get('/active');
      return response.data;
    } catch (error) {
      console.error('Erreur getActiveOrders:', error);
      throw error;
    }
  },

  async getOrderById(orderId: string): Promise<MaterialOrder> {
    try {
      const response = await apiClient.get(`/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getOrderById:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, updateData: { status: string; currentPosition?: { lat: number; lng: number; progress?: number } }): Promise<MaterialOrder> {
    try {
      console.log('📤 Updating order status:', orderId, updateData);
      const response = await apiClient.put(`/${orderId}/status`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur updateOrderStatus:', error.message);
      throw error;
    }
  },

  async updateOrderProgress(orderId: string, progressData: { lat: number; lng: number; progress: number; remainingTime?: number }): Promise<MaterialOrder> {
    try {
      const response = await apiClient.put(`/${orderId}/progress`, { 
        currentPosition: { 
          lat: progressData.lat, 
          lng: progressData.lng,
          progress: progressData.progress,
          remainingTime: progressData.remainingTime
        } 
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur updateOrderProgress:', error.message);
      throw error;
    }
  },

  async simulateDelivery(orderId: string): Promise<MaterialOrder> {
    try {
      const response = await apiClient.post(`/${orderId}/simulate`);
      return response.data;
    } catch (error) {
      console.error('Erreur simulateDelivery:', error);
      throw error;
    }
  },

  // ========== MÉTHODES PAIEMENT ==========

  /**
   * Traiter le paiement d'une commande
   * @param orderId - ID de la commande
   * @param paymentMethod - Méthode de paiement ('cash' ou 'card')
   * @returns Résultat du paiement avec clientSecret pour Stripe si nécessaire
   */
  async processPayment(orderId: string, paymentMethod: 'cash' | 'card'): Promise<PaymentProcessResponse> {
    try {
      console.log(`💳 Processing payment for order ${orderId} with method ${paymentMethod}`);
      const response = await apiClient.post(`/${orderId}/payment`, { paymentMethod });
      console.log('✅ Payment processed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur processPayment:', error.message);
      console.error('❌ Response data:', error.response?.data);
      throw error;
    }
  },

  /**
   * Confirmer un paiement par carte après succès Stripe
   * @param orderId - ID de la commande
   * @param paymentIntentId - ID du PaymentIntent Stripe
   * @returns Résultat de la confirmation
   */
  async confirmCardPayment(orderId: string, paymentIntentId: string): Promise<PaymentConfirmResponse> {
    try {
      console.log(`✅ Confirming card payment for order ${orderId}`);
      const response = await apiClient.post(`/${orderId}/payment/confirm`, { paymentIntentId });
      console.log('✅ Payment confirmed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur confirmCardPayment:', error.message);
      console.error('❌ Response data:', error.response?.data);
      throw error;
    }
  },

  /**
   * Récupérer le statut du paiement d'une commande
   * @param orderId - ID de la commande
   * @returns Statut du paiement
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      console.log(`📊 Getting payment status for order ${orderId}`);
      const response = await apiClient.get(`/${orderId}/payment/status`);
      console.log('📊 Payment status:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur getPaymentStatus:', error.message);
      // Retourner un objet par défaut en cas d'erreur pour éviter le crash
      return { hasPayment: false, error: error.message };
    }
  },

  /**
   * Vérifier si une commande a été payée
   * @param orderId - ID de la commande
   * @returns true si la commande est payée
   */
  async isOrderPaid(orderId: string): Promise<boolean> {
    try {
      const status = await this.getPaymentStatus(orderId);
      return status.hasPayment && status.status === 'completed';
    } catch (error) {
      console.error('❌ Erreur isOrderPaid:', error);
      return false;
    }
  },

  /**
   * Récupérer le montant du paiement d'une commande
   * @param orderId - ID de la commande
   * @returns Montant du paiement ou 0
   */
  async getPaymentAmount(orderId: string): Promise<number> {
    try {
      const order = await this.getOrderById(orderId);
      return order.paymentAmount || 0;
    } catch (error) {
      console.error('❌ Erreur getPaymentAmount:', error);
      return 0;
    }
  },

  // ========== MÉTHODE FACTURE ==========

  /**
   * Générer une facture pour une commande
   * @param orderId - ID de la commande
   * @param siteNom - Nom du site
   * @returns Facture générée
   */
  async generateInvoice(orderId: string, siteNom: string): Promise<InvoiceResponse | null> {
    try {
      console.log(`📄 Generating invoice for order ${orderId}`);
      const response = await apiClient.post(`/${orderId}/invoice`, { siteNom });
      console.log('📄 Invoice generated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur generateInvoice:', error.message);
      return null;
    }
  },

  /**
   * Télécharger une facture PDF
   * @param invoiceNumber - Numéro de facture
   */
  async downloadInvoice(invoiceNumber: string): Promise<Blob | null> {
    try {
      console.log(`📄 Downloading invoice ${invoiceNumber}`);
      const response = await apiClient.get(`/invoice/${invoiceNumber}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur downloadInvoice:', error.message);
      return null;
    }
  },

  // ========== MÉTHODE SUIVI GLOBAL ==========

  /**
   * Récupérer le tableau de bord global de suivi des commandes
   * @param filters - Filtres optionnels (status, siteId, supplierId)
   * @returns Données complètes de suivi global
   */
  async getGlobalOrdersTracking(filters?: {
    status?: string;
    siteId?: string;
    supplierId?: string;
  }): Promise<GlobalTrackingResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.siteId) params.append('siteId', filters.siteId);
      if (filters?.supplierId) params.append('supplierId', filters.supplierId);
      
      const queryString = params.toString();
      const url = queryString ? `/tracking/global?${queryString}` : '/tracking/global';
      
      console.log(`🗺️ Fetching global tracking data: ${url}`);
      const response = await apiClient.get(url);
      console.log('✅ Global tracking data received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur getGlobalOrdersTracking:', error.message);
      throw error;
    }
  },

  /**
   * Démarrer la livraison d'une commande en attente
   * @param orderId - ID de la commande
   * @returns Commande mise à jour
   */
  async startOrderDelivery(orderId: string): Promise<MaterialOrder> {
    try {
      console.log(`🚚 Starting delivery for order ${orderId}`);
      const response = await axios.post(`/api/orders-tracking/start/${orderId}`);
      console.log('✅ Delivery started:', response.data);
      return response.data.order;
    } catch (error: any) {
      console.error('❌ Erreur startOrderDelivery:', error.message);
      throw error;
    }
  }
};

export default orderService;