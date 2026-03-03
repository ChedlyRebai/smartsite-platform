import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'sites' })
export class Site extends Document {
  @Prop({ required: true, trim: true, index: true })
  nom: string;

  @Prop({ required: true, trim: true })
  adresse: string;

  @Prop({ required: true, trim: true, index: true })
  localisation: string;

  @Prop({ required: true, type: Number, min: 0 })
  budget: number;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true, index: true })
  isActif: boolean;

  // Frontend fields
  @Prop({ type: Number, default: 0 })
  area: number;

  @Prop({ type: String, enum: ['planning', 'in_progress', 'on_hold', 'completed'], default: 'planning' })
  status: string;

  @Prop({ type: Number, default: 0 })
  progress: number;

  @Prop({ type: Date })
  workStartDate: Date;

  @Prop({ type: Date })
  workEndDate: Date;

  @Prop({ type: String })
  projectId: string;

  @Prop({ type: Object })
  coordinates: { lat: number; lng: number };

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy?: Types.ObjectId;

  // Team assignment fields
  // References to individual users (foremen/workers) - uses UserSimple
  @Prop({ type: [{ type: Types.ObjectId, ref: 'UserSimple' }], default: [] })
  teams: Types.ObjectId[];

  // References to MongoDB Teams (team documents)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Team' }], default: [] })
  teamIds: Types.ObjectId[];

  // Virtual for formatted budget
  get formattedBudget(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(this.budget);
  }
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// Add virtuals to JSON - use any type to avoid TypeScript issues
SiteSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    // Rename _id to id
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

SiteSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id ? ret._id.toString() : undefined;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
