import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from './services/orders.service';
import { CreateMaterialOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { GetAllOrdersTrackingDto } from './dto/orders-tracking.dto';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateMaterialOrderDto) {
    const userId = 'system';
    console.log('📥 === ORDERS CONTROLLER ===');
    console.log('📥 createOrderDto:', createOrderDto);
    console.log('📥 materialId raw:', createOrderDto.materialId);
    console.log(
      '📥 materialId JSON:',
      JSON.stringify(createOrderDto.materialId),
    );

    const dtoAsAny = createOrderDto as any;
    console.log('📥 Via any - materialId:', dtoAsAny.materialId);
    console.log('📥 Via any - destinationSiteId:', dtoAsAny.destinationSiteId);
    console.log('📥 Via any - supplierId:', dtoAsAny.supplierId);

    try {
      const result = await this.ordersService.createOrder(
        createOrderDto,
        userId,
      );
      console.log('✅ Commande créée avec succès:', result._id);
      return result;
    } catch (error: any) {
      console.error('❌ Erreur dans controller:', error.message);
      console.error('❌ Stack:', error.stack);
      throw error;
    }
  }

  @Get()
  async getAllOrders(
    @Query('status') status?: string,
    @Query('siteId') siteId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.ordersService.getAllOrders({ status, siteId, supplierId });
  }

  // ========== NOUVEAU ENDPOINT POUR LE SUIVI GLOBAL ==========

  @Get('tracking/global')
  async getGlobalOrdersTracking(
    @Query('status') status?: string,
    @Query('siteId') siteId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    this.logger.log(`🗺️ Récupération du suivi global des commandes`);
    const filters: GetAllOrdersTrackingDto = {};
    if (status) filters.status = status;
    if (siteId) filters.siteId = siteId;
    if (supplierId) filters.supplierId = supplierId;

    return this.ordersService.getGlobalOrdersTracking(filters);
  }

  @Get('active')
  async getActiveOrders() {
    return this.ordersService.getActiveOrders();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }

  @Put(':id/progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Param('id') id: string,
    @Body()
    body: {
      currentPosition: {
        lat: number;
        lng: number;
        progress?: number;
        remainingTime?: number;
      };
    },
  ) {
    return this.ordersService.updateOrderProgress(id, body.currentPosition);
  }

  @Post(':id/simulate')
  @HttpCode(HttpStatus.OK)
  async simulateDelivery(@Param('id') id: string) {
    return this.ordersService.simulateDelivery(id);
  }

  // ========== ENDPOINTS PAIEMENT ==========

  @Post(':id/payment')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Param('id') id: string,
    @Body() body: { paymentMethod: 'cash' | 'card' },
  ) {
    this.logger.log(
      `💳 Payment request for order ${id}, method: ${body.paymentMethod}`,
    );
    return this.ordersService.processArrivalPayment(id, body.paymentMethod);
  }

  @Post(':id/payment/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { paymentIntentId: string },
  ) {
    this.logger.log(`✅ Confirm payment for order ${id}`);
    return this.ordersService.confirmCardPayment(id, body.paymentIntentId);
  }

  @Get(':id/payment/status')
  @HttpCode(HttpStatus.OK)
  async getPaymentStatus(@Param('id') id: string) {
    this.logger.log(`📊 Get payment status for order ${id}`);
    return this.ordersService.getPaymentStatus(id);
  }

  // ========== ENDPOINT FACTURE ==========

  @Post(':id/invoice')
  @HttpCode(HttpStatus.OK)
  async generateInvoice(
    @Param('id') id: string,
    @Body() body: { siteNom: string },
  ) {
    this.logger.log(`📄 Generate invoice for order ${id}`);
    return this.ordersService.generateInvoiceForOrder(id, body.siteNom);
  }
}
