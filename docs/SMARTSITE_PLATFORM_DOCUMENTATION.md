# SmartSite Platform - Documentation Complète

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Microservices](#architecture-microservices)
3. [Microservice: Materials Service](#materials-service)
4. [Microservice: Gestion-Suppliers](#gestion-suppliers)
5. [Microservice: Gestion-Site](#gestion-site)
6. [Microservice: Resource-Optimization](#resource-optimization)
7. [Microservice: Gestion-Projects](#gestion-projects)
8. [Microservice: Gestion-Planing](#gestion-planing)
9. [Microservice: User-Authentication](#user-authentication)
10. [Microservice: Incident-Management](#incident-management)
11. [Microservice: Notification](#notification)
12. [Microservice: Paiement](#paiement)
13. [Microservice: Videocall](#videocall)
14. [Frontend Application](#frontend-application)
15. [Fonctionnalités IA/ML](#ia-ml)
16. [Guide d'Installation](#installation)

---

## Vue d'ensemble

**SmartSite Platform** est une plateforme complète de gestion de chantiers de construction utilisant une architecture microservices. Elle intègre la gestion des matériaux, des fournisseurs, des sites, l'optimisation des ressources avec IA, et bien plus.

### Technologies Utilisées
- **Backend**: NestJS (TypeScript), Node.js (Express)
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Base de données**: MongoDB (Mongoose ODM)
- **IA/ML**: TensorFlow.js, Groq API (LLaMA 3.3 70B), Google Generative AI
- **Authentification**: JWT (Passport), bcrypt
- **Paiement**: Stripe
- **Temps réel**: Kafka, WebSockets, Stream Chat
- **Visualisation**: Recharts, Leaflet/OpenStreetMap

---

## Architecture Microservices

```
smartsite-platform/
├── apps/
│   ├── backend/
│   │   ├── materials-service (Port 3000)
│   │   ├── gestion-suppliers (Port non spécifié)
│   │   ├── gestion-site (Port 3001)
│   │   ├── resource-optimization (Port 3007)
│   │   ├── gestion-projects (Port 3007*)
│   │   ├── gestion-planing (Port 3002)
│   │   ├── user-authentication (Port 3000*)
│   │   ├── incident-management (Port non spécifié)
│   │   ├── notification (Port 3004)
│   │   ├── paiement (Port non spécifié)
│   │   └── videocall (Port non spécifié)
│   └── frontend (Port 5173)
```

---

## Materials Service

**Port**: 3000 (déduit)
**Technologie**: NestJS, MongoDB, TensorFlow.js, Groq API

### Fonctionnalités
1. **Gestion complète des matériaux** (CRUD)
2. **Gestion des stocks** avec niveaux min/max/reorder
3. **Suivi des mouvements de stock** (entrées/sorties/ajustements)
4. **Prédictions de stock avec IA** (TensorFlow.js)
5. **Détection d'anomalies** de consommation
6. **Génération de QR codes** pour les matériaux
7. **Import/Export Excel/PDF**
8. **Suivi des commandes** et livraisons en temps réel
9. **Smart Score** pour évaluer la santé des sites
10. **Recommandations d'approvisionnement automatique**

### Entités

#### Material
| Propriété | Type | Description |
|-----------|------|-------------|
| name | string | Nom du matériau |
| code | string (unique) | Code unique |
| category | string | Catégorie |
| unit | string | Unité de mesure |
| quantity | number | Quantité en stock |
| minimumStock | number | Stock minimum |
| maximumStock | number | Stock maximum |
| reorderPoint | number | Point de commande |
| qualityGrade | number (0-1) | Qualité du matériau |
| location | string | Emplacement |
| manufacturer | string | Fabricant |
| expiryDate | Date | Date d'expiration |
| barcode | string | Code-barres |
| qrCode | string | QR code |
| preferredSuppliers | ObjectId[] | Fournisseurs préférés |
| siteId | ObjectId | Site associé |
| reservedQuantity | number | Quantité réservée |
| damagedQuantity | number | Quantité endommagée |
| status | enum | active/discontinued/obsolete |
| priceHistory | Record<string, number> | Historique des prix |
| specifications | Record<string, any> | Spécifications techniques |
| consumptionRate | number | Taux de consommation |
| consumptionScore | number | Score de consommation |
| stockHealthScore | number | Score santé stock |
| anomaliesScore | number | Score anomalies |
| siteHealthScore | number | Score santé site |

#### MaterialFlowLog
| Propriété | Type | Description |
|-----------|------|-------------|
| siteId | ObjectId | Site concerné |
| materialId | ObjectId | Matériau concerné |
| type | enum | IN/OUT/ADJUSTMENT/DAMAGE/RETURN/RESERVE |
| quantity | number | Quantité du mouvement |
| timestamp | Date | Date du mouvement |
| userId | string | Utilisateur ayant effectué |
| previousStock | number | Stock avant |
| newStock | number | Stock après |
| reason | string | Raison du mouvement |
| anomalyDetected | AnomalyType | Anomalie détectée |
| emailSent | boolean | Email d'alerte envoyé |

#### MaterialOrder
| Propriété | Type | Description |
|-----------|------|-------------|
| orderNumber | string | Numéro de commande |
| status | enum | pending/in_transit/delivered/delayed/cancelled |
| materialId | ObjectId | Matériau commandé |
| quantity | number | Quantité commandée |
| destinationSiteId | ObjectId | Site de destination |
| supplierId | ObjectId | Fournisseur |
| estimatedDurationMinutes | number | Durée estimée |
| currentPosition | object | Position GPS actuelle |
| progress | number | Progression (%) |
| paymentStatus | string | Statut du paiement |

### API Endpoints

#### Materials
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /materials | Liste avec filtres et pagination |
| GET | /materials/:id | Détails d'un matériau |
| POST | /materials | Créer un matériau |
| PUT | /materials/:id | Modifier un matériau |
| DELETE | /materials/:id | Supprimer un matériau |
| PUT | /materials/:id/stock | Mettre à jour le stock |
| POST | /materials/:id/reorder | Commander du stock |
| GET | /materials/alerts | Alertes de stock |
| GET | /materials/low-stock | Matériaux en stock bas |
| GET | /materials/with-sites | Matériaux avec infos sites |
| GET | /materials/expiring | Matériaux expirant |

#### IA/ML
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /materials/prediction/:id | Prédiction de stock (ML) |
| GET | /materials/prediction/all | Toutes les prédictions |
| POST | /materials/:id/upload-csv | Upload données historiques |
| POST | /materials/:id/train | Entraîner modèle ML |
| GET | /materials/:id/predict | Prédire le stock |
| GET | /materials/:id/model-info | Infos modèle |
| POST | /materials/:id/predict-advanced | Prédiction avancée |
| GET | /materials/auto-order/recommendations | Recommandations auto |

#### QR Code et Import/Export
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /materials/scan-qr | Scanner QR code |
| POST | /materials/:id/generate-qr | Générer QR code |
| POST | /materials/import/excel | Importer Excel |
| POST | /materials/export/excel | Exporter Excel |
| POST | /materials/export/pdf | Exporter PDF |

---

## Gestion-Suppliers

**Technologie**: NestJS, Groq API (LLaMA 3.3 70B)

### Fonctionnalités
1. **Assistant IA conversationnel** pour la gestion des fournisseurs
2. **Support de l'historique de conversation**

### Entités
Aucune entité définie dans ce microservice. La gestion des fournisseurs est gérée ailleurs dans la plateforme.

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /chat/message | Envoyer un message à l'assistant IA |

### IA/ML
- **Fournisseur**: Groq API
- **Modèle**: LLaMA 3.3 70B Versatile
- **Système**: Assistant pour la gestion des fournisseurs, articles et prix

---

## Gestion-Site

**Port**: 3001
**Technologie**: NestJS, MongoDB

### Fonctionnalités
1. **Gestion complète des chantiers** (CRUD)
2. **Gestion des équipes assignées**
3. **Suivi du budget et de la progression**
4. **Support de géolocalisation** (coordonnées GPS)
5. **Statistiques et rapports**
6. **Suppression douce** (soft delete)
7. **Filtrage et pagination avancés**

### Entités

#### Site
| Propriété | Type | Description |
|-----------|------|-------------|
| nom | string | Nom du site |
| adresse | string | Adresse |
| localisation | string | Localisation |
| budget | number | Budget alloué |
| description | string | Description |
| isActif | boolean | Site actif |
| status | enum | planning/in_progress/on_hold/completed |
| progress | number (0-100) | Progression |
| workStartDate | Date | Date début travaux |
| workEndDate | Date | Date fin travaux |
| projectId | string | ID du projet |
| clientName | string | Nom du client |
| coordinates | {lat, lng} | Coordonnées GPS |
| teams | ObjectId[] | Équipes assignées |
| teamIds | ObjectId[] | IDs des équipes |

#### Team
| Propriété | Type | Description |
|-----------|------|-------------|
| name | string | Nom de l'équipe |
| description | string | Description |
| members | ObjectId[] | Membres (Users) |
| manager | ObjectId | Manager de l'équipe |
| site | ObjectId | Site assigné |
| isActive | boolean | Équipe active |
| teamCode | string | Code d'équipe |

#### UserSimple
| Propriété | Type | Description |
|-----------|------|-------------|
| firstName | string | Prénom |
| lastName | string | Nom |
| cin | string (unique) | CIN (ID) |
| email | string | Email |
| phoneNumber | string | Téléphone |
| address | string | Adresse |
| role | ObjectId | Rôle |
| assignedSite | ObjectId | Site assigné |
| responsibilities | string | Responsabilités |

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /gestion-sites | Liste avec filtres |
| GET | /gestion-sites/statistics | Statistiques |
| GET | /gestion-sites/budget/total | Budget total |
| GET | /gestion-sites/active | Sites actifs |
| GET | /gestion-sites/:id | Détails d'un site |
| POST | /gestion-sites | Créer un site |
| PUT | /gestion-sites/:id | Modifier un site |
| DELETE | /gestion-sites/:id | Suppression définitive |
| DELETE | /gestion-sites/:id/soft | Suppression douce |
| POST | /gestion-sites/:id/restore | Restaurer un site |
| POST | /gestion-sites/:id/teams | Assigner une équipe |
| DELETE | /gestion-sites/:id/teams/:userId | Retirer une équipe |

---

## Resource-Optimization

**Port**: 3007
**Technologie**: NestJS, MongoDB, TensorFlow.js, Groq API

### Fonctionnalités
1. **Analyse intelligente des ressources** (énergie, main-d'œuvre, équipement)
2. **Génération de recommandations IA** pour l'optimisation
3. **Détection d'équipements inactifs** (<20% utilisation)
4. **Analyse de la consommation d'énergie**
5. **Calcul de l'empreinte carbone** (CO2)
6. **Tableau de bord avec métriques de performance**
7. **Système d'alertes automatiques**
8. **Rapports financiers et environnementaux**
9. **Suivi avant/après** des recommandations

### Entités

#### Worker
| Propriété | Type | Description |
|-----------|------|-------------|
| workerId | string | ID unique |
| siteId | string | Site assigné |
| name | string | Nom |
| role | enum | supervisor/engineer/operator/laborer/other |
| hoursWorked | number | Heures travaillées |
| costhourlyRate | number | Coût horaire (€) |
| assignedTasks | string[] | Tâches assignées |
| productivityScore | number (0-100) | Score de productivité |

#### Equipment
| Propriété | Type | Description |
|-----------|------|-------------|
| deviceName | string | Nom de l'équipement |
| siteId | string | Site assigné |
| type | enum | excavator/dozer/crane/compressor/generator/other |
| isActive | boolean | Équipement actif |
| hoursOperating | number | Heures de fonctionnement |
| fuelConsumption | number | Consommation carburant (litres) |
| maintenanceCost | number | Coût maintenance (€) |
| utilizationRate | number (%) | Taux d'utilisation |
| lastMaintenance | Date | Dernière maintenance |

#### Recommendation
| Propriété | Type | Description |
|-----------|------|-------------|
| siteId | string | Site concerné |
| type | enum | energy/workforce/equipment/scheduling/environmental |
| title | string | Titre |
| description | string | Description |
| status | enum | pending/approved/rejected/implemented |
| estimatedSavings | number | Économies estimées (€) |
| estimatedCO2Reduction | number | Réduction CO2 (kg) |
| priority | number (1-10) | Priorité |
| confidenceScore | number (0-100) | Score de confiance |

#### EnergyConsumption
| Propriété | Type | Description |
|-----------|------|-------------|
| siteId | string | Site concerné |
| dateLogged | Date | Date |
| electricity | number | Électricité (kWh) |
| fuelConsumption | number | Carburant (litres) |
| waterConsumption | number | Eau (m³) |
| wasteGenerated | number | Déchets (kg) |
| carbonEmissions | number | Émissions CO2 (kg) |

#### Alert
| Propriété | Type | Description |
|-----------|------|-------------|
| siteId | string | Site concerné |
| type | enum | high-waste/equipment-idle/energy-spike/budget-exceed/deadline-risk |
| severity | enum | low/medium/high/critical |
| title | string | Titre |
| message | string | Message |
| isRead | boolean | Lu |
| status | enum | pending/resolved/ignored |

### API Endpoints

#### Analyse des ressources
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/resource-analysis/idle-equipment/:siteId | Équipements inactifs |
| GET | /api/resource-analysis/energy-consumption/:siteId | Analyse énergie |
| GET | /api/resource-analysis/worker-productivity/:siteId | Productivité |
| GET | /api/resource-analysis/resource-costs/:siteId | Coûts |
| GET | /api/resource-analysis/full-analysis/:siteId | Analyse complète |

#### Recommandations
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/recommendations/generate/:siteId | Générer recommandations |
| GET | /api/recommendations | Lister recommandations |
| GET | /api/recommendations/site/:siteId | Par site |
| GET | /api/recommendations/site/:siteId/summary | Résumé économies |
| GET | /api/recommendations/site/:siteId/savings | Analytics |
| PUT | /api/recommendations/:id/status | Changer statut |

#### Alertes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/alerts/generate/:siteId | Générer alertes |
| GET | /api/alerts/:siteId | Toutes les alertes |
| GET | /api/alerts/unread/:siteId | Non lues |
| GET | /api/alerts/critical/:siteId | Critiques |
| PUT | /api/alerts/:id/read | Marquer lu |
| PUT | /api/alerts/:id/resolve | Résoudre |

#### Rapports
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/reports/performance/:siteId | Rapport performance |
| GET | /api/reports/environmental/:siteId | Rapport environnemental |
| GET | /api/reports/financial/:siteId | Rapport financier |
| GET | /api/reports/dashboard/:siteId | Dashboard |
| GET | /api/reports/export/:siteId | Exporter données |

---

## Gestion-Projects

**Port**: 3007* (partage avec resource-optimization*)
**Technologie**: NestJS, MongoDB, Groq API

### Fonctionnalités
1. **Gestion complète des projets** (CRUD)
2. **Filtrage et pagination avancés**
3. **Export PDF des projets**
4. **Intégration avec gestion-site** pour les données des sites
5. **Assistant IA conversationnel**

### Entités

#### Project
| Propriété | Type | Description |
|-----------|------|-------------|
| name | string | Nom du projet |
| description | string | Description |
| location | string | Localisation |
| status | enum | planning/in_progress/on_hold/completed/cancelled |
| priority | enum | low/medium/high/critical |
| startDate | Date | Date début |
| endDate | Date | Date fin |
| manager | ObjectId | Chef de projet |
| client | ObjectId | Client |
| budget | number | Budget |
| actualCost | number | Coût réel |
| sites | ObjectId[] | Sites associés |
| teamMembers | ObjectId[] | Membres de l'équipe |
| progress | number | Progression (%) |
| clientName | string | Nom du client |
| clientContact | string | Contact client |
| clientEmail | string | Email client |

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /projects | Liste avec filtres |
| GET | /projects/with-sites | Projets avec sites |
| GET | /projects/export-pdf | Export PDF |
| GET | /projects/:id | Détails projet |
| POST | /projects | Créer projet |
| PUT | /projects/:id | Modifier projet |
| DELETE | /projects/:id | Supprimer projet |
| POST | /chat/message | Assistant IA |

---

## Gestion-Planing

**Port**: 3002
**Technologie**: NestJS, MongoDB, Kafka, Groq API

### Fonctionnalités
1. **Gestion des tâches** (Kanban + Gantt)
2. **Gestion des jalons** (milestones)
3. **Étapes de tâches** (workflow Kanban)
4. **Diagrammes Gantt** pour la planification
5. **Tableau de bord** avec tâches urgentes
6. **Intégration Kafka** pour les notifications
7. **Assistant IA conversationnel**
8. **Gestion des dépendances** (sous-tâches)

### Entités

#### Task
| Propriété | Type | Description |
|-----------|------|-------------|
| title | string | Titre |
| description | string | Description |
| milestoneId | ObjectId | Jalon parent |
| assignedTeams | string[] | Équipes assignées |
| priority | enum | LOW/MEDIUM/HIGH/CRITICAL |
| type | string | TASK/SUMMARY_TASK |
| projectId | string | Projet |
| siteId | string | Site |
| status | ObjectId | Étape (TaskStage) |
| progress | number (0-100) | Progression |
| startDate | Date | Date début |
| endDate | Date | Date fin |
| parent | ObjectId | Tâche parente |
| subtasks | ObjectId[] | Sous-tâches |

#### Milestone
| Propriété | Type | Description |
|-----------|------|-------------|
| title | string | Titre |
| tasks | ObjectId[] | Tâches associées |
| description | string | Description |
| projectId | string | Projet |
| siteId | string | Site |
| startDate | Date | Date début |
| endDate | Date | Date fin |

#### TaskStage (Kanban)
| Propriété | Type | Description |
|-----------|------|-------------|
| name | string | Nom de l'étape |
| description | string | Description |
| color | string | Couleur d'affichage |
| order | number | Ordre d'affichage |
| milestoneId | ObjectId | Jalon parent |
| tasks | ObjectId[] | Tâches dans cette étape |

### API Endpoints

#### Tâches
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /task | Toutes les tâches |
| POST | /task/milestone/:milestoneId/task-stage/:taskStageId | Créer tâche |
| PUT | /task/:taskId/task-stage/:colunId | Déplacer (Kanban) |
| GET | /task/my-tasks | Mes tâches |
| GET | /task/team/:teamId | Par équipe |
| GET | /task/milestone/:milestoneId | Par jalon (Kanban) |
| GET | /task/gantt/:projectId | Données Gantt |
| PUT | /task/:id/dates | Modifier dates |
| PUT | /task/:id | Modifier tâche |
| DELETE | /task/:id | Supprimer tâche |

#### Jalons
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /milestone | Tous les jalons |
| POST | /milestone/project/:projectId | Créer jalon |
| GET | /milestone/:id | Détails jalon |
| GET | /milestone/project/:projectId | Par projet |
| PATCH | /milestone/:id | Modifier |
| DELETE | /milestone/:id | Supprimer |

#### Étapes (Kanban)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /task-stage | Toutes les étapes |
| POST | /task-stage/milestone/:milestoneId | Créer étape |
| GET | /task-stage/milestone/:milestoneId | Par jalon |
| GET | /task-stage/milestone/:milestoneId/gantt | Gantt |
| PUT | /task-stage/:id | Modifier |
| DELETE | /task-stage/:id | Supprimer |

---

## User-Authentication

**Port**: 3000* (partage avec materials-service*)
**Technologie**: NestJS, MongoDB, JWT, bcrypt, Groq API

### Fonctionnalités
1. **Authentification JWT** complète
2. **Gestion des utilisateurs** (CRUD)
3. **Gestion des rôles et permissions** (RBAC)
4. **Gestion des équipes**
5. **Catalogue d'utilisateurs**
6. **Audit logs** (journaux d'audit)
7. **Chatbot IA**
8. **Emails automatiques**

### Entités Principales

#### User
| Propriété | Type | Description |
|-----------|------|-------------|
| firstName | string | Prénom |
| lastName | string | Nom |
| email | string (unique) | Email |
| password | string | Mot de passe (hashé) |
| cin | string | CIN (ID) |
| phoneNumber | string | Téléphone |
| address | string | Adresse |
| role | ObjectId | Rôle |
| isActive | boolean | Actif |
| assignedSite | ObjectId | Site assigné |

#### Role
| Propriété | Type | Description |
|-----------|------|-------------|
| name | string | Nom du rôle |
| permissions | string[] | Permissions |
| description | string | Description |

---

## Incident-Management

**Technologie**: NestJS, MongoDB, Groq API

### Fonctionnalités
1. **Gestion des incidents** (CRUD)
2. **Types d'incidents**: SAFETY/QUALITY/DELAY/OTHER
3. **Niveaux de sévérité**: LOW/MEDIUM/HIGH/CRITICAL
4. **Workflow de résolution**: OPEN → INVESTIGATING → RESOLVED → CLOSED
5. **Assignation à des utilisateurs**
6. **Assistant IA conversationnel**
7. **Upload d'images** pour les incidents

### Entités

#### Incident
| Propriété | Type | Description |
|-----------|------|-------------|
| type | enum | SAFETY/QUALITY/DELAY/OTHER |
| severity | enum | LOW/MEDIUM/HIGH/CRITICAL |
| title | string | Titre |
| description | string | Description |
| reporterName | string | Nom du rapporteur |
| reporterPhone | string | Téléphone |
| imageUrl | string | Image de l'incident |
| site | ObjectId | Site concerné |
| reportedBy | ObjectId | Signalé par |
| assignedTo | ObjectId | Assigné à |
| status | enum | OPEN/INVESTIGATING/RESOLVED/CLOSED |
| affectedPersons | string | Personnes affectées |
| immediateAction | string | Action immédiate |

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /incidents | Tous les incidents |
| GET | /incidents/:id | Détails incident |
| POST | /incidents | Créer incident |
| PUT | /incidents/:id | Modifier |
| DELETE | /incidents/:id | Supprimer |
| POST | /chat/message | Assistant IA |

---

## Notification

**Port**: 3004
**Technologie**: NestJS, MongoDB, Kafka, JWT, Groq API

### Fonctionnalités
1. **Gestion des notifications** (CRUD)
2. **Pagination et filtrage**
3. **Notifications par utilisateur/équipe**
4. **Marquage comme lu** (individuel ou en masse)
5. **Soft delete** (champ trash)
6. **Consommation d'événements Kafka** (task.created)
7. **Assistant IA conversationnel**

### Entités

#### Notification
| Propriété | Type | Description |
|-----------|------|-------------|
| title | string | Titre |
| message | string | Message |
| recipentId | string | ID destinataire |
| isRead | boolean | Lu |
| priority | enum | LOW/MEDIUM/HIGH |
| type | enum | INFO/WARNING/CRITICAL/SUCCESS |
| trash | boolean | Corbeille |
| qhseNotes | string | Notes QHSE |

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /notification | Toutes (paginé) |
| GET | /notification/user/:userId | Par utilisateur |
| GET | /notification/team/:teamId | Par équipe |
| GET | /notification/mynotifications | Mes notifications |
| GET | /notification/unread | Non lues |
| POST | /notification/team/:teamId/mark-all-read | Tout marquer lu |
| DELETE | /notification/:id | Supprimer |
| POST | /chat/message | Assistant IA |

---

## Paiement

**Technologie**: NestJS, MongoDB, Stripe, Groq API

### Fonctionnalités
1. **Gestion des paiements** (CRUD)
2. **Intégration Stripe** (paiements par carte)
3. **Génération de factures** (pdf)
4. **Méthodes**: cash/card/transfer/check
5. **Suivi du budget des sites**
6. **Assistant IA conversationnel**

### Entités

#### Payment
| Propriété | Type | Description |
|-----------|------|-------------|
| siteId | ObjectId | Site concerné |
| reference | string (unique) | Référence paiement |
| amount | number | Montant |
| paymentMethod | string | cash/card/transfer/check |
| description | string | Description |
| paymentDate | Date | Date paiement |
| status | enum | pending/completed/cancelled/refunded/paid |
| siteBudget | number | Budget du site |

#### Facture
| Propriété | Type | Description |
|-----------|------|-------------|
| numeroFacture | string (unique) | Numéro facture |
| paymentId | ObjectId | Paiement source |
| siteId | ObjectId | Site |
| siteNom | string | Nom du site |
| amount | number | Montant |
| paymentMethod | string | Méthode |
| pdfPath | string | Chemin PDF |

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /payments | Tous les paiements |
| POST | /payments | Créer paiement |
| POST | /payments/:id/stripe-payment | Paiement Stripe |
| GET | /invoices | Factures (paginé) |
| POST | /invoices/generate/:paymentId | Générer facture |
| GET | /chat/message | Assistant IA |

---

## Videocall

**Technologie**: Node.js, Express, MongoDB, Stream Chat API, JWT, bcrypt

### Fonctionnalités
1. **Authentification utilisateur** (signup/login/logout)
2. **Gestion du profil** (onboarding)
3. **Système d'amis** (demandes, acceptation)
4. **Génération de tokens Stream Chat**
5. **Synchronisation des utilisateurs** avec Stream Chat
6. **Avatars aléatoires** (avatar.iran.liara.run)

### Modèles

#### User (Stream-compatible)
| Propriété | Type | Description |
|-----------|------|-------------|
| fullName | string | Nom complet |
| email | string (unique) | Email |
| password | string | Mot de passe (hashé) |
| bio | string | Biographie |
| profilePic | string | Photo de profil |
| nativeLanguage | string | Langue maternelle |
| learningLanguage | string | Langue apprise |
| location | string | Localisation |
| isOnboarded | boolean | Onboarding fait |
| friends | ObjectId[] | Amis |

### API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/signup | Inscription |
| POST | /api/auth/login | Connexion |
| POST | /api/auth/logout | Déconnexion |
| POST | /api/auth/onboarding | Onboarding |
| GET | /api/users | Utilisateurs recommandés |
| GET | /api/users/friends | Mes amis |
| POST | /api/users/friend-request/:id | Demande d'ami |
| PUT | /api/users/friend-request/:id/accept | Accepter demande |
| GET | /api/chat/token | Token Stream Chat |

---

## Frontend Application

**Port**: 5173
**Technologie**: React 19, TypeScript, Tailwind CSS, Zustand, TanStack Query, Recharts

### Architecture

```
src/
├── app/
│   ├── pages/          # Pages principales (15+ modules)
│   │   ├── materials/      # Gestion matériaux + IA
│   │   ├── suppliers/      # Gestion fournisseurs + QHSE
│   │   ├── sites/          # Gestion sites + cartes
│   │   ├── projects/       # Gestion projets
│   │   ├── planning/       # Planification + Gantt/Kanban
│   │   ├── incidents/      # Gestion incidents
│   │   ├── payments/       # Paiements + Stripe
│   │   ├── users/          # Gestion utilisateurs
│   │   ├── notifications/  # Notifications
│   │   ├── dashboard/      # Tableaux de bord
│   │   └── ...
│   ├── features/        # Micro-frontends
│   │   └── resource-optimization/  # IA/ML dédié
│   ├── services/        # Couche API (Axios)
│   ├── store/           # State management (Zustand)
│   ├── components/      # Composants réutilisables
│   ├── hooks/           # Custom hooks
│   ├── types/           # Interfaces TypeScript
│   └── utils/           # Utilitaires
```

### Pages Principales

#### Materials (pages/materials/)
- **Materials.tsx**: Dashboard principal avec prédictions IA
- **MaterialMLTraining.tsx**: Entraînement modèles ML
- **MaterialAdvancedPrediction.tsx**: Prédictions avancées multi-facteurs
- **MaterialForecast.tsx**: Prévisions de consommation
- **MaterialAlerts.tsx**: Gestion des alertes
- **SmartScoreDashboard.tsx**: Scores de santé IA
- **AutoOrderDashboard.tsx**: Commandes automatiques

#### Resource Optimization (features/resource-optimization/)
- **ResourceOptimizationDashboard.tsx**: Hub principal IA
  - Métriques de performance (économies, CO2, ROI)
  - Moteur de recommandations (énergie, main-d'œuvre, équipement)
  - Système d'alertes temps réel
- **ResourceAnalysisPage.tsx**: Analyse approfondie
  - Détection équipements inactifs (<20%)
  - Analyse productivité travailleurs
  - Analyse coûts (équipement vs main-d'œuvre)
  - Impact environnemental (CO2, déchets)

#### Sites (pages/sites/)
- **Sites.tsx**: Gestion complète avec cartes (Leaflet)
- Géolocalisation en temps réel
- Assignation d'équipes
- Suivi budget et progression
- Export multi-format (PDF/CSV/Excel/JSON)

#### Planning (pages/planning/)
- **PlanningProjects.tsx**: Vue projets
- **ProjectMilestone.tsx**: Gestion jalons
- **MyTask.tsx**: Mes tâches (Kanban)
- Diagrammes Gantt interactifs

#### Incidents (pages/incidents/)
- **Incidents.tsx**: Gestion complète
- Génération descriptions IA
- Upload images/PDF
- Workflow de résolution
- Export PDF

### Services API (Axios)

| Service | Fonctionnalités |
|---------|-----------------|
| materialService.ts | CRUD, prédictions ML, QR codes, import/export |
| consumptionService.ts | Suivi consommation, détection anomalies |
| intelligentOrderService.ts | Recommandations auto, fournisseurs |
| siteService.ts | Gestion sites, équipes |
| projectService.ts | Gestion projets |
| taskService.ts | Gestion tâches, jalons |
| incidentService.ts | Gestion incidents |
| paymentService.ts | Paiements, factures |
| authService.ts | Authentification, profils |
| chatService.ts | Messagerie temps réel |

### State Management (Zustand)

| Store | Fonctionnalités |
|-------|-----------------|
| authStore.ts | JWT, utilisateur, permissions, rôles |
| themeStore.ts | 42+ thèmes (dark/light) |
| Permissions | RBAC (13 rôles) |

---

## IA/ML

### Fonctionnalités IA/ML par Microservice

#### Materials Service
1. **TensorFlow.js** - Prédictions de stock
   - Modèles de réseaux de neurones (2-5 entrées)
   - Entraînement: 50 époques
   - Prédictions: heures avant rupture, quantités recommandées
   - Statuts: safe (≥72h), warning (≥24h), critical (<24h)

2. **Smart Score** - Évaluation santé sites
   - Formule: 40% progression + 30% stock + 30% anomalies
   - Niveaux: excellent/good/average/poor/critical
   - Recommandations automatiques

3. **Détection d'anomalies** - Consommation
   - Ratio-based: >1.5x = surconsommation, <0.3x = problème
   - Types: VOL_POSSIBLE, CHANTIER_BLOQUE, NORMAL

4. **Recommandations intelligentes** - Commandes auto
   - Calcul stock sécurité (1.5x consommation)
   - Urgence: critical (<24h), warning (<48h)
   - Suggestions fournisseurs préférés

#### Resource-Optimization
1. **Analyse algorithmique** - Optimisation ressources
   - Répartition charge de travail (surcharge/décharge)
   - Prévision dépassement budget
   - Évaluation risques échéancier
   - Détection contraintes ressources

2. **Émissions CO2** - Calcul automatique
   - Électricité: 0.233 kg CO2/kWh
   - Carburant: 2.31 kg CO2/litre

3. **Assistant IA Groq** - LLaMA 3.3 70B
   - Recommandations énergie, main-d'œuvre, équipement
   - Analyse avant/après
   - Rapports financiers et environnementaux

#### Autres Microservices (Chat IA)
Tous les microservices suivants incluent un **assistant IA conversationnel** via Groq API:
- gestion-suppliers
- gestion-projects
- gestion-planing
- incident-management
- notification
- paiement

**Modèle commun**: LLaMA 3.3 70B Versatile
**Configuration**: 
- Temperature: 0.7
- Max tokens: 1024
- Système prompt personnalisé par service

---

## Installation

### Prérequis
- Node.js (v18+)
- MongoDB (v6+)
- Kafka (optionnel, pour les notifications)
- Compte Stripe (pour les paiements)
- Clé API Groq (pour l'IA)
- Compte Stream (pour la vidéo)

### Configuration des variables d'environnement

#### Materials Service (.env)
```
MONGODB_URI=mongodb://localhost:27017/smartsite
PORT=3000
JWT_SECRET=smartsite
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GESTION_SITES_URL=http://localhost:3001/api
```

#### Resource-Optimization (.env)
```
MONGODB_URI=mongodb://localhost:27017/smartsite
PORT=3007
GROQ_API_KEY=your_groq_api_key
GESTION_SITES_URL=http://localhost:3001/api
PLANNING_URL=http://localhost:3002/api
AUTH_URL=http://localhost:3000/api
```

#### Notification (.env)
```
MONGODB_URI=mongodb://localhost:27017/smartsite
PORT=3004
JWT_SECRET=smartsite
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-consumer
KAFKA_GROUP_ID=notification-group
```

### Démarrage

```bash
# Installer les dépendances
npm install

# Démarrer tous les microservices
npm run microservices:start

# Démarrer avec Kafka
npm run microservices:start:kafka

# Démarrer le frontend
cd apps/frontend
npm install
npm run dev
```

### Accès
- **Frontend**: http://localhost:5173
- **Materials API**: http://localhost:3000
- **Gestion-Site API**: http://localhost:3001
- **Planning API**: http://localhost:3002
- **Notification API**: http://localhost:3004
- **Resource Optimization API**: http://localhost:3007

---

## Résumé des Fonctionnalités par Module

| Module | CRUD | IA/ML | Temps Réel | Export | Upload |
|--------|------|-------|-----------|--------|--------|
| Materials | ✅ | ✅ TensorFlow | ✅ WebSocket | ✅ Excel/PDF | ✅ QR/Excel |
| Gestion-Suppliers | ❌* | ✅ Groq Chat | ❌ | ❌ | ❌ |
| Gestion-Site | ✅ | ❌ | ❌ | ✅ PDF/CSV/Excel | ❌ |
| Resource-Optimization | ✅ | ✅ Algorithmic + Groq | ✅ | ✅ JSON/CSV | ❌ |
| Gestion-Projects | ✅ | ✅ Groq Chat | ❌ | ✅ PDF | ❌ |
| Gestion-Planing | ✅ | ✅ Groq Chat | ✅ Kafka/WebSocket | ❌ | ❌ |
| User-Authentication | ✅ | ✅ Groq Chat | ❌ | ❌ | ❌ |
| Incident-Management | ✅ | ✅ Groq Chat | ❌ | ✅ PDF | ✅ Images |
| Notification | ✅ | ✅ Groq Chat | ✅ Kafka | ❌ | ❌ |
| Paiement | ✅ | ✅ Groq Chat | ❌ | ✅ PDF | ❌ |
| Videocall | ✅ | ❌ | ✅ Stream Chat | ❌ | ✅ Avatar |

*La gestion des fournisseurs est gérée ailleurs dans la plateforme.

---

## Conclusion

SmartSite Platform est une solution complète et moderne qui intègre:
- ✅ **11 microservices backend** avec des responsabilités claires
- ✅ **Frontend React moderne** avec 15+ modules fonctionnels
- ✅ **IA/ML avancée** (TensorFlow.js, Groq LLaMA 3.3 70B)
- ✅ **Temps réel** (Kafka, WebSockets, Stream Chat)
- ✅ **Gestion complète** (matériaux, sites, projets, planning, incidents, paiements)
- ✅ **Optimisation des ressources** avec analyse d'impact environnemental
- ✅ **Sécurité** (JWT, RBAC avec 13 rôles)
- ✅ **Intégrations externes** (Stripe, Stream, Groq)
