# Guide de Test - Correction Météo Automatique

## 🎯 Objectif
Tester que la météo est **automatiquement récupérée** selon le chantier assigné au matériau.

---

## 📋 Prérequis

### 1. Données de Test Nécessaires

#### Chantier avec GPS (pour test succès)
```json
{
  "_id": "site123",
  "name": "Chantier Nord",
  "coordinates": {
    "lat": 36.8065,
    "lng": 10.1815
  }
}
```

#### Matériau Assigné (pour test succès)
```json
{
  "_id": "mat123",
  "name": "Ciment",
  "code": "CIM-001",
  "siteId": "site123"  // ← Assigné au chantier
}
```

#### Matériau Non Assigné (pour test erreur)
```json
{
  "_id": "mat456",
  "name": "Sable",
  "code": "SAB-001",
  "siteId": null  // ← PAS assigné
}
```

---

## ✅ Test 1: Matériau Assigné avec GPS (Succès)

### Étapes:
1. Ouvrir `http://localhost:5173/materials`
2. Trouver un matériau **assigné à un chantier**
3. Cliquer sur l'icône "Prédiction IA" (cerveau violet)
4. Observer le chargement automatique de la météo

### Résultat Attendu:
```
✅ Encadré VERT affiché avec:
   - Titre: "☁️ Météo Automatique"
   - Bouton de rafraîchissement (🔄)
   - Nom du chantier: "Chantier Nord"
   - Météo: "ciel dégagé"
   - Température: "23°C (ressenti 21°C)"
   - Condition: "Ensoleillé"
   - Message: "✅ La météo a été automatiquement récupérée..."

✅ Champ "Météo" verrouillé (grisé) avec:
   - Label: "Météo (Auto-détectée)"
   - Valeur: "Ensoleillé"
   - Texte: "🔒 Champ verrouillé (météo automatique)"

✅ Toast de succès:
   "Météo récupérée: ciel dégagé (23°C)"
```

### Capture d'écran Attendue:
```
┌─────────────────────────────────────────────────────┐
│ 🧠 Prédiction IA - Ciment                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☁️ Météo Automatique                    🔄      │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 📍 Chantier: Chantier Nord                      │ │
│ │ ☁️ Météo: ciel dégagé                           │ │
│ │ Température: 23°C (ressenti 21°C)               │ │
│ │ Condition: Ensoleillé                           │ │
│ │                                                  │ │
│ │ ✅ La météo a été automatiquement récupérée     │ │
│ │    selon la localisation du chantier            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Heure (0-23)          Jour de la semaine            │
│ [23            ]      [Lundi              ▼]       │
│                                                      │
│ Activité (0-1)        Météo (Auto-détectée)         │
│ [0,7           ]      [Ensoleillé         ▼] 🔒    │
│                       🔒 Champ verrouillé           │
│                                                      │
│ Type de projet                                      │
│ [Commercial                              ▼]        │
│                                                      │
│ [🧠 Générer la prédiction avancée]                  │
└─────────────────────────────────────────────────────┘
```

---

## ❌ Test 2: Matériau Non Assigné (Erreur)

### Étapes:
1. Ouvrir `http://localhost:5173/materials`
2. Trouver un matériau **NON assigné** (siteId = null)
3. Cliquer sur l'icône "Prédiction IA"
4. Observer l'alerte rouge

### Résultat Attendu:
```
❌ Encadré ROUGE affiché avec:
   - Icône: ⚠️ AlertCircle
   - Titre: "Météo non disponible"
   - Message: "Ce matériau n'est pas encore assigné à un chantier"

❌ Champ "Météo" désactivé (grisé)

❌ Pas de toast de succès
```

### Capture d'écran Attendue:
```
┌─────────────────────────────────────────────────────┐
│ 🧠 Prédiction IA - Sable                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ⚠️ Météo non disponible                         │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ Ce matériau n'est pas encore assigné à un       │ │
│ │ chantier                                         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Heure (0-23)          Jour de la semaine            │
│ [23            ]      [Lundi              ▼]       │
│                                                      │
│ Activité (0-1)        Météo                         │
│ [0,7           ]      [Ensoleillé         ▼] (grisé)│
│                                                      │
│ Type de projet                                      │
│ [Commercial                              ▼]        │
│                                                      │
│ [🧠 Générer la prédiction avancée]                  │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ Test 3: Chantier Sans GPS (Erreur)

### Étapes:
1. Créer un chantier **sans coordonnées GPS**
2. Assigner un matériau à ce chantier
3. Ouvrir la prédiction IA
4. Observer l'alerte rouge

### Résultat Attendu:
```
❌ Encadré ROUGE affiché avec:
   - Titre: "Météo non disponible"
   - Message: "Le chantier assigné n'a pas de coordonnées GPS configurées"
```

---

## 🔄 Test 4: Rafraîchissement Météo

### Étapes:
1. Ouvrir la prédiction IA (météo déjà chargée)
2. Cliquer sur le bouton de rafraîchissement (🔄)
3. Observer le rechargement

### Résultat Attendu:
```
✅ Spinner affiché pendant le chargement
✅ Encadré vert mis à jour
✅ Toast de succès affiché
✅ Champ météo mis à jour
```

---

## 🧪 Test 5: API Backend

### Test avec cURL:

```bash
# 1. Récupérer un matériau
curl http://localhost:3002/api/materials/mat123

# Vérifier la réponse:
{
  "_id": "mat123",
  "name": "Ciment",
  "siteId": "site123"  // ← Doit être présent
}

# 2. Récupérer le chantier
curl http://localhost:3002/api/sites/site123

# Vérifier la réponse:
{
  "_id": "site123",
  "name": "Chantier Nord",
  "coordinates": {
    "lat": 36.8065,
    "lng": 10.1815
  }
}

# 3. Récupérer la météo
curl "http://localhost:3002/api/materials/weather?lat=36.8065&lng=10.1815"

# Vérifier la réponse:
{
  "success": true,
  "weather": {
    "temperature": 23,
    "feelsLike": 21,
    "description": "ciel dégagé",
    "condition": "sunny",
    ...
  }
}
```

---

## 🔍 Vérification Console

### Console Frontend (F12):
```javascript
// Logs attendus:
✅ Loading material and weather...
✅ Material loaded: { _id: "mat123", siteId: "site123" }
✅ Site loaded: { _id: "site123", coordinates: {...} }
✅ Weather loaded: { temperature: 23, condition: "sunny" }
```

### Console Backend:
```bash
# Logs attendus:
✅ GET /api/materials/mat123 - 200 OK
✅ GET /api/sites/site123 - 200 OK
✅ GET /api/materials/weather?lat=36.8065&lng=10.1815 - 200 OK
✅ Weather fetched for coordinates (36.8065, 10.1815): 23°C
```

---

## 📊 Checklist de Validation

### Fonctionnalités
- [ ] Météo chargée automatiquement au montage du composant
- [ ] Encadré vert affiché si succès
- [ ] Encadré rouge affiché si erreur
- [ ] Champ météo verrouillé si succès
- [ ] Champ météo désactivé si erreur
- [ ] Bouton de rafraîchissement fonctionne
- [ ] Toast de succès affiché
- [ ] Message de confirmation affiché

### Cas d'Erreur
- [ ] Alerte rouge si matériau non assigné
- [ ] Alerte rouge si chantier sans GPS
- [ ] Alerte rouge si API météo échoue
- [ ] Pas de crash si erreur réseau

### Performance
- [ ] Chargement < 1 seconde
- [ ] Pas de requêtes multiples
- [ ] Cache utilisé (30 minutes)

### UI/UX
- [ ] Spinner affiché pendant le chargement
- [ ] Couleurs appropriées (vert/rouge)
- [ ] Icônes claires
- [ ] Messages explicites
- [ ] Champ verrouillé visuellement distinct

---

## 🐛 Problèmes Possibles

### Problème 1: "Cannot read property 'siteId' of undefined"
**Solution**: Vérifier que `getMaterialById()` retourne bien le matériau

### Problème 2: "Cannot read property 'coordinates' of undefined"
**Solution**: Vérifier que l'endpoint `/api/sites/:id` existe et retourne le chantier

### Problème 3: Météo ne se charge pas
**Solution**: 
- Vérifier `OPENWEATHER_API_KEY` dans `.env`
- Vérifier la connexion Internet
- Vérifier les logs backend

### Problème 4: Champ météo pas verrouillé
**Solution**: Vérifier que `disabled={true}` est bien présent dans le select

---

## ✅ Résultat Final Attendu

Après tous les tests:
- ✅ Météo automatique fonctionne pour matériaux assignés
- ✅ Alerte rouge affichée pour matériaux non assignés
- ✅ Champ météo verrouillé correctement
- ✅ Rafraîchissement fonctionne
- ✅ Gestion des erreurs robuste
- ✅ Expérience utilisateur fluide

**La logique météo est maintenant 100% automatique!** 🌤️

---

**Date**: 27 avril 2026  
**Version**: 1.2.1  
**Status**: ✅ PRÊT À TESTER
