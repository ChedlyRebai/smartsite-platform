import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FlowType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  RETURN = 'RETURN',
  RESERVE = 'RESERVE',
  DAILY_CONSUMPTION = 'DAILY_CONSUMPTION',
}

export enum AnomalyType {
  NORMAL = 'normal',
  VOL = 'vol',
  THEFT = 'theft',
  WASTE = 'waste',
  OVER_CONSUMPTION = 'over_consumption',
  PROBLEME = 'probleme',
  NONE = 'none',
}

export enum AnomalySeverity {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum SourceCollection {
  MATERIAL_FLOW_LOG = 'MaterialFlowLog',
  DAILY_CONSUMPTION_LOG = 'DailyConsumptionLog',
  DIRECT = 'direct',
}

@Schema({ timestamps: true })
export class ConsumptionHistory extends Document {
  // Identification
  @Prop({ type: Types.ObjectId, ref: 'Material', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ required: true })
  materialName: string;

  @Prop({ required: true })
  materialCode: string;

  @Prop({ required: true })
  materialCategory: string;

  @Prop({ required: true })
  materialUnit: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  siteId: Types.ObjectId;

  @Prop()
  siteName: string;

  // Données de consommation
  @Prop({ type: Date, required: true, index: true })
  date: Date;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ type: String, enum: Object.values(FlowType), required: true, index: true })
  flowType: FlowType;

  // Analyse d'anomalie
  @Prop({ default: 0 })
  expectedQuantity: number;

  @Prop({ default: 0, min: 0, max: 100 })
  anomalyScore: number;

  @Prop({ type: String, enum: Object.values(AnomalyType), default: AnomalyType.NONE, index: true })
  anomalyType: AnomalyType;

  @Prop({ type: String, enum: Object.values(AnomalySeverity), default: AnomalySeverity.NONE })
  anomalySeverity: AnomalySeverity;

  // Stock au moment de l'événement
  @Prop({ default: 0 })
  stockBefore: number;

  @Prop({ default: 0 })
  stockAfter: number;

  // Source de la donnée (pour traçabilité)
  @Prop({ type: String, enum: Object.values(SourceCollection), required: true })
  sourceCollection: SourceCollection;

  @Prop({ type: Types.ObjectId })
  sourceId: Types.ObjectId;

  // Métadonnées
  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy: Types.ObjectId;

  @Prop()
  reason: string;

  @Prop()
  reference: string;

  @Prop()
  projectId: string;
}

export const ConsumptionHistorySchema = SchemaFactory.createForClass(ConsumptionHistory);

// Index composés pour optimiser les requêtes
ConsumptionHistorySchema.index({ materialId: 1, date: -1 });
ConsumptionHistorySchema.index({ siteId: 1, date: -1 });
ConsumptionHistorySchema.index({ date: -1 });
ConsumptionHistorySchema.index({ anomalyType: 1, date: -1 });
ConsumptionHistorySchema.index({ flowType: 1, date: -1 });
ConsumptionHistorySchema.index({ materialId: 1, siteId: 1, date: -1 });
