import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Milestone, MilestoneSchema } from '@/milestone/entities/milestone.entity';
import { Task, TaskSchema } from './entities/task.entity';
import { TaskStage, TaskStageSchema } from '@/task-stage/entities/TaskStage.entities';

@Module({
  imports: [
      MongooseModule.forFeature([
        { name: Milestone.name, schema: MilestoneSchema },
        { name: Task.name, schema: TaskSchema },
        { name: TaskStage.name, schema: TaskStageSchema },
      ]),
    ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
