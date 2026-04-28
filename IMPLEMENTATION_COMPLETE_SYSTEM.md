# 🎯 Implémentation Système Complet - Materials Service

## 📋 Fonctionnalités à Implémenter

### ✅ Déjà Implémenté (Backend)
1. Flow log avec détection d'anomalies
2. Email automatique si sortie excessive
3. Validation quantité commande (backend)
4. Prédiction ML avec TensorFlow.js
5. Datasets générés (stock-prediction.csv, anomaly-detection.csv)
6. Météo par coordonnées GPS
7. Historique consommation centralisé

### 🔧 À Corriger/Implémenter (Frontend)

#### 1. Formulaire Ajout Matériau avec Flow Log
**Fichier**: `apps/frontend/src/app/pages/materials/CreateMaterialDialog.tsx` (ou similaire)

**Fonctionnalités**:
- Champs: `stockExistant`, `stockEntree`, `stockSortie`
- Calcul automatique: `stockActuel = stockExistant + stockEntree - stockSortie`
- Enregistrement dans flow log si `stockEntree > 0` ou `stockSortie > 0`
- Calcul quantité à commander via prédiction IA

#### 2. Mouvements Récents Détaillés
**Fichier**: `apps/frontend/src/app/pages/materials/MaterialDetails.tsx`

**Affichage**:
- Type: Entrée (+), Sortie (-), Commande (🚚)
- Quantité avec couleur (vert/rouge/bleu)
- Date et heure
- Raison du mouvement
- Badge anomalie si détectée

#### 3. Météo dans Prédiction ML
**Fichier**: `apps/frontend/src/app/pages/materials/MaterialAdvancedPrediction.tsx`

**Correction**: Déjà appliquée, mais service doit être redémarré

#### 4. Validation Quantité Commande
**Fichier**: `apps/frontend/src/app/pages/materials/CreateOrderDialog.tsx`

**Déjà implémenté**: Validation frontend + backend

---

## 🔄 Workflow Complet

### A. Ajout d'un Matériau

```
1. Utilisateur remplit le formulaire:
   - Nom, Code, Catégorie
   - Stock Existant: 100
   - Stock Entrée: 50
   - Stock Sortie: 20
   - Stock Minimum: 30

2. Frontend calcule:
   - Stock Actuel = 100 + 50 - 20 = 130

3. Frontend appelle prédiction IA:
   GET /api/materials/prediction-for-new
   → Quantité recommandée: 200 unités

4. Backend crée le matériau:
   POST /api/materials
   {
     name, code, category,
     stockExistant: 100,
     stockEntree: 50,
     stockSortie: 20,
     stockMinimum: 30,
     quantity: 130,
     recommendedOrderQuantity: 200
   }

5. Backend enregistre dans flow log:
   - Si stockEntree > 0:
     POST /api/flows { type: IN, quantity: 50 }
   - Si stockSortie > 0:
     POST /api/flows { type: OUT, quantity: 20 }
     → Vérifie anomalie
     → Envoie email si nécessaire

6. Frontend affiche:
   ✅ Matériau créé
   ⚠️ Quantité à commander: 200 unités
```

### B. Commande de Matériau

```
1. Utilisateur clique "Commander"

2. Dialog affiche:
   - Quantité recommandée: 200 unités
   - Input pré-rempli: 200
   - Message: "Minimum requis: 200 unités"

3. Utilisateur saisit quantité:
   - Si < 200: ❌ Erreur "Quantité insuffisante"
   - Si >= 200: ✅ Validation OK

4. Backend valide:
   POST /api/orders
   → Vérifie quantité >= recommandée
   → Rejette si < recommandée

5. Commande créée:
   - Enregistrée dans MaterialOrder
   - Ajoutée aux mouvements récents
```

### C. Détection d'Anomalie

```
1. Utilisateur enregistre sortie: 500 unités

2. Backend calcule consommation normale:
   - Moyenne 30 derniers jours: 50 unités/jour
   - Seuil anomalie: 50 * 1.5 = 75 unités

3. Backend détecte:
   - 500 > 75 → EXCESSIVE_OUT
   - Déviation: (500-50)/50 = 900%

4. Backend enregistre:
   - MaterialFlowLog avec anomalyDetected
   - ConsumptionHistory avec anomalyType

5. Backend envoie email:
   - À: admin@smartsite.com
   - Sujet: "🚨 ALERTE: Sortie excessive - Ciment"
   - Contenu: Détails + risque de vol

6. Frontend affiche:
   - Toast: "⚠️ Anomalie détectée: Sortie excessive"
   - Badge rouge sur le mouvement
```

### D. Prédiction ML

```
1. Utilisateur upload CSV:
   - stock-prediction.csv (1000 lignes)
   - Colonnes: timestamp, stockLevel, consumption, weather, etc.

2. Backend parse et stocke:
   - MLTrainingService.parseCSV()
   - Stocke en mémoire

3. Utilisateur clique "Entraîner":
   - Backend entraîne modèle TensorFlow.js
   - 50 epochs, validation 20%
   - Stocke modèle en mémoire

4. Utilisateur clique "Prédire":
   - Backend utilise modèle entraîné
   - Prédit stock dans 24h
   - Calcule heures avant rupture

5. Frontend affiche:
   - Stock prédit: 50 unités
   - Rupture dans: 72h
   - Statut: ⚠️ Attention
   - Quantité à commander: 200 unités
```

---

## 📝 Code à Implémenter

### 1. Modifier CreateMaterialDialog.tsx

```typescript
// Ajouter après la création du matériau
const handleCreate = async () => {
  // 1. Créer le matériau
  const material = await materialService.create({
    ...formData,
    stockExistant,
    stockEntree,
    stockSortie,
    stockMinimum,
    quantity: stockExistant + stockEntree - stockSortie
  });

  // 2. Enregistrer les mouvements dans flow log
  if (stockEntree > 0) {
    await materialFlowService.recordMovement({
      materialId: material._id,
      siteId: material.siteId,
      type: FlowType.IN,
      quantity: stockEntree,
      reason: 'Stock initial - Entrée'
    });
  }

  if (stockSortie > 0) {
    const result = await materialFlowService.recordMovement({
      materialId: material._id,
      siteId: material.siteId,
      type: FlowType.OUT,
      quantity: stockSortie,
      reason: 'Stock initial - Sortie'
    });

    // Afficher alerte si anomalie
    if (result.anomalyDetected !== 'NONE') {
      toast.warning(`⚠️ ${result.anomalyMessage}`);
    }
  }

  // 3. Récupérer la prédiction IA
  const prediction = await materialService.getStockPrediction(material._id);
  
  toast.success(
    `✅ Matériau créé! Quantité à commander: ${prediction.recommendedOrderQuantity} unités`
  );
};
```

### 2. Modifier MaterialDetails.tsx - Mouvements Récents

```typescript
// Récupérer les mouvements depuis flow log
const loadMovements = async () => {
  try {
    const flows = await materialFlowService.getFlows({
      materialId: material._id,
      siteId: material.siteId,
      limit: 10
    });
    
    setMovements(flows);
  } catch (error) {
    console.error('Error loading movements:', error);
  }
};

// Affichage
{movements.map((movement) => (
  <div key={movement._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
    <div>
      <span className={`font-medium ${
        movement.type === 'IN' ? 'text-green-600' : 
        movement.type === 'OUT' ? 'text-red-600' : 
        'text-blue-600'
      }`}>
        {movement.type === 'IN' ? '+ ' : movement.type === 'OUT' ? '- ' : '🚚 '}
        {movement.quantity} {material.unit}
      </span>
      <span className="text-sm text-gray-500 ml-2">
        {new Date(movement.timestamp).toLocaleString('fr-FR')}
      </span>
      {movement.reason && (
        <p className="text-xs text-gray-600 mt-1">{movement.reason}</p>
      )}
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        {movement.type === 'IN' ? 'Entrée' : 
         movement.type === 'OUT' ? 'Sortie' : 
         'Commande'}
      </Badge>
      {movement.anomalyDetected !== 'NONE' && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Anomalie
        </Badge>
      )}
    </div>
  </div>
))}
```

### 3. Backend - Enregistrement Automatique dans Flow Log

**Fichier**: `apps/backend/materials-service/src/materials/materials.service.ts`

```typescript
async create(createMaterialDto: CreateMaterialDto, userId: string | null): Promise<Material> {
  // ... création du matériau ...
  
  const savedMaterial = await material.save();
  
  // Enregistrer les mouvements initiaux dans flow log
  if (createMaterialDto.stockEntree && createMaterialDto.stockEntree > 0) {
    await this.materialFlowService.recordMovement({
      materialId: savedMaterial._id.toString(),
      siteId: savedMaterial.siteId?.toString() || '',
      type: FlowType.IN,
      quantity: createMaterialDto.stockEntree,
      reason: 'Stock initial - Entrée',
    }, userId);
  }
  
  if (createMaterialDto.stockSortie && createMaterialDto.stockSortie > 0) {
    await this.materialFlowService.recordMovement({
      materialId: savedMaterial._id.toString(),
      siteId: savedMaterial.siteId?.toString() || '',
      type: FlowType.OUT,
      quantity: createMaterialDto.stockSortie,
      reason: 'Stock initial - Sortie',
    }, userId);
  }
  
  return savedMaterial;
}
```

### 4. Backend - Endpoint pour Prédiction Nouvelle Matériau

**Fichier**: `apps/backend/materials-service/src/materials/materials.controller.ts`

```typescript
@Post('predict-for-new')
async predictForNewMaterial(
  @Body() body: { 
    quantity: number; 
    minimumStock: number; 
    maximumStock: number;
    category: string;
  }
) {
  // Utiliser des valeurs par défaut basées sur la catégorie
  const consumptionRate = this.getDefaultConsumptionRate(body.category);
  
  const prediction = await this.predictionService.predictStockDepletion(
    'new',
    'Nouveau matériau',
    body.quantity,
    body.minimumStock,
    body.maximumStock,
    body.minimumStock,
    consumptionRate
  );
  
  return prediction;
}

private getDefaultConsumptionRate(category: string): number {
  const rates = {
    'ciment': 2.5,
    'sable': 3.0,
    'gravier': 2.0,
    'acier': 1.5,
    'bois': 1.0,
  };
  return rates[category?.toLowerCase()] || 1.0;
}
```

---

## 🧪 Tests de Validation

### Test 1: Ajout Matériau avec Flow Log

```bash
# 1. Créer un matériau
POST /api/materials
{
  "name": "Ciment Portland",
  "code": "CIM001",
  "category": "ciment",
  "stockExistant": 100,
  "stockEntree": 50,
  "stockSortie": 20,
  "stockMinimum": 30,
  "siteId": "69ec61d9e0335d072e73b7c1"
}

# 2. Vérifier flow log
GET /api/flows?materialId=XXX

# Résultat attendu:
# - 1 mouvement IN (50 unités)
# - 1 mouvement OUT (20 unités)
```

### Test 2: Anomalie et Email

```bash
# 1. Enregistrer sortie excessive
POST /api/flows
{
  "materialId": "XXX",
  "siteId": "YYY",
  "type": "OUT",
  "quantity": 500,
  "reason": "Test anomalie"
}

# 2. Vérifier réponse
{
  "anomalyDetected": "EXCESSIVE_OUT",
  "anomalyMessage": "🚨 ALERTE: Sortie excessive...",
  "emailSent": true
}

# 3. Vérifier email
https://ethereal.email/messages
```

### Test 3: Validation Commande

```bash
# 1. Récupérer prédiction
GET /api/materials/XXX/prediction
# → recommendedOrderQuantity: 200

# 2. Essayer commande insuffisante
POST /api/orders
{
  "materialId": "XXX",
  "quantity": 150,  # < 200
  ...
}

# Résultat attendu:
# 400 Bad Request
# "Quantité insuffisante! Minimum: 200 unités"

# 3. Commande correcte
POST /api/orders
{
  "materialId": "XXX",
  "quantity": 200,  # >= 200
  ...
}

# Résultat attendu:
# 201 Created
```

---

## 🔄 Actions Requises

### 1. Redémarrer le Service Backend

```bash
# Arrêter tous les processus Node.js du materials-service
# Puis redémarrer
cd apps/backend/materials-service
npm start
```

### 2. Vérifier les Routes

```bash
# Météo
curl "http://localhost:3002/api/materials/weather?lat=36.8&lng=10.2"

# Flow log
curl "http://localhost:3002/api/flows"

# Prédiction
curl "http://localhost:3002/api/materials/XXX/prediction"
```

### 3. Tester le Frontend

1. Ouvrir `http://localhost:5173`
2. Aller sur Materials
3. Ajouter un matériau avec entrée/sortie
4. Vérifier que les mouvements apparaissent
5. Commander et vérifier la validation
6. Voir les détails et vérifier la météo

---

## 📊 Résumé des Fichiers Modifiés

### Backend (Déjà Fait)
- ✅ `materials.controller.ts` - Route weather déplacée
- ✅ `materials.service.ts` - Coordonnées GPS corrigées
- ✅ `site-materials.service.ts` - Coordonnées GPS corrigées
- ✅ `orders.service.ts` - Validation quantité
- ✅ `material-flow.service.ts` - Détection anomalies + email
- ✅ `ml-training.service.ts` - Modèles ML
- ✅ `anomaly-email.service.ts` - Emails automatiques

### Frontend (À Faire)
- 🔧 `CreateMaterialDialog.tsx` - Enregistrer flow log
- 🔧 `MaterialDetails.tsx` - Afficher mouvements détaillés
- ✅ `MaterialAdvancedPrediction.tsx` - Météo corrigée
- ✅ `CreateOrderDialog.tsx` - Validation quantité
- ✅ `MaterialMLTraining.tsx` - Boutons fonctionnels

---

## ✅ Checklist Finale

### Backend
- [x] Route weather avant :id
- [x] Flow log automatique
- [x] Détection anomalies
- [x] Email automatique
- [x] Validation commande
- [x] ML training
- [x] Datasets générés

### Frontend
- [x] Météo dans prédiction ML (correction appliquée)
- [ ] Flow log lors ajout matériau (à implémenter)
- [ ] Mouvements détaillés (à améliorer)
- [x] Validation commande (déjà fait)
- [x] Boutons ML (déjà fonctionnels)

### Tests
- [ ] Ajout matériau → flow log
- [ ] Sortie excessive → email
- [ ] Commande < recommandée → rejet
- [ ] Météo dans prédiction ML
- [ ] Mouvements récents affichés

---

## 🚀 Prochaines Étapes

1. **REDÉMARRER LE SERVICE** (critique!)
2. Implémenter flow log dans CreateMaterialDialog
3. Améliorer affichage mouvements dans MaterialDetails
4. Tester le workflow complet
5. Vérifier les emails sur Ethereal

**Le backend est prêt, il faut juste le redémarrer et compléter le frontend!** 🎉
