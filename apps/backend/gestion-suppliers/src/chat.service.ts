import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, MessageType } from './entities/chat-message.entity';
import { WeatherService } from './weather.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
<<<<<<< HEAD:apps/backend/materials-service/src/chat/chat.service.ts

  constructor(
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
    private readonly weatherService: WeatherService,
  ) {}
=======
  private client: OpenAI;
  private readonly systemPrompt = 'You are a helpful assistant for the SmartSite supplier management service. You help users manage suppliers, articles, and pricing.';

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('GROQ_API_KEY') || '',
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  onModuleInit() {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    const model = this.configService.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
    if (!apiKey) {
      this.logger.error('GROQ_API_KEY is missing! Check your .env file.');
    } else {
      this.logger.log('Groq initialized � model: ' + model + ' � key: ' + apiKey.substring(0, 10) + '...');
    }
  }

  async sendMessage(
    message: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    const model = this.configService.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return { success: false, message: 'GROQ_API_KEY not configured.' };
    }
>>>>>>> origin/main:apps/backend/gestion-suppliers/src/chat.service.ts

  async saveMessage(messageData: any): Promise<any> {
    try {
      const message = new this.chatMessageModel(messageData);
      const saved = await message.save();
      this.logger.log(`✅ Message saved: ${saved._id}`);
      return saved;
    } catch (error) {
      this.logger.error(`❌ Save error: ${error.message}`);
      throw error;
    }
  }
<<<<<<< HEAD:apps/backend/materials-service/src/chat/chat.service.ts

  async getMessages(orderId: string, limit: number = 50): Promise<any[]> {
    try {
      const messages = await this.chatMessageModel
        .find({ orderId, isDeleted: false })
        .sort({ createdAt: 1 })
        .limit(limit)
        .lean()
        .exec();
      return messages;
    } catch (error) {
      this.logger.error(`❌ Get error: ${error.message}`);
      return [];
    }
  }

  async markAsRead(orderId: string, userId: string): Promise<void> {
    try {
      await this.chatMessageModel
        .updateMany(
          { orderId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } },
        )
        .exec();
    } catch (error) {
      this.logger.error(`❌ Mark read error: ${error.message}`);
    }
  }

  async getUnreadCount(orderId: string, userId: string): Promise<number> {
    try {
      return await this.chatMessageModel
        .countDocuments({
          orderId,
          readBy: { $ne: userId },
          senderId: { $ne: userId },
        })
        .exec();
    } catch (error) {
      return 0;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const result = await this.chatMessageModel
        .updateOne({ _id: messageId }, { isDeleted: true })
        .exec();
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<any> {
    try {
      const message = await this.chatMessageModel.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (!message.reactionsByUser) {
        message.reactionsByUser = new Map();
      }

      message.reactionsByUser.set(userId, emoji);

      if (!message.reactions) {
        message.reactions = [];
      }
      if (!message.reactions.includes(emoji)) {
        message.reactions.push(emoji);
      }

      await message.save();
      return message;
    } catch (error) {
      this.logger.error(`❌ Add reaction error: ${error.message}`);
      throw error;
    }
  }

  async removeReaction(messageId: string, userId: string): Promise<any> {
    try {
      const message = await this.chatMessageModel.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.reactionsByUser) {
        message.reactionsByUser.delete(userId);
      }

      await message.save();
      return message;
    } catch (error) {
      this.logger.error(`❌ Remove reaction error: ${error.message}`);
      throw error;
    }
  }

  async getWeatherForOrder(orderId: string): Promise<any> {
    return this.weatherService.getWeatherForOrder(orderId);
  }
}
=======
}
>>>>>>> origin/main:apps/backend/gestion-suppliers/src/chat.service.ts
