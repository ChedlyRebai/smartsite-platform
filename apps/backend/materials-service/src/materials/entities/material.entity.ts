import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MaterialSiteStock extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  reorderPoint: number;

  @Prop({ required: true, min: 0 })
  minimumStock: number;

  @Prop({ required: true, min: 0 })
  maximumStock: number;

  @Prop({ type: Date })
  lastUpdated: Date;
}

export const MaterialSiteStockSchema = SchemaFactory.createForClass(MaterialSiteStock);
MaterialSiteStockSchema.index({ materialId: 1, siteId: 1 }, { unique: true });

@Schema({ timestamps: true })
export class Material extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  minimumStock: number;

  @Prop({ required: true, min: 0 })
  maximumStock: number;

  // ========== NOUVEAU SYSTÈME DE STOCK V2 ==========
  @Prop({ type: Number, default: 0, min: 0 })
  stockEntree: number; // Quantité entrée dans le chantier

  @Prop({ type: Number, default: 0, min: 0 })
  stockSortie: number; // Quantité sortie du chantier

  @Prop({ type: Number, default: 0, min: 0 })
  stockExistant: number; // Quantité déjà présente

  @Prop({ type: Number, default: 0, min: 0 })
  stockMinimum: number; // Stock minimum requis

  // Stock actuel calculé: stockExistant + stockEntree - stockSortie
  @Prop({ type: Number, default: 0, min: 0 })
  stockActuel: number;

  // Besoin de commander ?
  @Prop({ type: Boolean, default: false })
  needsReorder: boolean;

  @Prop({ type: Number, min: 0, max: 1 })
  qualityGrade: number;

  @Prop({ type: String })
  barcode: string;

  @Prop({ type: String })
  qrCode: string;

  @Prop({ type: String })
  qrCodeImage: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fournisseur' }], default: [] })
  preferredSuppliers: Types.ObjectId[];

  @Prop({ type: Object })
  priceHistory?: Record<string, number>;

  @Prop({ type: Date })
  expiryDate: Date;

  @Prop({ type: Date })
  lastOrdered: Date;

  @Prop({ type: Date })
  lastReceived: Date;

  @Prop({ type: Number, default: 0 })
  reservedQuantity: number;

  @Prop({ type: Number, default: 0 })
  damagedQuantity: number;

  @Prop({ type: String, enum: ['active', 'discontinued', 'obsolete'], default: 'active' })
  status: string;

  @Prop({ type: Object })
  specifications: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Site', required: false, index: true })
  siteId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  assignedProjects: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Site' }], default: [] })
  assignedSites: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  reorderCount: number;

  @Prop({ type: Number, default: 1, min: 0 })
  consumptionRate: number;

  @Prop({ type: Date })
  lastCountDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;

  @Prop({ type: [String] })
  images?: string[];

  @Prop({ type: String })
  projectType?: string; // 'residential', 'commercial', 'infrastructure', 'industrial'

  // ========== MOUVEMENTS RÉCENTS ==========
  @Prop({ type: Date })
  lastMovementDate?: Date;

  @Prop({ type: String })
  lastMovementType?: 'IN' | 'OUT';

  // ========== SMART SCORE FIELDS ==========
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  consumptionScore?: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  stockHealthScore?: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  anomaliesScore?: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  siteHealthScore?: number;

  @Prop({ type: Date })
  lastScoreUpdate?: Date;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
MaterialSchema.index({ name: 'text', code: 'text' });
MaterialSchema.index({ category: 1 });
MaterialSchema.index({ status: 1 });
MaterialSchema.index({ assignedSites: 1 });
MaterialSchema.index({ siteId: 1 });
MaterialSchema.index({ siteHealthScore: -1 });