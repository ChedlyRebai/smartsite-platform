import axios from 'axios';

const API_BASE_URL = 'http://localhost:3006/api';

export interface ChatMessage {
  id: string;
  orderId: string;
  message: string;
  senderType: 'site' | 'supplier' | 'system' | 'driver';
  type: 'text' | 'image' | 'location' | 'voice' | 'arrival_confirmation' | 'status_update';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
  location?: { lat: number; lng: number };
}

export interface SendMessageDto {
  orderId: string;
  senderType: 'site' | 'supplier' | 'system' | 'driver';
  message: string;
  type?: string;
  metadata?: any;
  location?: { lat: number; lng: number };
}

const chatService = {
  // Envoyer un message
  sendMessage: async (data: SendMessageDto): Promise<{ success: boolean; messageId: string }> => {
    const response = await axios.post(`${API_BASE_URL}/chat/messages`, data);
    return response.data;
  },

  // Récupérer les messages d'une commande
  getMessagesByOrder: async (orderId: string, limit?: number, beforeId?: string): Promise<ChatMessage[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (beforeId) params.append('beforeId', beforeId);
    
    const response = await axios.get(`${API_BASE_URL}/chat/orders/${orderId}/messages?${params}`);
    return response.data.messages;
  },

  // Marquer les messages comme lus
  markAsRead: async (orderId: string, userId: string, readerType?: string): Promise<{ unreadCount: number }> => {
    const response = await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/read`, {
      userId,
      readerType
    });
    return response.data;
  },

  // Obtenir le nombre de messages non lus
  getUnreadCount: async (orderId: string, readerType: string = 'site'): Promise<number> => {
    const response = await axios.get(`${API_BASE_URL}/chat/orders/${orderId}/unread?readerType=${readerType}`);
    return response.data.unreadCount;
  },

  // Confirmer l'arrivée (système)
  sendArrivalConfirmation: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/arrival-confirmation`);
    return response.data;
  },

  // Confirmer la livraison terminée
  sendDeliveryComplete: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/chat/orders/${orderId}/delivery-complete`);
    return response.data;
  },

  // Supprimer un message
  deleteMessage: async (messageId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/chat/messages/${messageId}`);
  },

  // WebSocket connection
  connectWebSocket: (userId: string, orderIds: string[]): WebSocket => {
    const socket = new WebSocket(`ws://localhost:3006/chat`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'auth',
        userId,
        orderIds
      }));
    };
    
    return socket;
  }
};

export default chatService;