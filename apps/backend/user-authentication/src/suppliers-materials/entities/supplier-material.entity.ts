import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SupplierMaterial extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CatalogItem', required: true })
  catalogItemId: Types.ObjectId;

  @Prop({ trim: true })
  supplierRef: string;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true, enum: ['DT', 'EUR', 'USD'], default: 'DT' })
  currency: string;

  @Prop()
  deliveryDays: number;

  @Prop({ required: true, enum: ['available', 'limited', 'unavailable'], default: 'available' })
  availability: string;

  @Prop({ min: 0, max: 10 })
  qualityScore: number;

  @Prop({ default: false })
  isPreferred: boolean;

  @Prop({ type: String })
  notes: string;
}

export const SupplierMaterialSchema = SchemaFactory.createForClass(SupplierMaterial);