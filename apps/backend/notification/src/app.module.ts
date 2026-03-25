import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './notification/notification.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    NotificationModule,

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    Notification,
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite',
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
