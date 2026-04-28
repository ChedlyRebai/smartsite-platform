# 🚨 REDÉMARRAGE URGENT REQUIS

## ⚠️ Problème Actuel

Le service `materials-service` tourne depuis **1h49 AM** (avant les corrections).

Les corrections de la route `weather` ne sont **PAS actives** car le service n'a pas été redémarré.

---

## 🔄 Solution: Redémarrer le Service

### Option 1: Via Terminal

```bash
# 1. Trouver le processus
netstat -ano | findstr :3002

# 2. Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /PID <PID> /F

# 3. Redémarrer
cd apps/backend/materials-service
npm start
```

### Option 2: Via PowerShell

```powershell
# 1. Trouver et tuer le processus sur le port 3002
Get-NetTCPConnection -LocalPort 3002 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# 2. Redémarrer
cd apps\backend\materials-service
npm start
```

### Option 3: Redémarrer Tous les Services

```bash
# Si vous utilisez un script de démarrage global
npm run dev  # ou votre commande de démarrage
```

---

## ✅ Vérification Après Redémarrage

### 1. Vérifier les Logs

Vous devez voir:
```
[Nest] LOG [RouterExplorer] Mapped {/materials/weather, GET} route
[Nest] LOG [RouterExplorer] Mapped {/materials/:id, GET} route
```

**Important**: `/materials/weather` doit apparaître **AVANT** `/materials/:id`

### 2. Tester l'Endpoint Weather

```bash
curl "http://localhost:3002/api/materials/weather?lat=36.8&lng=10.2"
```

**Résultat Attendu**:
```json
{
  "success": true,
  "weather": {
    "temperature": 18,
    "description": "nuageux",
    ...
  }
}
```

**PAS**: `{"message":"ID de matériau invalide","error":"Bad Request","statusCode":400}`

### 3. Tester dans le Frontend

1. Ouvrir un matériau
2. Cliquer sur "Prédiction Avancée (IA)"
3. Vérifier que la météo s'affiche (pas d'erreur 404)

---

## 📋 Corrections Appliquées (Attendent Redémarrage)

### Backend
- ✅ Route `@Get('weather')` déplacée avant `@Get(':id')`
- ✅ Coordonnées GPS: `coordinates.lat/lng` au lieu de `coordonnees.latitude/longitude`
- ✅ Validation quantité commande
- ✅ Flow log avec détection anomalies
- ✅ Email automatique

### Frontend
- ✅ Endpoint météo corrigé: `/api/materials/sites/` au lieu de `/api/sites/`
- ✅ Champs coordonnées corrigés: `coordinates.lat/lng`
- ✅ Validation quantité commande

---

## 🎯 Après Redémarrage

Tout devrait fonctionner:

1. ✅ Météo dans prédiction ML
2. ✅ Bouton "Entraîner" (après upload CSV)
3. ✅ Flow log avec anomalies
4. ✅ Email automatique si sortie excessive
5. ✅ Validation quantité commande

---

## 📞 Si Problème Persiste

1. Vérifier que le port 3002 est libre
2. Vérifier les logs du service
3. Vérifier que le build est à jour: `npm run build`
4. Redémarrer le frontend également

---

## 🚀 COMMANDE RAPIDE

```bash
# Windows PowerShell
cd apps\backend\materials-service
npm start
```

**C'EST TOUT!** Le service doit juste être redémarré. 🔄
