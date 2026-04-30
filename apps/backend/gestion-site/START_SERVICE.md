# 🚀 Démarrage Rapide du Service Gestion-Site

## Commandes Rapides

### Option 1 : Démarrage Normal

```bash
cd apps/backend/gestion-site
npm start
```

### Option 2 : Recompilation + Démarrage

```bash
cd apps/backend/gestion-site
npm run build && npm start
```

### Option 3 : Mode Développement (avec watch)

```bash
cd apps/backend/gestion-site
npm run start:dev
```

## Vérification du Démarrage

### 1. Vérifier que le Service Écoute sur le Port 3001

```powershell
netstat -ano | findstr :3001
```

**Résultat Attendu** :
```
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       12345
```

### 2. Vérifier les Routes Disponibles

Dans les logs du service, vous devriez voir :

```
[RoutesResolver] GestionSiteController {/gestion-sites}:
[RouterExplorer] Mapped {/gestion-sites, POST} route
[RouterExplorer] Mapped {/gestion-sites, GET} route
[RouterExplorer] Mapped {/gestion-sites/statistics, GET} route
[RouterExplorer] Mapped {/gestion-sites/budget/total, GET} route
[RouterExplorer] Mapped {/gestion-sites/active, GET} route
...
[RouterExplorer] Mapped {/gestion-sites/geocode/search, GET} route  ← IMPORTANT !
...
[NestApplication] Nest application successfully started
```

### 3. Test Rapide de l'Endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Tunis" -Method GET
```

## 🔧 Résolution des Problèmes Courants

### Problème : Port 3001 Déjà Utilisé

**Erreur** :
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution 1** : Arrêter le processus existant
```powershell
# Trouver le PID du processus
netstat -ano | findstr :3001

# Arrêter le processus (remplacer 12345 par le PID trouvé)
taskkill /PID 12345 /F
```

**Solution 2** : Changer le port dans `.env`
```env
PORT=3011
```

### Problème : Erreurs de Compilation

**Erreur** :
```
error TS2339: Property 'geocodeAddress' does not exist on type 'GestionSiteService'
```

**Solution** :
1. Vérifier que le fichier `gestion-site.service.ts` contient bien la méthode `geocodeAddress`
2. Recompiler : `npm run build`
3. Redémarrer : `npm start`

### Problème : Module Non Trouvé

**Erreur** :
```
Cannot find module 'axios'
```

**Solution** :
```bash
npm install
npm run build
npm start
```

## 📊 Monitoring du Service

### Vérifier les Logs en Temps Réel

Les logs s'affichent automatiquement dans le terminal où vous avez lancé `npm start`.

### Logs Importants à Surveiller

```
✅ Démarrage réussi :
[NestApplication] Nest application successfully started

✅ Connexion MongoDB :
[MongooseModule] Mongoose connected to mongodb://localhost:27017/smartsite

✅ Endpoint de géocodage disponible :
[RouterExplorer] Mapped {/gestion-sites/geocode/search, GET} route

✅ Recherche d'adresse :
[GestionSiteController] 🔍 Recherche de géocodage pour l'adresse: Tunis
[GestionSiteService] 🌍 Géocodage de l'adresse: Tunis
[GestionSiteService] ✅ 5 résultat(s) trouvé(s) pour l'adresse: Tunis

❌ Erreur de géocodage :
[GestionSiteService] ❌ Erreur lors du géocodage de l'adresse: [message]
```

## 🎯 Workflow Complet de Test

### 1. Démarrer le Backend

```bash
# Terminal 1
cd apps/backend/gestion-site
npm run build
npm start
```

**Attendre** : "Nest application successfully started"

### 2. Tester l'Endpoint

```powershell
# Terminal 2 (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Tunis" -Method GET
```

**Vérifier** : Réponse JSON avec `success: true`

### 3. Démarrer le Frontend

```bash
# Terminal 3
cd apps/frontend
npm run dev
```

**Attendre** : "Local: http://localhost:5173/"

### 4. Tester dans le Navigateur

1. Ouvrir `http://localhost:5173`
2. Aller sur "Sites"
3. Cliquer "Edit" sur un site
4. Saisir une adresse : `Avenue Bourguiba, Tunis`
5. Cliquer sur l'icône 🔍
6. Observer :
   - Toast "Searching address..."
   - Carte se centre sur l'adresse
   - Toast "Address found: ..."
   - Coordonnées affichées

## 📝 Checklist de Démarrage

Avant de tester la fonctionnalité :

- [ ] MongoDB est démarré
- [ ] Le service gestion-site est compilé (`npm run build`)
- [ ] Le service gestion-site est démarré (`npm start`)
- [ ] Le port 3001 est libre ou le service écoute dessus
- [ ] L'endpoint `/gestion-sites/geocode/search` apparaît dans les logs
- [ ] Le test PowerShell retourne un résultat valide
- [ ] Le frontend est démarré (`npm run dev`)
- [ ] Le navigateur est ouvert sur `http://localhost:5173`

## 🔄 Redémarrage Rapide

Si vous avez modifié le code :

```bash
# Arrêter le service (Ctrl+C dans le terminal)
# Puis :
npm run build && npm start
```

Ou en mode développement (redémarrage automatique) :

```bash
npm run start:dev
```

## 📞 Aide Supplémentaire

Si vous rencontrez des problèmes :

1. **Vérifier les logs** : Regardez les messages d'erreur dans le terminal
2. **Vérifier MongoDB** : Assurez-vous que MongoDB est démarré
3. **Vérifier les ports** : Assurez-vous que les ports 3001 et 5173 sont libres
4. **Nettoyer et réinstaller** :
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   npm start
   ```
