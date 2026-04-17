import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CatalogItem extends Document {
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, trim: true })
  unit: string;

  @Prop({ trim: true })
  technicalSpec: string;

  @Prop({ type: String })
  description: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);
