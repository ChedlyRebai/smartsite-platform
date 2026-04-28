# 🚀 Fonctionnalités Intelligentes - Gestion des Matériaux

## 📋 Vue d'ensemble

Ce document décrit les nouvelles fonctionnalités intelligentes implémentées dans le système de gestion des matériaux, incluant l'affichage intelligent, les commandes automatiques, et l'intégration météo pour des prédictions précises.

---

## ✨ Nouvelles Fonctionnalités

### 1. 🏗️ Affichage du Chantier Assigné

#### Dans la Liste des Matériaux
- **Suppression de "Emplacement"** : Le champ emplacement a été retiré de l'affichage principal
- **Ajout de "Site"** : Affiche le nom du chantier assigné au matériau
- **Format** : `Site: Nom du chantier` ou `Site: Non assigné`

#### Dans les Détails du Matériau
- **Card dédiée** : Une carte affiche le chantier assigné avec :
  - 📍 Nom du chantier
  - 🗺️ Coordonnées GPS (latitude, longitude) si disponibles
  - Icône MapPin pour identification visuelle

**Exemple d'affichage** :
```
Chantier Assigné
Site Nord - Phase 2
📍 48.8566, 2.3522
```

---

### 2. 🛒 Bouton Commander Intelligent

#### Logique d'Affichage Automatique

Le bouton "Commander" s'affiche automatiquement dans les cas suivants :

1. **Rupture de Stock** (Quantité = 0)
   - Bouton rouge avec icône ⚠️
   - Texte : "Commander Urgent"
   - Priorité maximale

2. **Stock Bas** (Quantité ≤ stockMinimum)
   - Bouton jaune avec icône 🚚
   - Texte : "Commander"
   - Alerte préventive

#### Emplacements du Bouton

1. **Liste des matériaux** : À droite de chaque ligne
2. **Détails du matériau** : En bas du dialog
3. **Onglet Alertes** : Dans chaque carte d'alerte

#### Comportement
- Clic → Ouvre le dialog de création de commande
- Pré-remplit automatiquement :
  - Nom du matériau
  - Code
  - Catégorie
  - Site assigné
  - Coordonnées GPS du site
  - Quantité recommandée (calculée par l'IA)

---

### 3. 🤖 Auto Orders Intelligent

#### Système de Commande Automatique

Le système analyse en continu tous les matériaux et génère des recommandations de commande intelligentes.

#### Critères de Déclenchement

1. **Analyse Prédictive** :
   - Consommation moyenne calculée
   - Prédiction du temps avant rupture
   - Prise en compte des délais de livraison

2. **Niveaux d'Urgence** :
   - 🚨 **Critique** : Rupture dans < 24h
   - ⚠️ **Attention** : Rupture dans < 48h
   - ℹ️ **Info** : Stock suffisant

3. **Calcul de Quantité** :
   ```
   Quantité recommandée = (Consommation/h × Délai livraison) + Stock sécurité
   ```

#### Fonctionnalités

- **Dashboard Auto-Orders** : Onglet dédié dans l'interface
- **Tri par urgence** : Les matériaux critiques en premier
- **Commande en 1 clic** : Bouton direct depuis le dashboard
- **Historique** : Suivi de toutes les commandes automatiques

---

### 4. 🌤️ Intégration Météo pour Prédictions

#### Récupération Automatique de la Météo

Lorsqu'un matériau est assigné à un chantier :
1. Les coordonnées GPS du chantier sont récupérées automatiquement
2. La météo actuelle est chargée via OpenWeatherMap API
3. Les données météo sont affichées dans les détails du matériau

#### Affichage Météo avec Emojis

**Conditions météo supportées** :
- ☀️ **Ensoleillé** (sunny)
- ☁️ **Nuageux** (cloudy)
- 🌧️ **Pluvieux** (rainy)
- ❄️ **Neigeux** (snowy)
- ⛈️ **Orageux** (stormy)
- 💨 **Venteux** (windy)

**Informations affichées** :
- 🌡️ Température actuelle
- 🤚 Température ressentie
- 💧 Humidité
- 💨 Vitesse du vent
- 🏙️ Nom de la ville

#### Impact sur les Prédictions

La météo influence les prédictions de consommation :

1. **Conditions Difficiles** (pluie, orage) :
   - ⚠️ "Consommation peut augmenter (conditions difficiles)"
   - Facteur de correction appliqué aux prédictions

2. **Conditions Optimales** (soleil) :
   - ✅ "Conditions optimales pour le chantier"
   - Consommation normale prévue

3. **Conditions Normales** (nuageux) :
   - ℹ️ "Conditions normales"
   - Pas d'ajustement

#### Exemple d'Affichage

```
┌─────────────────────────────────────┐
│ 🌤️ Météo du Chantier               │
├─────────────────────────────────────┤
│ ☀️ 22°C                             │
│ Ensoleillé                          │
│                                     │
│ Ressenti: 24°C                      │
│ Humidité: 65%                       │
│ Vent: 12 km/h                       │
│ Ville: Paris                        │
└─────────────────────────────────────┘
```

---

### 5. 📊 Prédiction IA Améliorée

#### Affichage dans les Détails

Une carte dédiée affiche la prédiction complète :

**Informations affichées** :
- 🎯 Statut (Critique/Attention/OK)
- 📉 Taux de consommation
- ⏰ Temps avant stock bas
- 🚨 Temps avant rupture
- 📦 Quantité recommandée à commander
- 🤖 Modèle ML utilisé (si disponible)
- 🎯 Niveau de confiance

**Intégration météo** :
- Emoji météo affiché
- Message d'impact sur la consommation
- Ajustement automatique des prédictions

#### Exemple Complet

```
┌─────────────────────────────────────┐
│ 📈 Prédiction IA de Stock           │
│ 🤖 ML 87%                           │
├─────────────────────────────────────┤
│ Statut: ⚠️ Attention                │
│ Consommation: 2.5 kg/h              │
│ Stock bas dans: 36h                 │
│ Rupture dans: 48h                   │
│ Qté recommandée: 150 kg             │
│                                     │
│ "Attention: Rupture dans 48h"       │
│                                     │
│ ☀️ Impact météo: Conditions         │
│    optimales pour le chantier       │
└─────────────────────────────────────┘
```

---

## 🔧 Configuration Technique

### Backend - Endpoints Utilisés

1. **Météo** :
   ```
   GET /api/materials/weather?lat={latitude}&lng={longitude}
   ```

2. **Prédiction** :
   ```
   GET /api/materials/:id/prediction
   ```

3. **Auto Orders** :
   ```
   GET /api/materials/auto-order/recommendations?siteId={siteId}
   ```

### Frontend - Composants Modifiés

1. **MaterialDetails.tsx** :
   - Ajout de l'affichage du chantier
   - Intégration météo
   - Prédiction IA complète
   - Bouton commander intelligent

2. **Materials.tsx** :
   - Suppression de la colonne "Emplacement"
   - Ajout de la colonne "Site"
   - Passage de la fonction `onOrder` au MaterialDetails

3. **AutoOrderDashboard.tsx** :
   - Dashboard des commandes automatiques
   - Tri par urgence
   - Commande en 1 clic

---

## 📱 Expérience Utilisateur

### Workflow Complet

1. **Création/Assignation** :
   - Créer un matériau
   - L'assigner à un chantier
   - → Coordonnées GPS récupérées automatiquement

2. **Consultation** :
   - Ouvrir les détails du matériau
   - → Météo chargée automatiquement
   - → Prédiction IA calculée
   - → Bouton commander affiché si nécessaire

3. **Commande** :
   - Clic sur "Commander"
   - → Dialog pré-rempli avec toutes les infos
   - → Quantité recommandée par l'IA
   - → Fournisseurs triés par distance (GPS)

4. **Suivi** :
   - Onglet "Commandes Auto"
   - → Liste des matériaux à commander
   - → Tri par urgence
   - → Commande en 1 clic

---

## 🎯 Avantages

### Pour les Gestionnaires

1. **Visibilité** :
   - Voir immédiatement quel chantier utilise quel matériau
   - Localisation GPS précise

2. **Anticipation** :
   - Prédictions précises avec impact météo
   - Alertes avant rupture de stock

3. **Efficacité** :
   - Commandes automatiques intelligentes
   - Quantités optimisées par l'IA

### Pour les Chantiers

1. **Disponibilité** :
   - Moins de ruptures de stock
   - Commandes anticipées

2. **Adaptation** :
   - Prédictions ajustées selon la météo
   - Planification optimisée

3. **Traçabilité** :
   - Historique complet des mouvements
   - Lien matériau ↔ chantier clair

---

## 🚀 Prochaines Améliorations

### Court Terme
- [ ] Notifications push pour les alertes critiques
- [ ] Export des prédictions en PDF
- [ ] Graphiques de consommation avec météo

### Moyen Terme
- [ ] Prévisions météo à 7 jours
- [ ] Ajustement automatique des commandes selon météo
- [ ] ML avancé avec historique météo

### Long Terme
- [ ] IA prédictive multi-chantiers
- [ ] Optimisation des stocks inter-chantiers
- [ ] Système de recommandation de fournisseurs

---

## 📞 Support

Pour toute question ou suggestion d'amélioration, contactez l'équipe de développement.

**Version** : 2.0  
**Date** : Avril 2026  
**Auteur** : Équipe SmartSite Platform
