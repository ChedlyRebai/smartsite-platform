# Configuration des Ports - SmartSite Platform

## 📋 Attribution des Ports

### Services Backend

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **user-authentication** | 3000 | Service d'authentification | ✅ Actif |
| **gestion-site** | 3001 | Gestion des sites/chantiers | ✅ Actif |
| **materials-service** | 3002 | Gestion des matériaux | ✅ Actif |
| **gestion-planing** | 3003 | Planification des tâches | ✅ Actif |
| **incident-management** | 3004 | Gestion des incidents | ✅ Actif |
| **notification** | 3005 | Service de notifications | ✅ Actif |
| **api-gateway** | 3006 | Passerelle API | ✅ Actif |
| **gestion-projects** | 3007 | Gestion des projets | ✅ Actif |
| **paiement** | 3008 | Service de paiement | ✅ Actif |
| **resource-optimization** | 3010 | Optimisation des ressources | ✅ Actif |

### Frontend
| Application | Port | Description |
|-------------|------|-------------|
| **Frontend React** | 5173 | Application principale | ✅ Actif |

## 🔧 Configuration

### Variables d'Environnement

Chaque service doit avoir dans son `.env` :
```env
PORT=XXXX
```

### Références Inter-Services

#### Materials Service → Paiement
```env
PAYMENT_API_URL=http://localhost:3008/api/payments
STRIPE_API_URL=http://localhost:3008/api/payments/stripe/create-payment-intent
```

#### Gestion Site → Gestion Projects
```env
GESTION_PROJECTS_URL=http://localhost:3007
```

## 🚀 Démarrage des Services

### Ordre Recommandé
1. **Base de données** (MongoDB)
2. **Services Core** (ports 3000-3003)
3. **Services Métier** (ports 3004-3010)
4. **Frontend** (port 5173)

### Scripts de Démarrage

```bash
# Service par service
cd apps/backend/user-authentication && npm run start:dev     # Port 3000
cd apps/backend/gestion-site && npm run start:dev           # Port 3001
cd apps/backend/materials-service && npm run start:dev      # Port 3002
cd apps/backend/gestion-planing && npm run start:dev        # Port 3003
cd apps/backend/incident-management && npm run start:dev    # Port 3004
cd apps/backend/notification && npm run start:dev           # Port 3005
cd apps/backend/api-gateway && npm run start:dev            # Port 3006
cd apps/backend/gestion-projects && npm run start:dev       # Port 3007
cd apps/backend/paiement && npm run start:dev               # Port 3008
cd apps/backend/resource-optimization && npm run start:dev  # Port 3010

# Frontend
cd apps/frontend && npm run dev                             # Port 5173
```

## 🔍 Vérification des Ports

### Commandes Utiles

```bash
# Vérifier les ports utilisés
netstat -ano | findstr :3000
netstat -ano | findstr :3001
# ... etc

# Tuer un processus sur un port spécifique (Windows)
netstat -ano | findstr :3007
taskkill /PID <PID> /F

# Tuer un processus sur un port spécifique (Linux/Mac)
lsof -ti:3007 | xargs kill -9
```

### Health Check

```bash
# Vérifier que tous les services répondent
curl http://localhost:3000/health  # user-authentication
curl http://localhost:3001/health  # gestion-site
curl http://localhost:3002/health  # materials-service
curl http://localhost:3003/health  # gestion-planing
curl http://localhost:3004/health  # incident-management
curl http://localhost:3005/health  # notification
curl http://localhost:3006/health  # api-gateway
curl http://localhost:3007/health  # gestion-projects
curl http://localhost:3008/health  # paiement
curl http://localhost:3010/health  # resource-optimization
```

## ⚠️ Résolution des Conflits

### Erreur "EADDRINUSE"
```
Error: listen EADDRINUSE: address already in use :::3007
```

**Solutions :**
1. **Changer le port** dans le `.env` du service
2. **Tuer le processus** qui utilise le port
3. **Vérifier** qu'aucun autre service n'utilise le même port

### Exemple de Résolution
```bash
# 1. Identifier le processus
netstat -ano | findstr :3007

# 2. Tuer le processus
taskkill /PID <PID> /F

# 3. Ou changer le port dans .env
echo "PORT=3008" >> .env
```

## 📝 Bonnes Pratiques

1. **Toujours définir PORT** dans le `.env` de chaque service
2. **Documenter les changements** de ports
3. **Mettre à jour les références** dans les autres services
4. **Tester les communications** inter-services après changement
5. **Utiliser des ports consécutifs** pour faciliter la gestion

## 🔄 Mise à Jour des Références

Quand vous changez un port, vérifiez ces fichiers :
- `.env` des autres services
- `vite.config.ts` (proxy frontend)
- Fichiers de configuration API
- Documentation

## 📞 Support

En cas de problème de ports :
1. Vérifiez ce document
2. Utilisez les commandes de vérification
3. Consultez les logs des services
4. Redémarrez les services dans l'ordre recommandé

---

**Dernière mise à jour :** 25/04/2026
**Services actifs :** 10 backend + 1 frontend