import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AiMessageAnalyzerService } from './ai-message-analyzer.service';
import { WeatherService } from './weather.service';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
      {
        name: 'MaterialOrder',
        schema: require('../materials/entities/material-order.entity')
          .MaterialOrderSchema,
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    AiMessageAnalyzerService,
    WeatherService,
  ],
  exports: [ChatService, ChatGateway, AiMessageAnalyzerService, WeatherService],
})
export class ChatModule {}