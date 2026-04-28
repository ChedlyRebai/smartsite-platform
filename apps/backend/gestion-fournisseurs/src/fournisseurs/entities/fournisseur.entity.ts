import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Fournisseur extends Document {
  @Prop({ required: true, unique: true })
  nom: string;

  @Prop()
  adresse: string;

  @Prop()
  ville: string;

  @Prop()
  codePostal: string;

  @Prop()
  pays: string;

  @Prop()
  zoneGeographique: string; // Zone géographique de livraison

  @Prop()
  telephone: string;

  @Prop()
  email: string;

  @Prop()
  siteWeb: string;

  // Identifiants légales
  @Prop()
  registreCommerce: string; // RC

  @Prop()
  matriculeFiscale: string; // MF

  @Prop()
  nif: string; // NIF (Numéro d'Identification Fiscale)

  @Prop()
  nis: string; // NIS (Numéro d'Identification Statistique)

  @Prop()
  siret: string; // SIRET

  @Prop()
  iban: string; // IBAN

  @Prop()
  banque: string;

  // Conditions commerciales
  @Prop({ type: String, default: "30 jours" })
  conditionsPaiement: string; // Délai de paiement

  @Prop({ type: Number, default: 0 })
  delaiLivraison: number; // en jours

  @Prop({ type: Number, default: 0 })
  remise: number; // Pourcentage de remise

  // Notes et évaluation
  @Prop({ type: Number, default: 0 })
  noteFiabilite: number; // 0-5 étoiles

  @Prop({ type: Number, default: 0 })
  noteQualite: number; // Note de qualité 0-5

  @Prop({ type: Number, default: 0 })
  noteRespectDelais: number; // Respect des délais 0-5

  @Prop()
  notes: string;

  // Statut du fournisseur
  @Prop({
    type: String,
    enum: ["preferentiel", "occasionnel", "a_risque", "inactif"],
    default: "occasionnel",
  })
  statut: string;

  @Prop({ type: Boolean, default: true })
  estActif: boolean;

  @Prop({ type: Boolean, default: false })
  estArchive: boolean;

  // Catégories (matériaux spécifiques)
  @Prop({ type: [String], default: [] })
  categories: string[]; // béton, fer, électricité, plomberie, bois...

  // Contacts multiples
  @Prop({
    type: [
      {
        nom: String,
        fonction: String,
        telephone: String,
        email: String,
        estPrincipal: Boolean,
      },
    ],
    default: [],
  })
  contacts: {
    nom: string;
    fonction: string;
    telephone: string;
    email: string;
    estPrincipal: boolean;
  }[];

  // Historique des interactions
  @Prop({
    type: [
      {
        date: Date,
        type: String, // 'commande', 'retard', 'reclamation', 'paiement'
        description: String,
        montant: Number,
        evaluation: Number, // note donnée
      },
    ],
    default: [],
  })
  historiqueInteractions: {
    date: Date;
    type: string;
    description: string;
    montant?: number;
    evaluation?: number;
  }[];

  // Données financières
  @Prop({ type: Number, default: 0 })
  chiffreAffaires: number;

  @Prop()
  dateDerniereCommande: Date;

  @Prop({ type: Number, default: 0 })
  nombreRetards: number;

  @Prop()
  personneContact: string;

  @Prop()
  telephoneContact: string;

  @Prop({ type: Object })
  coordinates: { lat: number; lng: number };
}

export const FournisseurSchema = SchemaFactory.createForClass(Fournisseur);
