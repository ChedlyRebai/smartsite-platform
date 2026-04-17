import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Site extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({
    required: true,
    type: {
      lat: Number,
      lng: Number,
    },
  })
  coordinates: {
    lat: number;
    lng: number;
  };

  @Prop({ required: true, min: 0 })
  area: number;

  @Prop({
    required: true,
    enum: ['planning', 'in_progress', 'on_hold', 'completed'],
    default: 'planning',
  })
  status: string;

  @Prop({ required: true, type: Date })
  workStartDate: Date;

  @Prop({ required: false, type: Date })
  workEndDate?: Date;

  @Prop({ required: true, type: Types.ObjectId })
  projectId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  budget: number;

  @Prop({ required: true, min: 0, max: 100 })
  progress: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId; // L'utilisateur qui a créé le site

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// Indexes
SiteSchema.index({ name: 1 });
SiteSchema.index({ createdBy: 1 });
SiteSchema.index({ status: 1 });
SiteSchema.index({ projectId: 1 });
