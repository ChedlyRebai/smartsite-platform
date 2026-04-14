import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  LOCATION = 'location',
  VOICE = 'voice',
  ARRIVAL_CONFIRMATION = 'arrival_confirmation',
  STATUS_UPDATE = 'status_update'
}

export enum SenderType {
  SITE = 'site',
  SUPPLIER = 'supplier',
  SYSTEM = 'system',
  DRIVER = 'driver'
}

@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'MaterialOrder', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ required: true, enum: SenderType })
  senderType: SenderType;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  siteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Fournisseur' })
  supplierId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date;

  @Prop({ type: String })
  attachmentUrl: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Object })
  location: { lat: number; lng: number };

  // Ajout explicite de createdAt pour éviter les erreurs TypeScript
  createdAt: Date;
  updatedAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Indexes pour les requêtes fréquentes
ChatMessageSchema.index({ orderId: 1, createdAt: -1 });
ChatMessageSchema.index({ supplierId: 1, isRead: 1 });
ChatMessageSchema.index({ siteId: 1, createdAt: -1 });
ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 jours TTL

ChatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});