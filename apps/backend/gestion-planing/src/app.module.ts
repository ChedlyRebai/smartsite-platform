import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { MilestoneModule } from './milestone/milestone.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

import { TaskStageModule } from './task-stage/task-stage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
   MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite',
    ),
    TaskModule,
    MilestoneModule,
    AuthModule,
    TaskStageModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
