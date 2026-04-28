# 📖 Guide Utilisateur - Gestion Intelligente des Matériaux

## 🎯 Bienvenue !

Ce guide vous explique comment utiliser les nouvelles fonctionnalités intelligentes du système de gestion des matériaux.

---

## 📋 Table des Matières

1. [Voir le Chantier Assigné](#1-voir-le-chantier-assigné)
2. [Commander Automatiquement](#2-commander-automatiquement)
3. [Consulter la Météo](#3-consulter-la-météo)
4. [Utiliser les Prédictions IA](#4-utiliser-les-prédictions-ia)
5. [Auto Orders](#5-auto-orders)

---

## 1. 🏗️ Voir le Chantier Assigné

### Dans la Liste

Chaque matériau affiche maintenant le chantier auquel il est assigné :

```
┌────────────────────────────────────────────────────────┐
│ Ciment Portland (CIM-001)          [En stock]          │
│ Qté: 800 kg  Min: 1200  Max: 100                      │
│ Site: Site Nord - Phase 2          Prédiction IA: OK   │
│                                                         │
│ [👁️] [🧠] [✏️] [🗑️] [🚚 Commander] [📱]              │
└────────────────────────────────────────────────────────┘
```

**Où ?** : Colonne "Site" dans la liste des matériaux

### Dans les Détails

Cliquez sur l'icône 👁️ pour voir les détails complets :

```
┌─────────────────────────────────────┐
│ 📍 Chantier Assigné                 │
│                                     │
│ Site Nord - Phase 2                 │
│ 📍 48.8566, 2.3522                  │
└─────────────────────────────────────┘
```

**Informations affichées** :
- Nom du chantier
- Coordonnées GPS (latitude, longitude)
- Icône 📍 pour identification rapide

---

## 2. 🛒 Commander Automatiquement

### Quand le Bouton Apparaît

Le bouton "Commander" s'affiche automatiquement dans 2 cas :

#### 🚨 Rupture de Stock (Quantité = 0)

```
┌─────────────────────────────────────┐
│ Ciment Portland                     │
│ Quantité: 0 kg                      │
│                                     │
│ [⚠️ Commander Urgent]               │  ← Bouton ROUGE
└─────────────────────────────────────┘
```

#### ⚠️ Stock Bas (Quantité ≤ Stock Minimum)

```
┌─────────────────────────────────────┐
│ Ciment Portland                     │
│ Quantité: 50 kg (Min: 100 kg)       │
│                                     │
│ [🚚 Commander]                      │  ← Bouton JAUNE
└─────────────────────────────────────┘
```

### Comment Commander

1. **Cliquez** sur le bouton "Commander"
2. **Le dialog s'ouvre** avec toutes les informations pré-remplies :
   - Nom du matériau
   - Code
   - Catégorie
   - Site de livraison
   - Quantité recommandée (calculée par l'IA)
3. **Ajustez** si nécessaire
4. **Validez** la commande

### Où Trouver le Bouton

Le bouton "Commander" est disponible à 3 endroits :

1. **Liste des matériaux** : À droite de chaque ligne (si stock bas)
2. **Détails du matériau** : En bas du dialog
3. **Onglet Alertes** : Dans chaque carte d'alerte

---

## 3. 🌤️ Consulter la Météo

### Affichage Automatique

Lorsqu'un matériau est assigné à un chantier, la météo s'affiche automatiquement dans les détails :

```
┌─────────────────────────────────────┐
│ ☀️ Météo du Chantier                │
├─────────────────────────────────────┤
│                                     │
│ ☀️ 22°C                             │
│ Ensoleillé                          │
│                                     │
│ Ressenti: 24°C                      │
│ Humidité: 65%                       │
│ Vent: 12 km/h                       │
│ Ville: Paris                        │
└─────────────────────────────────────┘
```

### Emojis Météo

Le système utilise des emojis pour une identification rapide :

| Emoji | Condition | Description |
|-------|-----------|-------------|
| ☀️ | Ensoleillé | Conditions optimales |
| ☁️ | Nuageux | Conditions normales |
| 🌧️ | Pluvieux | Conditions difficiles |
| ❄️ | Neigeux | Conditions très difficiles |
| ⛈️ | Orageux | Conditions dangereuses |
| 💨 | Venteux | Attention au vent |

### Mise à Jour

La météo est mise à jour automatiquement :
- À l'ouverture des détails
- Toutes les 30 minutes (si le dialog reste ouvert)

---

## 4. 📊 Utiliser les Prédictions IA

### Affichage Complet

Dans les détails du matériau, une carte dédiée affiche la prédiction IA :

```
┌─────────────────────────────────────┐
│ 📈 Prédiction IA de Stock           │
│ 🤖 ML 87%                           │  ← Modèle ML utilisé
├─────────────────────────────────────┤
│                                     │
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

### Statuts Possibles

| Statut | Badge | Signification |
|--------|-------|---------------|
| ✅ OK | Vert | Stock suffisant pour > 48h |
| ⚠️ Attention | Jaune | Rupture dans < 48h |
| 🚨 Critique | Rouge | Rupture dans < 24h |

### Informations Affichées

1. **Statut** : État actuel du stock
2. **Consommation** : Taux de consommation moyen (unité/heure)
3. **Stock bas dans** : Temps avant d'atteindre le stock minimum
4. **Rupture dans** : Temps avant rupture totale
5. **Qté recommandée** : Quantité à commander (calculée par l'IA)
6. **Modèle ML** : Si un modèle d'apprentissage est utilisé
7. **Confiance** : Niveau de confiance de la prédiction (%)
8. **Impact météo** : Influence de la météo sur la consommation

### Impact Météo sur les Prédictions

La météo influence les prédictions :

#### ☀️ Conditions Optimales (Ensoleillé)
```
✅ "Conditions optimales pour le chantier"
→ Consommation normale prévue
```

#### 🌧️ Conditions Difficiles (Pluie, Orage)
```
⚠️ "Consommation peut augmenter (conditions difficiles)"
→ Facteur de correction appliqué (+10% à +30%)
```

#### ☁️ Conditions Normales (Nuageux)
```
ℹ️ "Conditions normales"
→ Pas d'ajustement
```

---

## 5. 🤖 Auto Orders

### Accéder au Dashboard

1. Cliquez sur l'onglet **"Commandes Auto"** 🚚
2. Le dashboard affiche tous les matériaux nécessitant une commande

### Interface du Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ 🚚 Commandes Automatiques Recommandées                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🚨 CRITIQUE (2)                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Ciment Portland                                   │   │
│ │ Stock: 0 kg                                       │   │
│ │ Rupture dans: 12h                                 │   │
│ │ Qté recommandée: 200 kg                           │   │
│ │                                                   │   │
│ │ [🛒 Commander Maintenant]                         │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ⚠️ ATTENTION (5)                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Sable                                             │   │
│ │ Stock: 50 kg                                      │   │
│ │ Rupture dans: 36h                                 │   │
│ │ Qté recommandée: 150 kg                           │   │
│ │                                                   │   │
│ │ [🛒 Commander]                                    │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Niveaux d'Urgence

| Niveau | Badge | Critère | Action |
|--------|-------|---------|--------|
| 🚨 Critique | Rouge | Rupture < 24h | Commander immédiatement |
| ⚠️ Attention | Jaune | Rupture < 48h | Commander bientôt |
| ℹ️ Info | Bleu | Stock suffisant | Surveiller |

### Commander en 1 Clic

1. **Trouvez** le matériau dans le dashboard
2. **Cliquez** sur "Commander Maintenant" ou "Commander"
3. **Le dialog s'ouvre** avec :
   - Quantité recommandée pré-remplie
   - Site de livraison
   - Fournisseurs triés par distance
4. **Validez** la commande

### Tri Automatique

Les matériaux sont automatiquement triés par urgence :
1. 🚨 Critiques en premier
2. ⚠️ Attention ensuite
3. ℹ️ Info en dernier

---

## 💡 Conseils d'Utilisation

### Pour Optimiser les Commandes

1. **Consultez régulièrement** l'onglet "Commandes Auto"
2. **Anticipez** les commandes critiques
3. **Utilisez** les quantités recommandées par l'IA
4. **Vérifiez** l'impact météo avant de commander

### Pour Éviter les Ruptures

1. **Activez** les notifications (si disponibles)
2. **Surveillez** les prédictions IA
3. **Commandez** dès que le statut passe à "Attention"
4. **Tenez compte** de la météo pour ajuster les quantités

### Pour Économiser

1. **Groupez** les commandes d'un même chantier
2. **Utilisez** les fournisseurs les plus proches (GPS)
3. **Commandez** les quantités recommandées (ni trop, ni trop peu)
4. **Évitez** les commandes urgentes (plus chères)

---

## 🆘 Résolution de Problèmes

### La Météo Ne S'Affiche Pas

**Causes possibles** :
- Le matériau n'est pas assigné à un chantier
- Le chantier n'a pas de coordonnées GPS
- Problème de connexion API météo

**Solutions** :
1. Vérifiez que le matériau est assigné à un chantier
2. Vérifiez que le chantier a des coordonnées GPS
3. Actualisez la page

### Le Bouton Commander N'Apparaît Pas

**Causes possibles** :
- Le stock est suffisant
- Le matériau n'a pas de stock minimum défini

**Solutions** :
1. Vérifiez le niveau de stock
2. Définissez un stock minimum pour le matériau

### Les Prédictions Sont Incorrectes

**Causes possibles** :
- Pas assez de données historiques
- Consommation très variable
- Modèle ML non entraîné

**Solutions** :
1. Attendez d'avoir plus de données historiques
2. Entraînez le modèle ML (onglet Prédiction IA)
3. Ajustez manuellement les quantités

---

## 📞 Support

Pour toute question ou problème :

1. **Documentation** : Consultez ce guide
2. **Support technique** : Contactez l'équipe IT
3. **Suggestions** : Envoyez vos idées d'amélioration

---

## 🎉 Conclusion

Vous êtes maintenant prêt à utiliser toutes les fonctionnalités intelligentes du système !

**Rappel des fonctionnalités** :
- ✅ Affichage du chantier assigné
- ✅ Bouton commander intelligent
- ✅ Météo en temps réel avec emojis
- ✅ Prédictions IA avec impact météo
- ✅ Auto orders intelligents

**Bonne gestion !** 🚀

---

**Version** : 2.0  
**Date** : Avril 2026  
**Auteur** : Équipe SmartSite Platform
