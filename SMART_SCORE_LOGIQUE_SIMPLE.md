# 🎯 Smart Score - Logique Simple et Compréhensible

## Vue d'Ensemble

Le Smart Score est un système simple pour évaluer l'état d'un chantier basé sur la consommation de ses matériaux.

---

## 📊 Logique Principale

### 1. États d'un Matériau

Chaque matériau peut avoir 4 états possibles:

| État | Condition | Description |
|------|-----------|-------------|
| ✅ **OK** | Stock ≥ Minimum, Pas d'anomalie | Tout va bien |
| 📉 **BAS** | Stock < Minimum | Besoin de commander |
| ✔️ **TERMINE** | Stock = 0 ou 100% consommé | Matériau épuisé |
| 🚨 **PROBLEME** | Anomalie détectée | Vol, gaspillage, surconsommation |

**Ordre de priorité:**
1. Si anomalie → **PROBLEME** (priorité absolue)
2. Sinon si stock = 0 → **TERMINE**
3. Sinon si stock < minimum → **BAS**
4. Sinon → **OK**

---

### 2. États d'un Chantier

Le chantier a 3 états possibles:

| État | Condition | Description |
|------|-----------|-------------|
| 🏗️ **EN_COURS** | Au moins 1 matériau non terminé + Pas de problème | Travaux en cours normalement |
| ✅ **TERMINE** | Tous les matériaux terminés (100%) | Chantier terminé |
| 🚨 **PROBLEME** | Au moins 1 matériau avec problème | Anomalie détectée |

**Logique de décision:**
```
SI (au moins 1 matériau a un PROBLEME)
  → État chantier = PROBLEME
SINON SI (tous les matériaux sont TERMINÉS)
  → État chantier = TERMINE
SINON
  → État chantier = EN_COURS
```

---

### 3. Calcul du Score (0-100)

**Score de base:** 100 points

**Pénalités:**
- **-10 points** par matériau avec PROBLEME
- **-5 points** par matériau avec stock BAS

**Bonus:**
- **+5 points** si chantier TERMINE sans problème

**Formule:**
```
Score = 100 - (Problèmes × 10) - (Stock Bas × 5) + Bonus
Score = MIN(100, MAX(0, Score))
```

**Exemples:**

| Situation | Calcul | Score |
|-----------|--------|-------|
| 10 matériaux, tous OK | 100 | 100 |
| 10 matériaux, 2 stock bas | 100 - (2 × 5) | 90 |
| 10 matériaux, 1 problème | 100 - (1 × 10) | 90 |
| 10 matériaux, 2 problèmes, 3 stock bas | 100 - (2 × 10) - (3 × 5) | 65 |
| 10 matériaux, tous terminés | 100 + 5 | 105 → 100 |

---

## 🔍 Détection des Anomalies

Les anomalies sont détectées automatiquement lors des sorties de matériaux:

### Seuils de Détection

| Type | Seuil | Sévérité | Action |
|------|-------|----------|--------|
| Surconsommation | > 150% moyenne | MEDIUM | Log |
| Gaspillage | > 200% moyenne | HIGH | Notification |
| Vol probable | > 300% moyenne | CRITICAL | Notification + Email |

### Exemple

**Historique des 7 derniers jours:**
- Jour 1: 50 kg
- Jour 2: 45 kg
- Jour 3: 52 kg
- Jour 4: 48 kg
- Jour 5: 51 kg
- Jour 6: 49 kg
- Jour 7: 47 kg

**Moyenne:** 49 kg/jour

**Nouvelle sortie:** 150 kg

**Analyse:**
- 150 / 49 = 3.06 (306%)
- 306% > 300% → **VOL PROBABLE** 🚨
- Matériau → État PROBLEME
- Chantier → État PROBLEME

---

## 📋 Génération des Problèmes

Le système liste automatiquement tous les problèmes détectés:

### Types de Problèmes

1. **🚨 Vol probable détecté**
   - Sortie > 300% de la moyenne
   - Sévérité: CRITICAL

2. **⚠️ Gaspillage détecté**
   - Sortie > 200% de la moyenne
   - Sévérité: HIGH

3. **📊 Surconsommation anormale**
   - Sortie > 150% de la moyenne
   - Sévérité: MEDIUM

4. **📉 Stock bas**
   - Stock actuel < Stock minimum
   - Besoin de commander

### Exemple de Liste

```
Problèmes détectés:
- 🚨 Fer à béton: Vol probable détecté
- 📉 Ciment: Stock bas (15 sacs)
- ⚠️ Sable: Gaspillage détecté
```

---

## 💡 Génération des Recommandations

Le système génère des recommandations selon l'état du chantier:

### Si État = PROBLEME

```
Recommandations:
- 🔍 Vérifier immédiatement les anomalies détectées
- 📋 Consulter les bons de sortie et justificatifs
- 🚨 Enquête urgente recommandée (si vol)
- 📹 Vérifier les caméras de surveillance (si vol)
- ♻️ Optimiser les pratiques de travail (si gaspillage)
- 📊 Former le personnel à la gestion des matériaux (si gaspillage)
```

### Si État = TERMINE

```
Recommandations:
- ✅ Chantier terminé avec succès
- 📊 Générer le rapport final de consommation
- 📝 Archiver les données du chantier
```

### Si État = EN_COURS

```
Recommandations:
- 📦 Commander 2 matériau(x) en stock bas
  • Ciment: 24 sacs
  • Gravier: 3 m³
- ✅ Stocks suffisants, continuer le suivi régulier
- 📱 Activer les alertes en temps réel
- 📊 Consulter le tableau de bord hebdomadaire
```

---

## 🎯 Exemple Complet

### Chantier A - Tunis

**Matériaux (12):**

| Matériau | Stock Actuel | Stock Min | Progrès | État |
|----------|--------------|-----------|---------|------|
| Fer à béton | 150 kg | 100 kg | 60% | ✅ OK |
| Ciment | 15 sacs | 50 sacs | 85% | 📉 BAS |
| Sable | 0 m³ | 10 m³ | 100% | ✔️ TERMINE |
| Gravier | 2 m³ | 5 m³ | 90% | 📉 BAS |
| Brique | 500 u | 200 u | 40% | ✅ OK |
| Carrelage | 80 m² | 50 m² | 55% | ✅ OK |
| Peinture | 25 L | 20 L | 70% | ✅ OK |
| Bois | 0 m | 10 m | 100% | ✔️ TERMINE |
| Acier | 200 kg | 150 kg | 45% | ✅ OK |
| Plâtre | 30 sacs | 25 sacs | 65% | ✅ OK |
| Isolation | 15 rouleaux | 10 rouleaux | 50% | ✅ OK |
| Tuyaux | 5 m | 20 m | 95% | 📉 BAS |

**Anomalies détectées (7 derniers jours):**
- Aucune

**Calcul du Score:**
```
Matériaux avec problème: 0
Matériaux stock bas: 3 (Ciment, Gravier, Tuyaux)
Matériaux terminés: 2 (Sable, Bois)

Score = 100 - (0 × 10) - (3 × 5)
Score = 100 - 15
Score = 85/100
```

**État du Chantier:**
```
Problèmes: 0
Terminés: 2 / 12
→ État = EN_COURS
```

**Résultat:**
```json
{
  "siteId": "507f1f77bcf86cd799439011",
  "siteName": "Chantier A - Tunis",
  "etatChantier": "EN_COURS",
  "score": 85,
  "materialsCount": 12,
  "problemes": [
    "📉 Ciment: Stock bas (15 sacs)",
    "📉 Gravier: Stock bas (2 m³)",
    "📉 Tuyaux: Stock bas (5 m)"
  ],
  "recommandations": [
    "📦 Commander 3 matériau(x) en stock bas",
    "  • Ciment: 48 sacs",
    "  • Gravier: 4 m³",
    "  • Tuyaux: 21 m",
    "📱 Activer les alertes en temps réel",
    "📊 Consulter le tableau de bord hebdomadaire"
  ]
}
```

---

## 🔄 Flux de Calcul

```
1. Récupérer le chantier
   ↓
2. Récupérer tous les matériaux du chantier
   ↓
3. Récupérer l'historique des 7 derniers jours
   ↓
4. Pour chaque matériau:
   ├─ Calculer le progrès (%)
   ├─ Vérifier les anomalies
   └─ Déterminer l'état (OK/BAS/TERMINE/PROBLEME)
   ↓
5. Compter:
   ├─ Matériaux terminés
   ├─ Matériaux avec problème
   └─ Matériaux stock bas
   ↓
6. Déterminer l'état du chantier:
   ├─ Si problème > 0 → PROBLEME
   ├─ Si terminés = total → TERMINE
   └─ Sinon → EN_COURS
   ↓
7. Calculer le score (0-100)
   ↓
8. Générer problèmes et recommandations
   ↓
9. Retourner le résultat
```

---

## 📊 API Response

```typescript
interface SiteSmartScore {
  siteId: string;
  siteName: string;
  etatChantier: 'EN_COURS' | 'TERMINE' | 'PROBLEME';
  score: number; // 0-100
  materialsCount: number;
  materials: MaterialInfo[];
  problemes: string[];
  recommandations: string[];
}

interface MaterialInfo {
  materialId: string;
  materialName: string;
  materialCode: string;
  unit: string;
  stockExistant: number;
  stockEntree: number;
  stockSortie: number;
  stockActuel: number;
  stockMinimum: number;
  progressPercentage: number; // % consommé
  etat: 'OK' | 'BAS' | 'TERMINE' | 'PROBLEME';
  hasAnomaly: boolean;
}
```

---

## 🎓 Avantages de cette Logique

✅ **Simple**: Règles claires et faciles à comprendre  
✅ **Rapide**: Calculs légers, pas de ML complexe  
✅ **Précis**: Détection efficace des anomalies  
✅ **Actionnable**: Recommandations concrètes  
✅ **Évolutif**: Facile à ajuster les seuils  
✅ **Transparent**: Logique explicable aux utilisateurs  

---

**Dernière mise à jour:** 28 avril 2026  
**Version:** 2.0.0 - Logique Simplifiée  
**Auteur:** Équipe SmartSite
