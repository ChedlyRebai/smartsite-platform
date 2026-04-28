# 🔄 Instructions de Redémarrage - Materials Service

## ✅ Corrections Appliquées

### 1. Route Weather Déplacée
- ✅ Route `@Get('weather')` déplacée AVANT toutes les routes dynamiques (`:id`)
- ✅ Maintenant à la ligne 140 (juste après `@Get('expiring')`)
- ✅ Plus de conflit avec `@Get(':id')`

### 2. URLs Frontend Corrigées
- ✅ `/materials/movements/${id}` → `/movements/${id}`
- ✅ `/materials/forecast/${id}` → `/forecast/${id}`
- ✅ Plus de double `/materials/materials/...`

### 3. Validation Quantité Backend
- ✅ Validation ajoutée dans `orders.service.ts`
- ✅ Vérifie la quantité recommandée par l'IA
- ✅ Rejette si quantité < recommandée

---

## 🚀 Étapes de Redémarrage

### Option 1: Redémarrage Manuel (Recommandé)

1. **Arrêter le service actuel**:
   - Si lancé dans un terminal: `Ctrl+C`
   - Si lancé en arrière-plan: Trouver le processus et le tuer

2. **Redémarrer le service**:
```bash
cd apps/backend/materials-service
npm start
```

3. **Vérifier les logs**:
```
[Nest] 12345  - 28/04/2026, 02:48:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 28/04/2026, 02:48:00     LOG [InstanceLoader] MaterialsModule dependencies initialized
[Nest] 12345  - 28/04/2026, 02:48:00     LOG [RoutesResolver] MaterialsController {/materials}:
[Nest] 12345  - 28/04/2026, 02:48:00     LOG [RouterExplorer] Mapped {/materials/weather, GET} route
[Nest] 12345  - 28/04/2026, 02:48:00     LOG [RouterExplorer] Mapped {/materials/:id, GET} route
```

**Vérifier que `/materials/weather` apparaît AVANT `/materials/:id`**

### Option 2: Redémarrage avec PM2 (Si utilisé)

```bash
pm2 restart materials-service
pm2 logs materials-service
```

### Option 3: Redémarrage avec Docker (Si utilisé)

```bash
docker-compose restart materials-service
docker-compose logs -f materials-service
```

---

## 🧪 Tests de Validation

### Test 1: Endpoint Weather

**Avec curl (Git Bash)**:
```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8002068&lng=10.1857757"
```

**Réponse Attendue**:
```json
{
  "success": true,
  "weather": {
    "temperature": 18,
    "feelsLike": 16,
    "description": "nuageux",
    "icon": "04d",
    "iconUrl": "https://openweathermap.org/img/wn/04d@2x.png",
    "humidity": 65,
    "windSpeed": 15,
    "cityName": "Tunis",
    "condition": "cloudy"
  }
}
```

**Logs Backend Attendus**:
```
🌍 Fetching weather for coordinates: 36.8002068, 10.1857757
✅ Weather fetched for coordinates (36.8002068, 10.1857757): 18°C
```

### Test 2: Endpoint Movements

**Avec curl**:
```bash
curl "http://localhost:3002/api/materials/movements/69f0135fef257c315ae53f5d"
```

**Réponse Attendue**: Array de mouvements ou `[]`

### Test 3: Frontend

1. **Ouvrir l'application**: `http://localhost:5173`
2. **Aller sur Materials**
3. **Cliquer sur un matériau avec coordonnées GPS**
4. **Vérifier**:
   - ✅ Météo s'affiche correctement
   - ✅ Mouvements récents s'affichent
   - ✅ Prédiction IA s'affiche

---

## ❌ Si l'Erreur Persiste

### Vérifier l'Ordre des Routes

Ouvrir `apps/backend/materials-service/src/materials/materials.controller.ts` et vérifier:

```typescript
@Controller('materials')
export class MaterialsController {
  
  // ✅ Routes FIXES en premier
  @Get()                    // /materials
  @Get('dashboard')         // /materials/dashboard
  @Get('alerts')            // /materials/alerts
  @Get('low-stock')         // /materials/low-stock
  @Get('with-sites')        // /materials/with-sites
  @Get('expiring')          // /materials/expiring
  @Get('weather')           // /materials/weather ← DOIT ÊTRE ICI
  
  // ✅ Routes DYNAMIQUES en dernier
  @Get(':id/prediction')    // /materials/:id/prediction
  @Get(':id/auto-order')    // /materials/:id/auto-order
  @Get(':id')               // /materials/:id ← CAPTURE TOUT
}
```

### Vérifier la Compilation

```bash
cd apps/backend/materials-service
npm run build
```

**Doit afficher**: `✔ Build completed successfully`

### Vérifier le Port

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3002 -State Listen

# Git Bash
netstat -ano | grep 3002
```

**Doit afficher**: Un processus écoute sur le port 3002

---

## 📝 Checklist de Vérification

Avant de tester:

- [ ] Service materials-service redémarré
- [ ] Logs montrent "Mapped {/materials/weather, GET}"
- [ ] Logs montrent weather AVANT :id
- [ ] Build réussi sans erreurs
- [ ] Port 3002 accessible
- [ ] Frontend redémarré (si nécessaire)

Après redémarrage:

- [ ] Endpoint weather répond 200 OK
- [ ] Endpoint movements répond 200 OK
- [ ] Frontend affiche la météo
- [ ] Frontend affiche les mouvements
- [ ] Validation quantité fonctionne

---

## 🔍 Debug Avancé

### Activer les Logs Détaillés

Dans `apps/backend/materials-service/src/main.ts`:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // ← Ajouter debug et verbose
  });
  // ...
}
```

### Vérifier les Routes Enregistrées

Ajouter dans `main.ts` après `app.init()`:

```typescript
const server = app.getHttpServer();
const router = server._events.request._router;
console.log('📋 Routes enregistrées:');
router.stack.forEach((layer: any) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(`  ${methods} ${layer.route.path}`);
  }
});
```

---

## 🎯 Résumé

**Problème**: Route `weather` capturée par route dynamique `:id`

**Solution**: Déplacer `@Get('weather')` AVANT `@Get(':id')`

**Action Requise**: **REDÉMARRER LE SERVICE** pour appliquer les changements

**Commande**:
```bash
cd apps/backend/materials-service
npm start
```

**Vérification**:
```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8&lng=10.2"
```

**Résultat Attendu**: `{"success":true,"weather":{...}}`

---

## 📞 Support

Si le problème persiste après redémarrage:

1. Vérifier les logs du service
2. Vérifier l'ordre des routes dans le controller
3. Vérifier que le build est à jour
4. Vérifier qu'aucun cache n'interfère
5. Redémarrer le frontend également

**Le service DOIT être redémarré pour que les changements prennent effet!** 🔄
