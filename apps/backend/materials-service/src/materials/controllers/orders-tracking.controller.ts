import { Controller, Get, Post, Put, Param, Body, Logger } from '@nestjs/common';
import { OrdersTrackingService } from '../services/orders-tracking.service';

@Controller('orders-tracking')
export class OrdersTrackingController {
  private readonly logger = new Logger(OrdersTrackingController.name);

  constructor(private readonly ordersTrackingService: OrdersTrackingService) {}

  /**
   * 📋 Récupérer toutes les commandes avec suivi
   */
  @Get('all')
  async getAllOrdersWithTracking() {
    this.logger.log('📋 Getting all orders with tracking');
    return this.ordersTrackingService.getAllOrdersWithTracking();
  }

  /**
   * 🚚 Récupérer les commandes actives
   */
  @Get('active')
  async getActiveOrders() {
    this.logger.log('🚚 Getting active orders');
    return this.ordersTrackingService.getActiveOrders();
  }

  /**
   * 🎯 Démarrer le suivi d'une commande
   */
  @Post('start/:orderId')
  async startOrderTracking(@Param('orderId') orderId: string) {
    this.logger.log(`🎯 Starting tracking for order: ${orderId}`);
    return this.ordersTrackingService.startOrderTracking(orderId);
  }

  /**
   * 📍 Mettre à jour le progrès d'une commande
   */
  @Put('progress/:orderId')
  async updateOrderProgress(
    @Param('orderId') orderId: string,
    @Body() body: {
      progress: number;
      currentPosition?: { lat: number; lng: number };
      remainingTimeMinutes?: number;
    }
  ) {
    this.logger.log(`📍 Updating progress for order: ${orderId}`);
    return this.ordersTrackingService.updateOrderProgress(
      orderId,
      body.progress,
      body.currentPosition,
      body.remainingTimeMinutes
    );
  }

  /**
   * 📊 Obtenir les statistiques de suivi
   */
  @Get('stats')
  async getTrackingStats() {
    this.logger.log('📊 Getting tracking statistics');
    return this.ordersTrackingService.getTrackingStats();
  }
}