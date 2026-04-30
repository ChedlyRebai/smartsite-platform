# 🌟 Système de Rating des Fournisseurs

## Vue d'Ensemble

Système automatique d'évaluation des fournisseurs qui s'active lorsque la consommation d'un matériau dépasse 30%.

---

## 🎯 Logique de Déclenchement

### Quand le Dialog S'Ouvre

Le dialog de rating s'ouvre automatiquement quand **TOUTES** ces conditions sont remplies:

1. ✅ **Consommation > 30%**
   ```
   Consommation (%) = (Stock Sortie / (Stock Existant + Stock Entrée)) × 100
   ```

2. ✅ **Utilisateur n'a pas encore noté** ce matériau de ce fournisseur

3. ✅ **Matériau a un fournisseur assigné**

### Exemple

**Matériau: Fer à béton**
- Stock Existant: 100 kg
- Stock Entrée: 50 kg
- Stock Sortie: 50 kg

**Calcul:**
```
Total Initial = 100 + 50 = 150 kg
Consommation = (50 / 150) × 100 = 33.3%
33.3% > 30% → ✅ Dialog s'ouvre
```

---

## 📝 Contenu du Dialog

### 1. Avis Général (Obligatoire)

Deux options:

| Option | Icône | Couleur | Signification |
|--------|-------|---------|---------------|
| **POSITIF** | 👍 | Vert | Satisfait du fournisseur |
| **NEGATIF** | 👎 | Rouge | Insatisfait du fournisseur |

### 2. Note en Étoiles (Obligatoire)

Échelle de 1 à 5 étoiles:

| Note | Label | Signification |
|------|-------|---------------|
| ⭐ | Très mauvais | Service inacceptable |
| ⭐⭐ | Mauvais | Service insuffisant |
| ⭐⭐⭐ | Moyen | Service acceptable |
| ⭐⭐⭐⭐ | Bon | Service satisfaisant |
| ⭐⭐⭐⭐⭐ | Excellent | Service exceptionnel |

### 3. Commentaire (Optionnel)

Champ texte libre pour partager l'expérience.

### 4. Réclamation (Optionnel)

Si l'utilisateur coche "Je souhaite faire une réclamation":

**Motifs disponibles:**
- Qualité insuffisante
- Livraison en retard
- Quantité incorrecte
- Produit endommagé
- Non-conformité
- Service client médiocre
- Autre

**Champs requis si réclamation:**
- Motif (sélection)
- Description détaillée (texte)

---

## 🗄️ Structure de Données

### SupplierRating Entity

```typescript
{
  materialId: ObjectId,           // Matériau évalué
  materialName: string,
  materialCode: string,
  supplierId: ObjectId,           // Fournisseur évalué
  supplierName: string,
  siteId: ObjectId,               // Chantier
  siteName: string,
  userId: ObjectId,               // Utilisateur qui note
  userName: string,
  avis: 'POSITIF' | 'NEGATIF',   // Avis général
  note: number,                   // 1-5 étoiles
  commentaire?: string,           // Commentaire optionnel
  hasReclamation: boolean,        // A une réclamation ?
  reclamationMotif?: string,      // Motif si réclamation
  reclamationDescription?: string, // Description si réclamation
  consumptionPercentage: number,  // % au moment du rating
  ratingDate: Date,               // Date du rating
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED', // Statut
  createdAt: Date,
  updatedAt: Date
}
```

### Index Unique

Un utilisateur ne peut noter qu'**une seule fois** un matériau d'un fournisseur:

```typescript
Index: { materialId: 1, supplierId: 1, userId: 1 } (unique)
```

Si l'utilisateur essaie de noter à nouveau, le rating existant est **mis à jour**.

---

## 🔄 Flux de Fonctionnement

### 1. Vérification Automatique

```
Utilisateur consulte un matériau
         ↓
Frontend appelle: GET /api/supplier-ratings/check/:materialId?userId=xxx
         ↓
Backend calcule:
  - Consommation (%)
  - Vérifie si déjà noté
         ↓
Retourne: { needed: true/false, consumptionPercentage: XX, ... }
         ↓
Si needed = true → Dialog s'ouvre automatiquement
```

### 2. Soumission du Rating

```
Utilisateur remplit le formulaire
         ↓
Clique sur "Envoyer l'avis"
         ↓
Frontend envoie: POST /api/supplier-ratings
         ↓
Backend:
  - Valide les données
  - Vérifie si rating existe
  - Crée ou met à jour le rating
  - Si réclamation → Status = PENDING
         ↓
Notification de succès
         ↓
Dialog se ferme
```

### 3. Traitement des Réclamations

```
Réclamation créée (Status = PENDING)
         ↓
Service qualité consulte: GET /api/supplier-ratings/reclamations?status=PENDING
         ↓
Traite la réclamation
         ↓
Marque comme résolue: PUT /api/supplier-ratings/:id/resolve
         ↓
Status = RESOLVED
```

---

## 📊 Statistiques Fournisseur

### Calcul Automatique

Pour chaque fournisseur, le système calcule:

```typescript
{
  supplierId: string,
  supplierName: string,
  totalRatings: number,           // Nombre total d'avis
  positifs: number,               // Nombre d'avis positifs
  negatifs: number,               // Nombre d'avis négatifs
  averageNote: number,            // Note moyenne (1-5)
  reclamations: number,           // Nombre de réclamations
  tauxSatisfaction: number        // % d'avis positifs
}
```

**Formules:**
```
Taux de Satisfaction = (Positifs / Total) × 100
Note Moyenne = Somme des notes / Nombre de notes
```

### Exemple

**Fournisseur: ABC Materials**
- Total avis: 20
- Positifs: 16
- Négatifs: 4
- Notes: [5, 4, 5, 3, 5, 4, 5, 5, 2, 4, 5, 3, 5, 4, 5, 5, 1, 4, 5, 5]
- Réclamations: 2

**Calcul:**
```
Taux Satisfaction = (16 / 20) × 100 = 80%
Note Moyenne = 82 / 20 = 4.1 ⭐
```

---

## 🎨 Interface Utilisateur

### Dialog de Rating

```
┌─────────────────────────────────────────────────┐
│ 🎯 Évaluer le Fournisseur                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ Vous avez consommé 33% de Fer à béton.         │
│ Donnez votre avis sur ABC Materials.           │
│                                                 │
│ ┌─── Votre avis général * ─────────────────┐  │
│ │                                            │  │
│ │  ┌──────────┐    ┌──────────┐            │  │
│ │  │    👍    │    │    👎    │            │  │
│ │  │ Positif  │    │ Négatif  │            │  │
│ │  └──────────┘    └──────────┘            │  │
│ │                                            │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─── Note (1-5 étoiles) * ──────────────────┐  │
│ │                                            │  │
│ │        ⭐ ⭐ ⭐ ⭐ ⭐                        │  │
│ │           Excellent                        │  │
│ │                                            │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─── Commentaire (optionnel) ───────────────┐  │
│ │ [________________________________]         │  │
│ │ [________________________________]         │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─── Réclamation ────────────────────────────┐  │
│ │ ☐ Je souhaite faire une réclamation       │  │
│ │                                            │  │
│ │ (Si coché, affiche motif et description)  │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ [Annuler]  [Envoyer l'avis]                    │
└─────────────────────────────────────────────────┘
```

### Page Statistiques Fournisseur

```
┌─────────────────────────────────────────────────┐
│ 📊 Statistiques - ABC Materials                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Note Moyenne: 4.1 ⭐⭐⭐⭐                       │
│ Taux de Satisfaction: 80%                      │
│                                                 │
│ ┌─── Répartition des Avis ──────────────────┐  │
│ │                                            │  │
│ │ 👍 Positifs: 16 (80%)                     │  │
│ │ 👎 Négatifs: 4 (20%)                      │  │
│ │ 🚨 Réclamations: 2                        │  │
│ │                                            │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─── Derniers Avis ──────────────────────────┐  │
│ │                                            │  │
│ │ 28/04/2026 - Mohamed Ali                  │  │
│ │ ⭐⭐⭐⭐⭐ Positif                          │  │
│ │ "Excellent service, livraison rapide"     │  │
│ │                                            │  │
│ │ 27/04/2026 - Ahmed Ben Ali                │  │
│ │ ⭐⭐ Négatif                                │  │
│ │ 🚨 Réclamation: Qualité insuffisante      │  │
│ │ "Matériau de mauvaise qualité"            │  │
│ │                                            │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1. Vérifier si Rating Nécessaire

```
GET /api/supplier-ratings/check/:materialId?userId=xxx
```

**Réponse:**
```json
{
  "needed": true,
  "consumptionPercentage": 33,
  "material": {
    "_id": "...",
    "name": "Fer à béton",
    "supplierId": "..."
  },
  "alreadyRated": false
}
```

### 2. Créer un Rating

```
POST /api/supplier-ratings
```

**Body:**
```json
{
  "materialId": "...",
  "supplierId": "...",
  "siteId": "...",
  "userId": "...",
  "userName": "Mohamed Ali",
  "avis": "POSITIF",
  "note": 5,
  "commentaire": "Excellent service",
  "hasReclamation": false,
  "consumptionPercentage": 33
}
```

### 3. Statistiques Fournisseur

```
GET /api/supplier-ratings/stats/:supplierId
```

**Réponse:**
```json
{
  "supplierId": "...",
  "supplierName": "ABC Materials",
  "totalRatings": 20,
  "positifs": 16,
  "negatifs": 4,
  "averageNote": 4.1,
  "reclamations": 2,
  "tauxSatisfaction": 80
}
```

### 4. Liste des Réclamations

```
GET /api/supplier-ratings/reclamations?status=PENDING
```

### 5. Résoudre une Réclamation

```
PUT /api/supplier-ratings/:id/resolve
```

### 6. Statistiques Globales

```
GET /api/supplier-ratings/global-stats
```

---

## 🎯 Cas d'Usage

### Cas 1: Premier Rating

**Situation:**
- Matériau: Ciment
- Consommation: 35%
- Utilisateur: Mohamed Ali
- Jamais noté ce matériau

**Flux:**
1. Mohamed consulte le matériau Ciment
2. System détecte: 35% > 30% et pas encore noté
3. Dialog s'ouvre automatiquement
4. Mohamed donne un avis POSITIF, 5 étoiles
5. Rating enregistré
6. Dialog se ferme

### Cas 2: Rating avec Réclamation

**Situation:**
- Matériau: Sable
- Consommation: 40%
- Problème: Qualité insuffisante

**Flux:**
1. Dialog s'ouvre
2. Utilisateur donne avis NEGATIF, 2 étoiles
3. Coche "Je souhaite faire une réclamation"
4. Sélectionne motif: "Qualité insuffisante"
5. Décrit le problème
6. Rating + Réclamation enregistrés (Status = PENDING)
7. Service qualité notifié

### Cas 3: Mise à Jour d'un Rating

**Situation:**
- Utilisateur a déjà noté ce matériau
- Veut changer son avis

**Flux:**
1. Dialog ne s'ouvre pas automatiquement (déjà noté)
2. Utilisateur peut accéder manuellement
3. Modifie son avis
4. Rating existant mis à jour

---

## ✅ Avantages du Système

✅ **Automatique**: Dialog s'ouvre au bon moment (30%)  
✅ **Simple**: Interface intuitive avec étoiles et pouces  
✅ **Complet**: Avis + Note + Commentaire + Réclamation  
✅ **Traçable**: Historique complet des ratings  
✅ **Statistiques**: Analyse automatique par fournisseur  
✅ **Actionnable**: Réclamations suivies et résolues  
✅ **Unique**: Un seul rating par utilisateur/matériau  

---

## 🔧 Configuration

### Variables d'Environnement

```env
# Seuil de déclenchement (%)
RATING_TRIGGER_THRESHOLD=30

# Email pour les réclamations
RECLAMATION_EMAIL=qualite@smartsite.com
```

### Personnalisation

Le seuil de 30% peut être ajusté dans le code:

```typescript
// Backend: supplier-rating.service.ts
const RATING_THRESHOLD = 30; // Modifier ici

// Frontend: useSupplierRating.ts
// Pas de modification nécessaire (géré par le backend)
```

---

**Dernière mise à jour:** 28 avril 2026  
**Version:** 1.0.0  
**Auteur:** Équipe SmartSite
