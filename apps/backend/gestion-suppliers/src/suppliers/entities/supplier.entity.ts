import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

export enum SupplierCategory {
  MATERIALS = 'Materials',
  EQUIPMENT_RENTAL = 'Equipment Rental',
  TRANSPORT = 'Transport',
  SUBCONTRACTING = 'Subcontracting',
  SAFETY_EQUIPMENT = 'Safety Equipment',
  OFFICE_SUPPLIES = 'Office Supplies',
  ENERGY = 'Energy',
  OTHER = 'Other',
}

export enum SupplierStatus {
  PENDING_QHSE = 'pending_qhse',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, unique: true })
  supplierCode: string; // Auto-generated: FRS-2026-001

  @Prop({ required: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ required: true, enum: SupplierCategory })
  category: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, minlength: 5, maxlength: 255 })
  address: string;

  @Prop({ required: true, match: /^[0-9]{14}$/ })
  siret: string;

  @Prop({ required: true })
  contractUrl: string; // Path to uploaded contract file

  @Prop({ required: true })
  insuranceDocumentUrl: string; // Path to uploaded insurance document file

  @Prop({
    type: String,
    enum: SupplierStatus,
    default: SupplierStatus.PENDING_QHSE,
  })
  status: string;

  @Prop({ required: true })
  createdBy: string; // User ID of the procurement manager

  @Prop()
  createdByName: string; // Name of the procurement manager

  @Prop()
  qhseValidatedBy: string; // User ID of QHSE manager who approved/rejected

  @Prop()
  qhseValidatedAt: Date;

  @Prop()
  qhseNotes: string; // Notes from QHSE manager

  @Prop({ type: Boolean, default: false })
  estArchive: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
