import { Module } from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { MilestoneController } from './milestone.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Milestone, MilestoneSchema } from './entities/milestone.entity';
import { Task, TaskSchema } from '@/task/entities/task.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Milestone.name, schema: MilestoneSchema },

      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [MilestoneController],
  providers: [MilestoneService],
})
export class MilestoneModule {}
