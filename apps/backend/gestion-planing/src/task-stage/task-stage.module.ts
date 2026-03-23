import { Module } from '@nestjs/common';
import { TaskStageService } from './task-stage.service';
import { TaskStageController } from './task-stage.controller';
import { TaskModule } from '@/task/task.module';
import { MilestoneModule } from '@/milestone/milestone.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Milestone,
  MilestoneSchema,
} from '@/milestone/entities/milestone.entity';
import { Task, TaskSchema } from '@/task/entities/task.entity';
import { TaskStage, TaskStageSchema } from './entities/TaskStage.entities';

@Module({
  imports: [
    TaskStageModule,
    TaskModule,
    MilestoneModule,

    MongooseModule.forFeature([
      { name: Milestone.name, schema: MilestoneSchema },
      { name: Task.name, schema: TaskSchema },
      { name: TaskStage.name, schema: TaskStageSchema },
    ]),
  ],
  providers: [TaskStageService],
  controllers: [TaskStageController],
})
export class TaskStageModule {}
