import { StatusEnum } from '@/StatusEnum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TaskStage extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  color: string;

  @Prop()
  order: number;

  @Prop({ type: Types.ObjectId, ref: 'Milestone', required: true })
  milestoneId: Types.ObjectId;
  @Prop()
  projectId: string;

  @Prop({ type: [Types.ObjectId], ref: 'Task' })
  tasks: Types.ObjectId[];

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const TaskStageSchema = SchemaFactory.createForClass(TaskStage);
