import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChatbotConversation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true, enum: ['en', 'fr', 'ar'] })
  language: string;

  @Prop({ type: [{ role: String, content: String, timestamp: Date }] })
  messages: { role: string; content: string; timestamp: Date }[];

  @Prop({ default: 'active' })
  status: string;

  @Prop()
  context?: string;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  currentSiteId?: Types.ObjectId;
}

export const ChatbotConversationSchema =
  SchemaFactory.createForClass(ChatbotConversation);
