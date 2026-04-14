import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef, Optional } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat-message.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3005'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients: Map<string, { socketId: string; userId: string; orderIds: string[] }> = new Map();

  constructor(
    @Inject(forwardRef(() => ChatService))
    @Optional()
    private readonly chatService?: ChatService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth?.userId || client.handshake.headers?.['x-user-id'];
      const orderIds = client.handshake.auth?.orderIds || [];
      
      this.connectedClients.set(client.id, {
        socketId: client.id,
        userId: userId || 'anonymous',
        orderIds: orderIds || [],
      });
      
      // Joindre les rooms des commandes
      if (orderIds && orderIds.length > 0) {
        orderIds.forEach((orderId: string) => {
          client.join(`order-${orderId}`);
        });
      }
      
      client.join('chat-room');
      this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);
      
      client.emit('connected', { 
        message: 'Connected to chat service',
        timestamp: new Date()
      });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-order')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string }
  ) {
    const { orderId } = data;
    client.join(`order-${orderId}`);
    
    // Mettre à jour les orderIds du client
    const clientData = this.connectedClients.get(client.id);
    if (clientData && !clientData.orderIds.includes(orderId)) {
      clientData.orderIds.push(orderId);
      this.connectedClients.set(client.id, clientData);
    }
    
    // Envoyer l'historique des messages
    const messages = await this.chatService!.getMessagesByOrder(orderId, 50);
    
    client.emit('message-history', {
      orderId,
      messages,
      timestamp: new Date()
    });
    
    return { event: 'joined', data: { orderId } };
  }

  @SubscribeMessage('leave-order')
  async handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string }
  ) {
    const { orderId } = data;
    client.leave(`order-${orderId}`);
    
    return { event: 'left', data: { orderId } };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() sendMessageDto: SendMessageDto
  ): Promise<WsResponse<any>> {
    try {
      const message = await this.chatService!.sendMessage(
        sendMessageDto.orderId,
        sendMessageDto.senderType,
        sendMessageDto.message,
        sendMessageDto.type,
        sendMessageDto.metadata,
        sendMessageDto.location
      );
      
      // Émettre le message dans la room de la commande
      this.server.to(`order-${sendMessageDto.orderId}`).emit('new-message', {
        message,
        timestamp: new Date()
      });
      
      // Émettre une notification globale
      this.server.emit('chat-update', {
        orderId: sendMessageDto.orderId,
        lastMessage: sendMessageDto.message,
        timestamp: new Date()
      });
      
      return {
        event: 'message-sent',
        data: { success: true, messageId: message._id, timestamp: new Date() }
      };
    } catch (error: any) {
      this.logger.error(`Error sending message: ${error.message}`);
      return {
        event: 'message-error',
        data: { success: false, error: error.message }
      };
    }
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string; readerType: string }
  ) {
    await this.chatService!.markMessagesAsRead(data.orderId, data.userId, data.readerType);
    
    this.server.to(`order-${data.orderId}`).emit('messages-read', {
      orderId: data.orderId,
      userId: data.userId,
      timestamp: new Date()
    });
    
    return { event: 'marked-read', data: { success: true } };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string; isTyping: boolean }
  ) {
    client.to(`order-${data.orderId}`).emit('user-typing', {
      userId: data.userId,
      orderId: data.orderId,
      isTyping: data.isTyping,
      timestamp: new Date()
    });
    
    return { event: 'typing-ack', data: { success: true } };
  }

  // Émettre une notification d'arrivée
  emitArrivalConfirmation(orderId: string, supplierName: string, siteName: string) {
    this.server.to(`order-${orderId}`).emit('arrival-confirmation', {
      orderId,
      supplierName,
      siteName,
      message: `✅ Le camion est arrivé chez ${supplierName} et commence le chargement`,
      timestamp: new Date()
    });
    
    this.server.emit('delivery-update', {
      orderId,
      type: 'arrival',
      message: `Arrivée chez ${supplierName}`,
      timestamp: new Date()
    });
  }

  // Émettre une notification de livraison terminée
  emitDeliveryComplete(orderId: string, siteName: string) {
    this.server.to(`order-${orderId}`).emit('delivery-complete', {
      orderId,
      siteName,
      message: `✅ Livraison terminée au chantier ${siteName}`,
      timestamp: new Date()
    });
  }

  // Émettre une mise à jour de statut de commande
  emitOrderStatusUpdate(orderId: string, status: string, progress: number) {
    this.server.to(`order-${orderId}`).emit('order-status-update', {
      orderId,
      status,
      progress,
      timestamp: new Date()
    });
  }

  // Émettre une notification générale
  emitNotification(notification: any) {
    this.server.emit('chat-notification', notification);
  }

  // Méthode pour obtenir le nombre de clients connectés
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Méthode pour obtenir les clients d'une commande spécifique
  getClientsForOrder(orderId: string): string[] {
    const clients: string[] = [];
    this.connectedClients.forEach((client, socketId) => {
      if (client.orderIds.includes(orderId)) {
        clients.push(socketId);
      }
    });
    return clients;
  }
}