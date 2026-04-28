import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

class SendMessageDto {
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto.message, dto.conversationHistory || []);
  }
}