# Product Backlog GitHub - SmartSite Platform

Ce backlog regroupe les sujets prioritaires pour les microservices `incident-management`, `resource-optimization`, le front associé, les logs, les approbations en attente, et le dashboard BI.

## Priorité globale

1. Incidents microservice + front
2. Resource Optimization + workflow d'approbation + logs
3. Dashboard BI / Power BI

## Épic 1 - Incident Management

### US-INC-01 - Créer un incident depuis le front
Description: En tant qu'utilisateur QHSE, je veux créer un incident depuis l'interface afin de tracer rapidement un événement.
Critères d'acceptation:
- Un formulaire permet de saisir type, description, sévérité, statut et site lié.
- L'incident est persisté via l'API `POST /incidents`.
- Un message de confirmation s'affiche après création.
- Les erreurs API sont affichées clairement.

Labels GitHub suggérés: `backend`, `frontend`, `incident-management`, `qhse`, `priority-high`

### US-INC-02 - Lister et filtrer les incidents
Description: En tant qu'utilisateur, je veux voir la liste des incidents avec filtres pour prioriser le traitement.
Critères d'acceptation:
- La page affiche la liste des incidents.
- Filtres par sévérité, statut, type et date sont disponibles.
- La pagination ou le chargement progressif est géré.
- L'état de chargement et l'état vide sont visibles.

Labels GitHub suggérés: `frontend`, `incident-management`, `ui`, `priority-high`

### US-INC-03 - Consulter le détail d'un incident
Description: En tant qu'utilisateur, je veux ouvrir le détail d'un incident pour voir son historique et son statut.
Critères d'acceptation:
- La fiche détail affiche les champs principaux.
- Le suivi des changements est visible si disponible.
- Un accès rapide aux actions de mise à jour est proposé.

Labels GitHub suggérés: `frontend`, `incident-management`, `priority-medium`

### US-INC-04 - Mettre à jour et clôturer un incident
Description: En tant qu'analyste ou responsable, je veux modifier le statut d'un incident pour suivre sa résolution.
Critères d'acceptation:
- Les statuts `open`, `investigating`, `resolved` sont gérés.
- La mise à jour appelle `PUT /incidents/:id`.
- La clôture conserve la date et l'utilisateur responsable.

Labels GitHub suggérés: `backend`, `frontend`, `incident-management`, `priority-high`

### US-INC-05 - Supprimer ou archiver un incident
Description: En tant qu'administrateur, je veux supprimer ou archiver un incident obsolète afin de garder une base propre.
Critères d'acceptation:
- Une action de suppression ou d'archivage est disponible selon le rôle.
- Une confirmation est demandée avant action destructive.
- Les listes se rafraîchissent après l'opération.

Labels GitHub suggérés: `backend`, `frontend`, `incident-management`, `admin`, `priority-medium`

## Épic 2 - Incident Frontend

### US-FRONT-INC-01 - Intégrer la page incidents au layout principal
Description: En tant qu'utilisateur connecté, je veux accéder aux incidents depuis la navigation du dashboard.
Critères d'acceptation:
- La route `incidents` est accessible depuis le menu.
- Les droits d'accès sont respectés.
- Le composant utilise les couleurs et statuts cohérents avec le reste du portail.

Labels GitHub suggérés: `frontend`, `routing`, `incident-management`, `priority-high`

### US-FRONT-INC-02 - Améliorer la recherche incident
Description: En tant qu'utilisateur, je veux rechercher un incident rapidement pour gagner du temps.
Critères d'acceptation:
- Recherche par mot-clé, sévérité, statut ou site.
- Résultats mis à jour en temps réel ou au submit.
- Aucun résultat affiche un état vide utile.

Labels GitHub suggérés: `frontend`, `ux`, `incident-management`, `priority-medium`

### US-FRONT-INC-03 - Afficher les indicateurs incidents dans le dashboard
Description: En tant que manager, je veux voir les KPIs incidents sur le dashboard pour suivre la situation.
Critères d'acceptation:
- Nombre d'incidents critiques, ouverts et résolus.
- Répartition par sévérité.
- Bloc incidents urgent visible en première vue.

Labels GitHub suggérés: `frontend`, `dashboard`, `incident-management`, `priority-high`

## Épic 3 - Resource Optimization

### US-RES-01 - Afficher les recommandations en attente d'approbation
Description: En tant que responsable, je veux voir les recommandations pending afin de valider les actions proposées.
Critères d'acceptation:
- Les recommandations au statut `pending` sont listées.
- Le compteur d'approbation en attente est visible.
- Chaque recommandation montre impact, gain estimé et priorité.

Labels GitHub suggérés: `backend`, `frontend`, `resource-optimization`, `approval-flow`, `priority-high`

### US-RES-02 - Approuver ou rejeter une recommandation
Description: En tant que manager, je veux approuver ou rejeter une recommandation pour faire avancer le workflow.
Critères d'acceptation:
- Une action approve/reject est disponible.
- Le statut change et est reflété dans le dashboard.
- L'action est tracée dans les logs d'audit.

Labels GitHub suggérés: `backend`, `frontend`, `resource-optimization`, `workflow`, `priority-high`

### US-RES-03 - Suivre l'historique des logs de recommandations
Description: En tant qu'administrateur, je veux consulter les logs pour comprendre les décisions et les erreurs.
Critères d'acceptation:
- Les logs d'approbation, implémentation et erreurs sont enregistrés.
- Une vue de consultation des logs existe côté front ou admin.
- Les filtres par type, date et niveau sont disponibles si l'écran existe.

Labels GitHub suggérés: `backend`, `frontend`, `logs`, `audit-trail`, `priority-medium`

### US-RES-04 - Gérer le backlog d'approbation
Description: En tant que manager, je veux surveiller le backlog d'approbation pour éviter l'accumulation de demandes bloquées.
Critères d'acceptation:
- Le dashboard affiche le nombre de recommandations en backlog.
- Un seuil d'alerte est défini pour les retards.
- Une vue permet de prioriser les approbations les plus critiques.

Labels GitHub suggérés: `resource-optimization`, `dashboard`, `approval-backlog`, `priority-high`

### US-RES-05 - Industrialiser les journaux applicatifs
Description: En tant qu'équipe technique, je veux des logs exploitables pour diagnostiquer les flux resource optimization.
Critères d'acceptation:
- Les logs sont structurés et corrélables par requête ou site.
- Les erreurs critiques sont centralisées.
- Les logs incluent les opérations d'analyse, génération et approbation.

Labels GitHub suggérés: `backend`, `observability`, `resource-optimization`, `priority-medium`

## Épic 4 - Dashboard BI / Power BI

### US-BI-01 - Consolider les métriques BI multi-microservices
Description: En tant que direction, je veux un tableau de bord unifié pour voir les KPI clés des sites, projets, incidents et ressources.
Critères d'acceptation:
- Les données des microservices sont agrégées dans un point d'entrée cohérent.
- Les métriques principales sont calculées de façon stable.
- Les valeurs manquantes ne cassent pas le dashboard.

Labels GitHub suggérés: `backend`, `bi`, `dashboard`, `priority-high`

### US-BI-02 - Ajouter les indicateurs d'approbation au dashboard BI
Description: En tant que manager, je veux voir les approbations en attente et leur impact dans le BI.
Critères d'acceptation:
- Le dashboard affiche pending approvals, backlog et taux d'approbation.
- Les prévisions simples sont visibles.
- Les chiffres se synchronisent avec le workflow resource optimization.

Labels GitHub suggérés: `bi`, `resource-optimization`, `dashboard`, `priority-high`

### US-BI-03 - Ajouter les alertes et incidents au BI
Description: En tant que responsable opérationnel, je veux voir les incidents critiques et les alertes dans la vue BI.
Critères d'acceptation:
- Les incidents critiques sont mis en avant.
- Les alertes actives et résolues sont distinguées.
- Les tableaux et graphiques restent lisibles sur desktop.

Labels GitHub suggérés: `bi`, `incident-management`, `dashboard`, `priority-high`

### US-BI-04 - Renforcer la fiabilité et le monitoring du dashboard
Description: En tant qu'équipe technique, je veux instrumenter le dashboard pour détecter les lenteurs et erreurs.
Critères d'acceptation:
- Les temps de réponse sont mesurables.
- Les erreurs de chargement sont loggées.
- Un comportement de repli existe si un service est indisponible.

Labels GitHub suggérés: `backend`, `observability`, `bi`, `priority-medium`

## Épic 5 - Qualité et livraison

### US-QUAL-01 - Ajouter des tests d'intégration sur les flux critiques
Description: En tant qu'équipe, je veux couvrir les flux incidents, approvals et BI pour réduire les régressions.
Critères d'acceptation:
- Les tests couvrent la création et consultation d'incident.
- Les tests couvrent l'approbation de recommandation.
- Les tests couvrent la récupération des données BI.

Labels GitHub suggérés: `testing`, `backend`, `frontend`, `priority-high`

### US-QUAL-02 - Vérifier les permissions sur les nouvelles vues
Description: En tant qu'administrateur, je veux que les nouvelles vues respectent les rôles et permissions.
Critères d'acceptation:
- L'accès aux écrans sensibles est limité par rôle.
- Les utilisateurs non autorisés sont redirigés ou bloqués.
- La matrice de permissions est documentée.

Labels GitHub suggérés: `security`, `frontend`, `auth`, `priority-medium`

## Proposition d'ordre de création GitHub

1. Créer les épiques `Incident Management`, `Resource Optimization`, `BI Dashboard`.
2. Créer les user stories `US-INC-01` à `US-INC-04`.
3. Créer les user stories `US-RES-01` à `US-RES-05`.
4. Créer les user stories `US-BI-01` à `US-BI-04`.
5. Ajouter les sujets qualité `US-QUAL-01` et `US-QUAL-02`.

## Notes de cadrage

- Le service incident expose déjà les opérations CRUD de base.
- Le dashboard frontend a déjà une route `incidents` et une route `resource-optimization`.
- Le service resource optimization inclut déjà le concept de `pending` pour les recommandations et des logs techniques côté backend.
- Le dashboard BI doit rester cohérent avec les données déjà agrégées par les services existants.