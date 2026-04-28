import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = '/api/chat';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: string;
  createdAt: string;
  fileUrl?: string;
  location?: any;
  duration?: number;
  metadata?: any;
  aiAnalysis?: {
    emotion: string;
    sentiment: string;
    confidence: number;
    status: string;
  };
}

class ChatService {
  private apiClient = axios.create({ baseURL: API_URL, timeout: 30000 });
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  initializeSocket(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
    
    this.socket = io(`${socketUrl}/chat`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ Chat WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Chat WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Chat WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Chat WebSocket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Chat WebSocket reconnection failed after max attempts');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async getMessagesByOrder(orderId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const { data } = await this.apiClient.get(`/messages/${orderId}?limit=${limit}`);
      if (data.success && data.messages) return data.messages;
      return [];
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  }

  async sendMessage(data: any): Promise<any> {
    try {
      const { data: response } = await this.apiClient.post('/messages', {
        orderId: data.orderId,
        senderType: data.senderType,
        content: data.message,
        type: data.type || 'text',
        location: data.location,
      });
      return response;
    } catch (error) {
      console.error('Send error:', error);
      throw error;
    }
  }

  async uploadFile(orderId: string, senderType: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);
      formData.append('senderType', senderType);

      const { data } = await axios.post(`${API_URL}/upload`, formData);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadVoice(orderId: string, senderType: string, audioBlob: Blob, duration: number): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('orderId', orderId);
      formData.append('senderType', senderType);
      formData.append('duration', duration.toString());

      const { data } = await axios.post(`${API_URL}/upload-voice`, formData);
      return data;
    } catch (error) {
      console.error('Voice upload error:', error);
      throw error;
    }
  }

  async getUnreadCount(orderId: string, userType: string): Promise<number> {
    try {
      const { data } = await this.apiClient.get(`/unread/${orderId}/${userType}`);
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  }

  async markAsRead(orderId: string, userId: string, userType: string): Promise<void> {
    try {
      await this.apiClient.post('/messages/read', { orderId, userId, userType });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  async sendArrivalConfirmation(orderId: string): Promise<any> {
    try {
      const { data } = await this.apiClient.post('/arrival-confirmation', { orderId });
      return data;
    } catch (error) {
      console.error('Arrival confirmation error:', error);
      throw error;
    }
  }

  async getWeatherForOrder(orderId: string): Promise<any> {
    try {
      const { data } = await this.apiClient.get(`/weather/${orderId}`);
      return data;
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw error;
    }
  }
}

export default new ChatService();