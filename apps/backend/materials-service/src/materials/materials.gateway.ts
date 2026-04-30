import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: 'materials',
})
export class MaterialsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(MaterialsGateway.name);
  private connectedClients: Map<string, { socketId: string; userId: string }> =
    new Map();

  async handleConnection(client: Socket) {
    try {
      this.connectedClients.set(client.id, {
        socketId: client.id,
        userId: 'anonymous',
      });

      client.join('materials-room');
      this.logger.log(`Client connected: ${client.id}`);

      client.emit('connected', { message: 'Connected to materials service' });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToMaterial')
  handleSubscribeToMaterial(client: Socket, materialId: string) {
    client.join(`material-${materialId}`);
    return { event: 'subscribed', data: { materialId } };
  }

  @SubscribeMessage('unsubscribeFromMaterial')
  handleUnsubscribeFromMaterial(client: Socket, materialId: string) {
    client.leave(`material-${materialId}`);
    return { event: 'unsubscribed', data: { materialId } };
  }

  emitStockUpdate(materialId: string, movement: any) {
    this.server.to(`material-${materialId}`).emit('stockUpdated', movement);
    this.server.to('materials-room').emit('globalStockUpdate', {
      materialId,
      movement,
      timestamp: new Date(),
    });
  }

  emitMaterialUpdate(event: string, data: any) {
    this.server.to('materials-room').emit(event, data);
  }

  emitAlert(alert: any) {
    this.server.to('materials-room').emit('stockAlert', alert);

    if (alert.severity === 'high') {
      this.server.to('managers-room').emit('criticalAlert', alert);
    }
  }

  emitLocationUpdate(materialId: string, location: any) {
    this.server.to(`material-${materialId}`).emit('locationUpdated', {
      materialId,
      location,
      timestamp: new Date(),
    });
  }

  emitOrderUpdate(event: string, order: any) {
    this.server.to('materials-room').emit(event, order);
    this.server.to(`order-${order._id}`).emit(event, order);
  }

  emitOrderProgressUpdate(orderId: string, progress: any) {
    this.server.to(`order-${orderId}`).emit('orderProgressUpdate', {
      orderId,
      ...progress,
      timestamp: new Date(),
    });
    this.server.to('materials-room').emit('globalOrderProgressUpdate', {
      orderId,
      ...progress,
      timestamp: new Date(),
    });
  }

  emitNotification(notification: any) {
    this.server.to('materials-room').emit('deliveryNotification', notification);
    this.server.to('managers-room').emit('deliveryNotification', notification);
  }
}
