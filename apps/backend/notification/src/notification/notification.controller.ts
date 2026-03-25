
import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/jwt.guard/jwt.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import { Notification } from 'src/entities/notification.entity';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post()
  async createNotification(@Body() notification : Notification) {

    return await this.notificationService.createNotification(notification);
  }

  @Get()
  async getAllNotifications() {
    return await this.notificationService.getAllNotifications();
  }

  @Get('user/:userId')
  async getNotificationsByUserId(@Param('userId') userId: string) {
    return await this.notificationService.getNotiFicationByUserId(userId);
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
}
