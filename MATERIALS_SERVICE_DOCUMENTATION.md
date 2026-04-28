# DOCUMENTATION TECHNIQUE — materials-service

**Version:** 0.0.1  
**Port:** 3002  
**Base de données:** MongoDB  
**Dernière mise à jour:** 26 avril 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture & Structure](#2-architecture--structure)
3. [Modèles de données (Schemas Mongoose)](#3-modèles-de-données-schemas-mongoose)
4. [API REST — Endpoints complets](#4-api-rest--endpoints-complets)
5. [WebSocket — Events Socket.IO](#5-websocket--events-socketio)
6. [Logique Métier détaillée](#6-logique-métier-détaillée)
7. [Module IA/ML (TensorFlow.js)](#7-module-iaml-tensorflowjs)
8. [Module Chat](#8-module-chat)
9. [Module Paiement (Stripe)](#9-module-paiement-stripe)
10. [Authentification & Sécurité](#10-authentification--sécurité)
11. [Gestion des fichiers](#11-gestion-des-fichiers)
12. [Import / Export](#12-import--export)
13. [Flux métier complets (end-to-end)](#13-flux-métier-complets-end-to-end)
14. [Points d'attention & Problèmes identifiés](#14-points-dattention--problèmes-identifiés)
15. [Métriques de couverture](#15-métriques-de-couverture)

---

## 1. Vue d'ensemble

### 1.1 Rôle du service

Le **materials-service** est un microservice NestJS responsable de la **gestion complète des matériaux de construction** dans la plateforme SmartSite. Il gère :

- **Inventaire des matériaux** : création, modification, suppression, recherche
- **Gestion des stocks** : entrées, sorties, réservations, ajustements
- **Prédictions IA/ML** : prévision de rupture de stock avec TensorFlow.js
- **Commandes fournisseurs** : création, suivi GPS en temps réel, livraison
- **Chat temps réel** : communication entre chantier et fournisseur avec analyse IA des messages
- **Paiements** : intégration Stripe pour paiement à l'arrivée
- **Alertes anomalies** : détection automatique de consommation anormale avec envoi d'emails
- **Import/Export** : Excel et PDF pour inventaire
- **QR Codes** : génération et scan pour identification rapide

### 1.2 Configuration réseau

| Paramètre | Valeur |
|-----------|--------|
| **Port** | 3002 |
| **Préfixe API** | `/api` |
| **URL complète** | `http://localhost:3002/api` |
| **CORS Origins** | `http://localhost:5173`, `5174`, `5175`, `3000`, `3001`, `3002` |
| **CORS Credentials** | `true` |
| **Méthodes HTTP autorisées** | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS` |
| **Headers autorisés** | `Content-Type`, `Authorization`, `Accept` |

### 1.3 Modules et responsabilités

| Module | Responsabilité |
|--------|----------------|
| **MaterialsModule** | Module principal, gestion matériaux, stocks, prédictions ML |
| **ChatModule** | Communication temps réel WebSocket, analyse IA des messages |
| **PaymentModule** | Intégration Stripe, paiements, factures |
| **SitesModule** | Connexion MongoDB externe pour récupérer les sites |
| **AuthModule** | Stratégie JWT (non implémenté complètement) |

### 1.4 Stack technique

```json
{
  "runtime": "Node.js",
  "framework": "NestJS 11.0.1",
  "language": "TypeScript 5.7.3",
  "database": "MongoDB (Mongoose 9.2.3)",
  "websocket": "Socket.IO 4.8.3",
  "ai_ml": "TensorFlow.js 4.22.0",
  "payment": "Stripe (via microservice externe)",
  "qrcode": "qrcode 1.5.4 + jsqr 1.4.0",
  "excel": "xlsx 0.18.5",
  "pdf": "pdfkit 0.18.0",
  "email": "nodemailer 8.0.5",
  "ai_chat": "OpenAI 6.34.0 (GPT-4o-mini)",
  "http_client": "@nestjs/axios 4.0.1",
  "cache": "@nestjs/cache-manager 3.1.0",
  "scheduler": "@nestjs/schedule 6.1.1",
  "validation": "class-validator 0.15.1 + class-transformer 0.5.1"
}
```

---

## 2. Architecture & Structure

### 2.1 Arborescence des fichiers

```
apps/backend/materials-service/
├── src/
│   ├── main.ts                          # Point d'entrée, config CORS, pipes globaux
│   ├── app.module.ts                    # Module racine (vide, non utilisé)
│   │
│   ├── materials/                       # MODULE PRINCIPAL
│   │   ├── materials.module.ts          # Configuration Mongoose, Multer, imports
│   │   ├── materials.controller.ts      # 40+ endpoints REST
│   │   ├── materials.service.ts         # Logique CRUD, cache, alertes
│   │   ├── materials.gateway.ts         # WebSocket pour notifications temps réel
│   │   ├── qrcode.controller.ts         # Génération et scan QR codes
│   │   ├── orders.controller.ts         # Gestion commandes fournisseurs
│   │   ├── site-materials.controller.ts # Matériaux par site
│   │   │
│   │   ├── controllers/
│   │   │   ├── consumption.controller.ts      # Consommation quotidienne
│   │   │   ├── site-consumption.controller.ts # Exigences matériaux par site
│   │   │   └── material-flow.controller.ts    # Flux entrées/sorties
│   │   │
│   │   ├── services/
│   │   │   ├── orders.service.ts              # Commandes, suivi GPS, paiement
│   │   │   ├── ml-training.service.ts         # TensorFlow.js, entraînement modèles
│   │   │   ├── stock-prediction.service.ts    # Prédictions stock (fallback)
│   │   │   ├── consumption-anomaly.service.ts # Détection anomalies consommation
│   │   │   ├── import-export.service.ts       # Excel/PDF import/export
│   │   │   ├── intelligent-recommendation.service.ts # Suggestions fournisseurs
│   │   │   ├── site-materials.service.ts      # Assignation matériaux/sites
│   │   │   ├── material-flow.service.ts       # Enregistrement mouvements stock
│   │   │   ├── site-consumption.service.ts    # Suivi consommation par site
│   │   │   ├── smart-score.service.ts         # Calcul score santé chantier
│   │   │   └── websocket.service.ts           # Émission events WebSocket
│   │   │
│   │   ├── entities/
│   │   │   ├── material.entity.ts             # Schéma principal matériau
│   │   │   ├── material-order.entity.ts       # Commandes fournisseurs
│   │   │   ├── material-requirement.entity.ts # Exigences matériaux/site
│   │   │   ├── daily-consumption.entity.ts    # Logs consommation quotidienne
│   │   │   └── material-flow-log.entity.ts    # Historique mouvements stock
│   │   │
│   │   ├── dto/                         # 20+ DTOs pour validation
│   │   └── interfaces/                  # Interfaces TypeScript
│   │
│   ├── chat/                            # MODULE CHAT TEMPS RÉEL
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts           # Endpoints REST pour historique
│   │   ├── chat.service.ts              # Persistance MongoDB
│   │   ├── chat.gateway.ts              # WebSocket namespace /chat
│   │   ├── ai-message-analyzer.service.ts # Analyse IA avec OpenAI GPT-4o-mini
│   │   ├── entities/
│   │   │   └── chat-message.entity.ts   # Schéma messages
│   │   └── dto/                         # DTOs WebSocket
│   │
│   ├── payment/                         # MODULE PAIEMENT
│   │   ├── payment.module.ts
│   │   └── payment.service.ts           # Appels HTTP vers microservice paiement
│   │
│   ├── sites/                           # MODULE SITES (connexion externe)
│   │   ├── sites.module.ts
│   │   └── sites.service.ts             # Connexion MongoDB smartsite/sites
│   │
│   ├── auth/                            # MODULE AUTH (partiel)
│   │   ├── jwt.strategy.ts              # Stratégie Passport JWT
│   │   ├── roles.enum.ts                # 11 rôles définis
│   │   └── roles.guard.ts               # Guard RBAC (non utilisé)
│   │
│   └── common/
│       ├── email/
│       │   └── anomaly-email.service.ts # Envoi emails alertes (Nodemailer)
│       └── utils/
│           ├── qr-generator.util.ts     # Génération QR codes
│           └── qr-scanner.util.ts       # Scan QR codes
│
├── uploads/                             # Fichiers uploadés
│   ├── qrcodes/                         # QR codes générés
│   ├── chat/                            # Fichiers chat
│   ├── voice/                           # Messages vocaux
│   └── imports/                         # CSV/Excel importés
│
├── exports/                             # Exports Excel/PDF
├── package.json
├── .env
└── tsconfig.json
```

### 2.2 Relations entre modules

```
MaterialsModule (principal)
├── importe ChatModule
├── importe SitesModule
├── importe PaymentModule
├── utilise AnomalyEmailService
└── expose MaterialsGateway (WebSocket)

ChatModule
├── utilise OpenAI API
└── expose ChatGateway (WebSocket namespace /chat)

PaymentModule
└── appelle microservice externe (port 3008)

SitesModule
└── connexion MongoDB externe (smartsite/sites)
```

### 2.3 Pattern architectural

**Pattern MVC (Model-View-Controller)** avec séparation claire :

- **Models** : Entities Mongoose (`*.entity.ts`)
- **Controllers** : Endpoints REST (`*.controller.ts`)
- **Services** : Logique métier (`*.service.ts`)
- **Gateways** : WebSocket (`*.gateway.ts`)

**Patterns supplémentaires** :
- **Repository Pattern** : via Mongoose `Model<T>`
- **Dependency Injection** : NestJS IoC container
- **Observer Pattern** : WebSocket events
- **Strategy Pattern** : ML models (TensorFlow vs fallback)

### 2.4 Configuration MongoDB

**Connexions multiples** :

| Base de données | URI | Collection(s) | Usage |
|-----------------|-----|---------------|-------|
| **smartsite-materials** | `mongodb://localhost:27017/smartsite-materials` | `materials`, `materialorders`, `materialrequirements`, `dailyconsumptionlogs`, `materialflowlogs`, `chatmessages` | Base principale du service |
| **smartsite** | `mongodb://localhost:27017/smartsite` | `sites` | Lecture seule des sites (SitesService) |
| **smartsite-fournisseurs** | `mongodb://localhost:27017/smartsite-fournisseurs` | `fournisseurs` | Lecture seule des fournisseurs (IntelligentRecommendationService) |

**Configuration Mongoose** (dans `materials.module.ts`) :

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    uri: configService.get('MONGODB_URI') || 
         'mongodb://localhost:27017/smartsite-materials',
  }),
})
```

---

## 3. Modèles de données (Schemas Mongoose)

### 3.1 Material (Matériau)

**Collection** : `materials`

**Description** : Entité principale représentant un matériau de construction.

```typescript
@Schema({ timestamps: true })
export class Material extends Document {
  // Informations de base
  @Prop({ required: true })
  name: string;                    // Nom du matériau

  @Prop({ required: true, unique: true, index: true })
  code: string;                    // Code unique (ex: "CIM-001")

  @Prop({ required: true })
  category: string;                // Catégorie (ex: "Ciment", "Acier")

  @Prop({ required: true })
  unit: string;                    // Unité de mesure (ex: "kg", "m³", "unité")

  // Gestion des stocks
  @Prop({ required: true, min: 0 })
  quantity: number;                // Stock actuel

  @Prop({ required: true, min: 0 })
  minimumStock: number;            // Stock minimum

  @Prop({ required: true, min: 0 })
  maximumStock: number;            // Stock maximum

  @Prop({ required: true, min: 0 })
  reorderPoint: number;            // Seuil de réapprovisionnement

  @Prop({ type: Number, min: 0, max: 1 })
  qualityGrade: number;            // Note qualité (0-1)

  // Localisation et identification
  @Prop({ type: String })
  location: string;                // Emplacement physique

  @Prop({ type: String })
  barcode: string;                 // Code-barres généré

  @Prop({ type: String })
  qrCode: string;                  // QR code (data URL base64)

  @Prop({ type: String })
  qrCodeImage: string;             // Chemin image QR code

  // Fournisseurs
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fournisseur' }], default: [] })
  preferredSuppliers: Types.ObjectId[];  // Fournisseurs préférés

  @Prop({ type: Object })
  priceHistory?: Record<string, number>; // Historique prix par date

  // Informations produit
  @Prop({ type: String })
  manufacturer: string;            // Fabricant

  @Prop({ type: Date })
  expiryDate: Date;                // Date d'expiration

  @Prop({ type: Date })
  lastOrdered: Date;               // Dernière commande

  @Prop({ type: Date })
  lastReceived: Date;              // Dernière réception

  // Stocks spéciaux
  @Prop({ type: Number, default: 0 })
  reservedQuantity: number;        // Quantité réservée

  @Prop({ type: Number, default: 0 })
  damagedQuantity: number;         // Quantité endommagée

  // Statut
  @Prop({ type: String, enum: ['active', 'discontinued', 'obsolete'], default: 'active' })
  status: string;

  // Métadonnées
  @Prop({ type: Object })
  specifications: Record<string, any>;  // Spécifications techniques

  // Assignation sites
  @Prop({ type: Types.ObjectId, ref: 'Site', required: false, index: true })
  siteId: Types.ObjectId;          // Site principal

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
  assignedProjects: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Site' }], default: [] })
  assignedSites: Types.ObjectId[]; // Sites multiples

  // Statistiques
  @Prop({ type: Number, default: 0 })
  reorderCount: number;            // Nombre de commandes

  @Prop({ type: Number, default: 1, min: 0 })
  consumptionRate: number;         // Taux consommation (unités/heure)

  @Prop({ type: Date })
  lastCountDate: Date;             // Dernier inventaire

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;      // Créateur

  @Prop({ type: [String] })
  images?: string[];               // URLs images

  @Prop({ type: String })
  projectType?: string;            // Type projet (residential, commercial, etc.)

  // SMART SCORE FIELDS (calculés par SmartScoreService)
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  consumptionScore?: number;       // Score consommation

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  stockHealthScore?: number;       // Score santé stock

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  anomaliesScore?: number;         // Score anomalies

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  siteHealthScore?: number;        // Score santé site

  @Prop({ type: Date })
  lastScoreUpdate?: Date;          // Dernière MAJ scores
}
```

**Index MongoDB** :
```typescript
MaterialSchema.index({ name: 'text', code: 'text' });  // Recherche full-text
MaterialSchema.index({ category: 1 });
MaterialSchema.index({ status: 1 });
MaterialSchema.index({ assignedSites: 1 });
MaterialSchema.index({ siteId: 1 });
MaterialSchema.index({ siteHealthScore: -1 });
```

**Règles de validation** :
- `minimumStock < maximumStock`
- `minimumStock <= reorderPoint <= maximumStock`
- `qualityGrade` entre 0 et 1
- `code` unique dans la collection


### 3.2 MaterialOrder (Commande fournisseur)

**Collection** : `materialorders`

**Description** : Commande de matériau avec suivi GPS en temps réel.

```typescript
export enum OrderStatus {
  PENDING = 'pending',           // En attente
  IN_TRANSIT = 'in_transit',     // En transit
  DELIVERED = 'delivered',       // Livré
  DELAYED = 'delayed',           // Retardé
  CANCELLED = 'cancelled',       // Annulé
}

@Schema({ timestamps: true })
export class MaterialOrder extends Document {
  @Prop({ required: true })
  orderNumber: string;             // Numéro commande (ex: "ORD-1714567890-123")

  // Matériau commandé
  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ required: true })
  materialName: string;

  @Prop({ required: true })
  materialCode: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  // Destination (site)
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  destinationSiteId: Types.ObjectId;

  @Prop({ required: true })
  destinationSiteName: string;

  @Prop({ required: true })
  destinationAddress: string;

  @Prop({ type: Object, required: true })
  destinationCoordinates: { lat: number; lng: number };

  // Fournisseur
  @Prop({ type: Types.ObjectId, ref: 'Fournisseur', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ required: true })
  supplierAddress: string;

  @Prop({ type: Object, required: true })
  supplierCoordinates: { lat: number; lng: number };

  // Suivi GPS
  @Prop({ type: Number, default: 0 })
  estimatedDurationMinutes: number;  // Durée estimée

  @Prop({ type: Number, default: 0 })
  remainingTimeMinutes: number;      // Temps restant

  @Prop({ type: Object })
  currentPosition: { lat: number; lng: number };  // Position actuelle camion

  @Prop({ type: Number, default: 0 })
  progress: number;                  // Progression 0-100%

  // Statut et dates
  @Prop({ type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: Date })
  scheduledDeparture: Date;          // Départ prévu

  @Prop({ type: Date })
  scheduledArrival: Date;            // Arrivée prévue

  @Prop({ type: Date })
  actualDeparture: Date;             // Départ réel

  @Prop({ type: Date })
  actualArrival: Date;               // Arrivée réelle

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: String })
  notes: string;

  // Paiement (ajouté pour intégration Stripe)
  @Prop({ type: String })
  paymentId?: string;                // ID paiement

  @Prop({ type: Number })
  paymentAmount?: number;            // Montant

  @Prop({ type: String })
  paymentMethod?: string;            // cash | card

  @Prop({ type: String })
  paymentStatus?: string;            // pending | completed | failed
}
```

**Index MongoDB** :
```typescript
MaterialOrderSchema.index({ orderNumber: 1 });
MaterialOrderSchema.index({ status: 1 });
MaterialOrderSchema.index({ destinationSiteId: 1 });
MaterialOrderSchema.index({ supplierId: 1 });
```

### 3.3 MaterialRequirement (Exigence matériau par site)

**Collection** : `materialrequirements`

**Description** : Quantité de matériau nécessaire pour un chantier spécifique.

```typescript
@Schema({ timestamps: true })
export class MaterialRequirement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true })
  siteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  initialQuantity: number;         // Quantité initiale nécessaire

  @Prop({ required: true, min: 0, default: 0 })
  consumedQuantity: number;        // Quantité consommée

  @Prop({ required: true, min: 0 })
  remainingQuantity: number;       // Quantité restante

  @Prop({ required: true, min: 0, max: 100, default: 0 })
  progressPercentage: number;      // Progression 0-100%

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}
```

**Index MongoDB** :
```typescript
// Index unique pour éviter doublons (site, material)
MaterialRequirementSchema.index({ siteId: 1, materialId: 1 }, { unique: true });
MaterialRequirementSchema.index({ siteId: 1 });
MaterialRequirementSchema.index({ progressPercentage: 1 });
```

### 3.4 DailyConsumptionLog (Consommation quotidienne)

**Collection** : `dailyconsumptionlogs`

**Description** : Log de consommation quotidienne avec détection d'anomalies.

```typescript
@Schema({ timestamps: true })
export class DailyConsumptionLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Material', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  date: Date;                      // Date du log

  @Prop({ required: true, min: 0 })
  quantityUsed: number;            // Quantité utilisée

  @Prop({ required: true, min: 0 })
  expectedConsumption: number;     // Consommation attendue

  // Détection anomalie
  @Prop({ min: 0, max: 100, default: 0 })
  anomalyScore: number;            // Score anomalie 0-100

  @Prop({ type: String, enum: ['vol', 'probleme', 'normal'], default: 'normal' })
  anomalyType: string;             // Type anomalie

  @Prop({ type: String })
  anomalyReason: string;           // Raison détaillée

  // Email alerte
  @Prop({ type: Boolean, default: false })
  emailSent: boolean;              // Email envoyé ?

  @Prop({ type: Date })
  emailSentAt: Date;               // Date envoi email

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy: Types.ObjectId;
}
```

**Index MongoDB** :
```typescript
// Index unique pour éviter doublons par jour
DailyConsumptionLogSchema.index({ materialId: 1, siteId: 1, date: 1 }, { unique: true });
DailyConsumptionLogSchema.index({ date: -1 });
DailyConsumptionLogSchema.index({ anomalyType: 1 });
```

### 3.5 MaterialFlowLog (Flux de stock)

**Collection** : `materialflowlogs`

**Description** : Historique complet des mouvements de stock avec détection d'anomalies.

```typescript
export enum FlowType {
  IN = 'IN',                       // Entrée
  OUT = 'OUT',                     // Sortie
  ADJUSTMENT = 'ADJUSTMENT',       // Ajustement
  DAMAGE = 'DAMAGE',               // Dommage
  RETURN = 'RETURN',               // Retour
  RESERVE = 'RESERVE',             // Réservation
}

export enum AnomalyType {
  NONE = 'NONE',                   // Pas d'anomalie
  EXCESSIVE_OUT = 'EXCESSIVE_OUT', // Sortie excessive
  EXCESSIVE_IN = 'EXCESSIVE_IN',   // Entrée excessive
  UNEXPECTED_MOVEMENT = 'UNEXPECTED_MOVEMENT',
  BELOW_SAFETY_STOCK = 'BELOW_SAFETY_STOCK',  // Stock sécurité
}

@Schema({ timestamps: true })
export class MaterialFlowLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Site', required: true, index: true })
  siteId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true, index: true })
  materialId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(FlowType) })
  type: FlowType;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Number })
  previousStock: number;           // Stock avant

  @Prop({ type: Number })
  newStock: number;                // Stock après

  @Prop({ type: String })
  reason?: string;                 // Raison du mouvement

  // Détection anomalie
  @Prop({ type: String, enum: Object.values(AnomalyType), default: AnomalyType.NONE })
  anomalyDetected: AnomalyType;

  @Prop({ type: Boolean, default: false })
  emailSent: boolean;

  @Prop({ type: String })
  anomalyMessage?: string;

  @Prop({ type: String })
  projectId?: string;

  @Prop({ type: String })
  reference?: string;
}
```

**Index MongoDB** :
```typescript
MaterialFlowLogSchema.index({ siteId: 1, materialId: 1 });
MaterialFlowLogSchema.index({ timestamp: -1 });
MaterialFlowLogSchema.index({ anomalyDetected: 1 });
MaterialFlowLogSchema.index({ type: 1 });
```

### 3.6 ChatMessage (Message chat)

**Collection** : `chatmessages`

**Description** : Messages de chat temps réel entre chantier et fournisseur.

```typescript
export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  IMAGE = 'image',
  DOCUMENT = 'document',
  LOCATION = 'location',
  ARRIVAL_CONFIRMATION = 'arrival_confirmation',
  CALL_REQUEST = 'call_request',
  CALL_ACCEPT = 'call_accept',
  CALL_REJECT = 'call_reject',
  CALL_END = 'call_end',
  STATUS_UPDATE = 'status_update',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  EMOJI = 'emoji',
}

@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ required: true, index: true })
  orderId: string;                 // ID commande

  @Prop({ required: true })
  senderId: string;                // ID expéditeur

  @Prop({ required: true })
  senderName: string;              // Nom expéditeur

  @Prop({ required: true })
  senderRole: string;              // Rôle (site, supplier, system)

  @Prop({ required: true })
  content: string;                 // Contenu message

  @Prop({ type: String, enum: Object.values(MessageType), default: MessageType.TEXT })
  type: MessageType;

  @Prop()
  fileUrl: string;                 // URL fichier (image, document, audio)

  @Prop({ type: Object })
  location: { lat: number; lng: number; address?: string };

  @Prop({ type: [String], default: [] })
  readBy: string[];                // IDs utilisateurs ayant lu

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  duration: number;                // Durée audio (secondes)

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: [] })
  reactions: string[];             // Emojis réactions

  @Prop({ type: Map, of: String })
  reactionsByUser: Map<string, string>;  // userId -> emoji

  // Analyse IA (ajouté par AiMessageAnalyzerService)
  @Prop({ type: Object })
  aiAnalysis?: {
    emotion: string;               // calm, stressed, frustrated, angry
    sentiment: string;             // positive, neutral, negative
    confidence: number;            // 0-100
    status: string;                // NORMAL, WARNING, CONFLICT
  };
}
```

**Index MongoDB** :
```typescript
ChatMessageSchema.index({ orderId: 1, createdAt: -1 });
```

---

## 4. API REST — Endpoints complets

### 4.1 MaterialsController (`/api/materials`)

**40+ endpoints** pour gestion complète des matériaux.

#### 4.1.1 Créer un matériau

```
POST /api/materials
```

**Description** : Crée un nouveau matériau avec génération automatique de QR code et code-barres.

**Guards** : Aucun (⚠️ non sécurisé)

**Body (CreateMaterialDto)** :
```typescript
{
  name: string;              // Requis
  code: string;              // Requis, unique
  category: string;          // Requis
  unit: string;              // Requis (ex: "kg", "m³")
  quantity: number;          // Requis, >= 0
  minimumStock: number;      // Requis, >= 0
  maximumStock: number;      // Requis, >= 0
  reorderPoint: number;      // Requis, >= 0
  qualityGrade?: number;     // Optionnel, 0-1
  location?: string;
  manufacturer?: string;
  expiryDate?: string;       // ISO date
  specifications?: object;
  siteId?: string;           // ObjectId site
  projectType?: string;      // residential, commercial, etc.
}
```

**Réponse 201** :
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ciment Portland",
  "code": "CIM-001",
  "category": "Ciment",
  "unit": "kg",
  "quantity": 1000,
  "minimumStock": 100,
  "maximumStock": 5000,
  "reorderPoint": 500,
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "qrCodeImage": "/uploads/qrcodes/CIM-001-1714567890.png",
  "barcode": "MAT-1714567890-123",
  "status": "active",
  "createdAt": "2026-04-26T10:00:00.000Z",
  "updatedAt": "2026-04-26T10:00:00.000Z"
}
```

**Erreurs** :
- `400` : Code déjà existant, validation échouée
- `500` : Erreur serveur

**Effets de bord** :
- Génération QR code sauvegardé dans `/uploads/qrcodes/`
- Émission WebSocket `materialCreated`
- Invalidation cache dashboard


#### 4.1.2 Lister les matériaux (avec pagination)

```
GET /api/materials?search=ciment&category=Ciment&status=active&page=1&limit=10
```

**Query params** :
- `search` : Recherche full-text (nom, code)
- `category` : Filtrer par catégorie
- `status` : active | discontinued | obsolete
- `location` : Filtrer par emplacement
- `lowStock` : boolean (matériaux en stock bas)
- `page` : Numéro page (défaut: 1)
- `limit` : Résultats par page (défaut: 10)
- `sortBy` : Champ tri (défaut: createdAt)
- `sortOrder` : asc | desc (défaut: desc)

**Réponse 200** :
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Ciment Portland",
      "code": "CIM-001",
      "quantity": 1000,
      "siteId": "507f1f77bcf86cd799439012",
      "siteName": "Chantier Nord",
      "siteAddress": "123 Rue Example",
      "needsReorder": false
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 15
}
```

#### 4.1.3 Dashboard statistiques

```
GET /api/materials/dashboard
```

**Réponse 200** :
```json
{
  "totalMaterials": 150,
  "lowStockCount": 12,
  "outOfStockCount": 3,
  "healthyStockCount": 135,
  "categoryStats": [
    { "_id": "Ciment", "count": 25, "totalQuantity": 50000 },
    { "_id": "Acier", "count": 40, "totalQuantity": 120000 }
  ],
  "recentMovements": [...],
  "timestamp": "2026-04-26T10:00:00.000Z"
}
```

**Cache** : 5 minutes (300s)

#### 4.1.4 Alertes stock bas

```
GET /api/materials/alerts
```

**Réponse 200** :
```json
[
  {
    "materialId": "507f1f77bcf86cd799439011",
    "materialName": "Ciment Portland",
    "currentQuantity": 80,
    "threshold": 100,
    "type": "low_stock",
    "severity": "medium",
    "message": "Ciment Portland est en dessous du seuil (80/100)",
    "date": "2026-04-26T10:00:00.000Z"
  }
]
```

**Cache** : 1 minute (60s)

#### 4.1.5 Prédiction stock (IA/ML)

```
GET /api/materials/:id/prediction
```

**Description** : Prédiction de rupture de stock avec TensorFlow.js ou fallback mathématique.

**Réponse 200** :
```json
{
  "materialId": "507f1f77bcf86cd799439011",
  "materialName": "Ciment Portland",
  "currentStock": 1000,
  "predictedStock": 520,
  "consumptionRate": 20,
  "hoursToLowStock": 25,
  "hoursToOutOfStock": 50,
  "status": "warning",
  "recommendedOrderQuantity": 1500,
  "predictionModelUsed": true,
  "confidence": 0.85,
  "message": "⚠️ Alerte! Stock faible. 50h avant rupture."
}
```

**Logique** :
1. Vérifie si modèle ML entraîné existe (`mlTrainingService.hasModel(id)`)
2. Si oui : utilise TensorFlow.js pour prédiction
3. Sinon : calcul mathématique `hoursToOutOfStock = currentStock / consumptionRate`

#### 4.1.6 Toutes les prédictions

```
GET /api/materials/prediction/all
GET /api/materials/predictions/all  (alias)
```

**Réponse 200** : Array de prédictions pour tous les matériaux (max 100).

#### 4.1.7 Recommandations commande automatique

```
GET /api/materials/auto-order/recommendations?siteId=507f1f77bcf86cd799439012
```

**Réponse 200** :
```json
[
  {
    "materialId": "507f1f77bcf86cd799439011",
    "materialName": "Ciment Portland",
    "materialCode": "CIM-001",
    "currentStock": 80,
    "consumptionRate": 20,
    "predictedHoursToOutOfStock": 4,
    "autoSuggestOrder": true,
    "recommendedQuantity": 1500,
    "leadTimeDays": 7,
    "safetyStock": 720,
    "urgencyLevel": "critical",
    "message": "🚨 CRITIQUE! Rupture imminente dans 4h!",
    "reason": "Stock critique: 80 kg restants"
  }
]
```

**Tri** : Par urgence (critical > warning > info)

#### 4.1.8 Smart Score (score santé chantier)

```
POST /api/materials/smart-score/site
```

**Body** :
```json
{
  "siteId": "507f1f77bcf86cd799439012",
  "siteName": "Chantier Nord",
  "progress": 65
}
```

**Réponse 200** :
```json
{
  "siteId": "507f1f77bcf86cd799439012",
  "siteName": "Chantier Nord",
  "progress": 65,
  "stockHealth": 85.5,
  "anomalies": 92.3,
  "score": 78.4,
  "level": "good",
  "details": {
    "totalMaterials": 45,
    "lowStockCount": 3,
    "outOfStockCount": 0,
    "anomalyCount": 2,
    "averageConsumptionRate": 15.2,
    "criticalMaterials": [...]
  },
  "recommendations": [
    "📊 Stock correct. Surveillez les matériaux en stock bas.",
    "🟡 3 matériau(x) en stock bas. Prévoyez une commande."
  ]
}
```

**Formule Smart Score** :
```
score = (progress * 0.4) + (stockHealth * 0.3) + (anomalies * 0.3)
```

**Niveaux** :
- `excellent` : >= 80
- `good` : >= 60
- `average` : >= 40
- `poor` : >= 20
- `critical` : < 20

#### 4.1.9 Suggestions fournisseurs

```
GET /api/materials/:id/suppliers?siteLatitude=48.8566&siteLongitude=2.3522&siteId=507f...
```

**Description** : Récupère les fournisseurs recommandés depuis MongoDB `smartsite-fournisseurs`.

**Réponse 200** :
```json
{
  "success": true,
  "data": [
    {
      "supplierId": "507f1f77bcf86cd799439013",
      "supplierName": "Matériaux Pro",
      "estimatedDeliveryDays": 3,
      "isPreferred": false,
      "telephone": "01 23 45 67 89",
      "email": "contact@materiauxpro.fr",
      "adresse": "10 Rue Industrie",
      "ville": "Paris",
      "specialites": ["Ciment", "Béton"],
      "evaluation": 4.5,
      "coordonnees": {
        "latitude": 48.8566,
        "longitude": 2.3522
      },
      "distance": 2.5
    }
  ],
  "count": 10,
  "sortedBy": "distance"
}
```

**Tri** :
- Si coordonnées site fournies : tri par distance (Haversine)
- Sinon : tri par évaluation

#### 4.1.10 Mettre à jour stock

```
PUT /api/materials/:id/stock
```

**Body (UpdateStockDto)** :
```typescript
{
  quantity: number;          // Requis
  operation: 'add' | 'remove' | 'reserve' | 'damage';  // Requis
  reason?: string;
  projectId?: string;
}
```

**Réponse 200** :
```json
{
  "material": { ... },
  "movement": {
    "materialId": "507f1f77bcf86cd799439011",
    "quantity": 100,
    "type": "out",
    "date": "2026-04-26T10:00:00.000Z",
    "userId": "507f1f77bcf86cd799439014",
    "previousStock": 1000,
    "newStock": 900,
    "reason": "Utilisation chantier"
  }
}
```

**Logique** :
- `add` : `newStock = previousStock + quantity`
- `remove` : `newStock = previousStock - quantity` (vérifie stock suffisant)
- `reserve` : Incrémente `reservedQuantity`, stock inchangé
- `damage` : Décrémente stock, incrémente `damagedQuantity`

**Effets de bord** :
- Émission WebSocket `stockUpdate`
- Invalidation cache dashboard et alertes

#### 4.1.11 Upload CSV pour ML training

```
POST /api/materials/:id/upload-csv
Content-Type: multipart/form-data
```

**Form data** :
- `file` : Fichier CSV

**Format CSV attendu** :
```csv
hour,stock,consumption,project,hourOfDay,dayOfWeek,siteActivityLevel,weather,projectType
2026-04-01 08:00,100,5,A,8,1,0.8,sunny,residential
2026-04-01 09:00,95,5,A,9,1,0.9,sunny,residential
```

**Colonnes requises** : `hour`, `stock`, `consumption`

**Colonnes optionnelles (features avancées)** :
- `hourOfDay` : 0-23
- `dayOfWeek` : 0-6 (0=dimanche)
- `siteActivityLevel` : 0-1
- `weather` : sunny, rainy, cloudy, stormy, snowy, windy
- `projectType` : residential, commercial, infrastructure, industrial

**Réponse 200** :
```json
{
  "success": true,
  "message": "CSV parsed successfully. 168 records loaded.",
  "data": {
    "totalRecords": 168,
    "dateRange": {
      "start": "2026-04-01 08:00",
      "end": "2026-04-08 08:00"
    },
    "averageConsumption": 5.2
  }
}
```

#### 4.1.12 Entraîner modèle ML

```
POST /api/materials/:id/train
```

**Description** : Entraîne un modèle TensorFlow.js sur les données historiques uploadées.

**Réponse 200** :
```json
{
  "success": true,
  "message": "Model trained successfully! Accuracy: 87.5%",
  "trainingResult": {
    "materialId": "507f1f77bcf86cd799439011",
    "success": true,
    "epochs": 50,
    "loss": 12.34,
    "accuracy": 0.875,
    "sampleSize": 168,
    "trainedAt": "2026-04-26T10:00:00.000Z"
  }
}
```

**Architecture réseau** :
- **Sans features avancées** : `[2] -> [32] -> [16] -> [8] -> [1]`
- **Avec features avancées** : `[5] -> [64] -> [32] -> [16] -> [1]`

**Optimizer** : Adam (learning rate 0.01)
**Loss** : Mean Squared Error
**Epochs** : 50
**Batch size** : min(32, floor(samples/2))

#### 4.1.13 Prédiction ML avancée

```
POST /api/materials/:id/predict-advanced
```

**Body** :
```json
{
  "hourOfDay": 14,
  "dayOfWeek": 2,
  "siteActivityLevel": 0.85,
  "weather": "sunny",
  "projectType": "commercial"
}
```

**Réponse 200** :
```json
{
  "materialId": "507f1f77bcf86cd799439011",
  "materialName": "Ciment Portland",
  "currentStock": 1000,
  "predictedStock": 850,
  "hoursToOutOfStock": 42,
  "consumptionRate": 20.2,
  "modelTrained": true,
  "confidence": 0.89,
  "status": "warning",
  "recommendedOrderQuantity": 1200,
  "estimatedRuptureDate": "2026-04-28T04:00:00.000Z",
  "message": "⚠️ Alerte! Rupture dans 42h. Commander 1200 unités."
}
```

#### 4.1.14 Info modèle ML

```
GET /api/materials/:id/model-info
```

**Réponse 200** :
```json
{
  "materialId": "507f1f77bcf86cd799439011",
  "modelTrained": true,
  "hasHistoricalData": true,
  "trained": true,
  "sampleSize": 168,
  "trainedAt": "2026-04-26T10:00:00.000Z"
}
```

#### 4.1.15 Import Excel

```
POST /api/materials/import/excel
Content-Type: multipart/form-data
```

**Form data** :
- `file` : Fichier Excel (.xlsx)

**Format Excel attendu** :

| Code | Nom | Catégorie | Unité | Quantité | Stock Minimum | Stock Maximum | Point de commande |
|------|-----|-----------|-------|----------|---------------|---------------|-------------------|
| CIM-001 | Ciment Portland | Ciment | kg | 1000 | 100 | 5000 | 500 |

**Colonnes acceptées** (normalisation automatique) :
- `code` / `codemateriau` / `reference` / `ref`
- `nom` / `name` / `designation` / `libelle`
- `categorie` / `category` / `cat`
- `unite` / `unit` / `unitemesure`
- `quantite` / `quantity` / `qte` / `stock`
- `stockminimum` / `minimumstock` / `stockmin` / `minstock`
- `stockmaximum` / `maximumstock` / `stockmax` / `maxstock`
- `pointdecommande` / `reorderpoint` / `seuil` / `reorder`

**Réponse 200** :
```json
{
  "success": true,
  "imported": 45,
  "failed": 2,
  "errors": [
    { "row": 3, "code": "CIM-003", "error": "Le code CIM-003 existe déjà" },
    { "row": 10, "code": "N/A", "error": "Code manquant" }
  ],
  "materials": [...]
}
```

#### 4.1.16 Export Excel

```
POST /api/materials/export/excel
```

**Body** (optionnel) :
```json
{
  "materialIds": ["507f...", "507f..."]
}
```

**Réponse** : Téléchargement fichier `materiaux_1714567890.xlsx`

**Colonnes exportées** :
- Code, Nom, Catégorie, Unité, Quantité
- Stock Minimum, Stock Maximum, Point de commande
- Qualité, Emplacement, Fabricant, Date expiration
- Statut, Quantité réservée, Quantité endommagée

#### 4.1.17 Export PDF

```
POST /api/materials/export/pdf
```

**Réponse** : Téléchargement fichier `inventaire_1714567890.pdf`

**Contenu PDF** :
- En-tête avec logo et date
- Tableau récapitulatif
- Statuts colorés (En stock, Stock bas, Rupture, Expire bientôt)

#### 4.1.18 Test email alerte

```
POST /api/materials/email/test
```

**Body** (optionnel) :
```json
{
  "email": "test@example.com",
  "materialName": "Ciment Portland (Test)"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "message": "Email de test envoyé avec succès à test@example.com",
  "info": "Vérifiez votre boîte de réception Ethereal Email sur https://ethereal.email/messages",
  "etherealUrl": "https://ethereal.email/messages",
  "credentials": {
    "username": "kacey8@ethereal.email",
    "note": "Connectez-vous sur https://ethereal.email avec ces identifiants pour voir l'email"
  }
}
```

**Configuration email** (Ethereal pour tests) :
- SMTP : `smtp.ethereal.email:587`
- User : `kacey8@ethereal.email`
- Pass : `mkWqQzs2q2wPvJStAu`

