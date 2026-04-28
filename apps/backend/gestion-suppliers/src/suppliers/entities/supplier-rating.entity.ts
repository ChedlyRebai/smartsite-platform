import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupplierRatingDocument = SupplierRating & Document;

@Schema({ timestamps: true })
export class SupplierRating {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, enum: ['procurement_manager', 'site_manager', 'project_manager', 'qhse_manager'] })
  userRole: string;

  @Prop({ type: Object, required: true })
  ratings: Record<string, number>;

  @Prop()
  comment?: string;
}

export const SupplierRatingSchema = SchemaFactory.createForClass(SupplierRating);