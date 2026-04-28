# 🧪 Test Rapide - Corrections Matériaux (5 minutes)

## ✅ Corrections Appliquées

1. **Météo** : Ajout de logs détaillés et gestion d'erreur
2. **Bouton Commander** : Rouge pour rupture, Jaune pour stock bas
3. **Seuil** : Utilisation de `stockMinimum` au lieu de `reorderPoint`

---

## 🚀 Test 1: Bouton Commander (2 min)

### Étape 1: Créer un matériau en stock bas
```bash
POST http://localhost:3002/api/materials
Content-Type: application/json

{
  "name": "Test Stock Bas",
  "code": "TEST-LOW-001",
  "category": "Test",
  "quantity": 10,
  "unit": "kg",
  "minimumStock": 5,
  "maximumStock": 100,
  "stockMinimum": 30
}
```

### Étape 2: Vérifier dans le frontend
1. Ouvrir `http://localhost:5173/materials`
2. Chercher "Test Stock Bas"
3. **Attendu** : 
   - ✅ Badge "Stock bas" (jaune)
   - ✅ Bouton "Commander" (jaune) avec icône 🚚

---

### Étape 3: Créer un matériau en rupture
```bash
POST http://localhost:3002/api/materials
Content-Type: application/json

{
  "name": "Test Rupture",
  "code": "TEST-OUT-001",
  "category": "Test",
  "quantity": 0,
  "unit": "kg",
  "minimumStock": 5,
  "maximumStock": 100,
  "stockMinimum": 30
}
```

### Étape 4: Vérifier dans le frontend
1. Chercher "Test Rupture"
2. **Attendu** :
   - ✅ Badge "Rupture" (rouge)
   - ✅ Bouton "Urgent" (rouge) avec icône ⚠️

---

## 🌤️ Test 2: Météo (3 min)

### Étape 1: Créer un site avec coordonnées
```bash
POST http://localhost:3001/api/gestion-sites
Content-Type: application/json

{
  "nom": "Site Test Météo",
  "adresse": "Avenue Habib Bourguiba, Tunis",
  "localisation": "Tunis",
  "budget": 100000,
  "coordinates": {
    "lat": 36.8065,
    "lng": 10.1815
  }
}
```

**Copier le `id` du site créé**

---

### Étape 2: Assigner un matériau au site
```bash
POST http://localhost:3002/api/materials/{materialId}/assign-site
Content-Type: application/json

{
  "siteId": "{siteId}"
}
```

Remplacer `{materialId}` et `{siteId}` par les vrais IDs.

---

### Étape 3: Vérifier la météo
1. Ouvrir `http://localhost:5173/materials`
2. Cliquer sur "Détails" du matériau assigné
3. **Ouvrir la console (F12)**
4. **Logs Attendus** :
   ```
   🌍 Chargement météo pour: lat=36.8065, lng=10.1815
   📡 Réponse météo: {success: true, weather: {...}}
   ✅ Météo chargée: {temperature: 22, ...}
   ```

5. **Affichage Attendu** :
   ```
   ┌─────────────────────────────────┐
   │ ☀️ Météo du Chantier            │
   │                                 │
   │ ☀️ 22°C - Ensoleillé            │
   │ Ressenti: 24°C                  │
   │ Humidité: 65%                   │
   │ Vent: 12 km/h                   │
   │ Ville: Tunis                    │
   └─────────────────────────────────┘
   ```

---

## 🔍 Dépannage Rapide

### Météo ne se charge pas

**1. Vérifier les coordonnées** :
```bash
GET http://localhost:3002/api/materials
```
Chercher `siteCoordinates` dans la réponse.

**2. Tester l'endpoint météo directement** :
```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8065&lng=10.1815"
```

**3. Vérifier la clé API** :
```bash
# Dans apps/backend/materials-service/.env
OPENWEATHER_API_KEY=9d61b206e0b8dbb7fa1b56b65205d2cc
```

---

### Bouton Commander ne s'affiche pas

**1. Vérifier le stock** :
```bash
GET http://localhost:3002/api/materials/{materialId}
```

Vérifier :
- `quantity` <= `stockMinimum` → Bouton jaune
- `quantity` === 0 → Bouton rouge

**2. Vérifier dans la console** :
```javascript
// Dans MaterialDetails
console.log('Quantity:', material.quantity);
console.log('StockMinimum:', material.stockMinimum);
console.log('Should show button:', material.quantity <= material.stockMinimum);
```

---

## ✅ Checklist Rapide

- [ ] Bouton "Commander" jaune visible pour stock bas
- [ ] Bouton "Urgent" rouge visible pour rupture
- [ ] Météo s'affiche avec emoji ☀️
- [ ] Logs console montrent le chargement météo
- [ ] Coordonnées GPS affichées dans les détails
- [ ] Impact météo dans la prédiction IA

---

## 🎯 Résultat Attendu

### Stock Bas (quantity <= stockMinimum)
```
┌─────────────────────────────────┐
│ Test Stock Bas                  │
│ Quantité: 10 kg                 │
│ ⚠️ Stock bas                    │
│ [🚚 Commander]  ← Jaune         │
└─────────────────────────────────┘
```

### Rupture (quantity === 0)
```
┌─────────────────────────────────┐
│ Test Rupture                    │
│ Quantité: 0 kg                  │
│ 🚨 Rupture                      │
│ [⚠️ Urgent]  ← Rouge            │
└─────────────────────────────────┘
```

### Météo
```
┌─────────────────────────────────┐
│ ☀️ Météo du Chantier            │
│ ☀️ 22°C - Ensoleillé            │
│ Ressenti: 24°C                  │
│ Humidité: 65%                   │
└─────────────────────────────────┘
```

---

**Temps total : ~5 minutes** ⏱️

Si tous les tests passent, le système est opérationnel ! 🎉
