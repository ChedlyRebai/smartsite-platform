# Guide de Récupération des Fournisseurs depuis MongoDB

## ✅ Modification Effectuée

Le service materials récupère maintenant les fournisseurs **directement depuis MongoDB** au lieu de passer par le service backend gestion-suppliers.

### 🔧 Architecture Mise à Jour

**AVANT :**
```
Materials Service → HTTP Request → Gestion-Suppliers Service → MongoDB
```

**MAINTENANT :**
```
Materials Service → Direct MongoDB Connection → smartsite-fournisseurs DB
```

## 🗄️ Configuration MongoDB

### Base de données utilisée :
- **Nom** : `smartsite-fournisseurs`
- **Collection** : `fournisseurs`
- **URI** : `mongodb://localhost:27017/smartsite-fournisseurs`

### Configuration dans materials-service/.env :
```env
# MongoDB pour les matériaux (principal)
MONGODB_URI=mongodb://localhost:27017/smartsite-materials

# MongoDB pour les fournisseurs (connexion directe)
SUPPLIERS_MONGODB_URI=mongodb://localhost:27017/smartsite-fournisseurs
```

## 🚀 Fonctionnalités Implémentées

### 1. Service SuppliersService (Nouveau)
- **Connexion directe** à MongoDB avec le driver natif
- **Recherche intelligente** : préférés → par matériau → proximité → tous
- **Calcul de distance** géographique
- **Gestion des erreurs** robuste avec fallback

### 2. API Endpoints Disponibles

#### Materials Service (http://localhost:3002)
- `GET /api/materials/suppliers` - **NOUVEAU** Liste tous les fournisseurs
- `GET /api/materials/suppliers/:materialId` - Fournisseurs pour un matériau
  - Paramètres optionnels : `?siteLatitude=X&siteLongitude=Y`
- `GET /api/materials/recommendations/:siteId` - Recommandations intelligentes

## 🧪 Tests de Fonctionnement

### 1. Vérifier la connexion MongoDB :
```bash
# Démarrer le service materials
cd apps/backend/materials-service
npm run start:dev
```

### 2. Tester la récupération de tous les fournisseurs :
```bash
curl http://localhost:3002/api/materials/suppliers
```

### 3. Tester les suggestions pour un matériau :
```bash
curl "http://localhost:3002/api/materials/suppliers/MATERIAL_ID"
```

### 4. Tester avec coordonnées géographiques :
```bash
curl "http://localhost:3002/api/materials/suppliers/MATERIAL_ID?siteLatitude=36.8&siteLongitude=10.2"
```

## 📊 Structure des Données Attendues

### Collection `fournisseurs` dans MongoDB :
```json
{
  "_id": "ObjectId",
  "nom": "Nom du fournisseur",
  "email": "contact@fournisseur.com",
  "telephone": "+216 XX XXX XXX",
  "adresse": "Adresse complète",
  "ville": "Ville",
  "codePostal": "Code postal",
  "pays": "Tunisie",
  "siteWeb": "https://site.com",
  "contactPrincipal": "Nom du contact",
  "specialites": ["Ciment", "Béton", "Acier"],
  "statut": "actif",
  "delaiLivraison": 7,
  "evaluation": 4,
  "notes": "Notes sur le fournisseur",
  "materialsSupplied": ["ObjectId1", "ObjectId2"],
  "coordonnees": {
    "latitude": 36.8625,
    "longitude": 10.1958
  },
  "isActive": true
}
```

## 🎯 Avantages de cette Approche

### ✅ Performance
- **Connexion directe** : Pas de latence réseau entre services
- **Requêtes optimisées** : Filtrage au niveau base de données
- **Cache local** : Connexion persistante

### ✅ Fiabilité
- **Moins de points de défaillance** : Pas de dépendance service externe
- **Gestion d'erreurs** : Fallback automatique
- **Reconnexion automatique** : En cas de perte de connexion

### ✅ Fonctionnalités Avancées
- **Recherche géographique** : Tri par proximité du chantier
- **Priorisation intelligente** : Préférés → spécialisés → proches → tous
- **Filtrage flexible** : Par matériau, statut, évaluation

## 🔍 Logs de Débogage

Le service affiche des logs détaillés :
```
[SuppliersService] Connexion à la base de données des fournisseurs établie
[SuppliersService] 5 fournisseurs trouvés dans la base de données
[SuppliersService] 3 suggestions de fournisseurs générées pour le matériau 12345
```

## 🎉 Résultat Final

L'interface de commande récupère maintenant les fournisseurs **directement depuis MongoDB** avec :
- ✅ **Performance optimisée** (connexion directe)
- ✅ **Données en temps réel** (pas de cache service)
- ✅ **Tri intelligent** (préférés, proximité, évaluation)
- ✅ **Informations complètes** (contact, spécialités, coordonnées)
- ✅ **Gestion d'erreurs robuste** (fallback automatique)

Le message "Aucun fournisseur dans la base de données" ne devrait plus apparaître si la collection `fournisseurs` contient des données !