import { IsString, IsEnum, IsOptional, IsObject, IsMongoId, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType, SenderType } from '../entities/chat-message.entity';

export class SendMessageDto {
  @IsMongoId()
  orderId: string;

  @IsEnum(SenderType)
  senderType: SenderType;

  @IsString()
  message: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };
}

export class SendMessageResponseDto {
  success: boolean;
  messageId: string;
  orderId: string;
  timestamp: Date;
}

export class GetMessagesQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsMongoId()
  beforeId?: string;
}

export class MarkAsReadDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsEnum(SenderType)
  readerType?: SenderType;
}

export interface ChatMessageEvent {
  orderId: string;
  messageId: string;
  message: string;
  senderType: SenderType;
  senderName: string;
  timestamp: Date;
  type: MessageType;
  location?: { lat: number; lng: number };
}

export interface SupplierNotificationEvent {
  supplierId: string;
  orderId: string;
  orderNumber: string;
  message: string;
  type: 'chat_message' | 'arrival_confirmation' | 'delivery_started' | 'delivery_complete';
  timestamp: Date;
}

export interface SiteNotificationEvent {
  siteId: string;
  orderId: string;
  message: string;
  type: string;
  timestamp: Date;
}