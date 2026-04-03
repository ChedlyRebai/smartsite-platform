import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/jwt.guard/jwt.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import { Notification } from 'src/entities/notification.entity';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  async createNotification(@Body() notification: Notification) {
    return await this.notificationService.createNotification(notification);
  }

  @Get()
  async getAllNotifications(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return await this.notificationService.getAllNotificationsPaginated(
      Number(page),
      Number(limit),
    );
  }

  @Get('user/:userId')
  async getNotificationsByUserId(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return await this.notificationService.getNotificationsByRecipientIdPaginated(
      userId,
      Number(page),
      Number(limit),
    );
  }

  @Get('team/:teamId')
  async getNotificationsByTeamId(
    @Param('teamId') teamId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return await this.notificationService.getNotificationsByRecipientIdPaginated(
      teamId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtGuard)
  @Get('mynotifications')
  async getMyNotifications(@GetUser() user: any) {
    const userId = user?.sub || user?.userId || user?.id || user?._id;
    console.log('Extracted user ID from token payload:', user);
    if (!userId) {
      throw new UnauthorizedException('User ID missing in token payload');
    }

    return await this.notificationService.getNotiFicationByUserId(userId);
  }
  @UseGuards(JwtGuard)
  @Get('unread')
  async getUnreadNotificationsByUserId(
    @GetUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const userId = user?.sub || user?.userId || user?.id || user?._id;
    console.log('Extracted user ID from token payload:', user);
    if (!userId) {
      throw new UnauthorizedException('User ID missing in token payload');
    }
    return await this.notificationService.getUnreadNotificationsByUserIdPaginated(
      userId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtGuard)
  @Get('team/:teamId/unread')
  async getUnreadNotificationsByTeamId(
    @Param('teamId') teamId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return await this.notificationService.getUnreadNotificationsByTeamIdPaginated(
      teamId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtGuard)
  @Get('read')
  async getReadNotificationsByUserId(
    @GetUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const userId = user?.sub || user?.userId || user?.id || user?._id;
    console.log('Extracted user ID from token payload:', user);
    if (!userId) {
      throw new UnauthorizedException('User ID missing in token payload');
    }
    return await this.notificationService.getReadNotificationsByUserIdPaginated(
      userId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtGuard)
  @Get('team/:teamId/read')
  async getReadNotificationsByTeamId(
    @Param('teamId') teamId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return await this.notificationService.getReadNotificationsByTeamIdPaginated(
      teamId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtGuard)
  @Get('unread-count')
  async getUnreadNotificationLengthByserId(@GetUser() user: any) {
    const userId = user?.sub || user?.userId || user?.id || user?._id;
    console.log('Extracted user ID from token payload:', user);
    if (!userId) {
      throw new UnauthorizedException('User ID missing in token payload');
    }
    return await this.notificationService.getUnreadNotificationLengthByserId(
      userId,
    );
  }

  @UseGuards(JwtGuard)
  @Get('team/:teamId/unread-count')
  async getUnreadNotificationLengthByTeamId(@Param('teamId') teamId: string) {
    return await this.notificationService.getUnreadNotificationLengthByTeamId(
      teamId,
    );
  }

  @UseGuards(JwtGuard)
  @Post('team/:teamId/mark-all-read')
  async markAllTeamNotificationsAsRead(@Param('teamId') teamId: string) {
    return await this.notificationService.markAllAsReadByTeamId(teamId);
  }


  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return await this.notificationService.deleteNotificationById(id);
  }
}
