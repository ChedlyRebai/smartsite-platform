import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    RabbitMQModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}