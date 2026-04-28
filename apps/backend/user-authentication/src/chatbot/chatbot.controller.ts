import { Controller, Post, Get, Delete, Body, Query, UseGuards, Req, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto, GetConversationDto, FeedbackDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly configService: ConfigService,
  ) {}

  @Get('api-status')
  async getApiStatus() {
    const googleKey = this.configService.get<string>('GOOGLE_CLOUD_VISION_API_KEY') || '';
    const imaggaKey = this.configService.get<string>('IMAGGA_API_KEY') || '';
    const imaggaSecret = this.configService.get<string>('IMAGGA_API_SECRET') || '';
    
    return {
      success: true,
      data: {
        googleCloudConfigured: !!(googleKey && googleKey.length > 0),
        imaggaConfigured: !!(imaggaKey && imaggaSecret && imaggaKey.length > 0 && imaggaSecret.length > 0),
      }
    };
  }

  @Put('api-keys')
  @UseGuards(JwtAuthGuard)
  async updateApiKeys(@Body() body: { googleKey?: string; imaggaKey?: string; imaggaSecret?: string }) {
    // Note: This would require persisting to a database in production
    // For now, return instructions
    return {
      success: false,
      message: 'API keys must be configured in the .env file. Please update the following variables:\n\n- GOOGLE_CLOUD_VISION_API_KEY\n- IMAGGA_API_KEY\n- IMAGGA_API_SECRET\n\nThen restart the backend.',
      data: {
        instructions: [
          '1. Edit .env file in apps/backend/user-authentication/',
          '2. Add your API keys',
          '3. Restart the backend server',
        ]
      }
    };
  }

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendMessageDto,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const userRole = req.user?.role?.name || 'user';
      console.log(`**********************************************************************Processing quick command: ${userId} with role: ${userRole}`);
  
    return this.chatbotService.sendMessage(userId, userRole, dto);
  }

  // @Post('voice')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // @UseInterceptors(FileInterceptor('audio', {
  //   storage: diskStorage({
  //     destination: './uploads',
  //     filename: (req, file, cb) => {
  //       const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
  //       cb(null, `${randomName}${extname(file.originalname)}`);
  //     }
  //   })
  // }))
  async processVoice(
    @Req() req: any,
    @UploadedFile() audio: any,
    @Body('language') language: string = 'en',
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const userRole = req.user?.role?.name || 'user';
    return this.chatbotService.processVoiceMessage(userId, userRole, audio, language);
  }

  // @Post('analyze-image')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // @UseInterceptors(FileInterceptor('image', {
  //   storage: diskStorage({
  //     destination: './uploads',
  //     filename: (req, file, cb) => {
  //       const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
  //       cb(null, `${randomName}${extname(file.originalname)}`);
  //     }
  //   }),
  //   fileFilter: (req: any, file: any, cb: any) => {
  //     if (file.mimetype.startsWith('image/')) {
  //       cb(null, true);
  //     } else {
  //       cb(new Error('Only image files are allowed'), false);
  //     }
  //   }
  // }))
  async analyzeImage(
    @Req() req: any,
    @UploadedFile() image: any,
    @Body('language') language: string = 'en',
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const userRole = req.user?.role?.name || 'user';
    return this.chatbotService.analyzeImage(userId, userRole, image, language);
  }

  @Post('quick-command')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async processQuickCommand(
    @Req() req: any,
    @Body() body: { command: string; language?: string },
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const userRole = req.user?.role?.name || 'user';
    const { command, language = 'en' } = body;
    console.log(`Processing quick command: ${command} with language: ${language} for user: ${userId} with role: ${userRole}`);
    return this.chatbotService.processQuickCommand(userId, userRole, command, language);
  }

  @Get('conversation')
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @Req() req: any,
    @Query() query: GetConversationDto,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.getConversation(userId, query.conversationId, query.limit ? parseInt(query.limit) : undefined);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.getConversations(userId, limit ? parseInt(limit) : 10);
  }

  @Delete('conversation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async deleteConversation(
    @Req() req: any,
    @Query('conversationId') conversationId: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.deleteConversation(userId, conversationId);
  }

  @Put('conversation/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async restoreConversation(
    @Req() req: any,
    @Query('conversationId') conversationId: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.restoreConversation(userId, conversationId);
  }

  @Delete('conversation/permanent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async permanentlyDeleteConversation(
    @Req() req: any,
    @Query('conversationId') conversationId: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.permanentlyDeleteConversation(userId, conversationId);
  }

  @Get('conversations/archived')
  @UseGuards(JwtAuthGuard)
  async getArchivedConversations(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.getArchivedConversations(userId, limit ? parseInt(limit) : 20);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async submitFeedback(
    @Req() req: any,
    @Body() dto: FeedbackDto,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    return this.chatbotService.submitFeedback(userId, dto);
  }

  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  async getSuggestedQuestions(
    @Query('language') language?: string,
  ) {
    return this.chatbotService.getSuggestedQuestions(language || 'en');
  }
}
