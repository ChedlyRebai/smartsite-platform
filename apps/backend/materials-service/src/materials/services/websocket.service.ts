import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ChatGateway } from '../../chat/chat.gateway';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  emitDeliveryProgress(orderId: string, progress: number, location: { lat: number; lng: number }) {
    this.chatGateway?.emitDeliveryProgress(orderId, progress, location);
    this.logger.log(`Emitted delivery progress for order ${orderId}: ${progress}%`);
  }

  emitArrival(orderId: string, supplierName: string) {
    this.chatGateway?.emitArrival(orderId, supplierName);
    this.logger.log(`Emitted arrival for order ${orderId} at ${supplierName}`);
  }

  emitLocationUpdate(orderId: string, location: { lat: number; lng: number }, senderName: string) {
    const roomId = `order-${orderId}`;
    this.chatGateway?.server?.to(roomId).emit('locationUpdate', {
      orderId,
      location,
      senderName,
      timestamp: new Date(),
    });
  }
}