# 📋 Spécifications Complètes - Materials Service V2

## 🎯 Vue d'Ensemble

Le Materials Service V2 est une refonte complète du système de gestion des matériaux avec:
- Gestion intelligente des stocks par chantier
- Détection automatique des anomalies
- Notifications et alertes email
- Rapports IA détaillés
- Intégration météo pour prédictions
- Smart Score par chantier

---

## 1. 📝 Formulaire Material - Nouvelle Structure

### Champs Modifiés

#### ❌ SUPPRIMÉS
- `location` (emplacement) - Remplacé par l'emplacement du chantier assigné
- `manufacturer` (fabricant) - Non nécessaire
- `reorderPoint` (point de commande) - Remplacé par logique Entrée/Sortie/Existant

#### ✅ NOUVEAUX CHAMPS
```typescript
interface MaterialFormData {
  // Champs existants
  name: string;
  code: string;
  category: string;
  unit: string;
  description?: string;
  
  // Champs de stock NOUVEAUX
  stockEntree: number;      // Quantité entrée dans le chantier
  stockSortie: number;      // Quantité sortie du chantier
  stockExistant: number;    // Quantité déjà présente
  stockMinimum: number;     // Stock minimum requis
  
  // Chantier assigné
  siteId: string;           // ID du chantier
  siteName?: string;        // Nom du chantier (auto-rempli)
  siteLocation?: {          // Emplacement du chantier (auto-rempli)
    latitude: number;
    longitude: number;
  };
}
```

### Logique de Calcul Automatique

```typescript
// Stock actuel = Existant + Entrée - Sortie
const stockActuel = stockExistant + stockEntree - stockSortie;

// Besoin de commander ?
const doitCommander = stockActuel < stockMinimum;

// Quantité à commander
const quantiteACommander = doitCommander 
  ? stockMinimum - stockActuel + (stockMinimum * 0.2) // +20% de marge
  : 0;
```

### Interface Utilisateur

```
┌─────────────────────────────────────────────────┐
│ Ajouter un Matériau                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Nom: [_____________________]                    │
│ Code: [_____________________]                   │
│ Catégorie: [Dropdown ▼]                        │
│ Unité: [_____________________]                  │
│                                                 │
│ ┌─── Gestion du Stock ───────────────────────┐ │
│ │                                             │ │
│ │ Chantier: [Sélectionner ▼]                 │ │
│ │ Emplacement: Tunis, Tunisie (auto)         │ │
│ │                                             │ │
│ │ Stock Existant: [____] unités              │ │
│ │ Stock Minimum:  [____] unités              │ │
│ │                                             │ │
│ │ ┌─ Mouvements (Optionnel) ────────────┐   │ │
│ │ │ Entrée: [____] unités               │   │ │
│ │ │ Sortie: [____] unités               │   │ │
│ │ └─────────────────────────────────────┘   │ │
│ │                                             │ │
│ │ ┌─ Calcul Automatique ─────────────────┐  │ │
│ │ │ Stock Actuel: 150 unités             │  │ │
│ │ │ État: ⚠️ COMMANDER (< minimum)       │  │ │
│ │ │ À commander: 50 unités               │  │ │
│ │ └──────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────┘ │
│                                                 │
│ [Annuler]  [Enregistrer et Commander]          │
└─────────────────────────────────────────────────┘
```

---

## 2. 📊 Détails Material - Mouvements Récents

### Affichage des Mouvements

```
┌─────────────────────────────────────────────────┐
│ Fer à béton - FER001                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Stock Actuel: 150 unités                        │
│ Stock Minimum: 100 unités                       │
│ État: ✅ En stock                               │
│                                                 │
│ ┌─── Mouvements Récents (7 derniers jours) ──┐ │
│ │                                              │ │
│ │ 📅 28/04/2026 14:30                         │ │
│ │ ➕ ENTRÉE: +50 unités                       │ │
│ │ 📍 Chantier A - Tunis                       │ │
│ │ 👤 Mohamed Ali                               │ │
│ │ 📝 Livraison fournisseur XYZ                │ │
│ │                                              │ │
│ │ 📅 27/04/2026 10:15                         │ │
│ │ ➖ SORTIE: -30 unités                       │ │
│ │ 📍 Chantier A - Tunis                       │ │
│ │ 👤 Ahmed Ben Ali                             │ │
│ │ 📝 Consommation dalle étage 2               │ │
│ │                                              │ │
│ │ 📅 26/04/2026 16:45                         │ │
│ │ ⚠️ SORTIE ANORMALE: -200 unités            │ │
│ │ 📍 Chantier A - Tunis                       │ │
│ │ 🚨 ALERTE: Risque de vol détecté           │ │
│ │                                              │ │
│ └──────────────────────────────────────────┘ │
│                                                 │
│ ┌─── Ajouter un Mouvement ────────────────┐  │
│ │ Type: [Entrée ▼]                         │  │
│ │ Quantité: [____] unités                  │  │
│ │ Raison: [_________________________]      │  │
│ │ [Annuler] [Enregistrer]                  │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ [📊 Rapport IA] [📈 Historique Complet]        │
└─────────────────────────────────────────────────┘
```

### Sauvegarde dans FlowLog

```typescript
// Lors de l'ajout d'un mouvement
const flowLogEntry = {
  materialId: material._id,
  siteId: material.siteId,
  type: 'IN' | 'OUT',
  quantity: quantity,
  date: new Date(),
  stockBefore: material.stockActuel,
  stockAfter: material.stockActuel + (type === 'IN' ? quantity : -quantity),
  recordedBy: userId,
  reason: reason,
  reference: `MANUAL-${Date.now()}`,
};

await flowLogModel.create(flowLogEntry);

// Créer aussi une entrée dans ConsumptionHistory
await consumptionHistoryModel.create({
  ...flowLogEntry,
  materialName: material.name,
  materialCode: material.code,
  materialCategory: material.category,
  materialUnit: material.unit,
  siteName: site.nom,
  flowType: type === 'IN' ? FlowType.IN : FlowType.OUT,
  sourceCollection: SourceCollection.DIRECT,
  sourceId: flowLogEntry._id,
});
```

---

## 3. 🤖 Rapport IA par Chantier

### Génération du Rapport

**Endpoint**: `GET /api/consumption-history/site-ai-report/:siteId?days=30`

**Analyse**:
1. Récupère tous les mouvements du chantier sur la période
2. Analyse chaque matériau:
   - Consommation normale vs anormale
   - Détection de pics de sortie
   - Comparaison avec la moyenne
   - Identification de patterns suspects
3. Génère des alertes par sévérité
4. Propose des recommandations

**Détection de Consommation Anormale**:
```typescript
// Seuils de détection
const SEUIL_GASPILLAGE = 1.5;  // 150% de la moyenne
const SEUIL_VOL = 2.0;          // 200% de la moyenne
const SEUIL_CRITIQUE = 3.0;     // 300% de la moyenne

// Analyse
if (sortie > moyenne * SEUIL_CRITIQUE) {
  // 🚨 ALERTE CRITIQUE: Vol probable
  await sendEmailAlert({
    type: 'VOL_PROBABLE',
    severity: 'CRITICAL',
    material: material.name,
    site: site.nom,
    quantity: sortie,
    expected: moyenne,
    deviation: ((sortie - moyenne) / moyenne) * 100,
  });
  
  await createNotification({
    type: 'ANOMALY_DETECTED',
    title: '🚨 Vol Probable Détecté',
    message: `Sortie anormale de ${sortie} ${material.unit} de ${material.name} sur ${site.nom}`,
    severity: 'CRITICAL',
    userId: siteManagerId,
  });
}
```

### Email d'Alerte

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .alert-critical { background: #fee; border-left: 4px solid #f00; }
    .alert-warning { background: #ffc; border-left: 4px solid #fa0; }
  </style>
</head>
<body>
  <div class="alert-critical">
    <h2>🚨 ALERTE CRITIQUE: Vol Probable Détecté</h2>
    
    <p><strong>Chantier:</strong> Chantier A - Tunis</p>
    <p><strong>Matériau:</strong> Fer à béton (FER001)</p>
    <p><strong>Date:</strong> 28/04/2026 14:30</p>
    
    <h3>Détails de l'Anomalie</h3>
    <ul>
      <li>Quantité sortie: <strong>300 unités</strong></li>
      <li>Quantité attendue: <strong>100 unités</strong></li>
      <li>Écart: <strong>+200%</strong></li>
    </ul>
    
    <h3>Actions Recommandées</h3>
    <ol>
      <li>🔍 Vérifier immédiatement les bons de sortie</li>
      <li>📹 Consulter les caméras de surveillance</li>
      <li>👥 Interroger le personnel présent</li>
      <li>📋 Faire un inventaire physique</li>
      <li>🚨 Contacter la sécurité si nécessaire</li>
    </ol>
    
    <p><a href="https://smartsite.com/materials/report/123">Voir le rapport complet</a></p>
  </div>
</body>
</html>
```

---

## 4. 🏆 Smart Score Chantier

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────┐
│ Smart Score - Chantier A                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Score Global: 85/100 ⭐⭐⭐⭐                    │
│ État: ✅ Bon                                    │
│                                                 │
│ ┌─── Matériaux (12) ──────────────────────┐   │
│ │                                           │   │
│ │ Fer à béton                               │   │
│ │ ████████████░░░░░░░░ 60% consommé        │   │
│ │ Score: 90/100 ✅ Excellent               │   │
│ │ Tendance: 📈 Stable                      │   │
│ │                                           │   │
│ │ Ciment                                    │   │
│ │ ████████████████░░░░ 80% consommé        │   │
│ │ Score: 75/100 ⚠️ Attention               │   │
│ │ Tendance: 📉 Surconsommation             │   │
│ │                                           │   │
│ │ Sable                                     │   │
│ │ ████████░░░░░░░░░░░░ 40% consommé        │   │
│ │ Score: 95/100 ✅ Excellent               │   │
│ │ Tendance: 📈 Optimal                     │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌─── Rapport IA ──────────────────────────┐   │
│ │                                           │   │
│ │ 📊 Analyse de Performance                │   │
│ │ • Consommation globale: Normale          │   │
│ │ • Gaspillage détecté: 2 incidents        │   │
│ │ • Efficacité: 85%                        │   │
│ │                                           │   │
│ │ ⚠️ Points d'Attention                    │   │
│ │ • Ciment: Surconsommation de 15%         │   │
│ │ • Fer: Pic anormal le 26/04              │   │
│ │                                           │   │
│ │ ✅ Points Forts                          │   │
│ │ • Sable: Gestion optimale                │   │
│ │ • Gravier: Consommation maîtrisée        │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌─── Review du Travail ───────────────────┐   │
│ │                                           │   │
│ │ 🎯 Objectifs Atteints: 8/10              │   │
│ │ ⏱️ Respect des Délais: 90%               │   │
│ │ 💰 Respect du Budget: 95%                │   │
│ │                                           │   │
│ │ 📝 Commentaire IA:                       │   │
│ │ "Le chantier progresse bien avec une     │   │
│ │ gestion efficace des matériaux. Attention│   │
│ │ à la surconsommation de ciment qui       │   │
│ │ pourrait impacter le budget."            │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ [📥 Télécharger Rapport PDF]                   │
└─────────────────────────────────────────────────┘
```

### Calcul du Smart Score

```typescript
interface SmartScoreCalculation {
  // Facteurs de calcul
  consommationNormale: number;      // 0-30 points
  respectBudget: number;            // 0-25 points
  gestionStock: number;             // 0-20 points
  efficacite: number;               // 0-15 points
  securite: number;                 // 0-10 points
  
  // Score total
  total: number;                    // 0-100
  
  // Niveau
  niveau: 'EXCELLENT' | 'BON' | 'MOYEN' | 'FAIBLE';
}

function calculateSmartScore(site: Site, materials: Material[]): SmartScoreCalculation {
  let score = 0;
  
  // 1. Consommation normale (30 points)
  const anomalies = detectAnomalies(materials);
  const tauxAnomalie = anomalies.length / materials.length;
  score += Math.max(0, 30 - (tauxAnomalie * 30));
  
  // 2. Respect du budget (25 points)
  const budgetRespect = calculateBudgetRespect(materials);
  score += budgetRespect * 25;
  
  // 3. Gestion du stock (20 points)
  const stockManagement = calculateStockManagement(materials);
  score += stockManagement * 20;
  
  // 4. Efficacité (15 points)
  const efficiency = calculateEfficiency(materials);
  score += efficiency * 15;
  
  // 5. Sécurité (10 points)
  const security = calculateSecurity(anomalies);
  score += security * 10;
  
  return {
    consommationNormale: Math.max(0, 30 - (tauxAnomalie * 30)),
    respectBudget: budgetRespect * 25,
    gestionStock: stockManagement * 20,
    efficacite: efficiency * 15,
    securite: security * 10,
    total: Math.round(score),
    niveau: score >= 90 ? 'EXCELLENT' : score >= 75 ? 'BON' : score >= 50 ? 'MOYEN' : 'FAIBLE',
  };
}
```

---

## 5. 🌤️ Intégration Météo

### Récupération Automatique

```typescript
// Lors de l'affichage d'un chantier
async function loadSiteWithWeather(siteId: string) {
  // 1. Récupérer le chantier
  const site = await getSite(siteId);
  
  // 2. Récupérer la météo selon l'emplacement
  const weather = await getWeatherByCoordinates(
    site.coordonnees.latitude,
    site.coordonnees.longitude
  );
  
  return {
    ...site,
    weather: {
      temperature: weather.temperature,
      condition: weather.condition, // 'sunny', 'cloudy', 'rainy', 'stormy'
      description: weather.description,
      icon: getWeatherIcon(weather.condition),
    }
  };
}
```

### Affichage Visuel

```
┌─────────────────────────────────────────────────┐
│ Chantier A - Tunis                              │
│ 📍 Avenue Habib Bourguiba, Tunis                │
│                                                 │
│ ┌─── Météo Actuelle ──────────────────────┐   │
│ │                                           │   │
│ │        ☀️                                 │   │
│ │     Ensoleillé                            │   │
│ │      23°C                                 │   │
│ │   Ressenti: 21°C                          │   │
│ │                                           │   │
│ │ 💨 Vent: 15 km/h                         │   │
│ │ 💧 Humidité: 65%                         │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Icônes Météo

```typescript
const weatherIcons = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  windy: '💨',
};

const weatherColors = {
  sunny: '#FFD700',
  cloudy: '#B0C4DE',
  rainy: '#4682B4',
  stormy: '#483D8B',
  snowy: '#F0F8FF',
  windy: '#87CEEB',
};
```

### Intégration dans les Prédictions

```typescript
// Prédiction avec météo
async function predictStockWithWeather(materialId: string, siteId: string) {
  const material = await getMaterial(materialId);
  const site = await getSite(siteId);
  const weather = await getWeather(site.coordonnees);
  
  // Facteur météo
  let weatherFactor = 1.0;
  
  if (weather.condition === 'rainy' || weather.condition === 'stormy') {
    // Pluie/Orage → Ralentissement des travaux → Moins de consommation
    weatherFactor = 0.7;
  } else if (weather.condition === 'sunny') {
    // Beau temps → Travaux normaux
    weatherFactor = 1.0;
  } else if (weather.condition === 'cloudy') {
    // Nuageux → Légère réduction
    weatherFactor = 0.9;
  }
  
  // Prédiction ajustée
  const basePrediction = await predictStock(materialId);
  const adjustedPrediction = {
    ...basePrediction,
    consumptionRate: basePrediction.consumptionRate * weatherFactor,
    hoursToOutOfStock: basePrediction.hoursToOutOfStock / weatherFactor,
    weatherImpact: {
      condition: weather.condition,
      factor: weatherFactor,
      message: getWeatherImpactMessage(weather.condition),
    }
  };
  
  return adjustedPrediction;
}
```

---

## 6. 📧 Système de Notifications et Emails

### Types de Notifications

```typescript
enum NotificationType {
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  VOL_PROBABLE = 'VOL_PROBABLE',
  GASPILLAGE = 'GASPILLAGE',
  STOCK_BAS = 'STOCK_BAS',
  STOCK_CRITIQUE = 'STOCK_CRITIQUE',
  COMMANDE_REQUISE = 'COMMANDE_REQUISE',
}

enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  CRITICAL = 'CRITICAL',
}
```

### Déclenchement Automatique

```typescript
// Lors de l'ajout d'une sortie
async function handleMaterialOutput(materialId: string, quantity: number) {
  const material = await getMaterial(materialId);
  const history = await getRecentHistory(materialId, 7); // 7 derniers jours
  
  // Calculer la moyenne
  const moyenne = calculateAverage(history);
  const deviation = ((quantity - moyenne) / moyenne) * 100;
  
  // Détection d'anomalie
  if (deviation > 200) {
    // 🚨 CRITIQUE: Vol probable
    await sendNotification({
      type: NotificationType.VOL_PROBABLE,
      severity: NotificationSeverity.CRITICAL,
      title: '🚨 Vol Probable Détecté',
      message: `Sortie anormale de ${quantity} ${material.unit} de ${material.name}`,
      materialId,
      siteId: material.siteId,
    });
    
    await sendEmail({
      to: [siteManager.email, securityManager.email],
      subject: '🚨 ALERTE CRITIQUE: Vol Probable Détecté',
      template: 'anomaly-critical',
      data: {
        material,
        quantity,
        moyenne,
        deviation,
        recommendations: [
          'Vérifier immédiatement les bons de sortie',
          'Consulter les caméras de surveillance',
          'Faire un inventaire physique',
        ],
      },
    });
  } else if (deviation > 150) {
    // ⚠️ DANGER: Gaspillage probable
    await sendNotification({
      type: NotificationType.GASPILLAGE,
      severity: NotificationSeverity.DANGER,
      title: '⚠️ Gaspillage Détecté',
      message: `Consommation excessive de ${quantity} ${material.unit} de ${material.name}`,
      materialId,
      siteId: material.siteId,
    });
    
    await sendEmail({
      to: [siteManager.email],
      subject: '⚠️ ALERTE: Gaspillage Détecté',
      template: 'anomaly-warning',
      data: { material, quantity, moyenne, deviation },
    });
  }
}
```

---

## 7. 📚 Documentation Complète

### Structure de la Documentation

```
MATERIALS_SERVICE_DOCUMENTATION_V2.md
├── 1. Introduction
├── 2. Architecture
├── 3. Entités et Modèles
│   ├── Material (nouvelle structure)
│   ├── FlowLog
│   ├── ConsumptionHistory
│   └── Notification
├── 4. API Endpoints
│   ├── Materials CRUD
│   ├── Mouvements (Entrée/Sortie)
│   ├── Rapports IA
│   ├── Smart Score
│   └── Météo
├── 5. Fonctionnalités
│   ├── Gestion des Stocks
│   ├── Détection d'Anomalies
│   ├── Notifications et Emails
│   ├── Rapports IA
│   ├── Smart Score
│   └── Intégration Météo
├── 6. Scénarios d'Utilisation
│   ├── Ajout de matériau
│   ├── Mouvement de stock
│   ├── Détection de vol
│   ├── Génération de rapport
│   └── Consultation Smart Score
├── 7. Configuration
└── 8. Tests et Déploiement
```

---

## 🚀 Prochaines Étapes d'Implémentation

### Phase 1: Backend (Priorité 1)
1. ✅ Modifier l'entité Material
2. ✅ Créer les endpoints de mouvements
3. ✅ Implémenter la détection d'anomalies
4. ✅ Créer le système de notifications
5. ✅ Implémenter l'envoi d'emails
6. ✅ Créer le Smart Score service
7. ✅ Intégrer la météo dans les prédictions

### Phase 2: Frontend (Priorité 2)
1. ✅ Modifier le formulaire Material
2. ✅ Créer la vue Détails avec mouvements
3. ✅ Créer la vue Smart Score
4. ✅ Afficher la météo
5. ✅ Afficher les notifications

### Phase 3: Documentation (Priorité 3)
1. ✅ Mettre à jour la documentation complète
2. ✅ Créer des guides d'utilisation
3. ✅ Documenter tous les scénarios

---

## 📊 Métriques de Succès

- ✅ Réduction de 80% des vols non détectés
- ✅ Réduction de 60% du gaspillage
- ✅ Amélioration de 40% de l'efficacité de gestion
- ✅ Temps de réponse < 2s pour les rapports IA
- ✅ Taux de satisfaction utilisateur > 90%

