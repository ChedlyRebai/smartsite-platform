// services/chatSocket.ts
import { io, Socket } from 'socket.io-client';

class ChatSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(userId: string, orderIds: string[] = []): void {
    this.socket = io('http://localhost:3006/chat', {
      auth: { userId, orderIds },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('new-message', (data) => {
      this.emit('new-message', data);
    });

    this.socket.on('message-history', (data) => {
      this.emit('message-history', data);
    });

    this.socket.on('messages-read', (data) => {
      this.emit('messages-read', data);
    });

    this.socket.on('arrival-confirmation', (data) => {
      this.emit('arrival-confirmation', data);
    });

    this.socket.on('delivery-complete', (data) => {
      this.emit('delivery-complete', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinOrder(orderId: string): void {
    this.socket?.emit('join-order', { orderId });
  }

  leaveOrder(orderId: string): void {
    this.socket?.emit('leave-order', { orderId });
  }

  sendMessage(data: any): void {
    this.socket?.emit('send-message', data);
  }

  markAsRead(orderId: string, userId: string, readerType: string): void {
    this.socket?.emit('mark-read', { orderId, userId, readerType });
  }

  sendTyping(orderId: string, userId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { orderId, userId, isTyping });
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const chatSocket = new ChatSocketService();