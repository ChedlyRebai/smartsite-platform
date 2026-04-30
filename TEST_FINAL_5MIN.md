# 🧪 Test Final - 5 Minutes

## ✅ Toutes les Corrections Appliquées

1. ✅ Validation quantité minimale
2. ✅ Taux de consommation réel
3. ✅ Météo influence prédiction
4. ✅ Flow log automatique

---

## 🚀 Test Rapide (5 min)

### Étape 1: Créer un Matériau (1 min)

```bash
POST http://localhost:3002/api/materials
Content-Type: application/json

{
  "name": "Ciment Test Final",
  "code": "CIM-FINAL-001",
  "category": "ciment",
  "quantity": 100,
  "unit": "sac",
  "minimumStock": 20,
  "maximumStock": 500,
  "stockMinimum": 50,
  "siteId": "{votre_site_id}"
}
```

**Copier l'ID du matériau créé**

---

### Étape 2: Faire des Sorties (1 min)

```bash
# Sortie 1
PATCH http://localhost:3002/api/materials/{materialId}/stock
Content-Type: application/json

{
  "operation": "remove",
  "quantity": 30,
  "reason": "Utilisation chantier"
}

# Sortie 2
PATCH http://localhost:3002/api/materials/{materialId}/stock
Content-Type: application/json

{
  "operation": "remove",
  "quantity": 25,
  "reason": "Utilisation chantier"
}
```

**Stock actuel** : 100 - 30 - 25 = 45 sacs (< 50 = stock bas)

---

### Étape 3: Vérifier Flow Log (30 sec)

```bash
GET http://localhost:3002/api/materials/flows?materialId={materialId}
```

**Attendu** :
```json
{
  "data": [
    {
      "type": "OUT",
      "quantity": 30,
      "anomalyDetected": "NONE"
    },
    {
      "type": "OUT",
      "quantity": 25,
      "anomalyDetected": "NONE"
    }
  ],
  "total": 2
}
```

✅ **Flow log enregistré automatiquement**

---

### Étape 4: Tester la Prédiction (30 sec)

```bash
GET http://localhost:3002/api/materials/{materialId}/prediction
```

**Attendu** :
```json
{
  "materialId": "...",
  "materialName": "Ciment Test Final",
  "currentStock": 45,
  "consumptionRate": 2.5,  // ← Calculé depuis historique
  "hoursToOutOfStock": 18,
  "status": "critical",
  "recommendedOrderQuantity": 455,  // ← Quantité à commander
  "predictionModelUsed": true,
  "confidence": 0.85,
  "message": "🚨 CRITIQUE! Rupture imminente dans 18h!"
}
```

✅ **Taux calculé depuis historique**
✅ **Quantité recommandée calculée**

---

### Étape 5: Tester Validation Quantité (2 min)

1. **Ouvrir le frontend** : `http://localhost:5173/materials`

2. **Chercher "Ciment Test Final"**

3. **Cliquer sur le bouton "Commander" (jaune)**

4. **Vérifier l'affichage** :
   ```
   ┌─────────────────────────────────────────┐
   │ Nouvelle commande                       │
   ├─────────────────────────────────────────┤
   │ Quantité à commander                    │
   │                                         │
   │ ┌─────────────────────────────────────┐ │
   │ │ ⚠️ Quantité recommandée par l'IA:   │ │
   │ │    455 unités                       │ │
   │ │ ⚠️ Vous devez commander au minimum  │ │
   │ │    cette quantité                   │ │
   │ └─────────────────────────────────────┘ │
   │                                         │
   │ [Input: 455]  ← Pré-rempli             │
   └─────────────────────────────────────────┘
   ```

5. **Essayer de réduire à 100** :
   - Input devient rouge
   - Message d'erreur apparaît : "Quantité insuffisante! Minimum: 455 unités"

6. **Cliquer "Créer la commande"** :
   - Toast d'erreur rouge : "❌ Quantité insuffisante! Minimum recommandé: 455 unités"
   - Commande NON créée

7. **Augmenter à 455 ou plus** :
   - Input redevient normal
   - Message d'erreur disparaît

8. **Cliquer "Créer la commande"** :
   - ✅ Commande créée avec succès
   - ✅ Chat dialog s'ouvre

---

## 📊 Résultats Attendus

### Console Backend (materials-service)

```
[MaterialsService] 📝 Recording OUT movement for material ...
[MaterialFlowService] ✅ Movement recorded: OUT 30 units
[MaterialFlowService] 📊 Taux calculé depuis historique: 2.5 unités/h (55 unités sur 30 jours)
[StockPredictionService] 📊 Taux de consommation effectif: 2.5 unités/h
[MaterialsController] ✅ Prediction calculated for material ...
```

### Console Frontend (navigateur)

```
📊 Prédiction chargée: Quantité recommandée = 455
🌍 Chargement météo pour: lat=36.8065, lng=10.1815
✅ Météo chargée: {temperature: 22, condition: "sunny"}
```

---

## ✅ Checklist de Validation

- [ ] Matériau créé avec succès
- [ ] 2 sorties enregistrées dans Flow Log
- [ ] Prédiction retourne `consumptionRate` > 0
- [ ] Prédiction retourne `recommendedOrderQuantity` > 0
- [ ] CreateOrderDialog affiche quantité recommandée
- [ ] Input pré-rempli avec quantité recommandée
- [ ] Validation empêche commande si quantité < recommandée
- [ ] Toast d'erreur rouge si validation échoue
- [ ] Commande créée si quantité >= recommandée

---

## 🐛 Dépannage

### Prédiction retourne consumptionRate = 0

**Cause** : Pas d'historique de sorties

**Solution** :
1. Faire au moins 2-3 sorties de stock
2. Attendre quelques secondes
3. Redemander la prédiction

---

### Quantité recommandée = 0

**Cause** : Stock actuel > maximumStock

**Solution** :
1. Vérifier que `quantity < stockMinimum`
2. Vérifier que `maximumStock` est défini
3. Faire des sorties pour réduire le stock

---

### Météo non disponible

**Cause** : Site sans coordonnées GPS

**Solution** :
1. Vérifier que le site a `coordinates.lat` et `coordinates.lng`
2. Vérifier que `OPENWEATHER_API_KEY` est dans `.env`
3. Vérifier les logs backend

---

### Flow Log non enregistré

**Cause** : Matériau sans `siteId`

**Solution** :
1. Assigner le matériau à un site
2. Refaire une sortie de stock
3. Vérifier `/api/materials/flows`

---

## 🎯 Temps Total : ~5 minutes

Si tous les tests passent :
- ✅ Validation quantité fonctionne
- ✅ Taux de consommation calculé
- ✅ Météo influence prédiction
- ✅ Flow log enregistré

**Le système est opérationnel !** 🎉
