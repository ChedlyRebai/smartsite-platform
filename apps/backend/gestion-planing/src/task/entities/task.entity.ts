import { StatusEnum } from '@/StatusEnum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId , ref: 'Milestone',required:true })
  milestoneId: Types.ObjectId;

  
  @Prop({ type: [String], default: [] })
  assignedUsers: string;

  @Prop()
  priority: string;

  @Prop()
  projectId: string;

  @Prop()
  siteId: string;
  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;

  @Prop({ type:String,enum:StatusEnum,default:StatusEnum.BACKLOG })
  status: StatusEnum;

  @Prop({ default: 0 })
  progress: number;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}
export const TaskSchema = SchemaFactory.createForClass(Task);
