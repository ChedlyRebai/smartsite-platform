# Document de Requirements — Infrastructure DevOps CI/CD

## Introduction

Ce document décrit les exigences pour la mise en place d'une infrastructure DevOps complète pour le projet **SmartSite Platform**, un monorepo Full Stack JS composé de microservices NestJS.

L'infrastructure couvre quatre axes principaux :
1. **Pipelines CI/CD** via GitHub Actions (2 CI + 2 CD, un par microservice backend)
2. **Qualité du code** via SonarQube
3. **Orchestration de conteneurs** via Kubernetes (kubeadm)
4. **Monitoring et alerting** via Prometheus, Grafana et AlertManager

Les deux microservices ciblés sont :
- `apps/backend/incident-management` (NestJS, module TypeScript `nodenext`)
- `apps/backend/resource-optimization` (NestJS, path aliases `@/`)

---

## Glossaire

- **CI_Pipeline** : Pipeline d'intégration continue exécuté sur GitHub Actions lors d'un push ou pull request
- **CD_Pipeline** : Pipeline de déploiement continu déclenché automatiquement après le succès du CI correspondant
- **CI_Incident** : Pipeline CI dédié au microservice `incident-management`
- **CI_Resource** : Pipeline CI dédié au microservice `resource-optimization`
- **CD_Incident** : Pipeline CD dédié au build et déploiement Docker du microservice `incident-management`
- **CD_Resource** : Pipeline CD dédié au build et déploiement Docker du microservice `resource-optimization`
- **SonarQube** : Outil d'analyse statique de la qualité du code et de la couverture de tests
- **Kubernetes_Cluster** : Cluster Kubernetes déployé avec kubeadm sur machines virtuelles partagées
- **Prometheus** : Système de collecte de métriques pour le monitoring
- **Grafana** : Tableau de bord de visualisation des métriques
- **AlertManager** : Composant Prometheus gérant les règles d'alerting et les notifications
- **Incident_Management** : Microservice NestJS gérant les incidents (`apps/backend/incident-management`)
- **Resource_Optimization** : Microservice NestJS gérant l'optimisation des ressources (`apps/backend/resource-optimization`)
- **Docker_Registry** : Registre Docker (Docker Hub) hébergeant les images des services
- **Jest** : Framework de tests unitaires utilisé par les microservices NestJS
- **Coverage_Report** : Rapport de couverture de tests généré par Jest au format LCOV
- **Quality_Gate** : Seuil de qualité SonarQube bloquant le pipeline en cas de non-conformité

---

## Requirements

### Requirement 1 : Pipeline CI — incident-management

**User Story :** En tant que développeur, je veux un pipeline CI automatisé pour le microservice `incident-management`, afin de valider la compilation et les tests unitaires à chaque modification du code.

#### Critères d'acceptation

1. WHEN un push ou une pull request est effectué sur les branches `main` ou `develop` avec des modifications dans `apps/backend/incident-management/**`, THE CI_Incident SHALL déclencher automatiquement l'exécution du pipeline.
2. THE CI_Incident SHALL installer les dépendances npm du microservice via `npm ci` avec le `cache-dependency-path` pointant vers `apps/backend/incident-management/package-lock.json`.
3. THE CI_Incident SHALL exécuter les tests unitaires Jest via `npm test -- --coverage` depuis le répertoire `apps/backend/incident-management`.
4. THE CI_Incident SHALL générer un rapport de couverture de tests au format LCOV.
5. IF les tests unitaires échouent, THEN THE CI_Incident SHALL marquer le pipeline comme échoué et bloquer le déclenchement du CD_Incident.
6. THE CI_Incident SHALL compiler le microservice via `npm run build`.
7. IF la compilation échoue, THEN THE CI_Incident SHALL marquer le pipeline comme échoué.
8. THE CI_Incident SHALL exécuter les tests unitaires en utilisant la configuration Jest compatible avec le module TypeScript `nodenext` via `ts-jest`.
9. THE CI_Incident SHALL publier les rapports de couverture comme artefacts du pipeline, conservés pendant 7 jours minimum.

---

### Requirement 2 : Pipeline CI — resource-optimization

**User Story :** En tant que développeur, je veux un pipeline CI automatisé pour le microservice `resource-optimization`, afin de valider la compilation et les tests unitaires à chaque modification du code.

#### Critères d'acceptation

1. WHEN un push ou une pull request est effectué sur les branches `main` ou `develop` avec des modifications dans `apps/backend/resource-optimization/**`, THE CI_Resource SHALL déclencher automatiquement l'exécution du pipeline.
2. THE CI_Resource SHALL installer les dépendances npm du microservice via `npm ci` avec le `cache-dependency-path` pointant vers `apps/backend/resource-optimization/package-lock.json`.
3. THE CI_Resource SHALL exécuter les tests unitaires Jest via `npm test -- --coverage` depuis le répertoire `apps/backend/resource-optimization`.
4. THE CI_Resource SHALL générer un rapport de couverture de tests au format LCOV.
5. IF les tests unitaires échouent, THEN THE CI_Resource SHALL marquer le pipeline comme échoué et bloquer le déclenchement du CD_Resource.
6. THE CI_Resource SHALL compiler le microservice via `npm run build`.
7. IF la compilation échoue, THEN THE CI_Resource SHALL marquer le pipeline comme échoué.
8. THE CI_Resource SHALL résoudre les path aliases `@/` via `moduleNameMapper` dans la configuration Jest et `tsconfig-paths` à l'exécution.
9. THE CI_Resource SHALL publier les rapports de couverture comme artefacts du pipeline, conservés pendant 7 jours minimum.

---

### Requirement 3 : Pipeline CD — incident-management

**User Story :** En tant que DevOps, je veux un pipeline CD automatisé pour le microservice `incident-management`, afin de déployer automatiquement les nouvelles versions après validation du CI.

#### Critères d'acceptation

1. WHEN le CI_Incident se termine avec succès sur la branche `main`, THE CD_Incident SHALL se déclencher automatiquement via l'événement `workflow_run`.
2. THE CD_Incident SHALL construire une image Docker pour le microservice `incident-management`.
3. THE CD_Incident SHALL pousser l'image Docker vers le Docker_Registry avec deux tags : `latest` et le SHA du commit Git.
4. THE CD_Incident SHALL déployer la nouvelle image sur le Kubernetes_Cluster en mettant à jour le Deployment Kubernetes correspondant.
5. IF la construction de l'image Docker échoue, THEN THE CD_Incident SHALL marquer le pipeline comme échoué et ne pas procéder au déploiement.
6. THE CD_Incident SHALL utiliser les secrets GitHub (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `KUBECONFIG`) pour l'authentification au Docker_Registry et au Kubernetes_Cluster.
7. THE CD_Incident SHALL afficher un message de confirmation avec le nom du service et le tag déployé en fin de pipeline.

---

### Requirement 4 : Pipeline CD — resource-optimization

**User Story :** En tant que DevOps, je veux un pipeline CD automatisé pour le microservice `resource-optimization`, afin de déployer automatiquement les nouvelles versions après validation du CI.

#### Critères d'acceptation

1. WHEN le CI_Resource se termine avec succès sur la branche `main`, THE CD_Resource SHALL se déclencher automatiquement via l'événement `workflow_run`.
2. THE CD_Resource SHALL construire une image Docker pour le microservice `resource-optimization`.
3. THE CD_Resource SHALL pousser l'image Docker vers le Docker_Registry avec deux tags : `latest` et le SHA du commit Git.
4. THE CD_Resource SHALL déployer la nouvelle image sur le Kubernetes_Cluster en mettant à jour le Deployment Kubernetes correspondant.
5. IF la construction de l'image Docker échoue, THEN THE CD_Resource SHALL marquer le pipeline comme échoué et ne pas procéder au déploiement.
6. THE CD_Resource SHALL utiliser les secrets GitHub (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `KUBECONFIG`) pour l'authentification au Docker_Registry et au Kubernetes_Cluster.
7. THE CD_Resource SHALL afficher un message de confirmation avec le nom du service et le tag déployé en fin de pipeline.

---

### Requirement 5 : Qualité du code avec SonarQube

**User Story :** En tant que responsable qualité, je veux mesurer et suivre la qualité du code des microservices, afin d'identifier les problèmes et de valider les améliorations après refactoring.

#### Critères d'acceptation

1. THE CI_Incident SHALL exécuter une analyse SonarQube pour le microservice Incident_Management après l'exécution des tests.
2. THE CI_Resource SHALL exécuter une analyse SonarQube pour le microservice Resource_Optimization après l'exécution des tests.
3. THE SonarQube SHALL recevoir les rapports de couverture LCOV générés par Jest pour calculer la couverture de tests.
4. WHEN une analyse SonarQube est exécutée, THE SonarQube SHALL afficher les métriques de qualité : couverture de tests, duplications, code smells, bugs et vulnérabilités.
5. WHERE un Quality_Gate est configuré, THE CI_Incident SHALL échouer si le Quality_Gate SonarQube n'est pas atteint.
6. WHERE un Quality_Gate est configuré, THE CI_Resource SHALL échouer si le Quality_Gate SonarQube n'est pas atteint.
7. THE SonarQube SHALL permettre de comparer l'état du code avant et après refactoring via l'historique des analyses.
8. WHEN un fichier `sonar-project.properties` est présent dans un microservice, THE SonarQube SHALL utiliser sa configuration pour l'analyse de ce microservice.

---

### Requirement 6 : Infrastructure Kubernetes

**User Story :** En tant qu'équipe DevOps, je veux déployer tous les microservices sur un cluster Kubernetes partagé, afin d'assurer une architecture distribuée et reproductible pour tous les membres du groupe.

#### Critères d'acceptation

1. THE Kubernetes_Cluster SHALL être déployé avec kubeadm sur un environnement de virtualisation partagé par tous les membres du groupe.
2. THE Kubernetes_Cluster SHALL contenir un Namespace dédié à l'application SmartSite.
3. THE Kubernetes_Cluster SHALL déployer chaque microservice backend sous forme de Deployment Kubernetes avec au minimum 1 réplique.
4. THE Kubernetes_Cluster SHALL exposer chaque microservice via un Service Kubernetes de type `ClusterIP` ou `NodePort`.
5. THE Kubernetes_Cluster SHALL stocker les variables d'environnement sensibles (URI MongoDB, clés JWT, clés API) dans des Secrets Kubernetes.
6. THE Kubernetes_Cluster SHALL stocker les variables d'environnement non sensibles dans des ConfigMaps Kubernetes.
7. WHEN un nouveau déploiement est effectué via le CD_Incident ou CD_Resource, THE Kubernetes_Cluster SHALL effectuer un rolling update sans interruption de service.
8. IF un Pod redémarre plus de 3 fois en moins de 5 minutes, THEN THE Kubernetes_Cluster SHALL déclencher une alerte via AlertManager.

---

### Requirement 7 : Monitoring des applications et des outils DevOps

**User Story :** En tant qu'opérateur, je veux surveiller en temps réel l'état des applications et des outils DevOps, afin de détecter et résoudre rapidement les problèmes de performance ou de disponibilité.

#### Critères d'acceptation

1. THE Prometheus SHALL collecter les métriques des microservices NestJS backend (CPU, mémoire, latence HTTP, taux d'erreur) via un endpoint `/metrics` exposé par chaque service.
2. THE Prometheus SHALL collecter les métriques des outils DevOps : état des nœuds Kubernetes, utilisation des ressources du cluster.
3. THE Grafana SHALL afficher un tableau de bord dédié aux microservices backend avec les métriques de latence, taux d'erreur et utilisation des ressources.
4. THE Grafana SHALL afficher un tableau de bord dédié à l'état du cluster Kubernetes (nœuds, Pods, Deployments).
5. WHILE un microservice est en cours d'exécution, THE Prometheus SHALL scraper ses métriques toutes les 15 secondes.

---

### Requirement 8 : Système d'alerting

**User Story :** En tant qu'opérateur, je veux recevoir des alertes automatiques en cas d'anomalie, afin d'intervenir rapidement avant que les utilisateurs ne soient impactés.

#### Critères d'acceptation

1. THE AlertManager SHALL envoyer une alerte WHEN la disponibilité d'un microservice backend tombe en dessous de 95% sur une fenêtre de 5 minutes.
2. THE AlertManager SHALL envoyer une alerte WHEN l'utilisation CPU d'un Pod dépasse 80% pendant plus de 2 minutes.
3. THE AlertManager SHALL envoyer une alerte WHEN l'utilisation mémoire d'un Pod dépasse 85% pendant plus de 2 minutes.
4. THE AlertManager SHALL envoyer une alerte WHEN un Pod est en état `CrashLoopBackOff` ou `OOMKilled`.
5. THE AlertManager SHALL envoyer une alerte WHEN le taux d'erreur HTTP (codes 5xx) d'un microservice dépasse 5% sur une fenêtre de 5 minutes.
6. IF une alerte est déclenchée, THEN THE AlertManager SHALL notifier l'équipe via au moins un canal de notification configuré (email ou webhook Slack).
7. THE AlertManager SHALL regrouper les alertes similaires pour éviter les tempêtes d'alertes (alert grouping).

---

### Requirement 9 : Tests unitaires — Incident Management

**User Story :** En tant qu'étudiant responsable du module incident-management, je veux des tests unitaires couvrant les fonctionnalités principales du service, afin de valider le comportement du code et de satisfaire aux exigences d'évaluation.

#### Critères d'acceptation

1. THE Incident_Management SHALL disposer de tests unitaires Jest couvrant le service `IncidentsService` (méthodes `create`, `findAll`, `findOne`, `update`, `remove`).
2. THE Incident_Management SHALL disposer de tests unitaires Jest couvrant le contrôleur `IncidentsController`.
3. WHEN les tests Jest sont exécutés, THE Incident_Management SHALL atteindre une couverture de code d'au moins 60% sur les fichiers `src/**/*.ts`.
4. THE Incident_Management SHALL utiliser des mocks Jest pour simuler le modèle Mongoose `Model<IncidentDocument>` sans connexion réelle à MongoDB.
5. IF un identifiant invalide est fourni à `findOne` ou `remove`, THEN THE Incident_Management SHALL lever une `NotFoundException` vérifiable dans les tests.
6. THE Incident_Management SHALL configurer Jest pour être compatible avec le module TypeScript `nodenext` via `ts-jest` et `tsconfig.json`.

---

### Requirement 10 : Tests unitaires — Resource Optimization

**User Story :** En tant qu'étudiant responsable du module resource-optimization, je veux des tests unitaires couvrant les fonctionnalités principales du service, afin de valider le comportement du code et de satisfaire aux exigences d'évaluation.

#### Critères d'acceptation

1. THE Resource_Optimization SHALL disposer de tests unitaires Jest couvrant le service `RecommendationService` (méthodes `create`, `findAll`, `findOne`, `update`, `remove`, `getSummary`).
2. THE Resource_Optimization SHALL disposer de tests unitaires Jest couvrant le contrôleur de recommandations.
3. WHEN les tests Jest sont exécutés, THE Resource_Optimization SHALL atteindre une couverture de code d'au moins 60% sur les fichiers `src/**/*.ts`.
4. THE Resource_Optimization SHALL utiliser des mocks Jest pour simuler le modèle Mongoose `Model<Recommendation>` et le service `HttpService` sans appels réseau réels.
5. WHEN `getSummary` est appelé avec un `siteId` valide, THE Resource_Optimization SHALL retourner un objet contenant les champs `totalPotentialSavings`, `approvedSavings`, `realizedSavings` et `totalCO2Reduction`.
6. THE Resource_Optimization SHALL configurer Jest pour résoudre les path aliases `@/*` via `moduleNameMapper` dans la configuration Jest.
7. THE Resource_Optimization SHALL configurer Jest pour être compatible avec `ts-jest` et le `tsconfig.json` du module.

---

### Requirement 11 : Tests unitaires — Frontend

**User Story :** En tant que développeur frontend, je veux un framework de tests unitaires configuré pour l'application React/Vite, afin de valider les composants et d'intégrer la couverture dans SonarQube.

> **Note de scope** : Le frontend ne dispose pas de pipeline CI/CD dédié dans ce périmètre DevOps. Les tests unitaires frontend sont exécutés localement et leur couverture peut être transmise manuellement à SonarQube si nécessaire.

#### Critères d'acceptation

1. THE Frontend SHALL intégrer Vitest et React Testing Library comme framework de tests unitaires.
2. THE Frontend SHALL disposer d'au moins 3 tests unitaires couvrant des composants React représentatifs.
3. WHEN les tests Vitest sont exécutés avec `--run`, THE Frontend SHALL générer un rapport de couverture au format LCOV dans le répertoire `coverage/`.
4. THE Frontend SHALL configurer Vitest dans `vite.config.ts` avec l'environnement `jsdom` pour simuler le DOM du navigateur.
5. IF un composant React lève une erreur de rendu, THEN THE Frontend SHALL capturer l'erreur dans le test et la signaler clairement.

---

### Requirement 12 : Dockerisation des microservices

**User Story :** En tant que DevOps, je veux que les microservices `incident-management` et `resource-optimization` soient conteneurisés avec Docker, afin de garantir la reproductibilité des déploiements sur Kubernetes.

#### Critères d'acceptation

1. THE Incident_Management SHALL disposer d'un `Dockerfile` multi-stage produisant une image de production optimisée.
2. THE Resource_Optimization SHALL disposer d'un `Dockerfile` multi-stage produisant une image de production optimisée.
3. WHEN une image Docker est construite, THE CD_Incident SHALL vérifier que l'image démarre correctement avant de la pousser vers le Docker_Registry.
4. WHEN une image Docker est construite, THE CD_Resource SHALL vérifier que l'image démarre correctement avant de la pousser vers le Docker_Registry.
5. THE Incident_Management SHALL résoudre les modules TypeScript `nodenext` correctement dans l'image Docker de production.
6. THE Resource_Optimization SHALL résoudre les path aliases `@/` correctement dans l'image Docker de production via `tsc-alias`.
