# Guide d'Intégration des Fournisseurs - Materials Service

## ✅ Problème Résolu

Le problème "Aucun fournisseur dans la base de données" a été corrigé en :

1. **Créant un service complet de gestion des fournisseurs** (port 3008)
2. **Corrigeant l'URL dans le service materials** (3005 → 3008)
3. **Ajoutant des données de test** avec 5 fournisseurs tunisiens
4. **Créant des API complètes** pour la gestion des fournisseurs

## 🚀 Services à Démarrer

### 1. Service Gestion-Suppliers (Port 3008)
```bash
cd apps/backend/gestion-suppliers
npm run start:dev
```

### 2. Service Materials (Port 3002)
```bash
cd apps/backend/materials-service
npm run start:dev
```

## 🔧 Initialisation des Données de Test

### Créer les fournisseurs de test :
```bash
curl -X POST http://localhost:3008/fournisseurs/seed
```

Cela créera 5 fournisseurs :
- **BatiMat Tunisie** (Ariana) - Ciment, Béton, Acier
- **Matériaux du Sud** (Sfax) - Peinture, Isolation, Carrelage  
- **Construction Plus** (Tunis) - Électricité, Plomberie, Outillage
- **Ferro Métal** (Bizerte) - Acier, Fer, Métallurgie
- **Eco Matériaux** (Sousse) - Matériaux écologiques

## 🔍 API Endpoints Disponibles

### Service Gestion-Suppliers (http://localhost:3008)
- `GET /fournisseurs` - Liste tous les fournisseurs
- `GET /fournisseurs/:id` - Détails d'un fournisseur
- `POST /fournisseurs` - Créer un fournisseur
- `PATCH /fournisseurs/:id` - Modifier un fournisseur
- `DELETE /fournisseurs/:id` - Supprimer un fournisseur
- `GET /fournisseurs/nearby?latitude=X&longitude=Y` - Fournisseurs proches
- `GET /fournisseurs/by-material/:materialId` - Fournisseurs par matériau
- `POST /fournisseurs/seed` - Créer données de test

### Service Materials (http://localhost:3002)
- `GET /api/materials/suppliers/:materialId` - Fournisseurs pour un matériau
- `GET /api/materials/recommendations/:siteId?` - Recommandations intelligentes

## 🧪 Tests de Fonctionnement

### 1. Vérifier les fournisseurs disponibles :
```bash
curl http://localhost:3008/fournisseurs
```

### 2. Tester les suggestions pour un matériau :
```bash
curl http://localhost:3002/api/materials/suppliers/MATERIAL_ID
```

### 3. Obtenir les recommandations intelligentes :
```bash
curl http://localhost:3002/api/materials/recommendations
```

## 🎯 Fonctionnalités Corrigées

### ✅ Interface de Commande
- Les fournisseurs apparaissent maintenant dans l'interface
- Tri par proximité du chantier
- Affichage des délais de livraison
- Fournisseurs préférés en priorité

### ✅ Recommandations Intelligentes
- Suggestions automatiques de fournisseurs
- Calcul des délais de livraison
- Priorisation des fournisseurs préférés
- Fallback en cas d'erreur de service

### ✅ Gestion Complète des Fournisseurs
- CRUD complet des fournisseurs
- Recherche par proximité géographique
- Association matériaux ↔ fournisseurs
- Évaluation et notes des fournisseurs

## 🔧 Configuration Requise

### Variables d'environnement :
```env
# Dans materials-service/.env
SUPPLIERS_SERVICE_URL=http://localhost:3008

# Dans gestion-suppliers/.env
PORT=3008
MONGODB_URI=mongodb://localhost:27017/smartsite-suppliers
```

## 🎉 Résultat Final

L'interface de commande affichera maintenant :
- ✅ Liste des fournisseurs disponibles
- ✅ Tri par proximité du chantier
- ✅ Délais de livraison estimés
- ✅ Fournisseurs préférés en priorité
- ✅ Informations de contact complètes

Le message "Aucun fournisseur dans la base de données" ne devrait plus apparaître !