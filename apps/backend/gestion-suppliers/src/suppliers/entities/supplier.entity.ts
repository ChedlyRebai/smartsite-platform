import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  telephone: string;

  @Prop()
  adresse: string;

  @Prop()
  ville: string;

  @Prop()
  codePostal: string;

  @Prop()
  pays: string;

  @Prop()
  siteWeb: string;

  @Prop()
  contactPrincipal: string;

  @Prop({ type: [String] })
  specialites: string[];

  @Prop({ default: 'actif' })
  statut: string;

  @Prop({ type: Number, default: 7 })
  delaiLivraison: number; // en jours

  @Prop({ type: Number, min: 1, max: 5, default: 3 })
  evaluation: number;

  @Prop()
  notes: string;

  @Prop({ type: [Types.ObjectId] })
  materialsSupplied: Types.ObjectId[]; // IDs des matériaux fournis

  @Prop({ type: Object })
  coordonnees: {
    latitude?: number;
    longitude?: number;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);