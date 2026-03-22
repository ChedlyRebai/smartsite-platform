import { Module } from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStageController } from './task-stage.controller';

@Module({
  providers: [TaskStageService],
  controllers: [TaskStageController]
})
export class TaskStageModule {}
