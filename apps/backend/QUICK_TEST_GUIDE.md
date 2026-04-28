# Guide de Test Rapide - Fournisseurs et Géocodage

## 🚀 Tests Rapides

### 1. Test des Fournisseurs (Materials Service)

#### A. Démarrer le service
```bash
cd apps/backend/materials-service
npm run start:dev
```

#### B. Tester tous les fournisseurs
```bash
curl http://localhost:3002/materials/suppliers
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": [...],
  "count": 25,
  "message": "25 fournisseurs trouvés",
  "source": "MongoDB smartsite-fournisseurs"
}
```

#### C. Tester les fournisseurs pour un matériau
```bash
# Remplacez MATERIAL_ID par un ID réel de votre base
curl "http://localhost:3002/materials/MATERIAL_ID/suppliers"
```

#### D. Tester avec coordonnées de site
```bash
curl "http://localhost:3002/materials/MATERIAL_ID/suppliers?siteLatitude=36.8&siteLongitude=10.2"
```

### 2. Test du Géocodage (Gestion Site)

#### A. Démarrer le service
```bash
cd apps/backend/gestion-site
npm run start:dev
```

#### B. Test simple
```bash
curl "http://localhost:3001/gestion-sites/geocode/search?address=Avenue%20Habib%20Bourguiba%20Tunis"
```

#### C. Test avancé
```bash
curl -X POST http://localhost:3001/gestion-sites/geocode/search-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Avenue Habib Bourguiba",
    "city": "Tunis",
    "country": "Tunisia"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "5 adresse(s) trouvée(s)",
  "results": [
    {
      "id": 0,
      "displayName": "Avenue Habib Bourguiba, Tunis, Tunisia",
      "lat": 36.8065,
      "lng": 10.1815,
      "coordinates": {
        "latitude": 36.8065,
        "longitude": 10.1815
      },
      "confidence": 0.95
    }
  ],
  "bestMatch": {...},
  "mapCenter": {
    "lat": 36.8065,
    "lng": 10.1815,
    "zoom": 16
  }
}
```

## 🧪 Tests avec Postman

### Collection Postman

Créez une collection avec ces requêtes :

#### 1. Fournisseurs - Tous
```
GET http://localhost:3002/materials/suppliers
```

#### 2. Fournisseurs - Pour matériau
```
GET http://localhost:3002/materials/{{materialId}}/suppliers?siteId={{siteId}}
```

#### 3. Géocodage - Simple
```
GET http://localhost:3001/gestion-sites/geocode/search?address=Tunis
```

#### 4. Géocodage - Avancé
```
POST http://localhost:3001/gestion-sites/geocode/search-advanced
Content-Type: application/json

{
  "address": "Avenue Habib Bourguiba",
  "city": "Tunis",
  "country": "Tunisia"
}
```

## 🔧 Tests Frontend

### 1. Installation des dépendances
```bash
npm install react-leaflet leaflet
npm install @types/leaflet # Si TypeScript
```

### 2. Test du composant fournisseurs
```tsx
import { SupplierSelector } from './components/SupplierSelector';

function TestSuppliers() {
  return (
    <SupplierSelector
      materialId="your-material-id"
      materialName="Ciment Portland"
      siteId="your-site-id"
      onSupplierSelect={(supplier) => {
        console.log('Fournisseur sélectionné:', supplier);
      }}
    />
  );
}
```

### 3. Test du composant géolocalisation
```tsx
import { AddressSearchWithMap } from './components/AddressSearchWithMap';

function TestGeocoding() {
  return (
    <AddressSearchWithMap
      onLocationSelect={(location) => {
        console.log('Localisation sélectionnée:', location);
      }}
      placeholder="Rechercher une adresse en Tunisie..."
    />
  );
}
```

## 📊 Vérifications

### Base de données MongoDB

#### Vérifier les fournisseurs
```javascript
// Dans MongoDB Compass ou shell
use smartsite-fournisseurs
db.fournisseurs.find().limit(5)
```

#### Vérifier les sites
```javascript
use smartsite
db.sites.find().limit(5)
```

### Logs du serveur

#### Materials Service
Recherchez ces logs :
```
✅ 25 fournisseurs trouvés depuis MongoDB
🏪 Récupération des fournisseurs recommandés pour matériau
📍 Coordonnées du site: 36.8, 10.2
```

#### Gestion Site
Recherchez ces logs :
```
🔍 Recherche de géocodage pour l'adresse: Avenue Habib Bourguiba
🌍 Géocodage avancé de l'adresse: Avenue Habib Bourguiba
✅ 5 résultat(s) trouvé(s) pour l'adresse
```

## 🐛 Dépannage

### Problème : Aucun fournisseur trouvé
**Solution :**
1. Vérifiez que MongoDB est démarré
2. Vérifiez la connexion à `smartsite-fournisseurs`
3. Vérifiez que la collection `fournisseurs` existe

### Problème : Géocodage ne fonctionne pas
**Solution :**
1. Vérifiez votre connexion internet
2. Testez directement l'API Nominatim :
   ```bash
   curl "https://nominatim.openstreetmap.org/search?q=Tunis&format=json"
   ```
3. Vérifiez les logs pour les erreurs de timeout

### Problème : Carte ne s'affiche pas
**Solution :**
1. Vérifiez que Leaflet CSS est importé :
   ```tsx
   import 'leaflet/dist/leaflet.css';
   ```
2. Vérifiez les icônes Leaflet :
   ```tsx
   import L from 'leaflet';
   import icon from 'leaflet/dist/images/marker-icon.png';
   import iconShadow from 'leaflet/dist/images/marker-shadow.png';

   let DefaultIcon = L.icon({
     iconUrl: icon,
     shadowUrl: iconShadow,
   });

   L.Marker.prototype.options.icon = DefaultIcon;
   ```

## 📈 Tests de Performance

### Test de charge fournisseurs
```bash
# Installer Apache Bench
sudo apt-get install apache2-utils

# Test 100 requêtes, 10 concurrentes
ab -n 100 -c 10 http://localhost:3002/materials/suppliers
```

### Test de charge géocodage
```bash
# Attention : Nominatim a des limites de taux
ab -n 10 -c 1 "http://localhost:3001/gestion-sites/geocode/search?address=Tunis"
```

## ✅ Checklist de Validation

### Fonctionnalités Fournisseurs
- [ ] Récupération de tous les fournisseurs
- [ ] Fournisseurs recommandés pour un matériau
- [ ] Tri par distance quand coordonnées fournies
- [ ] Tri par évaluation par défaut
- [ ] Gestion des erreurs MongoDB
- [ ] Logs informatifs

### Fonctionnalités Géocodage
- [ ] Recherche simple d'adresse
- [ ] Recherche avancée avec pays/ville
- [ ] Résultats avec coordonnées
- [ ] Calcul de score de confiance
- [ ] Gestion des erreurs API
- [ ] Fallback si pas de résultats en Tunisie

### Interface Utilisateur
- [ ] Composant de sélection fournisseurs
- [ ] Composant de recherche d'adresse
- [ ] Intégration carte Leaflet
- [ ] Responsive design
- [ ] États de chargement
- [ ] Gestion des erreurs

### Performance
- [ ] Temps de réponse < 2s pour fournisseurs
- [ ] Temps de réponse < 5s pour géocodage
- [ ] Pas de fuite mémoire
- [ ] Gestion des timeouts

## 🎯 Prochaines Étapes

1. **Intégration complète** dans votre application
2. **Tests utilisateur** avec de vraies données
3. **Optimisation** des performances
4. **Cache** pour les résultats de géocodage
5. **Monitoring** des APIs externes
6. **Documentation** utilisateur finale

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs des services
2. Testez les endpoints avec curl
3. Vérifiez les connexions MongoDB
4. Consultez la documentation des APIs externes

Les fonctionnalités sont maintenant prêtes pour la production ! 🚀