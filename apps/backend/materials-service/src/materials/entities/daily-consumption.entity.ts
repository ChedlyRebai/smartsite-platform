import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DailyConsumptionLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Material', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  date: Date;

  @Prop({ required: true, min: 0 })
  quantityUsed: number;

  @Prop({ required: true, min: 0 })
  expectedConsumption: number;

  @Prop({ min: 0, max: 100, default: 0 })
  anomalyScore: number;

  @Prop({ type: String, enum: ['vol', 'probleme', 'normal'], default: 'normal' })
  anomalyType: string;

  @Prop({ type: String })
  anomalyReason: string;

  @Prop({ type: Boolean, default: false })
  emailSent: boolean;

  @Prop({ type: Date })
  emailSentAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy: Types.ObjectId;
}

export const DailyConsumptionLogSchema = SchemaFactory.createForClass(DailyConsumptionLog);

DailyConsumptionLogSchema.index({ materialId: 1, siteId: 1, date: 1 }, { unique: true });
DailyConsumptionLogSchema.index({ date: -1 });
DailyConsumptionLogSchema.index({ anomalyType: 1 });
