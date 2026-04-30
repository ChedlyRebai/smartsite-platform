import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Article extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  designation: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  unite: string; // kg, m3, tonne, piece, ml, m2, sachet, rouleau

  // Catégories matériaux spécifiques au BTP
  @Prop({
    type: String,
    enum: [
      "béton",
      "fer",
      "acier",
      "électricité",
      "plomberie",
      "bois",
      "sable",
      "gravier",
      "ciment",
      "brique",
      "carrelage",
      "peinture",
      "isolation",
      "toiture",
      "menuiserie",
      "vitrerie",
      "équipements",
      "services",
      "autres",
    ],
    default: "autres",
  })
  categorie: string;

  @Prop()
  sousCategorie: string; // Sous-catégorie spécifique

  @Prop()
  marque: string;

  @Prop()
  referenceFournisseur: string;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: Number, default: 0 })
  stockMinimum: number;

  @Prop({ type: Number, default: 0 })
  prixReference: number; // Prix de référence

  @Prop({ type: Number, default: 19 })
  tauxTva: number; // TVA par défaut 19%

  @Prop()
  uniteStock: string; // Unité de stockage

  @Prop()
  origine: string; // Pays d'origine

  @Prop()
  reference: string; // Référence interne

  @Prop({ type: Boolean, default: true })
  estActif: boolean;

  @Prop()
  notes: string;

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags pour recherche
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
