import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FlowType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  RETURN = 'RETURN',
  RESERVE = 'RESERVE',
}

export enum AnomalyType {
  NONE = 'NONE',
  EXCESSIVE_OUT = 'EXCESSIVE_OUT', // Sortie > usage normal
  EXCESSIVE_IN = 'EXCESSIVE_IN', // Entrée > quantité attendue
  UNEXPECTED_MOVEMENT = 'UNEXPECTED_MOVEMENT',
  BELOW_SAFETY_STOCK = 'BELOW_SAFETY_STOCK',
}

@Schema({ timestamps: true })
export class MaterialFlowLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(FlowType) })
  type: FlowType;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Number })
  previousStock: number;

  @Prop({ type: Number })
  newStock: number;

  @Prop({ type: String })
  reason?: string;

  @Prop({
    type: String,
    enum: Object.values(AnomalyType),
    default: AnomalyType.NONE,
  })
  anomalyDetected: AnomalyType;

  @Prop({ type: Boolean, default: false })
  emailSent: boolean;

  @Prop({ type: String })
  anomalyMessage?: string;

  @Prop({ type: String })
  projectId?: string;

  @Prop({ type: String })
  reference?: string;
}

export const MaterialFlowLogSchema =
  SchemaFactory.createForClass(MaterialFlowLog);

// Indexes pour les recherches rapides
MaterialFlowLogSchema.index({ siteId: 1, materialId: 1 });
MaterialFlowLogSchema.index({ timestamp: -1 });
MaterialFlowLogSchema.index({ anomalyDetected: 1 });
MaterialFlowLogSchema.index({ type: 1 });
