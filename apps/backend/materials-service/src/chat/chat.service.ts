import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, SenderType, MessageType } from './entities/chat-message.entity';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessage>,
    private readonly rabbitMQService: RabbitMQService,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => ChatGateway))
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  async sendMessage(
    orderId: string,
    senderType: SenderType,
    message: string,
    type: MessageType = MessageType.TEXT,
    metadata?: Record<string, any>,
    location?: { lat: number; lng: number }
  ): Promise<ChatMessage> {
    try {
      // Récupérer les détails de la commande
      const order = await this.getOrderById(orderId);
      
      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      const chatMessage = new this.chatModel({
        orderId: new Types.ObjectId(orderId),
        materialId: order.materialId,
        senderType,
        siteId: order.destinationSiteId,
        supplierId: order.supplierId,
        message,
        type,
        metadata,
        location,
        isRead: false,
      });

      const savedMessage = await chatMessage.save();
      this.logger.log(`💬 Message saved: ${savedMessage._id} for order ${orderId}`);

      // Préparer l'événement pour RabbitMQ
      const chatEvent = {
        orderId,
        messageId: savedMessage._id.toString(),
        message,
        senderType,
        senderName: await this.getSenderName(senderType, order),
        timestamp: new Date(),
        type,
        location,
      };

      // Publier sur RabbitMQ
      await this.rabbitMQService.publishMessage(`chat.message.${senderType}`, chatEvent);

      // Notifier le destinataire via RabbitMQ
      if (senderType === SenderType.SITE) {
        // Notifier le fournisseur
        await this.notifySupplier(order, savedMessage);
      } else if (senderType === SenderType.SUPPLIER) {
        // Notifier le site
        await this.notifySite(order, savedMessage);
      }

      // Émettre via WebSocket
      this.chatGateway?.server.to(`order-${orderId}`).emit('new-message', {
        message: savedMessage,
        timestamp: new Date()
      });

      return savedMessage;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  async getMessagesByOrder(orderId: string, limit = 50, beforeId?: string): Promise<ChatMessage[]> {
    const query: any = { orderId: new Types.ObjectId(orderId) };
    
    if (beforeId) {
      const beforeMessage = await this.chatModel.findById(beforeId).exec();
      if (beforeMessage && beforeMessage.createdAt) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }
    
    return this.chatModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markMessagesAsRead(orderId: string, userId: string, readerType: string): Promise<void> {
    const result = await this.chatModel.updateMany(
      {
        orderId: new Types.ObjectId(orderId),
        isRead: false,
        senderType: { $ne: readerType } // Ne pas marquer ses propres messages comme lus
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    ).exec();
    
    this.logger.log(`📖 Marked ${result.modifiedCount} messages as read for order ${orderId}`);
    
    // Notifier via RabbitMQ
    await this.rabbitMQService.publishMessage('chat.messages.read', {
      orderId,
      userId,
      readerType,
      timestamp: new Date()
    });
  }

  async getUnreadCount(orderId: string, readerType: string): Promise<number> {
    return this.chatModel.countDocuments({
      orderId: new Types.ObjectId(orderId),
      isRead: false,
      senderType: { $ne: readerType }
    }).exec();
  }

  async getConversationsBySite(siteId: string): Promise<any[]> {
    const conversations = await this.chatModel.aggregate([
      {
        $match: { siteId: new Types.ObjectId(siteId) }
      },
      {
        $group: {
          _id: '$orderId',
          lastMessage: { $last: '$message' },
          lastMessageDate: { $last: '$createdAt' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          orderId: { $first: '$orderId' }
        }
      },
      {
        $sort: { lastMessageDate: -1 }
      },
      {
        $lookup: {
          from: 'materialorders',
          localField: '_id',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec();
    
    return conversations;
  }

  async getConversationsBySupplier(supplierId: string): Promise<any[]> {
    const conversations = await this.chatModel.aggregate([
      {
        $match: { supplierId: new Types.ObjectId(supplierId) }
      },
      {
        $group: {
          _id: '$orderId',
          lastMessage: { $last: '$message' },
          lastMessageDate: { $last: '$createdAt' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          orderId: { $first: '$orderId' }
        }
      },
      {
        $sort: { lastMessageDate: -1 }
      },
      {
        $lookup: {
          from: 'materialorders',
          localField: '_id',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec();
    
    return conversations;
  }

  private async getOrderById(orderId: string): Promise<any> {
    try {
      const baseUrl = process.env.MATERIALS_SERVICE_URL || 'http://localhost:3006';
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/orders/${orderId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId}: ${error.message}`);
      return null;
    }
  }

  private async getSiteById(siteId: string): Promise<any> {
    try {
      const siteUrl = process.env.SITE_SERVICE_URL || 'http://localhost:3001/api';
      const response = await firstValueFrom(
        this.httpService.get(`${siteUrl}/gestion-sites/${siteId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch site ${siteId}: ${error.message}`);
      return null;
    }
  }

  private async getSupplierById(supplierId: string): Promise<any> {
    try {
      const supplierUrl = process.env.SUPPLIER_SERVICE_URL || 'http://localhost:3005';
      const response = await firstValueFrom(
        this.httpService.get(`${supplierUrl}/fournisseurs/${supplierId}`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch supplier ${supplierId}: ${error.message}`);
      return null;
    }
  }

  private async getSenderName(senderType: SenderType, order: any): Promise<string> {
    switch (senderType) {
      case SenderType.SITE:
        return order.destinationSiteName || 'Chantier';
      case SenderType.SUPPLIER:
        return order.supplierName || 'Fournisseur';
      case SenderType.DRIVER:
        return 'Chauffeur';
      case SenderType.SYSTEM:
        return 'Système';
      default:
        return 'Utilisateur';
    }
  }

  private async notifySupplier(order: any, message: ChatMessage): Promise<void> {
    const notification = {
      supplierId: order.supplierId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      message: message.message,
      type: 'chat_message',
      timestamp: new Date(),
      senderName: order.destinationSiteName
    };
    
    await this.rabbitMQService.publishNotification(notification);
    
    // Appeler le service fournisseur pour envoyer une notification
    try {
      const supplierUrl = process.env.SUPPLIER_SERVICE_URL || 'http://localhost:3005';
      await firstValueFrom(
        this.httpService.post(`${supplierUrl}/fournisseurs/${order.supplierId}/notify`, notification)
      );
      this.logger.log(`📧 Supplier ${order.supplierId} notified`);
    } catch (error) {
      this.logger.warn(`Failed to notify supplier: ${error.message}`);
    }
  }

  private async notifySite(order: any, message: ChatMessage): Promise<void> {
    const notification = {
      siteId: order.destinationSiteId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      message: message.message,
      type: 'chat_message',
      timestamp: new Date(),
      senderName: order.supplierName
    };
    
    await this.rabbitMQService.publishNotification(notification);
    
    this.logger.log(`📧 Site ${order.destinationSiteId} notified via RabbitMQ`);
  }

  async sendArrivalConfirmation(orderId: string): Promise<ChatMessage> {
    const order = await this.getOrderById(orderId);
    
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    
    const message = `✅ Confirmation: Le camion est arrivé chez ${order.supplierName} et le chargement a commencé`;
    
    const chatMessage = await this.sendMessage(
      orderId,
      SenderType.SYSTEM,
      message,
      MessageType.ARRIVAL_CONFIRMATION
    );
    
    // Notifier via WebSocket
    this.chatGateway?.emitArrivalConfirmation(orderId, order.supplierName, order.destinationSiteName);
    
    // Publier événement spécifique
    await this.rabbitMQService.publishMessage('chat.arrival.confirmed', {
      orderId,
      supplierId: order.supplierId,
      siteId: order.destinationSiteId,
      timestamp: new Date()
    });
    
    return chatMessage;
  }

  async sendDeliveryComplete(orderId: string): Promise<ChatMessage> {
    const order = await this.getOrderById(orderId);
    
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    
    const message = `✅ Livraison terminée! Le matériel est arrivé au chantier ${order.destinationSiteName}`;
    
    const chatMessage = await this.sendMessage(
      orderId,
      SenderType.SYSTEM,
      message,
      MessageType.STATUS_UPDATE
    );
    
    this.chatGateway?.emitDeliveryComplete(orderId, order.destinationSiteName);
    
    return chatMessage;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const result = await this.chatModel.deleteOne({ _id: new Types.ObjectId(messageId) }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }
    
    this.logger.log(`🗑️ Message ${messageId} deleted`);
  }
}