import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Material extends Document {
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: ['bag', 'kg', 'm²', 'ton', 'piece'],
    trim: true,
  })
  unit: string;

  @Prop({ required: true, min: 0 })
  estimated_price: number;

  @Prop({ required: true, min: 0 })
  alert_threshold: number;

  @Prop({ required: true, type: Types.ObjectId })
  supplier_id: Types.ObjectId;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

// Indexes
MaterialSchema.index({ code: 1 });
MaterialSchema.index({ supplier_id: 1 });
MaterialSchema.index({ is_active: 1 });
