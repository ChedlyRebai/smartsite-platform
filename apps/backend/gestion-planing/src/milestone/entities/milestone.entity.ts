import { Task } from '@/task/entities/task.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Milestone extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], required: true })
  tasks: Types.ObjectId[] | Task[];

  @Prop()
  description: string;

  @Prop()
  projectId: string;

  @Prop()
  siteId: string;   

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}


export const MilestoneSchema = SchemaFactory.createForClass(Milestone);