import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MaterialOrder, OrderStatus } from '../entities/material-order.entity';

export interface OrderTrackingInfo {
  _id: string;
  orderNumber: string;
  materialName: string;
  supplierName: string;
  destinationSiteName: string;
  status: OrderStatus;
  progress: number; // 0-100
  estimatedDurationMinutes: number;
  remainingTimeMinutes: number;
  currentPosition?: { lat: number; lng: number };
  destinationCoordinates?: { lat: number; lng: number };
  supplierCoordinates?: { lat: number; lng: number };
  startedAt?: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  quantity: number;
  totalDistance?: number;
  trackingHistory: Array<{
    timestamp: Date;
    status: string;
    position?: { lat: number; lng: number };
    progress: number;
    message: string;
  }>;
}

@Injectable()
export class OrdersTrackingService {
  private readonly logger = new Logger(OrdersTrackingService.name);

  constructor(
    @InjectModel(MaterialOrder.name) private orderModel: Model<MaterialOrder>,
  ) {}

  /**
   * 📋 Récupérer toutes les commandes avec leur statut de suivi
   */
  async getAllOrdersWithTracking(): Promise<OrderTrackingInfo[]> {
    this.logger.log('📋 Getting all orders with tracking info');

    try {
      const orders = await this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .exec();

      const trackingInfos: OrderTrackingInfo[] = orders.map((order) => {
        const trackingInfo: OrderTrackingInfo = {
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          materialName: order.materialName,
          supplierName: order.supplierName,
          destinationSiteName: order.destinationSiteName,
          status: order.status,
          progress: order.progress || 0,
          estimatedDurationMinutes: order.estimatedDurationMinutes || 60,
          remainingTimeMinutes: order.remainingTimeMinutes || 0,
          currentPosition: order.currentPosition,
          destinationCoordinates: order.destinationCoordinates,
          supplierCoordinates: order.supplierCoordinates,
          startedAt: order.startedAt,
          estimatedArrival: order.estimatedArrival,
          actualArrival: order.actualArrival,
          quantity: order.quantity,
          totalDistance: order.totalDistance,
          trackingHistory: order.trackingHistory || [],
        };

        return trackingInfo;
      });

      this.logger.log(
        `✅ Retrieved ${trackingInfos.length} orders with tracking`,
      );
      return trackingInfos;
    } catch (error) {
      this.logger.error(`❌ Error getting orders tracking: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🚚 Récupérer les commandes actives (en cours de livraison)
   */
  async getActiveOrders(): Promise<OrderTrackingInfo[]> {
    this.logger.log('🚚 Getting active orders');

    try {
      const activeOrders = await this.orderModel
        .find({
          status: { $in: [OrderStatus.PENDING, OrderStatus.IN_TRANSIT] },
        })
        .sort({ createdAt: -1 })
        .exec();

      const trackingInfos: OrderTrackingInfo[] = activeOrders.map((order) => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        materialName: order.materialName,
        supplierName: order.supplierName,
        destinationSiteName: order.destinationSiteName,
        status: order.status,
        progress: order.progress || 0,
        estimatedDurationMinutes: order.estimatedDurationMinutes || 60,
        remainingTimeMinutes: order.remainingTimeMinutes || 0,
        currentPosition: order.currentPosition,
        destinationCoordinates: order.destinationCoordinates,
        supplierCoordinates: order.supplierCoordinates,
        startedAt: order.startedAt,
        estimatedArrival: order.estimatedArrival,
        quantity: order.quantity,
        totalDistance: order.totalDistance,
        trackingHistory: order.trackingHistory || [],
      }));

      this.logger.log(`✅ Retrieved ${trackingInfos.length} active orders`);
      return trackingInfos;
    } catch (error) {
      this.logger.error(`❌ Error getting active orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎯 Démarrer le suivi d'une commande (démarrer le trajet)
   */
  async startOrderTracking(orderId: string): Promise<{
    success: boolean;
    message: string;
    order: OrderTrackingInfo;
  }> {
    this.logger.log(`🎯 Starting tracking for order: ${orderId}`);

    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error(`Order ${orderId} is not in pending status`);
      }

      // Mettre à jour le statut et démarrer le suivi
      const now = new Date();
      const estimatedArrival = new Date(
        now.getTime() + (order.estimatedDurationMinutes || 60) * 60 * 1000,
      );

      order.status = OrderStatus.IN_TRANSIT;
      order.startedAt = now;
      order.estimatedArrival = estimatedArrival;
      order.progress = 0;
      order.remainingTimeMinutes = order.estimatedDurationMinutes || 60;

      // Ajouter à l'historique de suivi
      if (!order.trackingHistory) {
        order.trackingHistory = [];
      }

      order.trackingHistory.push({
        timestamp: now,
        status: OrderStatus.IN_TRANSIT,
        position: order.supplierCoordinates,
        progress: 0,
        message: `🚚 Livraison démarrée depuis ${order.supplierName}`,
      });

      await order.save();

      const trackingInfo: OrderTrackingInfo = {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        materialName: order.materialName,
        supplierName: order.supplierName,
        destinationSiteName: order.destinationSiteName,
        status: order.status,
        progress: order.progress,
        estimatedDurationMinutes: order.estimatedDurationMinutes || 60,
        remainingTimeMinutes: order.remainingTimeMinutes || 0,
        currentPosition: order.currentPosition,
        destinationCoordinates: order.destinationCoordinates,
        supplierCoordinates: order.supplierCoordinates,
        startedAt: order.startedAt,
        estimatedArrival: order.estimatedArrival,
        quantity: order.quantity,
        totalDistance: order.totalDistance,
        trackingHistory: order.trackingHistory,
      };

      this.logger.log(`✅ Order tracking started: ${order.orderNumber}`);
      return {
        success: true,
        message: `🚚 Suivi démarré pour la commande ${order.orderNumber}`,
        order: trackingInfo,
      };
    } catch (error) {
      this.logger.error(`❌ Error starting order tracking: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📍 Mettre à jour la position et le progrès d'une commande
   */
  async updateOrderProgress(
    orderId: string,
    progress: number,
    currentPosition?: { lat: number; lng: number },
    remainingTimeMinutes?: number,
  ): Promise<OrderTrackingInfo> {
    this.logger.log(
      `📍 Updating progress for order: ${orderId}, progress: ${progress}%`,
    );

    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Mettre à jour le progrès
      order.progress = Math.min(100, Math.max(0, progress));

      if (currentPosition) {
        order.currentPosition = currentPosition;
      }

      if (remainingTimeMinutes !== undefined) {
        order.remainingTimeMinutes = Math.max(0, remainingTimeMinutes);
      }

      // Ajouter à l'historique
      if (!order.trackingHistory) {
        order.trackingHistory = [];
      }

      order.trackingHistory.push({
        timestamp: new Date(),
        status: order.status,
        position: currentPosition,
        progress: order.progress,
        message: `📍 Position mise à jour - ${order.progress}% complété`,
      });

      // Si 100% atteint, marquer comme livré
      if (order.progress >= 100 && order.status === OrderStatus.IN_TRANSIT) {
        order.status = OrderStatus.DELIVERED;
        order.actualArrival = new Date();
        order.remainingTimeMinutes = 0;

        order.trackingHistory.push({
          timestamp: new Date(),
          status: OrderStatus.DELIVERED,
          position: order.destinationCoordinates,
          progress: 100,
          message: `✅ Livraison terminée à ${order.destinationSiteName}`,
        });
      }

      await order.save();

      const trackingInfo: OrderTrackingInfo = {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        materialName: order.materialName,
        supplierName: order.supplierName,
        destinationSiteName: order.destinationSiteName,
        status: order.status,
        progress: order.progress,
        estimatedDurationMinutes: order.estimatedDurationMinutes || 60,
        remainingTimeMinutes: order.remainingTimeMinutes || 0,
        currentPosition: order.currentPosition,
        destinationCoordinates: order.destinationCoordinates,
        supplierCoordinates: order.supplierCoordinates,
        startedAt: order.startedAt,
        estimatedArrival: order.estimatedArrival,
        actualArrival: order.actualArrival,
        quantity: order.quantity,
        totalDistance: order.totalDistance,
        trackingHistory: order.trackingHistory,
      };

      this.logger.log(
        `✅ Order progress updated: ${order.orderNumber} - ${order.progress}%`,
      );
      return trackingInfo;
    } catch (error) {
      this.logger.error(`❌ Error updating order progress: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 Obtenir les statistiques de suivi
   */
  async getTrackingStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    inTransitOrders: number;
    deliveredOrders: number;
    delayedOrders: number;
    averageDeliveryTime: number;
  }> {
    this.logger.log('📊 Getting tracking statistics');

    try {
      const [
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
        delayedOrders,
        allOrders,
      ] = await Promise.all([
        this.orderModel.countDocuments(),
        this.orderModel.countDocuments({ status: OrderStatus.PENDING }),
        this.orderModel.countDocuments({ status: OrderStatus.IN_TRANSIT }),
        this.orderModel.countDocuments({ status: OrderStatus.DELIVERED }),
        this.orderModel.countDocuments({ status: OrderStatus.DELAYED }),
        this.orderModel.find({
          status: OrderStatus.DELIVERED,
          startedAt: { $exists: true },
          actualArrival: { $exists: true },
        }),
      ]);

      // Calculer le temps de livraison moyen
      let averageDeliveryTime = 0;
      if (allOrders.length > 0) {
        const totalDeliveryTime = allOrders.reduce((sum, order) => {
          if (order.startedAt && order.actualArrival) {
            return (
              sum + (order.actualArrival.getTime() - order.startedAt.getTime())
            );
          }
          return sum;
        }, 0);
        averageDeliveryTime = Math.round(
          totalDeliveryTime / allOrders.length / (1000 * 60),
        ); // en minutes
      }

      const stats = {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        deliveredOrders,
        delayedOrders,
        averageDeliveryTime,
      };

      this.logger.log(`✅ Tracking stats calculated: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error(`❌ Error getting tracking stats: ${error.message}`);
      throw error;
    }
  }
}
