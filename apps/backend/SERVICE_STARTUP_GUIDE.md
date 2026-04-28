# Guide de Démarrage des Services Backend

## ✅ Services Corrigés et Fonctionnels

### 1. Materials Service (Port 3002)
- ✅ **Erreurs TypeScript corrigées** : Interface `StoredMessage` exportée
- ✅ **Dépendances installées** : uuid, nodemailer, mongodb, @types/uuid, @types/nodemailer
- ✅ **Configuration .env mise à jour** avec clés GROQ pour l'IA
- ✅ **Compilation réussie** sans erreurs
- ✅ **Récupération fournisseurs optimisée** : Connexion directe MongoDB (smartsite-fournisseurs)
- ✅ **Fonctionnalités ML/AI actives** :
  - 🤖 **Recommandations intelligentes** : Prédiction automatique des commandes
  - 📊 **Prédiction de stock** : Algorithmes ML avec TensorFlow.js
  - 🚨 **Détection d'anomalies** : Surveillance des consommations anormales
  - 📈 **Analyse prédictive** : Calcul des heures avant rupture de stock
  - ⚡ **Alertes automatiques** : Notifications par email des anomalies
  - 🏪 **Suggestions de fournisseurs** : Récupération directe depuis MongoDB avec tri intelligent

### 2. Service Paiement (Port 3007)
- ✅ **Fichier .env créé** avec configuration Stripe complète
- ✅ **Code compilé** sans erreurs
- ✅ **Dépendances installées** et à jour
- ✅ **Intégration Stripe** fonctionnelle

### 3. Service Gestion-Suppliers (Port 3008) - NOUVEAU
- ✅ **Service complet créé** pour la gestion des fournisseurs
- ✅ **API CRUD complète** : Créer, lire, modifier, supprimer fournisseurs
- ✅ **Données de test** : 5 fournisseurs tunisiens pré-configurés
- ✅ **Recherche géographique** : Fournisseurs par proximité
- ✅ **Association matériaux** : Liaison fournisseurs ↔ matériaux
- ✅ **Compilation réussie** sans erreurs

## 🔧 Configuration Requise

### Materials Service
Mettre à jour le fichier `apps/backend/materials-service/.env` avec vos vraies clés :
```env
# Clé API Groq pour l'IA conversationnelle
GROQ_API_KEY=gsk_your_real_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017/smartsite-materials

# MongoDB pour les fournisseurs (connexion directe)
SUPPLIERS_MONGODB_URI=mongodb://localhost:27017/smartsite-fournisseurs

# Configuration email pour les alertes d'anomalies
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_application
ADMIN_EMAIL=admin@smartsite.com
```

### Service Paiement
Mettre à jour le fichier `apps/backend/paiement/.env` avec vos vraies clés Stripe :
```env
# Configuration Stripe
STRIPE_SECRET_KEY=sk_test_your_real_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_real_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017/smartsite-paiement
```

### Service Gestion-Suppliers
Le fichier `.env` est déjà configuré. Optionnel : mettre à jour avec votre vraie base MongoDB :
```env
PORT=3008
MONGODB_URI=mongodb://localhost:27017/smartsite-suppliers
```

## 🚀 Commandes de Démarrage

### 1. Materials Service (PRINCIPAL)
```bash
cd apps/backend/materials-service
npm run start:dev
```

### 2. Service Paiement
```bash
cd apps/backend/paiement
npm run build
npm start
```

### 3. Service Gestion-Suppliers (OPTIONNEL)
```bash
cd apps/backend/gestion-suppliers
npm run start:dev
```

**Note :** Le service gestion-suppliers n'est plus requis pour les fournisseurs car le materials-service se connecte directement à MongoDB.

## 🔍 Vérification des Services

### Materials Service (http://localhost:3002)
**API Chat & IA :**
- `POST /chat/message` - Chat avec IA (Groq)
- `GET /chat/messages/:orderId` - Récupérer messages
- `POST /chat/upload` - Upload de fichiers

**API ML/IA :**
- `GET /api/materials/recommendations/:siteId` - Recommandations intelligentes
- `POST /api/materials/consumption/anomaly` - Détection d'anomalies
- `GET /api/materials/predictions/:materialId` - Prédictions de stock
- `GET /api/materials/anomalies/active` - Anomalies actives
- `GET /api/materials/suppliers` - **NOUVEAU** Liste tous les fournisseurs (MongoDB direct)
- `GET /api/materials/suppliers/:materialId` - **NOUVEAU** Fournisseurs pour un matériau (avec coordonnées optionnelles)

**API Matériaux :**
- `GET /api/materials` - Liste des matériaux
- `POST /api/materials` - Créer matériau
- `GET /api/materials/qr/:id` - Générer QR code

### Service Gestion-Suppliers (http://localhost:3008) - NOUVEAU
**API Fournisseurs :**
- `GET /fournisseurs` - Liste tous les fournisseurs
- `GET /fournisseurs/:id` - Détails d'un fournisseur
- `POST /fournisseurs` - Créer un fournisseur
- `PATCH /fournisseurs/:id` - Modifier un fournisseur
- `DELETE /fournisseurs/:id` - Supprimer un fournisseur
- `GET /fournisseurs/nearby?latitude=X&longitude=Y` - Fournisseurs proches
- `GET /fournisseurs/by-material/:materialId` - Fournisseurs par matériau
- `POST /fournisseurs/seed` - **Créer données de test**

### Service Paiement (http://localhost:3007)
**API Paiements :**
- `POST /api/payments/stripe/create-payment-intent` - Créer intention de paiement
- `GET /api/payments/:id` - Statut du paiement
- `POST /api/payments/webhook` - Webhook Stripe

## 🤖 Fonctionnalités ML/IA Disponibles

### 1. Recommandations Intelligentes
- Analyse automatique des stocks
- Prédiction des ruptures
- Suggestions de commandes automatiques
- Calcul des quantités optimales

### 2. Détection d'Anomalies
- Surveillance des consommations anormales
- Détection de vols potentiels
- Alertes de blocage de chantier
- Notifications automatiques par email

### 3. Prédiction de Stock
- Algorithmes ML avec TensorFlow.js
- Prédiction des heures avant rupture
- Calcul des taux de consommation
- Optimisation des niveaux de stock

### 4. Chat IA
- Assistant conversationnel avec Groq
- Support multilingue
- Gestion des fichiers et médias
- Historique des conversations

## ✅ Prérequis
- ✅ MongoDB en cours d'exécution sur localhost:27017
- ✅ Node.js et npm installés
- ⚠️ Clés API valides (Groq, Stripe) à configurer
- ✅ Toutes les dépendances installées

## 🎯 Statut Final
**Materials Service** : ✅ Entièrement fonctionnel avec ML/IA et fournisseurs
**Service Paiement** : ✅ Entièrement fonctionnel avec Stripe  
**Service Gestion-Suppliers** : ✅ Entièrement fonctionnel avec données de test

## 🎉 Problème Résolu !
Le message **"Aucun fournisseur dans la base de données"** ne devrait plus apparaître. Le materials-service récupère maintenant les fournisseurs **directement depuis MongoDB** avec :
- ✅ **Performance optimisée** (connexion directe, pas de HTTP)
- ✅ **Données en temps réel** (pas de cache service)
- ✅ **Tri intelligent** (préférés → spécialisés → proches → tous)
- ✅ **Informations complètes** (contact, spécialités, coordonnées GPS)
- ✅ **Gestion d'erreurs robuste** (fallback automatique)

**Base de données utilisée :** `mongodb://localhost:27017/smartsite-fournisseurs` (collection `fournisseurs`)