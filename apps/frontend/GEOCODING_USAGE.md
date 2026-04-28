# 🗺️ Guide d'Utilisation du Géocodage d'Adresses

## Fonctionnalité

Lors de la création ou de la modification d'un site, vous pouvez maintenant **rechercher automatiquement les coordonnées GPS** d'une adresse en cliquant simplement sur l'icône de recherche 🔍.

## 📍 Comment Utiliser

### 1. Création d'un Nouveau Site

1. Cliquez sur le bouton **"Add Site"**
2. Remplissez le formulaire
3. Dans le champ **"Address"**, saisissez l'adresse complète
   - Exemple : `Avenue Habib Bourguiba, Tunis`
   - Exemple : `Rue de la République, Sousse`
4. Cliquez sur le bouton **"Search on Map"** (🔍)
5. La carte se centre automatiquement sur l'adresse trouvée
6. Les coordonnées GPS sont automatiquement remplies
7. Vous pouvez ajuster la position en cliquant directement sur la carte si nécessaire

### 2. Modification d'un Site Existant

1. Cliquez sur le bouton **"Edit"** (✏️) d'un site
2. Dans le champ **"Address"**, modifiez l'adresse si nécessaire
3. Cliquez sur l'**icône de recherche** (🔍) à droite du champ adresse
4. La carte se met à jour automatiquement avec les nouvelles coordonnées
5. Vérifiez la position sur la carte
6. Cliquez sur **"Save Changes"** pour enregistrer

## 💡 Conseils pour une Meilleure Recherche

### ✅ Bonnes Pratiques

- **Soyez précis** : Incluez le nom de la rue, la ville et le pays
  - ✅ `Avenue Habib Bourguiba, Tunis, Tunisia`
  - ✅ `Rue de la Liberté, Sousse`
  - ✅ `Boulevard 14 Janvier, Sfax`

- **Utilisez des adresses complètes** : Plus l'adresse est détaillée, meilleurs sont les résultats
  - ✅ `123 Avenue de la République, La Marsa, Tunis`
  - ❌ `Tunis` (trop vague)

- **Vérifiez les résultats** : Après la recherche, vérifiez visuellement sur la carte que la position est correcte

### ⚠️ À Éviter

- ❌ Adresses trop courtes (moins de 3 caractères)
- ❌ Adresses incomplètes ou vagues
- ❌ Fautes d'orthographe importantes
- ❌ Abréviations non standard

## 🎯 Exemples d'Adresses Tunisiennes

### Tunis et Environs

```
Avenue Habib Bourguiba, Tunis
Rue de la Kasbah, Tunis Médina
Avenue Mohamed V, La Marsa
Boulevard de la Terre, Ariana
Rue du Lac Windermere, Les Berges du Lac
```

### Autres Villes

```
Avenue Habib Bourguiba, Sousse
Rue Hedi Chaker, Sfax
Avenue de la République, Bizerte
Boulevard de l'Environnement, Monastir
Avenue Farhat Hached, Nabeul
```

## 🔧 Fonctionnalités

### Recherche Automatique

- **Icône de recherche** : Cliquez sur 🔍 pour lancer la recherche
- **Résultats instantanés** : Les coordonnées sont trouvées en quelques secondes
- **Centrage automatique** : La carte se centre sur l'adresse trouvée
- **Zoom adaptatif** : Le niveau de zoom s'ajuste automatiquement

### Ajustement Manuel

Si la position trouvée n'est pas exacte :

1. **Cliquez directement sur la carte** pour ajuster la position
2. Les coordonnées se mettent à jour automatiquement
3. La position exacte est affichée sous la carte

### Affichage des Coordonnées

Une fois la position trouvée, vous verrez :

```
✅ Position: 36.8065, 10.1815
```

Ces coordonnées sont automatiquement sauvegardées avec le site.

## 🚀 Avantages

### 1. **Gain de Temps**
- Plus besoin de chercher manuellement les coordonnées GPS
- Recherche instantanée en un clic

### 2. **Précision**
- Coordonnées GPS exactes
- Basé sur OpenStreetMap (données ouvertes et à jour)

### 3. **Facilité d'Utilisation**
- Interface intuitive
- Feedback visuel immédiat
- Pas de configuration nécessaire

### 4. **Intégration avec les Fournisseurs**
- Recherche automatique des fournisseurs à proximité
- Calcul de distance automatique
- Recommandations basées sur la localisation

## 📊 Cas d'Usage

### Scénario 1 : Nouveau Chantier

```
Vous créez un nouveau site pour un chantier à Tunis
↓
Vous saisissez : "Avenue de la Liberté, Tunis"
↓
Vous cliquez sur l'icône de recherche 🔍
↓
La carte se centre automatiquement sur l'adresse
↓
Les coordonnées GPS sont remplies : 36.8065, 10.1815
↓
Vous validez et créez le site
```

### Scénario 2 : Correction d'Adresse

```
Un site a une adresse incorrecte
↓
Vous cliquez sur "Edit"
↓
Vous corrigez l'adresse
↓
Vous cliquez sur l'icône de recherche 🔍
↓
La carte se met à jour avec la nouvelle position
↓
Vous sauvegardez les modifications
```

### Scénario 3 : Adresse Ambiguë

```
Vous saisissez : "Avenue Bourguiba"
↓
Plusieurs résultats possibles (Tunis, Sousse, Sfax)
↓
Le système choisit le résultat le plus pertinent
↓
Vous vérifiez visuellement sur la carte
↓
Si nécessaire, vous ajustez manuellement en cliquant sur la carte
```

## 🐛 Dépannage

### Problème : "Address not found"

**Solutions** :
1. Vérifiez l'orthographe de l'adresse
2. Ajoutez plus de détails (ville, pays)
3. Essayez une adresse plus générale (nom de la ville)
4. Utilisez le clic manuel sur la carte

### Problème : Position Incorrecte

**Solutions** :
1. Cliquez directement sur la carte pour ajuster
2. Essayez une adresse plus précise
3. Ajoutez le numéro de rue si disponible

### Problème : Recherche Lente

**Solutions** :
1. Vérifiez votre connexion internet
2. Attendez quelques secondes (l'API peut être temporairement occupée)
3. Réessayez après quelques instants

### Problème : "Too Many Requests"

**Solutions** :
1. Attendez 1-2 secondes entre les recherches
2. L'API Nominatim limite à 1 requête par seconde
3. Utilisez le clic manuel sur la carte en attendant

## 📱 Interface

### Formulaire de Création

```
┌─────────────────────────────────────┐
│ Address *                           │
│ ┌─────────────────────────────────┐ │
│ │ Avenue Bourguiba, Tunis      🔍 │ │
│ └─────────────────────────────────┘ │
│ 💡 Click the search icon to         │
│    automatically find coordinates   │
└─────────────────────────────────────┘
```

### Formulaire d'Édition

```
┌─────────────────────────────────────┐
│ Address *                           │
│ ┌─────────────────────────────────┐ │
│ │ Avenue Bourguiba, Tunis      🔍 │ │
│ └─────────────────────────────────┘ │
│ 💡 Click the search icon to         │
│    automatically find coordinates   │
│                                     │
│ Location on Map                     │
│ ┌─────────────────────────────────┐ │
│ │         [  MAP  ]               │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ ✅ Position: 36.8065, 10.1815       │
└─────────────────────────────────────┘
```

## 🎓 Formation Rapide

### Pour les Nouveaux Utilisateurs

1. **Étape 1** : Saisissez une adresse complète
2. **Étape 2** : Cliquez sur l'icône 🔍
3. **Étape 3** : Vérifiez la position sur la carte
4. **Étape 4** : Ajustez si nécessaire en cliquant sur la carte
5. **Étape 5** : Sauvegardez

### Temps Estimé

- ⏱️ **Recherche d'adresse** : 2-3 secondes
- ⏱️ **Vérification visuelle** : 5-10 secondes
- ⏱️ **Ajustement manuel** : 5 secondes (si nécessaire)
- ⏱️ **Total** : ~15-20 secondes par site

## 📚 Ressources

- **OpenStreetMap** : https://www.openstreetmap.org/
- **Nominatim API** : https://nominatim.org/
- **Support** : Contactez l'équipe technique en cas de problème

---

**Note** : Cette fonctionnalité utilise l'API gratuite de Nominatim (OpenStreetMap). Veuillez l'utiliser de manière responsable et éviter les requêtes excessives.
