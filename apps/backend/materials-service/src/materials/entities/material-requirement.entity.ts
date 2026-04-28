import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MaterialRequirement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  siteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  initialQuantity: number;

  @Prop({ required: true, min: 0, default: 0 })
  consumedQuantity: number;

  @Prop({ required: true, min: 0 })
  remainingQuantity: number;

  @Prop({ required: true, min: 0, max: 100, default: 0 })
  progressPercentage: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const MaterialRequirementSchema =
  SchemaFactory.createForClass(MaterialRequirement);

// Index compose pour eviter les doublons par (site, material)
MaterialRequirementSchema.index({ siteId: 1, materialId: 1 }, { unique: true });
MaterialRequirementSchema.index({ siteId: 1 });
MaterialRequirementSchema.index({ progressPercentage: 1 });
