# 🔧 Corrections - Prédiction, Flow Log & Météo

## 📋 Problèmes à Corriger

### 1. ❌ Quantité à commander non validée
**Problème** : Pas de validation de quantité minimale basée sur la prédiction IA

### 2. ❌ Prédiction ne s'affiche pas
**Problème** : Taux de consommation non calculé correctement (utilise 1 par défaut)

### 3. ❌ Flow Log non enregistré
**Problème** : Entrées/sorties ne sont pas enregistrées automatiquement

### 4. ❌ Météo basée sur consommation
**Problème** : Météo doit influencer la prédiction de consommation

---

## ✅ Solution 1: Validation Quantité Minimale

### Frontend - CreateOrderDialog.tsx

**Ajout des états** :
```typescript
const [recommendedQuantity, setRecommendedQuantity] = useState<number>(0);
const [minQuantity, setMinQuantity] = useState<number>(1);
const [loadingPrediction, setLoadingPrediction] = useState(false);
```

**Chargement de la prédiction** :
```typescript
const loadPrediction = async () => {
  setLoadingPrediction(true);
  try {
    const response = await fetch(`http://localhost:3002/api/materials/${materialId}/prediction`);
    if (response.ok) {
      const prediction = await response.json();
      const recommended = prediction.recommendedOrderQuantity || 0;
      setRecommendedQuantity(recommended);
      setMinQuantity(recommended);
      setQuantity(recommended);
      console.log(`📊 Prédiction chargée: Quantité recommandée = ${recommended}`);
    }
  } catch (error) {
    console.error('Erreur chargement prédiction:', error);
  } finally {
    setLoadingPrediction(false);
  }
};
```

**Validation avant création** :
```typescript
const handleCreateOrder = async () => {
  // ... autres validations ...
  
  // Validation de la quantité minimale
  if (recommendedQuantity > 0 && quantity < recommendedQuantity) {
    toast.error(
      `❌ Quantité insuffisante! Minimum recommandé: ${recommendedQuantity} unités. Vous avez saisi: ${quantity} unités.`,
      { duration: 5000 }
    );
    return;
  }
  
  // ... création de la commande ...
};
```

**Affichage de l'alerte** :
```tsx
{loadingPrediction ? (
  <div className="text-sm text-gray-500">Calcul de la quantité recommandée...</div>
) : recommendedQuantity > 0 ? (
  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-2">
    <div className="flex items-center gap-2 text-blue-800">
      <AlertTriangle className="h-4 w-4" />
      <span className="font-semibold">Quantité recommandée par l'IA: {recommendedQuantity} unités</span>
    </div>
    <div className="text-xs text-blue-600 mt-1">
      ⚠️ Vous devez commander au minimum cette quantité
    </div>
  </div>
) : null}

<Input
  type="number"
  min={minQuantity}
  value={quantity}
  onChange={(e) => setQuantity(parseInt(e.target.value) || minQuantity)}
  className={`w-full ${quantity < recommendedQuantity && recommendedQuantity > 0 ? 'border-red-500' : ''}`}
/>

{quantity < recommendedQuantity && recommendedQuantity > 0 && (
  <div className="text-xs text-red-600 flex items-center gap-1">
    <AlertTriangle className="h-3 w-3" />
    Quantité insuffisante! Minimum: {recommendedQuantity} unités
  </div>
)}
```

---

## ✅ Solution 2: Calcul Correct du Taux de Consommation

### Backend - stock-prediction.service.ts

**Problème actuel** :
```typescript
// ❌ Utilise un taux fixe de 1
const effectiveRate = Math.max(1, consumptionRate);
```

**Solution** : Calculer le taux réel depuis MaterialFlowLog

**Nouvelle méthode** :
```typescript
/**
 * Calculer le taux de consommation réel depuis l'historique
 */
private async calculateRealConsumptionRate(
  materialId: string,
  siteId?: string
): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Récupérer les sorties des 30 derniers jours
    const MaterialFlowLog = this.flowLogModel || 
      this.connection.model('MaterialFlowLog');
    
    const outMovements = await MaterialFlowLog.aggregate([
      {
        $match: {
          materialId: new Types.ObjectId(materialId),
          ...(siteId && { siteId: new Types.ObjectId(siteId) }),
          type: 'OUT',
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalOut: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (outMovements.length === 0 || outMovements[0].totalOut === 0) {
      // Pas d'historique, utiliser un taux par défaut
      return 2; // 2 unités par heure
    }

    // Calculer le taux horaire
    const totalOut = outMovements[0].totalOut;
    const hoursIn30Days = 30 * 24;
    const hourlyRate = totalOut / hoursIn30Days;

    return Math.max(0.5, hourlyRate); // Minimum 0.5 unités/heure
  } catch (error) {
    this.logger.error(`Erreur calcul taux consommation: ${error.message}`);
    return 2; // Fallback
  }
}
```

**Modifier predictStockDepletion** :
```typescript
async predictStockDepletion(
  materialId: string,
  materialName: string,
  currentStock: number,
  minimumStock: number,
  maximumStock: number,
  reorderPoint: number,
  consumptionRate: number, // Peut être 0 ou incorrect
  siteId?: string
): Promise<StockPredictionResult> {
  try {
    // Calculer le vrai taux de consommation
    const realRate = await this.calculateRealConsumptionRate(materialId, siteId);
    const effectiveRate = consumptionRate > 0 ? consumptionRate : realRate;
    
    this.logger.log(`📊 Taux de consommation: fourni=${consumptionRate}, réel=${realRate}, effectif=${effectiveRate}`);
    
    // ... reste du code ...
  }
}
```

---

## ✅ Solution 3: Enregistrement Automatique dans Flow Log

### Backend - materials.controller.ts

**Modifier l'endpoint updateStock** :
```typescript
@Patch(':id/stock')
async updateStock(
  @Param('id') id: string,
  @Body() updateStockDto: UpdateStockDto,
  @Req() req: any,
) {
  const userId = req.user?.userId || req.user?.id || 'system';
  
  // 1. Mettre à jour le stock
  const result = await this.materialsService.updateStock(id, updateStockDto, userId);
  
  // 2. Enregistrer dans MaterialFlowLog
  const material = result.material;
  const siteId = material.siteId?.toString();
  
  if (siteId) {
    try {
      const flowType = updateStockDto.operation === 'add' ? 'IN' : 
                       updateStockDto.operation === 'remove' ? 'OUT' :
                       updateStockDto.operation === 'damage' ? 'DAMAGE' :
                       updateStockDto.operation === 'reserve' ? 'RESERVE' : 'ADJUSTMENT';
      
      await this.materialFlowService.recordMovement({
        siteId,
        materialId: id,
        type: flowType,
        quantity: updateStockDto.quantity,
        reason: updateStockDto.reason || `Stock ${updateStockDto.operation}`,
        projectId: updateStockDto.projectId,
      }, userId);
      
      this.logger.log(`✅ Flow log enregistré: ${flowType} ${updateStockDto.quantity} unités`);
    } catch (error) {
      this.logger.error(`⚠️ Erreur enregistrement flow log: ${error.message}`);
      // Ne pas faire échouer l'opération principale
    }
  }
  
  return result;
}
```

---

## ✅ Solution 4: Météo Influence la Prédiction

### Backend - stock-prediction.service.ts

**Ajouter paramètre météo** :
```typescript
async predictStockDepletion(
  materialId: string,
  materialName: string,
  currentStock: number,
  minimumStock: number,
  maximumStock: number,
  reorderPoint: number,
  consumptionRate: number,
  siteId?: string,
  weatherCondition?: 'sunny' | 'rainy' | 'stormy' | 'cloudy' | 'snowy' | 'windy'
): Promise<StockPredictionResult> {
  try {
    // Calculer le taux de consommation réel
    let effectiveRate = await this.calculateRealConsumptionRate(materialId, siteId);
    
    // Ajuster selon la météo
    if (weatherCondition) {
      const weatherMultiplier = this.getWeatherMultiplier(weatherCondition);
      effectiveRate = effectiveRate * weatherMultiplier;
      this.logger.log(`🌤️ Ajustement météo (${weatherCondition}): x${weatherMultiplier}`);
    }
    
    // ... reste du code ...
  }
}

/**
 * Obtenir le multiplicateur de consommation selon la météo
 */
private getWeatherMultiplier(condition: string): number {
  const multipliers: Record<string, number> = {
    'sunny': 1.0,    // Conditions normales
    'cloudy': 1.05,  // Légère augmentation
    'rainy': 1.3,    // Pluie = travail plus lent = plus de consommation
    'stormy': 1.5,   // Orage = conditions difficiles
    'snowy': 1.4,    // Neige = conditions difficiles
    'windy': 1.1,    // Vent = légère augmentation
  };
  return multipliers[condition] || 1.0;
}
```

### Backend - materials.controller.ts

**Modifier l'endpoint prediction** :
```typescript
@Get(':id/prediction')
async getStockPrediction(@Param('id') id: string) {
  const material = await this.materialsService.findOne(id);
  
  // Récupérer la météo si le matériau a un site avec coordonnées
  let weatherCondition: string | undefined;
  if (material.siteId) {
    try {
      const siteResponse = await axios.get(
        `http://localhost:3001/api/gestion-sites/${material.siteId}`
      );
      const site = siteResponse.data;
      
      if (site?.coordinates?.lat && site?.coordinates?.lng) {
        const weatherResponse = await this.getWeatherByCoordinates(
          site.coordinates.lat.toString(),
          site.coordinates.lng.toString()
        );
        
        if (weatherResponse.success && weatherResponse.weather) {
          weatherCondition = weatherResponse.weather.condition;
          this.logger.log(`🌤️ Météo récupérée: ${weatherCondition}`);
        }
      }
    } catch (error) {
      this.logger.warn(`⚠️ Impossible de récupérer la météo: ${error.message}`);
    }
  }
  
  // Calculer le taux de consommation
  const consumptionRate = await this.calculateConsumptionRate(material._id.toString());
  
  return this.predictionService.predictStockDepletion(
    material._id.toString(),
    material.name,
    material.quantity,
    material.minimumStock,
    material.maximumStock,
    material.stockMinimum || material.reorderPoint,
    consumptionRate,
    material.siteId?.toString(),
    weatherCondition as any
  );
}
```

---

## 🧪 Tests à Effectuer

### Test 1: Validation Quantité Minimale

1. **Créer un matériau en stock bas** :
   ```json
   {
     "name": "Test Validation",
     "code": "TEST-VAL-001",
     "quantity": 10,
     "stockMinimum": 30
   }
   ```

2. **Cliquer sur "Commander"**
3. **Vérifier** :
   - ✅ Quantité recommandée affichée (ex: 150 unités)
   - ✅ Input pré-rempli avec cette quantité
   - ✅ Alerte bleue visible

4. **Essayer de réduire la quantité** (ex: 50)
5. **Cliquer sur "Créer la commande"**
6. **Attendu** :
   - ❌ Toast d'erreur rouge
   - ❌ "Quantité insuffisante! Minimum recommandé: 150 unités"
   - ❌ Commande NON créée

7. **Augmenter à 150 ou plus**
8. **Cliquer sur "Créer la commande"**
9. **Attendu** :
   - ✅ Commande créée avec succès

---

### Test 2: Prédiction avec Historique

1. **Créer un matériau** :
   ```json
   {
     "name": "Test Prédiction",
     "code": "TEST-PRED-001",
     "quantity": 100,
     "stockMinimum": 30,
     "siteId": "{siteId}"
   }
   ```

2. **Faire plusieurs sorties** :
   ```bash
   # Sortie 1
   PATCH /api/materials/{id}/stock
   { "operation": "remove", "quantity": 10, "reason": "Utilisation chantier" }
   
   # Sortie 2
   PATCH /api/materials/{id}/stock
   { "operation": "remove", "quantity": 15, "reason": "Utilisation chantier" }
   
   # Sortie 3
   PATCH /api/materials/{id}/stock
   { "operation": "remove", "quantity": 12, "reason": "Utilisation chantier" }
   ```

3. **Vérifier MaterialFlowLog** :
   ```bash
   GET /api/materials/flows?materialId={id}
   ```
   **Attendu** : 3 entrées avec type="OUT"

4. **Demander la prédiction** :
   ```bash
   GET /api/materials/{id}/prediction
   ```
   **Attendu** :
   ```json
   {
     "consumptionRate": 1.5,  // Calculé depuis l'historique
     "hoursToOutOfStock": 50,
     "recommendedOrderQuantity": 150,
     "message": "⚠️ Alerte! Stock faible..."
   }
   ```

---

### Test 3: Météo Influence Prédiction

1. **Créer un site avec coordonnées** :
   ```json
   {
     "nom": "Site Météo Test",
     "coordinates": { "lat": 36.8065, "lng": 10.1815 }
   }
   ```

2. **Assigner un matériau au site**

3. **Demander la prédiction** :
   ```bash
   GET /api/materials/{id}/prediction
   ```

4. **Vérifier les logs backend** :
   ```
   🌤️ Météo récupérée: rainy
   📊 Taux de consommation: fourni=0, réel=2.5, effectif=3.25
   🌤️ Ajustement météo (rainy): x1.3
   ```

5. **Attendu dans la réponse** :
   ```json
   {
     "consumptionRate": 3.25,  // 2.5 * 1.3 (pluie)
     "hoursToOutOfStock": 30,  // Réduit à cause de la pluie
     "message": "🚨 CRITIQUE! Rupture imminente dans 30h!"
   }
   ```

---

## 📊 Résultat Final

### Avant ❌
```
- Quantité à commander non validée
- Prédiction utilise taux fixe de 1
- Flow log non enregistré automatiquement
- Météo n'influence pas la prédiction
```

### Après ✅
```
- Validation stricte de la quantité minimale
- Taux de consommation calculé depuis l'historique
- Flow log enregistré automatiquement
- Météo ajuste la prédiction (pluie = +30%)
- Alerte visuelle si quantité insuffisante
```

---

## 🎯 Checklist de Validation

- [ ] Quantité recommandée affichée dans CreateOrderDialog
- [ ] Validation empêche commande si quantité < recommandée
- [ ] Toast d'erreur rouge si validation échoue
- [ ] Taux de consommation calculé depuis MaterialFlowLog
- [ ] Flow log enregistré pour chaque entrée/sortie
- [ ] Météo récupérée depuis les coordonnées du site
- [ ] Prédiction ajustée selon la météo
- [ ] Logs backend montrent les calculs

---

**Toutes les corrections sont prêtes à être appliquées !** 🚀
