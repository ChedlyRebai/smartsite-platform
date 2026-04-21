import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private client: OpenAI;
  private readonly systemPrompt = 'You are a helpful assistant for the SmartSite project management service. You help users manage construction projects, timelines, and budgets.';

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

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content || '';
      return { success: true, data: { reply } };
    } catch (error: any) {
      this.logger.error('Groq API error:', error?.message || error);
      return { success: false, message: error?.message || 'Failed to get response from AI.' };
    }
  }
}
