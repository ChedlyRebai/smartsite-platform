import { StatusEnum } from '../../StatusEnum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskTypeEnum } from './TaskTypeEnum';
import { TaskPriorityEnum } from './TaskPriorityEnum';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'Milestone', required: true })
  milestoneId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  assignedTeams!: string[];

  @Prop({ type: String, enum: TaskPriorityEnum, default: TaskPriorityEnum.MEDIUM })
  priority!: TaskPriorityEnum;

  @Prop({ type: String, enum: TaskTypeEnum, default: TaskTypeEnum.TASK })
  type: string;

  @Prop()
  projectId: string;

  @Prop()
  siteId: string;
  
  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;

  // @Prop({ type: String, enum: StatusEnum, default: StatusEnum.BACKLOG })
  // status: StatusEnum;


  @Prop({ type: Types.ObjectId, ref: 'TaskStage' })
  status: Types.ObjectId;

  @Prop({ default: 0 })
  progress: number;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: false })
  parent: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Task', required: false })
  subtasks: Types.ObjectId[];
}
export const TaskSchema = SchemaFactory.createForClass(Task);
