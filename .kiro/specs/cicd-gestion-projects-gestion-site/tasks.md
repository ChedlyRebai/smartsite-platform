# Plan d'implémentation : CI/CD pour gestion-projects et gestion-site

## Vue d'ensemble

Ce plan couvre la mise en place complète des pipelines CI/CD pour les microservices **gestion-projects** (port 3007) et **gestion-site** (port 3001). Les tâches sont organisées de façon incrémentale : configuration Docker, tests unitaires, puis workflows GitHub Actions.

## Tâches

- [x] 1. Créer les fichiers de configuration Docker pour les deux services
  - [x] 1.1 Créer le `Dockerfile` multi-stage pour `gestion-projects`
    - Créer `apps/backend/gestion-projects/Dockerfile` avec deux stages : `builder` (node:20-alpine, `npm ci`, `npm run build`) et `production` (node:20-alpine, dépendances de prod uniquement, copie de `dist/`)
    - Exposer le port 3007 via `EXPOSE 3007`, définir `ENV NODE_ENV=production` et `CMD ["node", "dist/main"]`
    - _Exigences : 6.1, 6.2, 6.3, 6.5_

  - [x] 1.2 Créer le `.dockerignore` pour `gestion-projects`
    - Créer `apps/backend/gestion-projects/.dockerignore` excluant : `node_modules`, `dist`, `.env`, `.env.*`, `.git`, `.gitignore`, `coverage`, `*.spec.ts`, `*.test.ts`, `README.md`
    - _Exigences : 6.6_

  - [x] 1.3 Créer le `Dockerfile` multi-stage pour `gestion-site`
    - Créer `apps/backend/gestion-site/Dockerfile` avec la même structure multi-stage que gestion-projects
    - Exposer le port 3001 via `EXPOSE 3001`, définir `ENV NODE_ENV=production` et `CMD ["node", "dist/main"]`
    - _Exigences : 6.1, 6.2, 6.4, 6.5_

  - [x] 1.4 Créer le `.dockerignore` pour `gestion-site`
    - Créer `apps/backend/gestion-site/.dockerignore` avec le même contenu que celui de gestion-projects
    - _Exigences : 6.6_

- [x] 2. Créer les fichiers de configuration SonarQube
  - [x] 2.1 Créer `sonar-project.properties` pour `gestion-projects`
    - Créer `apps/backend/gestion-projects/sonar-project.properties` avec `sonar.projectKey=smartsite-gestion-projects`, sources pointant vers `src`, exclusions des fichiers spec/test/node_modules/dist, et `sonar.javascript.lcov.reportPaths=coverage/lcov.info`
    - _Exigences : 2.6_

  - [x] 2.2 Créer `sonar-project.properties` pour `gestion-site`
    - Créer `apps/backend/gestion-site/sonar-project.properties` avec `sonar.projectKey=smartsite-gestion-site`, même structure que gestion-projects
    - _Exigences : 3.6_

- [x] 3. Configurer Jest et les dépendances de test pour `gestion-projects`
  - [x] 3.1 Ajouter la configuration Jest et les dépendances de test dans `package.json` de `gestion-projects`
    - Ajouter dans `devDependencies` : `@nestjs/testing`, `jest`, `ts-jest`, `@types/jest`
    - Ajouter la section `"jest"` dans `package.json` avec `moduleFileExtensions`, `rootDir: "src"`, `testRegex`, `transform`, `collectCoverageFrom` (excluant `*.module.ts` et `main.ts`), `coverageDirectory: "../coverage"`, `coverageThreshold` (60% lignes/fonctions/branches/instructions), `testEnvironment: "node"`
    - _Exigences : 7.6_

  - [x] 3.2 Ajouter `coverageThreshold` et les dépendances manquantes dans `package.json` de `gestion-site`
    - Ajouter `coverageThreshold` dans la section `"jest"` existante : 60% pour lignes, fonctions, branches et instructions
    - Vérifier la présence de `@nestjs/testing`, `jest`, `ts-jest`, `@types/jest` dans `devDependencies` (déjà présents — confirmer et compléter si nécessaire)
    - _Exigences : 8.5_

- [x] 4. Créer les tests unitaires pour `gestion-projects`
  - [x] 4.1 Créer `projects.service.spec.ts`
    - Créer `apps/backend/gestion-projects/src/projects/projects.service.spec.ts`
    - Configurer le `TestingModule` avec un mock de `ProjectModel` (méthodes : `find`, `findById`, `findByIdAndUpdate`, `findByIdAndDelete`, `save`, `countDocuments`)
    - Écrire les tests unitaires pour `findAll`, `findOne` (ID valide), `create`, `update` (ID valide), `remove` (ID valide)
    - _Exigences : 7.1, 7.2_

  - [ ]* 4.2 Écrire le test de propriété 1 : `create` retourne les champs obligatoires
    - **Propriété 1 : Création d'un projet retourne les champs obligatoires**
    - Utiliser `fast-check` avec `fc.record({ name: fc.string({ minLength: 1 }), status: fc.constantFrom(...), priority: fc.constantFrom(...) })` sur 100 itérations
    - Vérifier que le résultat contient `name`, `status` et `priority` avec les valeurs fournies
    - Annoter : `// Feature: cicd-gestion-projects-gestion-site, Property 1: create retourne les champs obligatoires`
    - **Valide : Exigences 7.2**

  - [x] 4.3 Ajouter les tests `findOne` et `remove` avec ID inexistant dans `projects.service.spec.ts`
    - Tester `findOne` avec un ID inexistant (mock retournant `null`) → doit lever `NotFoundException`
    - Tester `remove` avec un ID inexistant (mock retournant `null`) → doit lever `NotFoundException`
    - _Exigences : 7.3, 7.4_

  - [ ]* 4.4 Écrire le test de propriété 2 : `findOne` avec ID inexistant lève `NotFoundException`
    - **Propriété 2 : findOne avec ID inexistant lève NotFoundException**
    - Utiliser `fast-check` avec `fc.string({ minLength: 1 })` pour générer des IDs inexistants, mock retournant `null`
    - Vérifier que `ProjectsService.findOne()` lève systématiquement `NotFoundException`
    - Annoter : `// Feature: cicd-gestion-projects-gestion-site, Property 2: findOne avec ID inexistant lève NotFoundException`
    - **Valide : Exigences 7.3**

  - [ ]* 4.5 Écrire le test de propriété 3 : `remove` avec ID inexistant lève `NotFoundException`
    - **Propriété 3 : remove avec ID inexistant lève NotFoundException**
    - Utiliser `fast-check` avec `fc.string({ minLength: 1 })` pour générer des IDs inexistants, mock retournant `null`
    - Vérifier que `ProjectsService.remove()` lève systématiquement `NotFoundException`
    - Annoter : `// Feature: cicd-gestion-projects-gestion-site, Property 3: remove avec ID inexistant lève NotFoundException`
    - **Valide : Exigences 7.4**

  - [x] 4.6 Créer `projects.controller.spec.ts`
    - Créer `apps/backend/gestion-projects/src/projects/projects.controller.spec.ts`
    - Configurer le `TestingModule` avec un mock de `ProjectsService`
    - Écrire les tests pour les routes GET (findAll, findOne), POST (create), PUT (update), DELETE (remove) — vérifier que le contrôleur délègue correctement au service
    - _Exigences : 7.5_

- [ ] 5. Point de contrôle — Tests gestion-projects
  - S'assurer que tous les tests de `gestion-projects` passent et que la couverture atteint au moins 60%. Poser des questions si nécessaire.

- [x] 6. Créer les tests unitaires pour `gestion-site`
  - [x] 6.1 Créer `gestion-site.service.spec.ts`
    - Créer `apps/backend/gestion-site/src/gestion-site.service.spec.ts`
    - Configurer le `TestingModule` avec des mocks pour `SiteModel`, `UserSimpleModel` et `TeamModel`
    - Écrire les tests unitaires pour `create` (données valides), `findAll`, `findById` (ID valide), `update` (ID valide), `remove` (ID valide)
    - _Exigences : 8.1, 8.2_

  - [ ]* 6.2 Écrire le test de propriété 4 : `create` retourne les champs attendus
    - **Propriété 4 : Création d'un site retourne les champs attendus**
    - Utiliser `fast-check` avec `fc.record({ nom: fc.string({ minLength: 1 }), adresse: fc.string({ minLength: 1 }), localisation: fc.string({ minLength: 1 }), budget: fc.float({ min: 0 }) })` sur 100 itérations
    - Vérifier que le résultat contient `nom`, `adresse`, `localisation`, `budget`, `status` (défaut: `planning`) et `isActif` (défaut: `true`)
    - Annoter : `// Feature: cicd-gestion-projects-gestion-site, Property 4: create retourne les champs attendus`
    - **Valide : Exigences 8.2**

  - [x] 6.3 Ajouter le test `findById` avec ID inexistant dans `gestion-site.service.spec.ts`
    - Tester `findById` avec un ID inexistant (mock retournant `null`) → doit lever `NotFoundException`
    - _Exigences : 8.3_

  - [ ]* 6.4 Écrire le test de propriété 5 : `findById` avec ID inexistant lève `NotFoundException`
    - **Propriété 5 : findById avec ID inexistant lève NotFoundException**
    - Utiliser `fast-check` avec `fc.string({ minLength: 1 })` pour générer des IDs inexistants, mock retournant `null`
    - Vérifier que `GestionSiteService.findById()` lève systématiquement `NotFoundException`
    - Annoter : `// Feature: cicd-gestion-projects-gestion-site, Property 5: findById avec ID inexistant lève NotFoundException`
    - **Valide : Exigences 8.3**

  - [x] 6.5 Créer `gestion-site.controller.spec.ts`
    - Créer `apps/backend/gestion-site/src/gestion-site.controller.spec.ts`
    - Configurer le `TestingModule` avec un mock de `GestionSiteService`
    - Écrire les tests pour les routes principales du contrôleur — vérifier que chaque route délègue correctement au service
    - _Exigences : 8.4_

- [ ] 7. Point de contrôle — Tests gestion-site
  - S'assurer que tous les tests de `gestion-site` passent et que la couverture atteint au moins 60%. Poser des questions si nécessaire.

- [x] 8. Créer les workflows GitHub Actions CI
  - [x] 8.1 Créer le workflow CI pour `gestion-projects`
    - Créer `.github/workflows/ci-gestion-projects.yml`
    - Déclenchement sur push et pull_request vers `main` et `develop` avec `paths: ['apps/backend/gestion-projects/**']`
    - Job `ci` sur `ubuntu-latest` avec `working-directory: apps/backend/gestion-projects`
    - Étapes : `actions/checkout@v4`, `actions/setup-node@v4` (node 20, cache npm), `npm ci`, `npm test -- --coverage --coverageReporters=lcov`, `npm run build`, `SonarSource/sonarqube-scan-action@v5`
    - _Exigences : 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 8.2 Créer le workflow CI pour `gestion-site`
    - Créer `.github/workflows/ci-gestion-site.yml`
    - Déclenchement sur push et pull_request vers `main` et `develop` avec `paths: ['apps/backend/gestion-site/**']`
    - Même structure que le CI de gestion-projects, avec `working-directory: apps/backend/gestion-site`
    - _Exigences : 1.2, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 9. Créer les workflows GitHub Actions CD
  - [x] 9.1 Créer le workflow CD pour `gestion-projects`
    - Créer `.github/workflows/cd-gestion-projects.yml`
    - Déclenchement via `workflow_run` sur `"CI gestion-projects"` (types: [completed], branches: [main])
    - Condition `if: ${{ github.event.workflow_run.conclusion == 'success' }}`
    - Étapes : `actions/checkout@v4`, `docker/login-action@v3` (secrets `DOCKER_USERNAME`/`DOCKER_PASSWORD`), `docker/build-push-action@v5` (context: `apps/backend/gestion-projects`, tags: `latest` + SHA), déploiement Docker avec port 3007, `PORT=3007` et `MONGODB_URI`
    - _Exigences : 1.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.2, 9.3_

  - [x] 9.2 Créer le workflow CD pour `gestion-site`
    - Créer `.github/workflows/cd-gestion-site.yml`
    - Déclenchement via `workflow_run` sur `"CI gestion-site"` (types: [completed], branches: [main])
    - Même structure que le CD de gestion-projects, avec port 3001, `PORT=3001` et `MONGODB_URI`
    - _Exigences : 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 9.2, 9.4_

- [x] 10. Documenter les secrets GitHub à configurer
  - Créer ou mettre à jour un fichier `SECRETS.md` (ou section dans le README) listant les 5 secrets GitHub requis avec leur description, le pipeline qui les utilise et les instructions de configuration
  - Secrets à documenter : `SONAR_TOKEN`, `SONAR_HOST_URL`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `MONGODB_URI`
  - _Exigences : 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Point de contrôle final — Vérification complète
  - S'assurer que tous les fichiers créés sont syntaxiquement corrects (YAML valide, JSON valide, TypeScript compilable)
  - Vérifier que les chemins référencés dans les workflows correspondent aux fichiers créés
  - Poser des questions si nécessaire.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les tests de propriétés utilisent `fast-check` (à ajouter dans les `devDependencies` des deux services)
- Les points de contrôle garantissent une validation incrémentale avant de passer aux workflows
- Les workflows CD utilisent `workflow_run` pour garantir que le déploiement ne se déclenche qu'après un CI réussi sur `main`
