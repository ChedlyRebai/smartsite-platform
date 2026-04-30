# 🧪 TESTS DE CONSOMMATION - MATERIALS SERVICE

## ✅ VÉRIFICATION DE LA LOGIQUE DU CODE

### **Analyse du code**
La logique de consommation est **CORRECTE** :

1. ✅ **Validation des données** : DTOs avec `class-validator` (Min, Max, IsMongoId)
2. ✅ **Calculs automatiques** : `remainingQuantity` et `progressPercentage` calculés automatiquement
3. ✅ **Protection contre dépassement** : Impossible de consommer plus que `initialQuantity`
4. ✅ **Index unique** : Pas de doublons (siteId + materialId)
5. ✅ **Traçabilité** : `lastUpdated`, `notes`, `createdBy`

### **Formules vérifiées**
```typescript
remainingQuantity = initialQuantity - consumedQuantity
progressPercentage = (consumedQuantity / initialQuantity) × 100
```

---

## 🎯 SCÉNARIOS DE TEST AVEC VOS MATÉRIAUX

### **Prérequis**
- Service materials-service sur `http://localhost:3002`
- Avoir un `siteId` valide (ex: `67a1b2c3d4e5f6g7h8i9j0k1`)

---

## 📋 TEST 1 : CRÉER UNE EXIGENCE DE CONSOMMATION

### **Scénario : Chantier A a besoin de 5000 kg de Ciment Portland**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "MATERIAL_ID_CIM001",
  "initialQuantity": 5000,
  "notes": "Ciment Portland pour fondations - Chantier A"
}
```

**Réponse attendue :**
```json
{
  "_id": "...",
  "siteId": "VOTRE_SITE_ID",
  "materialId": "MATERIAL_ID_CIM001",
  "initialQuantity": 5000,
  "consumedQuantity": 0,
  "remainingQuantity": 5000,
  "progressPercentage": 0,
  "notes": "Ciment Portland pour fondations - Chantier A",
  "lastUpdated": "2024-01-15T10:00:00.000Z"
}
```

---

## 📋 TEST 2 : AJOUTER UNE CONSOMMATION PROGRESSIVE

### **Jour 1 : Consommation de 1500 kg**

```http
POST http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM001/add
Content-Type: application/json

{
  "quantity": 1500,
  "notes": "Jour 1 - Coulage dalle principale"
}
```

**Réponse attendue :**
```json
{
  "consumedQuantity": 1500,
  "remainingQuantity": 3500,
  "progressPercentage": 30,
  "notes": "Ciment Portland pour fondations - Chantier A\nJour 1 - Coulage dalle principale"
}
```

### **Jour 5 : Consommation de 2000 kg supplémentaires**

```http
POST http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM001/add
Content-Type: application/json

{
  "quantity": 2000,
  "notes": "Jour 5 - Murs porteurs"
}
```

**Réponse attendue :**
```json
{
  "consumedQuantity": 3500,
  "remainingQuantity": 1500,
  "progressPercentage": 70,
  "notes": "...\nJour 5 - Murs porteurs"
}
```

### **Jour 10 : Consommation finale de 1500 kg**

```http
POST http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM001/add
Content-Type: application/json

{
  "quantity": 1500,
  "notes": "Jour 10 - Finitions"
}
```

**Réponse attendue :**
```json
{
  "consumedQuantity": 5000,
  "remainingQuantity": 0,
  "progressPercentage": 100,
  "notes": "...\nJour 10 - Finitions"
}
```

---

## 📋 TEST 3 : METTRE À JOUR LA CONSOMMATION DIRECTEMENT

### **Scénario : Corriger la consommation à 4200 kg**

```http
PUT http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM001
Content-Type: application/json

{
  "consumedQuantity": 4200,
  "notes": "Correction après inventaire"
}
```

**Réponse attendue :**
```json
{
  "consumedQuantity": 4200,
  "remainingQuantity": 800,
  "progressPercentage": 84
}
```

---

## 📋 TEST 4 : CRÉER PLUSIEURS EXIGENCES POUR UN CHANTIER

### **Matériau 1 : Sable (CIM009)**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "MATERIAL_ID_CIM009",
  "initialQuantity": 12000,
  "notes": "Sable pour béton"
}
```

### **Matériau 2 : Gravier (CIM010)**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "MATERIAL_ID_CIM010",
  "initialQuantity": 9500,
  "notes": "Gravier pour béton"
}
```

### **Matériau 3 : Fer à béton (CIM011)**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "MATERIAL_ID_CIM011",
  "initialQuantity": 7000,
  "notes": "Fer pour armatures"
}
```

---

## 📋 TEST 5 : VOIR TOUS LES MATÉRIAUX D'UN CHANTIER

```http
GET http://localhost:3002/api/site-consumption/site/VOTRE_SITE_ID
```

**Réponse attendue :**
```json
[
  {
    "_id": "...",
    "siteId": "VOTRE_SITE_ID",
    "materialId": "...",
    "materialName": "Ciment Portland",
    "materialCode": "CIM001",
    "materialCategory": "Construction",
    "materialUnit": "kg",
    "initialQuantity": 5000,
    "consumedQuantity": 4200,
    "remainingQuantity": 800,
    "progressPercentage": 84,
    "lastUpdated": "2024-01-15T14:30:00.000Z",
    "notes": "..."
  },
  {
    "materialName": "Sable",
    "materialCode": "CIM009",
    "initialQuantity": 12000,
    "consumedQuantity": 0,
    "remainingQuantity": 12000,
    "progressPercentage": 0
  },
  ...
]
```

---

## 📋 TEST 6 : STATISTIQUES DU CHANTIER

```http
GET http://localhost:3002/api/site-consumption/site/VOTRE_SITE_ID/stats?siteName=Chantier%20A
```

**Réponse attendue :**
```json
{
  "siteId": "VOTRE_SITE_ID",
  "siteName": "Chantier A",
  "totalInitialQuantity": 33500,
  "totalConsumedQuantity": 4200,
  "totalRemainingQuantity": 29300,
  "overallProgress": 12.5,
  "materialsCount": 4,
  "materials": [...]
}
```

---

## 📋 TEST 7 : MATÉRIAUX À FORTE CONSOMMATION (>80%)

### **Ajouter des consommations pour atteindre 80%+**

```http
POST http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM009/add
Content-Type: application/json

{
  "quantity": 10000,
  "notes": "Consommation importante"
}
```

### **Voir les matériaux à forte consommation**

```http
GET http://localhost:3002/api/site-consumption/high-consumption?threshold=80
```

**Réponse attendue :**
```json
[
  {
    "_id": "...",
    "siteId": "VOTRE_SITE_ID",
    "materialId": "...",
    "materialName": "Ciment Portland",
    "materialCode": "CIM001",
    "initialQuantity": 5000,
    "consumedQuantity": 4200,
    "remainingQuantity": 800,
    "progressPercentage": 84
  },
  {
    "materialName": "Sable",
    "materialCode": "CIM009",
    "initialQuantity": 12000,
    "consumedQuantity": 10000,
    "remainingQuantity": 2000,
    "progressPercentage": 83.3
  }
]
```

---

## 📋 TEST 8 : VOIR TOUTES LES EXIGENCES (TOUS CHANTIERS)

```http
GET http://localhost:3002/api/site-consumption/all
```

**Réponse attendue :**
```json
[
  {
    "_id": "...",
    "siteId": "...",
    "siteName": "Chantier A",
    "materialName": "Ciment Portland",
    "materialCode": "CIM001",
    "progressPercentage": 84
  },
  {
    "siteName": "Chantier B",
    "materialName": "Gravier",
    "materialCode": "CIM010",
    "progressPercentage": 45
  },
  ...
]
```

---

## 📋 TEST 9 : SUPPRIMER UNE EXIGENCE

```http
DELETE http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM001
```

**Réponse attendue :**
```
Status: 204 No Content
```

---

## 🚨 TESTS D'ERREURS

### **Erreur 1 : Dépasser la quantité initiale**

```http
POST http://localhost:3002/api/site-consumption/VOTRE_SITE_ID/MATERIAL_ID_CIM001/add
Content-Type: application/json

{
  "quantity": 10000
}
```

**Réponse attendue :**
```json
{
  "statusCode": 400,
  "message": "La consommation totale (14200) depasserait la quantite initiale (5000)"
}
```

### **Erreur 2 : Créer un doublon**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "MATERIAL_ID_CIM001",
  "initialQuantity": 3000
}
```

**Réponse attendue :**
```json
{
  "statusCode": 400,
  "message": "Une exigence existe deja pour ce materiau sur ce chantier"
}
```

### **Erreur 3 : Matériau inexistant**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "000000000000000000000000",
  "initialQuantity": 1000
}
```

**Réponse attendue :**
```json
{
  "statusCode": 404,
  "message": "Materiau #000000000000000000000000 non trouve"
}
```

---

## 🎯 SCÉNARIO COMPLET DE TEST

### **Étape 1 : Récupérer les IDs des matériaux**

```http
GET http://localhost:3002/api/materials?search=Ciment Portland
```

Notez le `_id` du matériau CIM001.

### **Étape 2 : Créer une exigence**

```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "67a1b2c3d4e5f6g7h8i9j0k1",
  "materialId": "ID_RÉCUPÉRÉ_ÉTAPE_1",
  "initialQuantity": 5000,
  "notes": "Test consommation"
}
```

### **Étape 3 : Ajouter 3 consommations progressives**

```http
POST .../add { "quantity": 1000 }  → 20%
POST .../add { "quantity": 2000 }  → 60%
POST .../add { "quantity": 1500 }  → 90%
```

### **Étape 4 : Vérifier les stats**

```http
GET http://localhost:3002/api/site-consumption/site/67a1b2c3d4e5f6g7h8i9j0k1/stats
```

### **Étape 5 : Vérifier les matériaux à forte consommation**

```http
GET http://localhost:3002/api/site-consumption/high-consumption?threshold=80
```

---

## 📊 RÉSUMÉ DES ENDPOINTS

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/site-consumption` | Créer exigence |
| `POST` | `/site-consumption/:siteId/:materialId/add` | Ajouter consommation |
| `PUT` | `/site-consumption/:siteId/:materialId` | Mettre à jour |
| `GET` | `/site-consumption/site/:siteId` | Liste matériaux chantier |
| `GET` | `/site-consumption/site/:siteId/stats` | Stats chantier |
| `GET` | `/site-consumption/all` | Toutes exigences |
| `GET` | `/site-consumption/high-consumption` | Forte consommation |
| `GET` | `/site-consumption/:siteId/:materialId` | Détail exigence |
| `DELETE` | `/site-consumption/:siteId/:materialId` | Supprimer |

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Création d'exigence fonctionne
- [ ] Ajout de consommation calcule correctement `remainingQuantity`
- [ ] Ajout de consommation calcule correctement `progressPercentage`
- [ ] Impossible de dépasser `initialQuantity`
- [ ] Impossible de créer un doublon (siteId + materialId)
- [ ] Les stats du chantier sont correctes
- [ ] Les matériaux à forte consommation (>80%) sont détectés
- [ ] La suppression fonctionne
- [ ] Les notes s'accumulent correctement
- [ ] `lastUpdated` se met à jour

---

## 🔧 COMMANDES UTILES

### **Voir tous les matériaux disponibles**
```http
GET http://localhost:3002/api/materials
```

### **Chercher un matériau par code**
```http
GET http://localhost:3002/api/materials?search=CIM001
```

### **Voir un matériau spécifique**
```http
GET http://localhost:3002/api/materials/:materialId
```
