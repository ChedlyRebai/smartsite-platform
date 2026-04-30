# 🧪 Test de l'Endpoint de Géocodage

## Problème Identifié

L'endpoint `/gestion-sites/geocode/search` retourne une erreur 404 car le service n'a pas été redémarré après les modifications.

## Solution

### Étape 1 : Arrêter le Service Actuel

Si le service est en cours d'exécution, arrêtez-le :
- Appuyez sur `Ctrl+C` dans le terminal où le service tourne
- Ou fermez le terminal

### Étape 2 : Recompiler le Service

```bash
cd apps/backend/gestion-site
npm run build
```

### Étape 3 : Redémarrer le Service

```bash
npm start
```

Vous devriez voir dans les logs :
```
[RoutesResolver] GestionSiteController {/gestion-sites}:
[RouterExplorer] Mapped {/gestion-sites/geocode/search, GET} route
```

### Étape 4 : Tester l'Endpoint

#### Test 1 : Adresse Simple

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Tunis" -Method GET
```

**Résultat Attendu** :
```json
{
  "success": true,
  "message": "X adresse(s) trouvée(s)",
  "results": [
    {
      "displayName": "Tunis, Tunisia",
      "lat": 36.8065,
      "lng": 10.1815,
      ...
    }
  ]
}
```

#### Test 2 : Adresse Complète

```powershell
$address = "Avenue Habib Bourguiba, Tunis"
$encoded = [System.Web.HttpUtility]::UrlEncode($address)
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=$encoded" -Method GET
```

#### Test 3 : Depuis le Frontend

1. Ouvrir le navigateur sur `http://localhost:5173`
2. Aller sur la page "Sites"
3. Cliquer sur "Edit" pour un site
4. Dans le champ "Address", saisir : `Avenue Bourguiba, Tunis`
5. Cliquer sur l'icône 🔍
6. Observer :
   - Toast "Searching address..."
   - Puis "Address found: ..."
   - La carte se centre sur l'adresse
   - Les coordonnées s'affichent sous la carte

## 🐛 Dépannage

### Problème : 404 Not Found

**Cause** : Le service n'a pas été redémarré après les modifications

**Solution** :
1. Arrêter le service (Ctrl+C)
2. Recompiler : `npm run build`
3. Redémarrer : `npm start`
4. Vérifier les logs pour voir l'endpoint `/gestion-sites/geocode/search`

### Problème : CORS Error

**Cause** : Le frontend ne peut pas accéder au backend

**Solution** :
1. Vérifier que le service tourne sur le port 3001
2. Vérifier la configuration CORS dans le backend
3. Vérifier le proxy Vite dans `apps/frontend/vite.config.ts`

### Problème : Timeout

**Cause** : L'API Nominatim est lente ou indisponible

**Solution** :
1. Vérifier votre connexion internet
2. Réessayer après quelques secondes
3. Utiliser une adresse plus simple (ex: juste "Tunis")

### Problème : La Carte Ne Se Centre Pas

**Cause** : Les coordonnées ne sont pas correctement mises à jour

**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier que `setEditMapPosition` est bien appelé
4. Vérifier que la réponse de l'API contient `lat` et `lng`

## ✅ Checklist de Vérification

Avant de tester dans le frontend :

- [ ] Le service backend est compilé (`npm run build`)
- [ ] Le service backend est démarré (`npm start`)
- [ ] L'endpoint apparaît dans les logs au démarrage
- [ ] Le test PowerShell retourne un résultat valide
- [ ] Le frontend est démarré (`npm run dev`)
- [ ] Le navigateur est ouvert sur `http://localhost:5173`

## 📝 Logs à Vérifier

### Backend (au démarrage)

```
[RoutesResolver] GestionSiteController {/gestion-sites}:
[RouterExplorer] Mapped {/gestion-sites, POST} route
[RouterExplorer] Mapped {/gestion-sites, GET} route
...
[RouterExplorer] Mapped {/gestion-sites/geocode/search, GET} route  ← IMPORTANT
...
[NestApplication] Nest application successfully started
```

### Backend (lors d'une recherche)

```
[GestionSiteController] 🔍 Recherche de géocodage pour l'adresse: Tunis
[GestionSiteService] 🌍 Géocodage de l'adresse: Tunis
[GestionSiteService] ✅ 5 résultat(s) trouvé(s) pour l'adresse: Tunis
```

### Frontend (Console du navigateur)

```
Searching address...
Response: { success: true, results: [...] }
Address found: Tunis, Tunisia
```

## 🔄 Processus Complet de Test

```bash
# Terminal 1 : Backend
cd apps/backend/gestion-site
npm run build
npm start

# Attendre que le service démarre complètement
# Vérifier les logs pour voir l'endpoint /geocode/search

# Terminal 2 : Test de l'endpoint
Invoke-RestMethod -Uri "http://localhost:3001/gestion-sites/geocode/search?address=Tunis" -Method GET

# Si le test réussit, tester dans le frontend
# Terminal 3 : Frontend
cd apps/frontend
npm run dev

# Ouvrir le navigateur sur http://localhost:5173
# Tester la fonctionnalité de recherche d'adresse
```

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifier les logs du backend pour les erreurs
2. Vérifier la console du navigateur pour les erreurs JavaScript
3. Vérifier que tous les services nécessaires sont démarrés
4. Vérifier la configuration réseau (firewall, proxy, etc.)
