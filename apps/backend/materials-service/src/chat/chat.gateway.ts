import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from './chat.service';
import { AiMessageAnalyzerService, MessageAnalysisResult } from './ai-message-analyzer.service';
import {
  SendMessageDto,
  SendVoiceMessageDto,
  SendLocationDto,
  JoinRoomDto,
  TypingDto,
  MarkAsReadDto,
} from './dto/chat.dto';
import { MessageType } from './entities/chat-message.entity';

interface ChatRoom {
  orderId: string;
  participants: Map<string, { name: string; role: string; socketId: string }>;
  messages: any[];
  unreadCount: Map<string, number>;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(ChatGateway.name);
  private rooms: Map<string, ChatRoom> = new Map();
  private userSockets: Map<string, { socketId: string; userId: string; role: string }> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly aiAnalyzer: AiMessageAnalyzerService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to chat service', createdAt: new Date().toISOString() });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);

    // Find user by socket ID
    let disconnectedUserId: string | null = null;
    let disconnectedUserData: { socketId: string; userId: string; role: string } | null = null;

    for (const [userId, data] of this.userSockets.entries()) {
      if (data.socketId === client.id) {
        disconnectedUserId = userId;
        disconnectedUserData = data;
        this.userSockets.delete(userId);
        break;
      }
    }

    if (disconnectedUserId && disconnectedUserData) {
      // Remove user from all rooms and clean up
      const roomsToClean: string[] = [];
      
      for (const [orderId, room] of this.rooms.entries()) {
        if (room.participants.has(disconnectedUserId)) {
          // Remove participant from room
          room.participants.delete(disconnectedUserId);
          
          // Make client leave the room
          client.leave(`order-${orderId}`);
          
          // Notify other participants
          this.server.to(`order-${orderId}`).emit('userLeft', {
            userId: disconnectedUserId,
            userName: disconnectedUserData.userId,
            role: disconnectedUserData.role,
            createdAt: new Date().toISOString(),
          });

          // Mark room for cleanup if empty
          if (room.participants.size === 0) {
            roomsToClean.push(orderId);
          }

          this.logger.log(`👤 User ${disconnectedUserData.userId} left room order-${orderId}`);
        }
      }

      // Clean up empty rooms to prevent memory leaks
      for (const orderId of roomsToClean) {
        this.rooms.delete(orderId);
        this.logger.log(`🧹 Cleaned up empty room: order-${orderId}`);
      }

      this.logger.log(`✅ Disconnection cleanup completed for user: ${disconnectedUserData.userId}`);
    } else {
      this.logger.warn(`⚠️ Could not find user data for disconnected socket: ${client.id}`);
    }
  }

  @SubscribeMessage('joinRoom')
  @UsePipes(new ValidationPipe())
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const roomId = `order-${data.orderId}`;
    client.join(roomId);

    // Store user socket
    this.userSockets.set(data.userId, {
      socketId: client.id,
      userId: data.userId,
      role: data.role,
    });

    // Initialize or update room
    let room = this.rooms.get(data.orderId);
    if (!room) {
      room = {
        orderId: data.orderId,
        participants: new Map(),
        messages: [],
        unreadCount: new Map(),
      };
      this.rooms.set(data.orderId, room);
    }

    room.participants.set(data.userId, {
      name: data.userName,
      role: data.role,
      socketId: client.id,
    });

    // Load last 50 messages from database
    const lastMessages = await this.chatService.getMessages(data.orderId, 50);
    if (lastMessages.length > 0) {
      client.emit('messageHistory', lastMessages);
    }

    // Notify room
    client.to(roomId).emit('userJoined', {
      userId: data.userId,
      userName: data.userName,
      role: data.role,
      createdAt: new Date().toISOString(),
    });

    client.emit('joinedRoom', {
      roomId,
      orderId: data.orderId,
      participants: Array.from(room.participants.values()),
    });

    this.logger.log(`User ${data.userName} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string },
  ) {
    const roomId = `order-${data.orderId}`;
    client.leave(roomId);

    const room = this.rooms.get(data.orderId);
    if (room) {
      room.participants.delete(data.userId);
      this.server.to(roomId).emit('userLeft', {
        userId: data.userId,
        createdAt: new Date().toISOString(),
      });
    }

    this.logger.log(`User ${data.userId} left room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  @UsePipes(new ValidationPipe())
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    // Analyze message with AI before sending
    let analysis: MessageAnalysisResult | null = null;
    try {
      analysis = await this.aiAnalyzer.analyzeMessage(data.content, data.senderRole);
      
      // Send analysis result back to sender for UI feedback
      client.emit('messageAnalysis', {
        originalMessage: data.content,
        analysis,
        timestamp: new Date().toISOString(),
      });

      // If message is blocked (CONFLICT), don't send it
      if (analysis && !analysis.allow_send) {
        this.logger.warn(`🚫 Message blocked due to conflict: ${data.content.substring(0, 50)}`);
        return;
      }
    } catch (error) {
      this.logger.error(`❌ AI Analysis error: ${error.message}`);
      // Continue without analysis if AI fails
    }

    const message: any = {
      id: uuidv4(),
      orderId: data.orderId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: data.content,
      type: data.type || MessageType.TEXT,
      createdAt: new Date().toISOString(),
    };

    // Add AI analysis metadata if available
    if (analysis) {
      message.aiAnalysis = {
        emotion: analysis.emotion,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        status: analysis.status,
      };
    }

    // Save to database
    await this.chatService.saveMessage(message);

    // Store in memory
    const room = this.rooms.get(data.orderId);
    if (room) {
      room.messages.push(message);
      if (room.messages.length > 200) room.messages.shift();

      // Increment unread count for other participants
      for (const [userId] of room.participants) {
        if (userId !== data.senderId) {
          const currentUnread = room.unreadCount.get(userId) || 0;
          room.unreadCount.set(userId, currentUnread + 1);
        }
      }
    }

    const roomId = `order-${data.orderId}`;
    this.server.to(roomId).emit('newMessage', message);
    this.logger.log(`📨 Message sent to room ${roomId}: ${data.content.substring(0, 50)} [${analysis?.emotion || 'no-analysis'}]`);
  }

  @SubscribeMessage('sendVoiceMessage')
  @UsePipes(new ValidationPipe())
  async handleSendVoiceMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendVoiceMessageDto,
  ) {
    // In production, save audio to cloud storage (S3, etc.)
    const audioUrl = `/uploads/voice/${Date.now()}-${data.senderId}.webm`;

    const message = {
      id: uuidv4(),
      orderId: data.orderId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: `🎤 Message vocal (${data.duration}s)`,
      type: MessageType.VOICE,
      fileUrl: audioUrl,
      duration: data.duration,
      createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt (string ISO)
    };

    await this.chatService.saveMessage(message);

    const roomId = `order-${data.orderId}`;
    this.server.to(roomId).emit('newMessage', message);
    this.logger.log(`Voice message sent to room ${roomId}`);
  }

  @SubscribeMessage('sendLocation')
  @UsePipes(new ValidationPipe())
  async handleSendLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendLocationDto,
  ) {
    const message = {
      id: uuidv4(),
      orderId: data.orderId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: `📍 ${data.location.address || 'Position actuelle'}`,
      type: MessageType.LOCATION,
      location: data.location,
      createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt (string ISO)
    };

    await this.chatService.saveMessage(message);

    const roomId = `order-${data.orderId}`;
    this.server.to(roomId).emit('newMessage', message);
    this.server.to(roomId).emit('locationUpdate', {
      orderId: data.orderId,
      location: data.location,
      senderName: data.senderName,
      timestamp: new Date().toISOString(), // ← gardé car LocationUpdateData utilise timestamp
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingDto,
  ) {
    const roomId = `order-${data.orderId}`;
    client.to(roomId).emit('userTyping', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: MarkAsReadDto,
  ) {
    await this.chatService.markAsRead(data.orderId, data.userId);

    const room = this.rooms.get(data.orderId);
    if (room) {
      room.unreadCount.delete(data.userId);
      const roomId = `order-${data.orderId}`;
      this.server.to(roomId).emit('messagesRead', {
        orderId: data.orderId,
        userId: data.userId,
        createdAt: new Date().toISOString(), // ✅ CORRIGÉ: timestamp → createdAt
      });
    }
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string },
  ) {
    const unreadCount = await this.chatService.getUnreadCount(data.orderId, data.userId);
    client.emit('unreadCount', { orderId: data.orderId, count: unreadCount });
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; userId: string; emoji: string; orderId: string },
  ) {
    try {
      const message = await this.chatService.addReaction(data.messageId, data.userId, data.emoji);
      const roomId = `order-${data.orderId}`;
      this.server.to(roomId).emit('reactionAdded', {
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
        message,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; userId: string; orderId: string },
  ) {
    try {
      const message = await this.chatService.removeReaction(data.messageId, data.userId);
      const roomId = `order-${data.orderId}`;
      this.server.to(roomId).emit('reactionRemoved', {
        messageId: data.messageId,
        userId: data.userId,
        message,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 🔥 PROBLÈME 3 FIX: Événement pour terminer l'appel
   * Crée un message système "Appel terminé" visible par tous
   */
  @SubscribeMessage('endCall')
  async handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; userId: string; userName: string },
  ) {
    try {
      const roomId = `order-${data.orderId}`;
      
      // Créer un message système
      const systemMessage = {
        id: uuidv4(),
        orderId: data.orderId,
        senderId: 'system',
        senderName: 'Système',
        senderRole: 'system',
        content: `📞 Appel terminé par ${data.userName}`,
        type: MessageType.SYSTEM,
        createdAt: new Date().toISOString(),
        readBy: [],
      };

      // Sauvegarder dans la base de données
      await this.chatService.saveMessage(systemMessage);

      // Diffuser à tous les participants de la salle
      this.server.to(roomId).emit('callEnded', {
        orderId: data.orderId,
        userId: data.userId,
        userName: data.userName,
        message: systemMessage,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`📞 Call ended in room ${roomId} by ${data.userName}`);
    } catch (error) {
      this.logger.error(`❌ End call error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // Method to emit delivery progress from OrdersService
  emitDeliveryProgress(orderId: string, progress: number, location: { lat: number; lng: number }) {
    const roomId = `order-${orderId}`;
    this.server.to(roomId).emit('deliveryProgress', {
      orderId,
      progress,
      location,
      timestamp: new Date().toISOString(), // ← gardé car DeliveryProgressData utilise timestamp
    });
  }

  // Method to emit arrival notification
  emitArrival(orderId: string, supplierName: string) {
    const roomId = `order-${orderId}`;
    this.server.to(roomId).emit('arrivalNotification', {
      orderId,
      supplierName,
      message: `🚚 Le camion est arrivé chez ${supplierName}`,
      timestamp: new Date().toISOString(),
    });
  }

  getRoom(orderId: string): ChatRoom | undefined {
    return this.rooms.get(orderId);
  }
}
