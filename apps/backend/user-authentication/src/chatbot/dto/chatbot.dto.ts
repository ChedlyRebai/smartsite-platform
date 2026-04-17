import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
} from 'class-validator';

export class SendMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(['en', 'fr', 'ar'])
  language?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  intent?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class GetConversationDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class ChatbotResponseDto {
  success: boolean;
  message: string;
  data?: {
    conversationId: string;
    responses: string[];
    suggestions?: string[];
    quickReplies?: string[];
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

export class SuggestedQuestionsDto {
  @IsArray()
  @IsString({ each: true })
  questions: string[];
}

export class FeedbackDto {
  @IsString()
  conversationId: string;

  @IsString()
  messageId: string;

  @IsString()
  feedback: 'positive' | 'negative';

  @IsOptional()
  @IsString()
  comment?: string;
}
