# Gestion Projects Service

Microservice NestJS pour la gestion des projets SmartSite.

## 🚀 Déploiement

| Environnement | URL |
|---|---|
| Production (Render) | https://smartsite-gestion-projects-latest.onrender.com |
| Frontend (Vercel) | https://smartsite-platform-2yawk528c-asmammhs-projects.vercel.app |

## 📡 API Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | /projects | Liste tous les projets |
| GET | /projects/with-sites | Projets avec leurs sites |
| GET | /projects/:id | Détail d'un projet |
| POST | /projects | Créer un projet |
| PUT | /projects/:id | Modifier un projet |
| DELETE | /projects/:id | Supprimer un projet |
| POST | /chat/message | Chat IA |

## 🔧 Variables d'environnement

```env
PORT=3007
NODE_ENV=production
MONGODB_URI=<mongodb-atlas-uri>
GROQ_API_KEY=<groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
```

## 🏗️ CI/CD

- **CI** : Jenkins → Tests → SonarQube → Quality Gate
- **CD** : Jenkins → Docker Build → Docker Hub → Render
- **Image Docker** : `asmaamh/smartsite-gestion-projects:latest`
