import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class MaterialOrder extends Document {
  @Prop({ required: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ required: true })
  materialName: string;

  @Prop({ required: true })
  materialCode: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  destinationSiteId: Types.ObjectId;

  @Prop({ required: true })
  destinationSiteName: string;

  @Prop({ required: true })
  destinationAddress: string;

  @Prop({ type: Object, required: true })
  destinationCoordinates: { lat: number; lng: number };

  @Prop({ type: Types.ObjectId, ref: 'Fournisseur', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ required: true })
  supplierAddress: string;

  @Prop({ type: Object, required: true })
  supplierCoordinates: { lat: number; lng: number };

  @Prop({ type: Number, default: 0 })
  estimatedDurationMinutes: number;

  @Prop({ type: Number, default: 0 })
  remainingTimeMinutes: number;

  @Prop({ type: Object })
  currentPosition: { lat: number; lng: number };

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({ type: Date })
  scheduledDeparture: Date;

  @Prop({ type: Date })
  scheduledArrival: Date;

  @Prop({ type: Date })
  actualDeparture: Date;

  @Prop({ type: Date })
  actualArrival: Date;

  // ========== CHAMPS TRACKING AJOUTÉS ==========
  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  estimatedArrival?: Date;

  @Prop({ type: Number })
  totalDistance?: number;

  @Prop({ type: Array, default: [] })
  trackingHistory?: Array<{
    timestamp: Date;
    status: string;
    position?: { lat: number; lng: number };
    progress: number;
    message: string;
  }>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: String })
  notes: string;

  // ========== TIMESTAMPS (auto-générés par timestamps: true) ==========
  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;

  // ========== CHAMPS PAIEMENT (AJOUTER) ==========
  @Prop({ type: String })
  paymentId?: string;

  @Prop({ type: Number })
  paymentAmount?: number;

  @Prop({ type: String })
  paymentMethod?: string;

  @Prop({ type: String })
  paymentStatus?: string;
}

export const MaterialOrderSchema = SchemaFactory.createForClass(MaterialOrder);

MaterialOrderSchema.index({ orderNumber: 1 });
MaterialOrderSchema.index({ status: 1 });
MaterialOrderSchema.index({ destinationSiteId: 1 });
MaterialOrderSchema.index({ supplierId: 1 });
