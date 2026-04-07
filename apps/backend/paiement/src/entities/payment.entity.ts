import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'payments' })
export class Payment extends Document {
  // siteId references a Site document owned by another microservice — no ref/populate here
  @Prop({ required: true, type: Types.ObjectId, index: true })
  siteId: Types.ObjectId;

  @Prop({ trim: true })
  reference?: string;

  @Prop({ required: true, type: Number, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true })
  paymentMethod: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, type: Date, default: Date.now })
  paymentDate: Date;

  @Prop({ type: String, enum: ['pending', 'completed', 'cancelled', 'refunded', 'paid'], default: 'pending' })
  status: string;

  @Prop({ type: Number, min: 0 })
  siteBudget: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy?: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

PaymentSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
