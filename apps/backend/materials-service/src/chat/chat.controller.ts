import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto, GetMessagesQueryDto, MarkAsReadDto } from './dto/chat-message.dto';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    this.logger.log(`📨 Sending message for order ${sendMessageDto.orderId}`);
    
    const message = await this.chatService.sendMessage(
      sendMessageDto.orderId,
      sendMessageDto.senderType,
      sendMessageDto.message,
      sendMessageDto.type,
      sendMessageDto.metadata,
      sendMessageDto.location
    );
    
    return {
      success: true,
      messageId: message._id,
      orderId: message.orderId,
      timestamp: message.createdAt || new Date()
    };
  }

  @Get('orders/:orderId/messages')
  async getMessages(
    @Param('orderId') orderId: string,
    @Query() query: GetMessagesQueryDto
  ) {
    const messages = await this.chatService.getMessagesByOrder(
      orderId,
      query.limit,
      query.beforeId
    );
    
    return {
      success: true,
      orderId,
      messages,
      count: messages.length,
      timestamp: new Date()
    };
  }

  @Post('orders/:orderId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('orderId') orderId: string,
    @Body() markAsReadDto: MarkAsReadDto
  ) {
    const readerType = markAsReadDto.readerType || 'site';
    await this.chatService.markMessagesAsRead(orderId, markAsReadDto.userId, readerType);
    
    const unreadCount = await this.chatService.getUnreadCount(orderId, readerType);
    
    return {
      success: true,
      orderId,
      unreadCount,
      timestamp: new Date()
    };
  }

  @Get('orders/:orderId/unread')
  async getUnreadCount(
    @Param('orderId') orderId: string,
    @Query('readerType') readerType: string = 'site'
  ) {
    const count = await this.chatService.getUnreadCount(orderId, readerType);
    
    return {
      success: true,
      orderId,
      unreadCount: count,
      timestamp: new Date()
    };
  }

  @Get('sites/:siteId/conversations')
  async getSiteConversations(@Param('siteId') siteId: string) {
    const conversations = await this.chatService.getConversationsBySite(siteId);
    
    return {
      success: true,
      siteId,
      conversations,
      count: conversations.length,
      timestamp: new Date()
    };
  }

  @Get('suppliers/:supplierId/conversations')
  async getSupplierConversations(@Param('supplierId') supplierId: string) {
    const conversations = await this.chatService.getConversationsBySupplier(supplierId);
    
    return {
      success: true,
      supplierId,
      conversations,
      count: conversations.length,
      timestamp: new Date()
    };
  }

  @Post('orders/:orderId/arrival-confirmation')
  @HttpCode(HttpStatus.OK)
  async sendArrivalConfirmation(@Param('orderId') orderId: string) {
    const message = await this.chatService.sendArrivalConfirmation(orderId);
    
    return {
      success: true,
      messageId: message._id,
      orderId,
      message: message.message,
      timestamp: message.createdAt || new Date()
    };
  }

  @Post('orders/:orderId/delivery-complete')
  @HttpCode(HttpStatus.OK)
  async sendDeliveryComplete(@Param('orderId') orderId: string) {
    const message = await this.chatService.sendDeliveryComplete(orderId);
    
    return {
      success: true,
      messageId: message._id,
      orderId,
      message: message.message,
      timestamp: message.createdAt || new Date()
    };
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@Param('messageId') messageId: string) {
    await this.chatService.deleteMessage(messageId);
  }
}