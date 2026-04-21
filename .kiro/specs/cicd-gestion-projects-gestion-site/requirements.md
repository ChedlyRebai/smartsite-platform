# Document des Exigences

## Introduction

Ce document décrit les exigences pour la mise en place de pipelines CI/CD (Intégration Continue / Déploiement Continu) pour deux microservices du monorepo SmartSite : **gestion-projects** (port 3007) et **gestion-site** (port 3001). Les pipelines seront implémentés avec GitHub Actions et couvriront les étapes de build, test, analyse de qualité (SonarQube), containerisation Docker et déploiement automatisé.

## Glossaire

- **CI_Pipeline** : Pipeline d'intégration continue exécuté à chaque push ou pull request sur la branche principale.
- **CD_Pipeline** : Pipeline de déploiement continu déclenché automatiquement après le succès du CI_Pipeline.
- **Workflow_GitHub_Actions** : Fichier YAML définissant les étapes automatisées dans GitHub Actions.
- **Docker_Image** : Image conteneurisée d'un microservice prête à être déployée.
- **Docker_Registry** : Registre de stockage des Docker_Images (ex. Docker Hub ou GitHub Container Registry).
- **SonarQube** : Outil d'analyse statique de la qualité et de la sécurité du code.
- **Service_gestion_projects** : Microservice NestJS gérant les projets de construction, exposé sur le port 3007.
- **Service_gestion_site** : Microservice NestJS gérant les sites de construction, exposé sur le port 3001 avec le préfixe `/api`.
- **Monorepo** : Dépôt unique contenant plusieurs services sous `apps/backend/`.
- **Jest** : Framework de tests unitaires utilisé par les deux microservices.
- **Dockerfile** : Fichier de configuration pour la construction d'une Docker_Image.
- **Runner** : Environnement d'exécution GitHub Actions (ubuntu-latest).

---

## Exigences

### Exigence 1 : Structure des fichiers Workflow GitHub Actions

**User Story :** En tant que développeur, je veux que les workflows CI/CD soient organisés dans des fichiers YAML dédiés, afin de maintenir une séparation claire des pipelines par service.

#### Critères d'acceptation

1. THE CI_Pipeline SHALL disposer d'un fichier Workflow_GitHub_Actions dédié à `.github/workflows/ci-gestion-projects.yml` pour le Service_gestion_projects.
2. THE CI_Pipeline SHALL disposer d'un fichier Workflow_GitHub_Actions dédié à `.github/workflows/ci-gestion-site.yml` pour le Service_gestion_site.
3. THE CD_Pipeline SHALL disposer d'un fichier Workflow_GitHub_Actions dédié à `.github/workflows/cd-gestion-projects.yml` pour le Service_gestion_projects.
4. THE CD_Pipeline SHALL disposer d'un fichier Workflow_GitHub_Actions dédié à `.github/workflows/cd-gestion-site.yml` pour le Service_gestion_site.
5. WHEN un fichier Workflow_GitHub_Actions est créé, THE CI_Pipeline SHALL définir les chemins de déclenchement (`paths`) restreints au répertoire du service concerné (`apps/backend/gestion-projects/**` ou `apps/backend/gestion-site/**`).

---

### Exigence 2 : Pipeline CI pour gestion-projects

**User Story :** En tant que développeur, je veux un pipeline CI automatisé pour le Service_gestion_projects, afin de valider la qualité du code à chaque modification.

#### Critères d'acceptation

1. WHEN un push ou une pull request est effectué sur la branche `main` ou `develop` avec des modifications dans `apps/backend/gestion-projects/**`, THE CI_Pipeline SHALL se déclencher automatiquement.
2. THE CI_Pipeline SHALL exécuter les étapes suivantes dans l'ordre : checkout du code, configuration de Node.js 20, installation des dépendances npm, exécution des tests unitaires Jest, build NestJS, et analyse SonarQube.
3. WHEN l'étape d'installation des dépendances est exécutée, THE CI_Pipeline SHALL utiliser `npm ci` dans le répertoire `apps/backend/gestion-projects`.
4. WHEN les tests unitaires sont exécutés, THE CI_Pipeline SHALL lancer la commande `npm test -- --coverage` et générer un rapport de couverture.
5. WHEN le build est exécuté, THE CI_Pipeline SHALL lancer la commande `npm run build` et vérifier que le répertoire `dist/` est généré.
6. WHEN l'analyse SonarQube est exécutée, THE CI_Pipeline SHALL utiliser l'action `SonarSource/sonarqube-scan-action` avec les secrets `SONAR_TOKEN` et `SONAR_HOST_URL`.
7. IF une étape du CI_Pipeline échoue, THEN THE CI_Pipeline SHALL arrêter l'exécution et signaler l'échec sans déclencher le CD_Pipeline.

---

### Exigence 3 : Pipeline CI pour gestion-site

**User Story :** En tant que développeur, je veux un pipeline CI automatisé pour le Service_gestion_site, afin de valider la qualité du code à chaque modification.

#### Critères d'acceptation

1. WHEN un push ou une pull request est effectué sur la branche `main` ou `develop` avec des modifications dans `apps/backend/gestion-site/**`, THE CI_Pipeline SHALL se déclencher automatiquement.
2. THE CI_Pipeline SHALL exécuter les étapes suivantes dans l'ordre : checkout du code, configuration de Node.js 20, installation des dépendances npm, exécution des tests unitaires Jest, build NestJS, et analyse SonarQube.
3. WHEN l'étape d'installation des dépendances est exécutée, THE CI_Pipeline SHALL utiliser `npm ci` dans le répertoire `apps/backend/gestion-site`.
4. WHEN les tests unitaires sont exécutés, THE CI_Pipeline SHALL lancer la commande `npm test -- --coverage` et générer un rapport de couverture.
5. WHEN le build est exécuté, THE CI_Pipeline SHALL lancer la commande `npm run build` et vérifier que le répertoire `dist/` est généré.
6. WHEN l'analyse SonarQube est exécutée, THE CI_Pipeline SHALL utiliser l'action `SonarSource/sonarqube-scan-action` avec les secrets `SONAR_TOKEN` et `SONAR_HOST_URL`.
7. IF une étape du CI_Pipeline échoue, THEN THE CI_Pipeline SHALL arrêter l'exécution et signaler l'échec sans déclencher le CD_Pipeline.

---

### Exigence 4 : Pipeline CD pour gestion-projects

**User Story :** En tant que DevOps, je veux un pipeline CD automatisé pour le Service_gestion_projects, afin de déployer automatiquement les nouvelles versions après validation CI.

#### Critères d'acceptation

1. WHEN le CI_Pipeline du Service_gestion_projects se termine avec succès sur la branche `main`, THE CD_Pipeline SHALL se déclencher automatiquement via l'événement `workflow_run`.
2. THE CD_Pipeline SHALL exécuter les étapes suivantes dans l'ordre : checkout du code, authentification au Docker_Registry, construction de la Docker_Image, push de la Docker_Image vers le Docker_Registry, et déploiement.
3. WHEN la Docker_Image est construite, THE CD_Pipeline SHALL utiliser le Dockerfile situé dans `apps/backend/gestion-projects/Dockerfile` et tagger l'image avec le SHA du commit et le tag `latest`.
4. WHEN la Docker_Image est poussée, THE CD_Pipeline SHALL utiliser les secrets `DOCKER_USERNAME` et `DOCKER_PASSWORD` pour l'authentification au Docker_Registry.
5. WHEN le déploiement est exécuté, THE CD_Pipeline SHALL exposer le Service_gestion_projects sur le port 3007 avec la variable d'environnement `PORT=3007`.
6. IF la construction de la Docker_Image échoue, THEN THE CD_Pipeline SHALL arrêter l'exécution et signaler l'échec sans effectuer le déploiement.

---

### Exigence 5 : Pipeline CD pour gestion-site

**User Story :** En tant que DevOps, je veux un pipeline CD automatisé pour le Service_gestion_site, afin de déployer automatiquement les nouvelles versions après validation CI.

#### Critères d'acceptation

1. WHEN le CI_Pipeline du Service_gestion_site se termine avec succès sur la branche `main`, THE CD_Pipeline SHALL se déclencher automatiquement via l'événement `workflow_run`.
2. THE CD_Pipeline SHALL exécuter les étapes suivantes dans l'ordre : checkout du code, authentification au Docker_Registry, construction de la Docker_Image, push de la Docker_Image vers le Docker_Registry, et déploiement.
3. WHEN la Docker_Image est construite, THE CD_Pipeline SHALL utiliser le Dockerfile situé dans `apps/backend/gestion-site/Dockerfile` et tagger l'image avec le SHA du commit et le tag `latest`.
4. WHEN la Docker_Image est poussée, THE CD_Pipeline SHALL utiliser les secrets `DOCKER_USERNAME` et `DOCKER_PASSWORD` pour l'authentification au Docker_Registry.
5. WHEN le déploiement est exécuté, THE CD_Pipeline SHALL exposer le Service_gestion_site sur le port 3001 avec la variable d'environnement `PORT=3001` et le préfixe global `/api`.
6. IF la construction de la Docker_Image échoue, THEN THE CD_Pipeline SHALL arrêter l'exécution et signaler l'échec sans effectuer le déploiement.

---

### Exigence 6 : Dockerfiles pour les microservices

**User Story :** En tant que développeur, je veux des Dockerfiles optimisés pour chaque microservice, afin de produire des images légères et sécurisées.

#### Critères d'acceptation

1. THE Dockerfile SHALL utiliser une construction multi-étapes (multi-stage build) avec une image de base `node:20-alpine` pour la phase de build et `node:20-alpine` pour la phase de production.
2. THE Dockerfile SHALL copier uniquement les fichiers `package.json` et `package-lock.json` avant d'installer les dépendances, afin d'optimiser le cache Docker.
3. WHEN le Dockerfile est construit pour le Service_gestion_projects, THE Dockerfile SHALL exposer le port 3007 via l'instruction `EXPOSE 3007`.
4. WHEN le Dockerfile est construit pour le Service_gestion_site, THE Dockerfile SHALL exposer le port 3001 via l'instruction `EXPOSE 3001`.
5. THE Dockerfile SHALL définir la commande de démarrage `CMD ["node", "dist/main"]` correspondant au script `start:prod`.
6. THE Dockerfile SHALL exclure les fichiers non nécessaires via un fichier `.dockerignore` incluant `node_modules`, `dist`, `.env`, et `.git`.

---

### Exigence 7 : Tests unitaires pour gestion-projects

**User Story :** En tant que développeur, je veux des tests unitaires pour le Service_gestion_projects, afin de valider le comportement du service dans le pipeline CI.

#### Critères d'acceptation

1. THE Service_gestion_projects SHALL disposer d'un fichier de test `apps/backend/gestion-projects/src/projects/projects.service.spec.ts` couvrant les méthodes `findAll`, `findOne`, `create`, `update` et `remove`.
2. WHEN la méthode `create` est testée, THE Service_gestion_projects SHALL valider que la création d'un projet avec des données valides retourne un objet projet avec les champs `name`, `status` et `priority`.
3. WHEN la méthode `findOne` est testée avec un identifiant inexistant, THE Service_gestion_projects SHALL lever une exception `NotFoundException`.
4. WHEN la méthode `remove` est testée avec un identifiant inexistant, THE Service_gestion_projects SHALL lever une exception `NotFoundException`.
5. THE Service_gestion_projects SHALL disposer d'un fichier de test `apps/backend/gestion-projects/src/projects/projects.controller.spec.ts` couvrant les routes GET, POST, PUT et DELETE.
6. WHEN les tests sont exécutés dans le CI_Pipeline, THE Service_gestion_projects SHALL atteindre un taux de couverture de code d'au moins 60%.

---

### Exigence 8 : Tests unitaires pour gestion-site

**User Story :** En tant que développeur, je veux des tests unitaires pour le Service_gestion_site, afin de valider le comportement du service dans le pipeline CI.

#### Critères d'acceptation

1. THE Service_gestion_site SHALL disposer d'un fichier de test `apps/backend/gestion-site/src/gestion-site.service.spec.ts` couvrant les méthodes principales du `GestionSiteService`.
2. WHEN la méthode de création d'un site est testée, THE Service_gestion_site SHALL valider que la création avec des données valides retourne un objet site avec les champs attendus.
3. WHEN une méthode est testée avec un identifiant inexistant, THE Service_gestion_site SHALL lever une exception `NotFoundException`.
4. THE Service_gestion_site SHALL disposer d'un fichier de test `apps/backend/gestion-site/src/gestion-site.controller.spec.ts` couvrant les routes principales du contrôleur.
5. WHEN les tests sont exécutés dans le CI_Pipeline, THE Service_gestion_site SHALL atteindre un taux de couverture de code d'au moins 60%.

---

### Exigence 9 : Configuration des secrets et variables d'environnement

**User Story :** En tant que DevOps, je veux que les informations sensibles soient gérées via les secrets GitHub Actions, afin de sécuriser les pipelines.

#### Critères d'acceptation

1. THE CI_Pipeline SHALL utiliser les secrets GitHub `SONAR_TOKEN` et `SONAR_HOST_URL` pour l'intégration SonarQube, sans exposer ces valeurs dans les logs.
2. THE CD_Pipeline SHALL utiliser les secrets GitHub `DOCKER_USERNAME` et `DOCKER_PASSWORD` pour l'authentification au Docker_Registry, sans exposer ces valeurs dans les logs.
3. WHEN le Service_gestion_projects est déployé, THE CD_Pipeline SHALL injecter la variable d'environnement `MONGODB_URI` depuis les secrets GitHub pour la connexion à MongoDB.
4. WHEN le Service_gestion_site est déployé, THE CD_Pipeline SHALL injecter la variable d'environnement `MONGODB_URI` depuis les secrets GitHub pour la connexion à MongoDB.
5. IF un secret requis est absent lors de l'exécution du pipeline, THEN THE CI_Pipeline SHALL échouer avec un message d'erreur explicite indiquant le secret manquant.
