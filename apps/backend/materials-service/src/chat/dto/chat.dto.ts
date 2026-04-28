import { IsString, IsEnum, IsOptional, IsObject, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { MessageType } from '../entities/chat-message.entity';

export class SendMessageDto {
  @IsString()
  orderId: string;

  @IsString()
  senderId: string;

  @IsString()
  senderName: string;

  @IsString()
  senderRole: string;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}

export class SendVoiceMessageDto {
  @IsString()
  orderId: string;

  @IsString()
  senderId: string;

  @IsString()
  senderName: string;

  @IsString()
  senderRole: string;

  @IsString()
  audioBase64: string;

  @IsNumber()
  @Min(1)
  @Max(300)
  duration: number;
}

export class SendLocationDto {
  @IsString()
  orderId: string;

  @IsString()
  senderId: string;

  @IsString()
  senderName: string;

  @IsString()
  senderRole: string;

  @IsObject()
  location: { lat: number; lng: number; address: string };
}

export class JoinRoomDto {
  @IsString()
  orderId: string;

  @IsString()
  userId: string;

  @IsString()
  userName: string;

  @IsString()
  role: string;
}

export class TypingDto {
  @IsString()
  orderId: string;

  @IsString()
  userId: string;

  @IsString()
  userName: string;

  @IsBoolean()
  isTyping: boolean;
}

export class MarkAsReadDto {
  @IsString()
  orderId: string;

  @IsString()
  userId: string;
}

// Nouveau DTO pour les appels
export class CallSignalDto {
  @IsString()
  orderId: string;

  @IsString()
  fromUserId: string;

  @IsString()
  toUserId: string;

  @IsString()
  signal: string;

  @IsBoolean()
  video: boolean;
}

// DTO pour les réactions emoji
export class AddReactionDto {
  @IsString()
  messageId: string;

  @IsString()
  userId: string;

  @IsString()
  emoji: string;
}

export class RemoveReactionDto {
  @IsString()
  messageId: string;

  @IsString()
  userId: string;
}