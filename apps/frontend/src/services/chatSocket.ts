import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';

export interface SocketMessage {
  orderId: string;
  senderType: string;
  message: string;
  type?: string;
  location?: { lat: number; lng: number };
  duration?: number;
}

export interface IncomingMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: string;
  createdAt: string;
  fileUrl?: string;
  location?: { lat: number; lng: number };
  duration?: number;
  metadata?: any;
}

export interface DeliveryProgressData {
  orderId: string;
  progress: number;
  location: { lat: number; lng: number };
  timestamp: string;
}

export interface LocationUpdateData {
  orderId: string;
  location: { lat: number; lng: number };
  senderName: string;
  timestamp: string;
}

class ChatSocketService {
  private socket: Socket | null = null;
  private currentUserId: string = '';
  private currentOrderIds: string[] = [];
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(userId: string, orderIds: string[] = []): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.currentUserId = userId;
    this.currentOrderIds = orderIds;

    try {
      const base = SOCKET_URL.replace(/\/$/, '');
      this.socket = io(`${base}/chat`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        withCredentials: true,
      });

      this.setupCoreListeners();
      console.log(`ChatSocket connecting to ${base}/chat`);
    } catch (error) {
      console.error('ChatSocket connection error:', error);
    }
  }

  private setupCoreListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('ChatSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;

      // Rejoindre les rooms des commandes actives
      this.currentOrderIds.forEach((orderId) => {
        this.joinOrder(orderId);
      });

      this.emit('connected', { userId: this.currentUserId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('ChatSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('ChatSocket connect error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
      }
    });

    // Messages entrants
    this.socket.on('newMessage', (message: IncomingMessage) => {
      this.trigger('new-message', { message });
    });

    // Historique des messages à la connexion
    this.socket.on('messageHistory', (messages: IncomingMessage[]) => {
      this.trigger('message-history', { messages });
    });

    // Indicateur de frappe
    this.socket.on('userTyping', (data: { userId: string; userName: string; isTyping: boolean }) => {
      this.trigger('user-typing', data);
    });

    // Messages lus
    this.socket.on('messagesRead', (data: { orderId: string; userId: string }) => {
      this.trigger('messages-read', data);
    });

    // Progression livraison
    this.socket.on('deliveryProgress', (data: DeliveryProgressData) => {
      this.trigger('delivery-progress', data);
    });

    // Notification arrivée
    this.socket.on('arrivalNotification', (data: any) => {
      this.trigger('arrival-notification', data);
    });

    // Mise à jour de position
    this.socket.on('locationUpdate', (data: LocationUpdateData) => {
      this.trigger('location-update', data);
    });

    // Utilisateur rejoint/quitte la room
    this.socket.on('userJoined', (data: any) => {
      this.trigger('user-joined', data);
    });

    this.socket.on('userLeft', (data: any) => {
      this.trigger('user-left', data);
    });

    // Confirmation room rejointe
    this.socket.on('joinedRoom', (data: any) => {
      this.trigger('joined-room', data);
    });

    // Compteur non-lus
    this.socket.on('unreadCount', (data: { orderId: string; count: number }) => {
      this.trigger('unread-count', data);
    });
  }

  // Rejoindre la room d'une commande
  joinOrder(orderId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join order room');
      return;
    }
    if (!this.currentOrderIds.includes(orderId)) {
      this.currentOrderIds.push(orderId);
    }
    this.socket.emit('joinRoom', {
      orderId,
      userId: this.currentUserId,
      userName: this.currentUserId,
      role: 'site',
    });
    console.log(`Joined room for order: ${orderId}`);
  }

  // Quitter la room d'une commande
  leaveOrder(orderId: string): void {
    if (!this.socket?.connected) return;
    this.currentOrderIds = this.currentOrderIds.filter((id) => id !== orderId);
    this.socket.emit('leaveRoom', {
      orderId,
      userId: this.currentUserId,
    });
  }

  // Envoyer un message texte
  sendMessage(data: SocketMessage): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, message not sent');
      return;
    }
    this.socket.emit('sendMessage', {
      orderId: data.orderId,
      senderId: this.currentUserId,
      senderName: data.senderType === 'site' ? 'Chantier' : 'Fournisseur',
      senderRole: data.senderType,
      content: data.message,
      type: data.type || 'text',
    });
  }

  // Envoyer une localisation
  sendLocation(orderId: string, location: { lat: number; lng: number; address?: string }): void {
    if (!this.socket?.connected) return;
    this.socket.emit('sendLocation', {
      orderId,
      senderId: this.currentUserId,
      senderName: 'Chantier',
      senderRole: 'site',
      location,
    });
  }

  // Indiquer que l'utilisateur est en train d'écrire
  sendTyping(orderId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', {
      orderId,
      userId: this.currentUserId,
      userName: 'Chantier',
      isTyping,
    });
  }

  // Marquer les messages comme lus
  markAsRead(orderId: string, userId: string, userRole?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('markAsRead', { orderId, userId });
  }

  // Obtenir le compteur de non-lus
  getUnreadCount(orderId: string, userId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('getUnreadCount', { orderId, userId });
  }

  // Émettre un événement vers le serveur
  private emit(event: string, data: any): void {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  // Système d'événements custom (pub/sub)
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      this.eventListeners.set(
        event,
        listeners.filter((cb) => cb !== callback)
      );
    }
  }

  private trigger(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners && listeners.length > 0) {
      listeners.forEach((cb) => cb(data));
    }
  }

  // Vérifier si connecté
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Déconnecter proprement
  disconnect(): void {
    if (this.socket) {
      this.currentOrderIds.forEach((orderId) => {
        this.socket?.emit('leaveRoom', {
          orderId,
          userId: this.currentUserId,
        });
      });
      this.socket.disconnect();
      this.socket = null;
      this.currentOrderIds = [];
      this.eventListeners.clear();
      console.log('ChatSocket disconnected');
    }
  }
}

// Singleton
export const chatSocket = new ChatSocketService();
export default chatSocket;