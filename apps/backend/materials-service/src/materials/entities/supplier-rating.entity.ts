import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SupplierRating extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Material' })
  materialId: Types.ObjectId;

  @Prop({ required: true })
  materialName: string;

  @Prop({ required: true })
  materialCode: string;

  @Prop({ type: Types.ObjectId, required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ type: Types.ObjectId, required: true })
  siteId: Types.ObjectId;

  @Prop({ required: true })
  siteName: string;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, enum: ['POSITIF', 'NEGATIF'] })
  avis: 'POSITIF' | 'NEGATIF';

  @Prop({ required: true, min: 1, max: 5 })
  note: number;

  @Prop()
  commentaire?: string;

  @Prop({ required: true, default: false })
  hasReclamation: boolean;

  @Prop()
  reclamationMotif?: string;

  @Prop()
  reclamationDescription?: string;

  @Prop({ required: true })
  consumptionPercentage: number;

  @Prop({ required: true, default: new Date() })
  ratingDate: Date;

  @Prop({
    required: true,
    enum: ['PENDING', 'REVIEWED', 'RESOLVED'],
    default: 'REVIEWED',
  })
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
}

export const SupplierRatingSchema =
  SchemaFactory.createForClass(SupplierRating);
