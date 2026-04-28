# 🚀 Démarrage du Materials Service

## ✅ Erreurs TypeScript Corrigées

Les 9 erreurs TypeScript ont été corrigées en ajoutant le type explicite pour `siteCoordinates` :

```typescript
// ✅ CORRECT
let siteCoordinates: { lat: number; lng: number } | null = null;
```

Au lieu de :

```typescript
// ❌ INCORRECT
let siteCoordinates = null;  // TypeScript infère le type 'null' uniquement
```

## 🔧 Commandes de Démarrage

### 1. Démarrer le Materials Service

```bash
cd apps/backend/materials-service
npm start
```

**Attendu** :
```
[Nest] 12345  - 2024/04/28 02:20:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2024/04/28 02:20:00     LOG [InstanceLoader] MaterialsModule dependencies initialized
[Nest] 12345  - 2024/04/28 02:20:01     LOG [RoutesResolver] MaterialsController {/api/materials}
[Nest] 12345  - 2024/04/28 02:20:01     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 2024/04/28 02:20:01     LOG Materials Service running on http://localhost:3002
```

### 2. Vérifier que le Service Fonctionne

```bash
# Test de santé
curl http://localhost:3002/api/materials

# Devrait retourner la liste des matériaux
```

## 🧪 Tests Rapides

### Test 1: Vérifier un Matériau avec Coordonnées

```bash
curl http://localhost:3002/api/materials | jq '.data[0] | {name, siteCoordinates}'
```

**Attendu** :
```json
{
  "name": "Ciment Portland",
  "siteCoordinates": {
    "lat": 36.8065,
    "lng": 10.1815
  }
}
```

### Test 2: Tester l'Endpoint Météo

```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8065&lng=10.1815"
```

**Attendu** :
```json
{
  "success": true,
  "weather": {
    "temperature": 22,
    "condition": "sunny",
    "description": "Ensoleillé"
  }
}
```

### Test 3: Vérifier les Logs

Dans la console du service, vous devriez voir :

```
[MaterialsService] 📍 Site 507f1f77bcf86cd799439011: Site Nord - Phase 2, Coords: {"lat":36.8065,"lng":10.1815}
[MaterialsService] ✅ Coordonnées extraites: lat=36.8065, lng=10.1815
```

## 🌐 Frontend

### 1. Démarrer le Frontend (si pas déjà démarré)

```bash
cd apps/frontend
npm run dev
```

### 2. Tester dans le Navigateur

1. Ouvrir : `http://localhost:5173/materials`
2. Cliquer sur "Détails" d'un matériau assigné à un chantier
3. Vérifier :
   - ✅ Section "Chantier Assigné" avec coordonnées GPS
   - ✅ Card "Météo du Chantier" avec emoji ☀️
   - ✅ Card "Prédiction IA" avec impact météo

## 🔍 Dépannage

### Erreur: ECONNREFUSED

Si vous voyez encore `ECONNREFUSED`, cela signifie que le service n'est pas démarré.

**Solution** :
```bash
# Vérifier que MongoDB est démarré
# Vérifier que le port 3002 est libre
netstat -ano | findstr :3002

# Démarrer le service
cd apps/backend/materials-service
npm start
```

### Erreur: Cannot find module

**Solution** :
```bash
cd apps/backend/materials-service
npm install
npm start
```

### Erreur: MongoDB Connection

**Solution** :
```bash
# Vérifier le fichier .env
cat apps/backend/materials-service/.env

# Devrait contenir :
MONGODB_URI=mongodb://localhost:27017/materials-service
```

## ✅ Checklist de Validation

- [ ] Le service démarre sans erreur TypeScript
- [ ] Le service écoute sur le port 3002
- [ ] L'endpoint `/api/materials` retourne des données
- [ ] Les coordonnées GPS sont présentes dans `siteCoordinates`
- [ ] L'endpoint météo fonctionne
- [ ] Le frontend affiche la météo dans MaterialDetails
- [ ] Les logs affichent "✅ Coordonnées extraites"

## 🎯 Résultat Attendu

```
✅ 0 erreurs TypeScript
✅ Service démarré sur http://localhost:3002
✅ Coordonnées GPS récupérées correctement
✅ Météo affichée dans le frontend
✅ Prédiction IA avec impact météo fonctionnelle
```

---

**Tout est prêt ! Vous pouvez maintenant tester le système complet.** 🚀
