# 🧪 EXEMPLES DE TESTS AVEC VOS MATÉRIAUX RÉELS

## 📦 Matériaux disponibles dans votre base

D'après votre fichier Excel, voici les matériaux les plus pertinents pour tester :

| Code | Nom | Catégorie | Unité | Stock actuel |
|------|-----|-----------|-------|--------------|
| CIM001 | Ciment Portland | Construction | kg | 4999 |
| CIM008 | Ciment | Construction | kg | 8000 |
| CIM009 | Sable | Construction | kg | 12000 |
| CIM010 | Gravier | Construction | kg | 9500 |
| CIM011 | Fer à béton | Construction | kg | 7000 |
| CIM012 | Bois | Construction | kg | 5000 |
| CIM013 | Carrelage | Finition | m2 | 4000 |
| CIM014 | Briques | Construction | kg | 6500 |
| CIM015 | Peinture | Finition | L | 1200 |

---

## 🏗️ SCÉNARIO 1 : CONSTRUCTION D'UNE MAISON

### **Contexte**
Chantier A construit une maison de 150m². Voici les besoins estimés :

### **Étape 1 : Récupérer les IDs des matériaux**

```http
GET http://localhost:3002/api/materials?code=CIM001
GET http://localhost:3002/api/materials?code=CIM009
GET http://localhost:3002/api/materials?code=CIM010
GET http://localhost:3002/api/materials?code=CIM011
```

**Notez les `_id` retournés !**

---

### **Étape 2 : Créer les exigences pour le chantier**

#### **Ciment Portland - 5000 kg**
```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "ID_CIM001",
  "initialQuantity": 5000,
  "notes": "Ciment pour fondations et structure - Maison 150m²"
}
```

#### **Sable - 12000 kg**
```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "ID_CIM009",
  "initialQuantity": 12000,
  "notes": "Sable pour béton et mortier"
}
```

#### **Gravier - 9500 kg**
```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "ID_CIM010",
  "initialQuantity": 9500,
  "notes": "Gravier pour béton"
}
```

#### **Fer à béton - 7000 kg**
```http
POST http://localhost:3002/api/site-consumption
Content-Type: application/json

{
  "siteId": "VOTRE_SITE_ID",
  "materialId": "ID_CIM011",
  "initialQuantity": 7000,
  "notes": "Fer pour armatures et poteaux"
}
```

---

### **Étape 3 : Simuler la consommation progressive**

#### **SEMAINE 1 : Fondations (20% du projet)**

```http
# Ciment : 1000 kg (20%)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM001/add
Content-Type: application/json
{
  "quantity": 1000,
  "notes": "Semaine 1 - Fondations"
}

# Sable : 2400 kg (20%)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM009/add
Content-Type: application/json
{
  "quantity": 2400,
  "notes": "Semaine 1 - Fondations"
}

# Gravier : 1900 kg (20%)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM010/add
Content-Type: application/json
{
  "quantity": 1900,
  "notes": "Semaine 1 - Fondations"
}

# Fer : 1400 kg (20%)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM011/add
Content-Type: application/json
{
  "quantity": 1400,
  "notes": "Semaine 1 - Armatures fondations"
}
```

**Résultat attendu :**
- Ciment : 1000/5000 = 20%
- Sable : 2400/12000 = 20%
- Gravier : 1900/9500 = 20%
- Fer : 1400/7000 = 20%

---

#### **SEMAINE 3 : Structure (40% cumulé)**

```http
# Ciment : +1000 kg (40% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM001/add
Content-Type: application/json
{
  "quantity": 1000,
  "notes": "Semaine 3 - Poteaux et poutres"
}

# Sable : +2400 kg (40% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM009/add
Content-Type: application/json
{
  "quantity": 2400,
  "notes": "Semaine 3 - Structure"
}

# Gravier : +1900 kg (40% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM010/add
Content-Type: application/json
{
  "quantity": 1900,
  "notes": "Semaine 3 - Structure"
}

# Fer : +1400 kg (40% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM011/add
Content-Type: application/json
{
  "quantity": 1400,
  "notes": "Semaine 3 - Armatures structure"
}
```

**Résultat attendu :**
- Ciment : 2000/5000 = 40%
- Sable : 4800/12000 = 40%
- Gravier : 3800/9500 = 40%
- Fer : 2800/7000 = 40%

---

#### **SEMAINE 6 : Murs et dalles (70% cumulé)**

```http
# Ciment : +1500 kg (70% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM001/add
Content-Type: application/json
{
  "quantity": 1500,
  "notes": "Semaine 6 - Murs et dalles"
}

# Sable : +3600 kg (70% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM009/add
Content-Type: application/json
{
  "quantity": 3600,
  "notes": "Semaine 6 - Murs et dalles"
}

# Gravier : +2850 kg (70% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM010/add
Content-Type: application/json
{
  "quantity": 2850,
  "notes": "Semaine 6 - Murs et dalles"
}

# Fer : +2100 kg (70% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM011/add
Content-Type: application/json
{
  "quantity": 2100,
  "notes": "Semaine 6 - Armatures murs"
}
```

**Résultat attendu :**
- Ciment : 3500/5000 = 70%
- Sable : 8400/12000 = 70%
- Gravier : 6650/9500 = 70%
- Fer : 4900/7000 = 70%

---

#### **SEMAINE 10 : Finitions (90% cumulé)**

```http
# Ciment : +1000 kg (90% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM001/add
Content-Type: application/json
{
  "quantity": 1000,
  "notes": "Semaine 10 - Finitions"
}

# Sable : +2400 kg (90% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM009/add
Content-Type: application/json
{
  "quantity": 2400,
  "notes": "Semaine 10 - Finitions"
}

# Gravier : +1900 kg (90% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM010/add
Content-Type: application/json
{
  "quantity": 1900,
  "notes": "Semaine 10 - Finitions"
}

# Fer : +1400 kg (90% total)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM011/add
Content-Type: application/json
{
  "quantity": 1400,
  "notes": "Semaine 10 - Finitions"
}
```

**Résultat attendu :**
- Ciment : 4500/5000 = 90% ⚠️ ALERTE FORTE CONSOMMATION
- Sable : 10800/12000 = 90% ⚠️ ALERTE FORTE CONSOMMATION
- Gravier : 8550/9500 = 90% ⚠️ ALERTE FORTE CONSOMMATION
- Fer : 6300/7000 = 90% ⚠️ ALERTE FORTE CONSOMMATION

---

### **Étape 4 : Vérifier les statistiques**

```http
GET http://localhost:3002/api/site-consumption/site/SITE_ID/stats?siteName=Chantier%20Maison%20150m²
```

**Réponse attendue :**
```json
{
  "siteId": "SITE_ID",
  "siteName": "Chantier Maison 150m²",
  "totalInitialQuantity": 33500,
  "totalConsumedQuantity": 30150,
  "totalRemainingQuantity": 3350,
  "overallProgress": 90.0,
  "materialsCount": 4,
  "materials": [
    {
      "materialName": "Ciment Portland",
      "materialCode": "CIM001",
      "consumedQuantity": 4500,
      "remainingQuantity": 500,
      "progressPercentage": 90
    },
    {
      "materialName": "Sable",
      "materialCode": "CIM009",
      "consumedQuantity": 10800,
      "remainingQuantity": 1200,
      "progressPercentage": 90
    },
    {
      "materialName": "Gravier",
      "materialCode": "CIM010",
      "consumedQuantity": 8550,
      "remainingQuantity": 950,
      "progressPercentage": 90
    },
    {
      "materialName": "Fer à béton",
      "materialCode": "CIM011",
      "consumedQuantity": 6300,
      "remainingQuantity": 700,
      "progressPercentage": 90
    }
  ]
}
```

---

### **Étape 5 : Voir les matériaux à forte consommation**

```http
GET http://localhost:3002/api/site-consumption/high-consumption?threshold=80
```

**Réponse attendue :**
```json
[
  {
    "materialName": "Ciment Portland",
    "materialCode": "CIM001",
    "progressPercentage": 90,
    "remainingQuantity": 500
  },
  {
    "materialName": "Sable",
    "materialCode": "CIM009",
    "progressPercentage": 90,
    "remainingQuantity": 1200
  },
  {
    "materialName": "Gravier",
    "materialCode": "CIM010",
    "progressPercentage": 90,
    "remainingQuantity": 950
  },
  {
    "materialName": "Fer à béton",
    "materialCode": "CIM011",
    "progressPercentage": 90,
    "remainingQuantity": 700
  }
]
```

---

## 🏢 SCÉNARIO 2 : RÉNOVATION D'UN IMMEUBLE

### **Contexte**
Chantier B rénove un immeuble. Besoins en finitions :

### **Créer les exigences**

```http
# Carrelage - 4000 m²
POST http://localhost:3002/api/site-consumption
Content-Type: application/json
{
  "siteId": "SITE_B_ID",
  "materialId": "ID_CIM013",
  "initialQuantity": 4000,
  "notes": "Carrelage pour tous les appartements"
}

# Peinture - 1200 L
POST http://localhost:3002/api/site-consumption
Content-Type: application/json
{
  "siteId": "SITE_B_ID",
  "materialId": "ID_CIM015",
  "initialQuantity": 1200,
  "notes": "Peinture pour murs et plafonds"
}

# Bois - 5000 kg
POST http://localhost:3002/api/site-consumption
Content-Type: application/json
{
  "siteId": "SITE_B_ID",
  "materialId": "ID_CIM012",
  "initialQuantity": 5000,
  "notes": "Bois pour menuiseries"
}
```

### **Consommation progressive**

```http
# Étage 1 : 25%
POST .../SITE_B_ID/ID_CIM013/add
{ "quantity": 1000, "notes": "Étage 1 - Carrelage" }

POST .../SITE_B_ID/ID_CIM015/add
{ "quantity": 300, "notes": "Étage 1 - Peinture" }

POST .../SITE_B_ID/ID_CIM012/add
{ "quantity": 1250, "notes": "Étage 1 - Menuiseries" }

# Étage 2 : 50% total
POST .../SITE_B_ID/ID_CIM013/add
{ "quantity": 1000, "notes": "Étage 2 - Carrelage" }

POST .../SITE_B_ID/ID_CIM015/add
{ "quantity": 300, "notes": "Étage 2 - Peinture" }

POST .../SITE_B_ID/ID_CIM012/add
{ "quantity": 1250, "notes": "Étage 2 - Menuiseries" }

# Étage 3 : 75% total
POST .../SITE_B_ID/ID_CIM013/add
{ "quantity": 1000, "notes": "Étage 3 - Carrelage" }

POST .../SITE_B_ID/ID_CIM015/add
{ "quantity": 300, "notes": "Étage 3 - Peinture" }

POST .../SITE_B_ID/ID_CIM012/add
{ "quantity": 1250, "notes": "Étage 3 - Menuiseries" }
```

---

## 🧪 SCÉNARIO 3 : TEST D'ERREURS

### **Test 1 : Dépasser la quantité initiale**

```http
# Créer une exigence de 1000 kg
POST http://localhost:3002/api/site-consumption
Content-Type: application/json
{
  "siteId": "SITE_ID",
  "materialId": "ID_CIM001",
  "initialQuantity": 1000,
  "notes": "Test dépassement"
}

# Tenter de consommer 1500 kg (DEVRAIT ÉCHOUER)
POST http://localhost:3002/api/site-consumption/SITE_ID/ID_CIM001/add
Content-Type: application/json
{
  "quantity": 1500,
  "notes": "Tentative de dépassement"
}
```

**Erreur attendue :**
```json
{
  "statusCode": 400,
  "message": "La consommation totale (1500) depasserait la quantite initiale (1000)"
}
```

---

### **Test 2 : Créer un doublon**

```http
# Créer une première exigence
POST http://localhost:3002/api/site-consumption
Content-Type: application/json
{
  "siteId": "SITE_ID",
  "materialId": "ID_CIM001",
  "initialQuantity": 1000
}

# Tenter de créer la même exigence (DEVRAIT ÉCHOUER)
POST http://localhost:3002/api/site-consumption
Content-Type: application/json
{
  "siteId": "SITE_ID",
  "materialId": "ID_CIM001",
  "initialQuantity": 2000
}
```

**Erreur attendue :**
```json
{
  "statusCode": 400,
  "message": "Une exigence existe deja pour ce materiau sur ce chantier"
}
```

---

## 📊 TABLEAU RÉCAPITULATIF DES TESTS

| Test | Endpoint | Résultat attendu |
|------|----------|------------------|
| Créer exigence | `POST /site-consumption` | 201 Created |
| Ajouter 20% | `POST .../add` | progressPercentage: 20 |
| Ajouter 30% | `POST .../add` | progressPercentage: 50 |
| Ajouter 40% | `POST .../add` | progressPercentage: 90 |
| Stats chantier | `GET /site/:id/stats` | overallProgress: 90 |
| Forte consommation | `GET /high-consumption?threshold=80` | 4 matériaux |
| Dépasser limite | `POST .../add` | 400 Bad Request |
| Créer doublon | `POST /site-consumption` | 400 Bad Request |

---

## ✅ CHECKLIST DE VALIDATION

Après avoir exécuté tous les tests, vérifiez :

- [ ] Les exigences sont créées avec `progressPercentage: 0`
- [ ] `remainingQuantity = initialQuantity - consumedQuantity`
- [ ] `progressPercentage = (consumedQuantity / initialQuantity) × 100`
- [ ] Impossible de dépasser `initialQuantity`
- [ ] Impossible de créer un doublon (même siteId + materialId)
- [ ] Les notes s'accumulent avec des retours à la ligne
- [ ] `lastUpdated` se met à jour à chaque modification
- [ ] Les stats du chantier sont correctes
- [ ] Les matériaux >80% apparaissent dans `/high-consumption`
- [ ] La suppression fonctionne

---

## 🎯 PROCHAINES ÉTAPES

1. **Récupérer un siteId valide** depuis votre service gestion-sites
2. **Récupérer les materialId** avec `GET /api/materials?code=CIM001`
3. **Exécuter le Scénario 1** (construction maison)
4. **Vérifier les calculs** avec les stats
5. **Tester les erreurs** (Scénario 3)

Bonne chance avec vos tests ! 🚀
