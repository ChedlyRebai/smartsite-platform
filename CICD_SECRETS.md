# Secrets GitHub Actions — CI/CD SmartSite

Ce fichier liste les secrets GitHub à configurer dans **Settings → Secrets and variables → Actions** de ton dépôt GitHub.

---

## Comment ajouter un secret GitHub

1. Va sur ton dépôt GitHub
2. Clique sur **Settings** (onglet en haut)
3. Dans le menu gauche : **Secrets and variables → Actions**
4. Clique sur **New repository secret**
5. Ajoute le nom et la valeur

---

## Secrets requis

### 🔍 SonarQube (utilisé par les pipelines CI)

| Nom du secret | Description | Utilisé par |
|---|---|---|
| `SONAR_TOKEN` | Token d'authentification SonarQube. Généré dans SonarQube : **My Account → Security → Generate Token** | CI gestion-projects, CI gestion-site |
| `SONAR_HOST_URL` | URL de ton serveur SonarQube. Ex: `http://192.168.1.100:9000` | CI gestion-projects, CI gestion-site |

### 🐳 Docker Hub (utilisé par les pipelines CD)

| Nom du secret | Description | Utilisé par |
|---|---|---|
| `DOCKER_USERNAME` | Ton identifiant Docker Hub. Ex: `monusername` | CD gestion-projects, CD gestion-site |
| `DOCKER_PASSWORD` | Ton mot de passe ou token Docker Hub. Généré dans Docker Hub : **Account Settings → Security → New Access Token** | CD gestion-projects, CD gestion-site |

### 🗄️ MongoDB (utilisé par les pipelines CD)

| Nom du secret | Description | Utilisé par |
|---|---|---|
| `MONGODB_URI` | URI de connexion MongoDB. Ex: `mongodb+srv://user:pass@cluster.mongodb.net/smartsite` | CD gestion-projects, CD gestion-site |

---

## Résumé des 5 secrets à configurer

```
SONAR_TOKEN          → Token SonarQube
SONAR_HOST_URL       → URL SonarQube (ex: http://IP:9000)
DOCKER_USERNAME      → Identifiant Docker Hub
DOCKER_PASSWORD      → Mot de passe / token Docker Hub
MONGODB_URI          → URI MongoDB Atlas ou local
```

---

## Images Docker produites

Après chaque déploiement réussi, les images suivantes seront disponibles sur Docker Hub :

- `DOCKER_USERNAME/smartsite-gestion-projects:latest`
- `DOCKER_USERNAME/smartsite-gestion-projects:SHA_DU_COMMIT`
- `DOCKER_USERNAME/smartsite-gestion-site:latest`
- `DOCKER_USERNAME/smartsite-gestion-site:SHA_DU_COMMIT`

---

## Flux des pipelines

```
Push sur main
    │
    ├── Modif dans apps/backend/gestion-projects/**
    │       └── CI gestion-projects (tests + build + sonar)
    │               └── Succès → CD gestion-projects (docker build + push + deploy :3007)
    │
    └── Modif dans apps/backend/gestion-site/**
            └── CI gestion-site (tests + build + sonar)
                    └── Succès → CD gestion-site (docker build + push + deploy :3001)
```
