import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { Notification as Notif, NotificationSchema} from 'src/entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notif.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    NotificationService,
    // JwtModule.register({
    //   secret: 'smartiste',
    //   signOptions: { expiresIn: '24h' },
    // }),
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
