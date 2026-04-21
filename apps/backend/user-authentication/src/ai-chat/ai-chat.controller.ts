import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';

class SendMessageDto {
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.aiChatService.sendMessage(
      dto.message,
      dto.conversationHistory || [],
    );
  }
}
