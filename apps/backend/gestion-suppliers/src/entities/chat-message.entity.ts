import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  IMAGE = 'image',
  DOCUMENT = 'document',
  LOCATION = 'location',
  ARRIVAL_CONFIRMATION = 'arrival_confirmation',
  CALL_REQUEST = 'call_request',
  CALL_ACCEPT = 'call_accept',
  CALL_REJECT = 'call_reject',
  CALL_END = 'call_end',
  STATUS_UPDATE = 'status_update',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  EMOJI = 'emoji',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  senderRole: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Prop()
  fileUrl: string;

  @Prop({ type: Object })
  location: { lat: number; lng: number; address?: string };

  @Prop({ type: [String], default: [] })
  readBy: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  duration: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: [] })
  reactions: string[];

  @Prop({ type: Map, of: String })
  reactionsByUser: Map<string, string>;

  @Prop({ type: Object })
  aiAnalysis?: {
    emotion: string;
    sentiment: string;
    confidence: number;
    status: string;
  };
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ orderId: 1, createdAt: -1 });
