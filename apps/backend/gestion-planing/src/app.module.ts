import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { MilestoneModule } from './milestone/milestone.module';

@Module({
  imports: [TaskModule, MilestoneModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
