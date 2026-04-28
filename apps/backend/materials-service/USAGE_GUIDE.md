# Guide d'utilisation - Fournisseurs et Géocodage

## 🚀 Démarrage Rapide

### 1. Démarrer les services

```bash
# Materials Service (Port 3002)
cd apps/backend/materials-service
npm run start:dev

# Gestion Site Service (Port 3001)
cd apps/backend/gestion-site
npm run start:dev
```

### 2. Tester les APIs

#### Fournisseurs
```bash
# Tous les fournisseurs
curl http://localhost:3002/materials/suppliers

# Fournisseurs pour un matériau
curl "http://localhost:3002/materials/MATERIAL_ID/suppliers"
```

#### Géocodage
```bash
# Recherche d'adresse
curl "http://localhost:3001/gestion-sites/geocode/search?address=Tunis"

# Recherche avancée
curl -X POST http://localhost:3001/gestion-sites/geocode/search-advanced \
  -H "Content-Type: application/json" \
  -d '{"address": "Avenue Habib Bourguiba", "city": "Tunis"}'
```

## 📁 Fichiers Frontend

Les composants React sont maintenant dans :
- `apps/frontend/src/components/suppliers/SupplierSelector.tsx`
- `apps/frontend/src/components/geocoding/AddressSearch.tsx`
- `apps/frontend/src/styles/suppliers.css`
- `apps/frontend/src/styles/geocoding.css`

## 🎯 Utilisation Frontend

### 1. Importer les composants
```tsx
import { SupplierSelector } from '../components/suppliers/SupplierSelector';
import { AddressSearch } from '../components/geocoding/AddressSearch';
import '../styles/suppliers.css';
import '../styles/geocoding.css';
```

### 2. Utiliser le sélecteur de fournisseurs
```tsx
<SupplierSelector
  materialId="your-material-id"
  materialName="Ciment Portland"
  siteId="your-site-id"
  onSupplierSelect={(supplier) => {
    console.log('Fournisseur sélectionné:', supplier);
  }}
/>
```

### 3. Utiliser la recherche d'adresse
```tsx
<AddressSearch
  onLocationSelect={(location) => {
    console.log('Localisation:', location);
  }}
  placeholder="Rechercher une adresse..."
/>
```

## ✅ Fonctionnalités

### Fournisseurs
- ✅ Récupération depuis MongoDB local
- ✅ Tri par distance/évaluation
- ✅ Interface utilisateur complète
- ✅ Gestion des erreurs

### Géocodage
- ✅ API gratuite OpenStreetMap
- ✅ Optimisé pour la Tunisie
- ✅ Score de confiance
- ✅ Interface utilisateur complète

Les services sont maintenant prêts à l'utilisation ! 🎉