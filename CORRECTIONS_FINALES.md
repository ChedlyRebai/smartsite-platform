# 🔧 Corrections Finales - Materials Service

## ✅ Problèmes Corrigés

### 1. **Erreur 404 sur `/materials/sites/:id`**
**Problème**: Route capturée par `@Get(':id')` car placée après  
**Solution**: Déplacé `@Get(':id')` à la fin du controller avec commentaire explicatif  
**Fichier**: `apps/backend/materials-service/src/materials/materials.controller.ts`

```typescript
// ========== DYNAMIC ROUTES (MUST BE LAST) ==========
// Ces routes doivent être placées APRÈS toutes les routes spécifiques
// pour éviter les conflits (ex: /materials/sites/:id capturé par /materials/:id)

@Get(':id')
async findOne(@Param('id') id: string) {
  return this.materialsService.findOne(id);
}
```

### 2. **Erreur "export" cast to ObjectId**
**Problème**: Route `/consumption-history/export` capturée par `/:id`  
**Solution**: Déplacé `@Get('consumption-history/export')` AVANT les routes dynamiques  
**Fichier**: `apps/backend/materials-service/src/materials/materials.controller.ts`

```typescript
// ========== CONSUMPTION HISTORY ENDPOINTS (MUST BE BEFORE :id ROUTES) ==========
@Get('consumption-history/export')
async exportConsumptionHistory(...) { ... }

@Get('consumption-history')
async getConsumptionHistory(...) { ... }
```

### 3. **RefreshCw not defined**
**Problème**: Import manquant dans ConsumptionAIReport  
**Solution**: Ajouté `RefreshCw` dans les imports lucide-react  
**Fichier**: `apps/frontend/src/app/pages/materials/ConsumptionAIReport.tsx`

```typescript
import { 
  Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Shield, AlertCircle, Info, Loader2, FileText, X, RefreshCw
} from "lucide-react";
```

### 4. **Duplication de route consumption-history/export**
**Problème**: Route définie 2 fois (ligne 984 et 1106)  
**Solution**: Supprimé la deuxième occurrence  
**Fichier**: `apps/backend/materials-service/src/materials/materials.controller.ts`

---

## 🚀 Actions Requises

### **URGENT: Redémarrer le service materials-service**

Le service DOIT être redémarré pour que les corrections prennent effet:

```bash
cd apps/backend/materials-service
npm start
```

### Vérifications après redémarrage:

1. **Tester l'endpoint sites/:id**:
```bash
curl http://localhost:3002/api/materials/sites/SITE_ID
```

2. **Tester l'endpoint weather**:
```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8&lng=10.2"
```

3. **Tester l'export consumption-history**:
```bash
curl "http://localhost:3002/api/materials/consumption-history/export?materialId=XXX"
```

4. **Vérifier les logs au démarrage**:
- Routes doivent apparaître dans l'ordre: `weather`, `sites/:id`, `consumption-history/export`, puis `:id`

---

## 📋 Fonctionnalités Déjà Implémentées (Backend)

### ✅ Système de Flow Log
- **Service**: `MaterialFlowService`
- **Endpoint**: `POST /api/flows`
- **Fonctionnalités**:
  - Enregistrement automatique des entrées/sorties
  - Calcul de la consommation normale (30 derniers jours)
  - Détection d'anomalies (EXCESSIVE_OUT si > 150% normale)
  - Email automatique si anomalie détectée

### ✅ Détection d'Anomalies
- **Service**: `AnomalyEmailService`
- **Types d'anomalies**:
  - `EXCESSIVE_OUT`: Sortie > 150% de la normale (risque vol/gaspillage)
  - `EXCESSIVE_IN`: Entrée anormalement élevée
  - `BELOW_SAFETY_STOCK`: Stock en dessous du seuil de sécurité
- **Email automatique**: Envoyé via SMTP Ethereal

### ✅ Validation Quantité Commande
- **Frontend**: `CreateOrderDialog.tsx`
  - Charge automatiquement la prédiction IA
  - Pré-remplit l'input avec la quantité recommandée
  - Affiche alerte bleue + bordure rouge si invalide
  - Toast d'erreur si quantité < recommandée
- **Backend**: `orders.service.ts`
  - Récupère la prédiction IA
  - Compare avec la quantité commandée
  - Rejette avec `BadRequestException` si insuffisante

### ✅ ML Training & Prédiction
- **Service**: `MLTrainingService`
- **Endpoints**:
  - `POST /:id/upload-csv` - Upload dataset historique
  - `POST /:id/train` - Entraîner le modèle
  - `GET /:id/predict` - Prédire rupture de stock
  - `POST /:id/predict-advanced` - Prédiction avancée avec météo
- **Datasets disponibles**:
  - `stock-prediction.csv` (1000 lignes) - Prédire rupture
  - `anomaly-detection.csv` (1000 lignes) - Détecter vol/gaspillage

### ✅ Météo Automatique
- **Endpoint**: `GET /materials/weather?lat=X&lng=Y`
- **Fonctionnalités**:
  - Récupération via OpenWeatherMap API
  - Mapping des conditions météo
  - Intégration dans MaterialDetails (✅ fonctionnel)
  - Intégration dans MaterialAdvancedPrediction (⚠️ à tester après redémarrage)

---

## 🔨 Fonctionnalités À Implémenter (Frontend)

### 1. **Enregistrement Flow Log dans Formulaire Ajout Matériau**
**Objectif**: Lors de l'ajout d'un matériau, enregistrer automatiquement dans flow log

**Fichier à modifier**: `apps/frontend/src/app/pages/materials/CreateMaterialDialog.tsx`

**Logique**:
```typescript
// Après création du matériau
if (stockEntree > 0) {
  await axios.post('/api/flows', {
    materialId: newMaterial._id,
    siteId: formData.siteId,
    type: 'IN',
    quantity: stockEntree,
    reason: 'Stock initial'
  });
}
```

### 2. **Affichage Détaillé des Mouvements**
**Objectif**: Afficher entrée/sortie/commande dans MaterialDetails

**Fichier à modifier**: `apps/frontend/src/app/pages/materials/MaterialDetails.tsx`

**Logique**:
- Récupérer les mouvements via `GET /api/flows?materialId=X`
- Afficher avec badges colorés:
  - 🟢 Entrée (IN)
  - 🔴 Sortie (OUT)
  - 🟡 Commande (ORDER)

### 3. **Interface Enregistrement Manuel Entrées/Sorties**
**Objectif**: Créer un composant pour enregistrer manuellement les mouvements

**Nouveau fichier**: `apps/frontend/src/app/pages/materials/MaterialFlowDialog.tsx`

**Fonctionnalités**:
- Formulaire avec type (Entrée/Sortie), quantité, raison
- Appel `POST /api/flows`
- Détection automatique d'anomalie si sortie > 150% normale
- Affichage alerte si anomalie détectée

### 4. **Entraînement ML pour Détection Anomalies**
**Objectif**: Entraîner un modèle ML pour prédire si consommation est normale/anormale

**Fichier à modifier**: `apps/frontend/src/app/pages/materials/MaterialMLTraining.tsx`

**Logique**:
- Upload `anomaly-detection.csv`
- Entraîner modèle avec `POST /:id/train-anomaly`
- Afficher prédiction: 🟢 Normal / 🔴 Anormal (vol/gaspillage)
- Si anormal: afficher alerte + envoyer email

---

## 📊 Ordre des Routes (Critique pour NestJS)

### ✅ Ordre Correct (Après Corrections)

```typescript
// 1. Routes spécifiques (TOUJOURS EN PREMIER)
@Get('dashboard')
@Get('alerts')
@Get('forecast/:id')
@Get('movements/:id')
@Get('low-stock')
@Get('with-sites')
@Get('expiring')
@Get('weather')  // ✅ AVANT :id
@Get('prediction/all')
@Get('sites')  // ✅ AVANT :id
@Get('sites/test')  // ✅ AVANT :id
@Get('sites/:id')  // ✅ AVANT :id
@Get('suppliers')  // ✅ AVANT :id
@Get('consumption-history/export')  // ✅ AVANT :id
@Get('consumption-history')  // ✅ AVANT :id

// 2. Routes dynamiques (TOUJOURS EN DERNIER)
@Get(':id')  // ⚠️ Capture tout ce qui n'a pas matché avant
@Put(':id')
@Delete(':id')
@Post(':id/reorder')
```

### ❌ Ordre Incorrect (Avant Corrections)

```typescript
@Get(':id')  // ❌ Capture /sites/123, /weather, /export, etc.
@Get('sites/:id')  // ❌ Jamais atteint
@Get('consumption-history/export')  // ❌ Jamais atteint
```

---

## 🧪 Tests de Validation

### Test 1: Endpoint sites/:id
```bash
curl http://localhost:3002/api/materials/sites/675e8e5f8b8e4c001f8b4567
# Attendu: { _id, nom, ville, coordinates: { lat, lng } }
```

### Test 2: Endpoint weather
```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8&lng=10.2"
# Attendu: { success: true, weather: { temperature, description, ... } }
```

### Test 3: Export consumption-history
```bash
curl "http://localhost:3002/api/materials/consumption-history/export" -o test.xlsx
# Attendu: Fichier Excel téléchargé
```

### Test 4: Frontend - Prédiction Avancée
1. Ouvrir un matériau assigné à un chantier
2. Cliquer sur "Prédiction Avancée (IA)"
3. Vérifier que la météo s'affiche automatiquement
4. Vérifier que le champ météo est verrouillé (grisé)

### Test 5: Frontend - Rapport IA
1. Ouvrir "Rapport IA"
2. Cliquer sur "Régénérer"
3. Vérifier qu'aucune erreur "RefreshCw not defined"

---

## 📝 Résumé des Fichiers Modifiés

1. ✅ `apps/backend/materials-service/src/materials/materials.controller.ts`
   - Réorganisation des routes (spécifiques avant dynamiques)
   - Suppression duplication `consumption-history/export`
   - Ajout commentaires explicatifs

2. ✅ `apps/frontend/src/app/pages/materials/ConsumptionAIReport.tsx`
   - Ajout import `RefreshCw`

3. ✅ `apps/frontend/src/app/pages/materials/MaterialAdvancedPrediction.tsx`
   - Correction URL `/api/materials/sites/` (déjà fait précédemment)
   - Correction champs `coordinates.lat/lng` (déjà fait précédemment)

---

## 🎯 Prochaines Étapes

1. **URGENT**: Redémarrer `materials-service`
2. Tester tous les endpoints (sites/:id, weather, export)
3. Implémenter enregistrement flow log dans formulaire ajout
4. Améliorer affichage mouvements dans MaterialDetails
5. Créer MaterialFlowDialog pour enregistrement manuel
6. Entraîner modèle ML pour détection anomalies

---

## 💡 Notes Importantes

- **NestJS évalue les routes dans l'ordre de déclaration**
- **Routes spécifiques TOUJOURS avant routes dynamiques**
- **Service DOIT être redémarré après modification des routes**
- **Météo fonctionne dans MaterialDetails, doit fonctionner dans MaterialAdvancedPrediction après redémarrage**
- **Flow log backend déjà implémenté, manque juste intégration frontend**
- **Validation commande déjà implémentée frontend + backend**
- **Datasets ML disponibles dans `apps/backend/materials-service/`**

---

**Date**: 28 avril 2026, 3:50 AM  
**Status**: ✅ Corrections appliquées, en attente de redémarrage service
