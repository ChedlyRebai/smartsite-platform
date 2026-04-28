import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class PrixArticle extends Document {
  @Prop({ type: Types.ObjectId, ref: "Fournisseur", required: true })
  fournisseurId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Article", required: true })
  articleId: Types.ObjectId;

  @Prop({ required: true })
  prixUnitaire: number;

  @Prop({ type: Number, default: 19 }) // TVA par défaut 19%
  tauxTva: number;

  @Prop()
  dateDebut: Date;

  @Prop()
  dateFin: Date;

  @Prop({ type: Boolean, default: true })
  estActif: boolean;

  @Prop()
  notes: string;

  // Pour l'historique des prix
  @Prop({ type: Number })
  prixPrecedent: number;

  @Prop()
  dateModification: Date;
}

export const PrixArticleSchema = SchemaFactory.createForClass(PrixArticle);

// Index pour optimiser les requêtes
PrixArticleSchema.index({ fournisseurId: 1, articleId: 1 });
PrixArticleSchema.index({ articleId: 1 });
