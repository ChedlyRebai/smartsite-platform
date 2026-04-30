# Product Backlog - Power BI Dashboard SmartSite
## Backlog détaillé pour le tableau de bord centralisé (localhost:5173/power-bi/:siteId)

---

## Vue d'ensemble

Le Power BI Dashboard agrège les données en temps quasi-réel depuis les microservices:
- **incident-management** (Port 3003)
- **resource-optimization** (Port 3007)
- **gestion-site** (Port 3001)
- **gestion-planing** (Port 3002)

**Route frontend:** `/power-bi/:siteId` ou `/director/optimization`

---

## Épic 1 - Fondation Dashboard BI

### US-BI-CORE-01 - Créer l'infrastructure de base du dashboard
**Description:** En tant qu'ingénieur, je veux mettre en place la structure du dashboard pour accueillir les visualisations multi-données.

**Critères d'acceptation:**
- Un composant `PowerBiDashboard` est créé avec routage siteId.
- Le système de tabs (Aperçu, Incidents, Ressources, Budget, Performances) est en place.
- Les chargements de données (Promise.all) sont parallélisés.
- Les états de chargement et erreurs sont gérés.

**Labels:** `backend`, `frontend`, `bi`, `infrastructure`, `priority-high`

---

### US-BI-CORE-02 - Mettre en place l'API d'agrégation BI côté backend
**Description:** En tant que développeur backend, je veux exposer un endpoint unique pour récupérer toutes les métriques BI.

**Critères d'acceptation:**
- Route `GET /dashboard-data/:siteId` dans PowerBiController.
- Agrégation de recommandations, alertes, incidents et métriques.
- Calcul des KPIs: ROI, efficiency score, sustainability index.
- Réponse optimisée et cacheable.

**Endpoints connexes:**
```
GET /api/power-bi/dashboard-data/:siteId → Données complètes
GET /api/power-bi/recommendations-stream/:siteId → Stream recommandations
GET /api/power-bi/alerts-stream/:siteId → Stream alertes
GET /api/power-bi/performance-metrics/:siteId?period=7days → Métriques
```

**Labels:** `backend`, `bi`, `api`, `aggregation`, `priority-high`

---

## Épic 2 - Onglet Aperçu (Overview)

### US-BI-OVER-01 - Créer le tableau de synthèse principal
**Description:** En tant que directeur, je veux voir d'un coup d'œil l'état global du site.

**Critères d'acceptation:**
- Cartes KPI: Sites actifs, Projets en cours, Incidents critiques, Recommandations en attente.
- Mise à jour en temps réel ou par rafraîchissement manuel.
- Code couleur: vert (OK), orange (warning), rouge (critique).
- Responsive design pour desktop et tablette.

**Métriques affichées:**
- Total sites / sites actifs
- Total projets / projets actifs
- Incidents critiques / ouverts / résolus
- Recommandations: pending / approved / implemented
- Économies réalisées (€)
- CO₂ réduit (kg)

**Labels:** `frontend`, `bi`, `ui`, `kpi`, `priority-high`

---

### US-BI-OVER-02 - Ajouter des graphiques de tendance
**Description:** En tant qu'analyste, je veux visualiser les tendances sur 30, 7, ou 1 jour.

**Critères d'acceptation:**
- Sélecteur de période (24h / 7 jours / 30 jours).
- Courbes pour: recommandations créées/approuvées, incidents, alertes.
- Libraire Recharts pour les graphiques.
- Légende et tooltips interactifs.

**Labels:** `frontend`, `bi`, `charts`, `analytics`, `priority-high`

---

## Épic 3 - Onglet Incidents

### US-BI-INC-01 - Tableau de distribution des incidents
**Description:** En tant que responsable sécurité, je veux analyser les incidents par type et sévérité.

**Critères d'acceptation:**
- Graphique en barres: incidents par sévérité (critical, high, medium, low).
- Graphique en secteurs: incidents par type.
- Filtres par statut (open, investigating, resolved).
- Nombre total et statistiques.

**Labels:** `frontend`, `bi`, `incidents`, `visualization`, `priority-high`

---

### US-BI-INC-02 - Lister les incidents critiques et récents
**Description:** En tant qu'utilisateur, je veux accéder rapidement aux incidents actifs.

**Critères d'acceptation:**
- Tableau avec colonnes: ID, Type, Sévérité, Statut, Date création, Assigné.
- Tri par sévérité décroissante par défaut.
- Hyperliens vers le détail (routes déjà existantes).
- Pagination ou scroll infini (max 20 affichés).

**Labels:** `frontend`, `bi`, `incidents`, `listing`, `priority-high`

---

### US-BI-INC-03 - Chronologie des incidents
**Description:** En tant qu'analyste, je veux voir l'évolution des incidents sur le temps.

**Critères d'acceptation:**
- Timeline ou heatmap: incidents par jour.
- Filtre par sévérité et statut.
- Infobulle au survol.

**Labels:** `frontend`, `bi`, `visualization`, `priority-medium`

---

## Épic 4 - Onglet Resource Optimization

### US-BI-RES-01 - Dashboard des recommandations en attente
**Description:** En tant que manager, je veux voir les approbations qui demandent de l'action.

**Critères d'acceptation:**
- Compteur large: Pending approvals (en couleur rouge si > 5).
- Graphique en anneau: répartition par type (énergie, équipement, travailleurs, planification, environnement).
- Tableau détail: top 10 recommandations pending avec gain estimé et score de confiance.

**Labels:** `frontend`, `bi`, `resource-optimization`, `approval-flow`, `priority-high`

---

### US-BI-RES-02 - Tracking des économies réalisées
**Description:** En tant que directeur financier, je veux voir l'impact financier des recommandations implémentées.

**Critères d'acceptation:**
- KPI principal: Économies cumulées (€).
- Graphique de progression: savings over time (cumulatif).
- Ventilation par type de recommandation.
- Comparaison budget prévu vs réalisé.

**Labels:** `frontend`, `bi`, `budget`, `roi`, `priority-high`

---

### US-BI-RES-03 - Indicateurs écologiques
**Description:** En tant que responsable RSE, je veux suivre l'impact environnemental.

**Critères d'acceptation:**
- CO₂ réduit (kg / tonnes).
- Énergie économisée (kWh).
- Eau économisée (m³).
- Déchet réduit (kg).
- Tendance mensuelle pour chaque métrique.

**Labels:** `frontend`, `bi`, `sustainability`, `eco`, `priority-high`

---

### US-BI-RES-04 - Heatmap d'efficacité par ressource
**Description:** En tant qu'analyste, je veux identifier les goulots d'étranglement.

**Critères d'acceptation:**
- Matrice: équipements × semaines avec taux d'utilisation.
- Dégradé de couleur: rouge (faible), vert (optimal).
- Drill-down possible vers le détail d'équipement.

**Labels:** `frontend`, `bi`, `visualization`, `analysis`, `priority-medium`

---

## Épic 5 - Onglet Budget et ROI

### US-BI-BUDGET-01 - Présentation budgétaire par catégorie
**Description:** En tant que contrôleur budgétaire, je veux voir la ventilation des dépenses.

**Critères d'acceptation:**
- Camembert: répartition budgétaire (équipement 40%, travailleurs 60%).
- Tableau détail avec budget alloué, dépensé, écarts.
- Variance % en rouge/vert selon performance.

**Labels:** `frontend`, `bi`, `budget`, `finance`, `priority-high`

---

### US-BI-BUDGET-02 - Calcul et affichage du ROI
**Description:** En tant que directeur, je veux connaître le retour sur investissement global.

**Critères d'acceptation:**
- Formule ROI = (Réalisé Savings / Total Resources Cost) × 100.
- Affichage en pourcentage et en courbe mensuelle.
- Benchmark avec objectif cible (ex: 25% min).
- Statut indicateur: ✓ (> cible), ≈ (dans cible ±5%), ✗ (< cible).

**Labels:** `backend`, `frontend`, `bi`, `roi`, `priority-high`

---

### US-BI-BUDGET-03 - Prévisions budgétaires
**Description:** En tant que planificateur, je veux estimer les économies futures.

**Critères d'acceptation:**
- Moyenne économies 7 derniers jours × 30 = projection 30 jours.
- Courbe de tendance (hausse / baisse).
- Intervalle de confiance (± 15%).

**Labels:** `backend`, `bi`, `forecasting`, `priority-medium`

---

## Épic 6 - Onglet Performances

### US-BI-PERF-01 - Scorecard KPI consolidé
**Description:** En tant qu'exécutif, je veux voir les scores de performance clés.

**Critères d'acceptation:**
- Efficiency Score = (Implémentées / Totales) × 100 %
- Sustainability Index = (CO₂ Réduit / Émissions Actuelles) × 100 %
- Budget Variance = différence vs plan
- Response Time to Incidents = heures moyennes
- Tous les scores en gauge ou speedometer.

**Labels:** `frontend`, `bi`, `kpi`, `scorecard`, `priority-high`

---

### US-BI-PERF-02 - Analyse d'alertes par type et sévérité
**Description:** En tant qu'opérateur, je veux analyser les alertes générées.

**Critères d'acceptation:**
- Graphique en barres: alertes par type (équipement, énergie, force de travail, etc.).
- Filtrage par sévérité.
- Statut: Active / Résolue.
- Temps moyen de résolution.

**Labels:** `frontend`, `bi`, `alerts`, `monitoring`, `priority-high`

---

### US-BI-PERF-03 - Rapport d'anomalies et risks
**Description:** En tant qu'analyste risque, je veux identifier les situations anormales.

**Critères d'acceptation:**
- Liste des risques prédits: `approval_backlog`, `low_roi`, `equipment_investment`.
- Probabilité et impact pour chacun.
- Recommandations d'actions.

**Labels:** `backend`, `frontend`, `bi`, `risk`, `predictive`, `priority-medium`

---

## Épic 7 - Interactivité et Filtrage

### US-BI-FILT-01 - Filtres globaux par site et période
**Description:** En tant qu'utilisateur, je veux restreindre les données affichées.

**Critères d'acceptation:**
- Sélecteur de site (liste multi ou single).
- Sélecteur de période (24h, 7j, 30j, custom date range).
- Bouton Appliquer et Réinitialiser.
- Les filtres persistent dans l'URL (query params).

**Labels:** `frontend`, `bi`, `filtering`, `ux`, `priority-high`

---

### US-BI-FILT-02 - Drill-down vers le détail
**Description:** En tant qu'utilisateur avancé, je veux explorer les données en détail.

**Critères d'acceptation:**
- Clic sur une barre de graphique → liste filtrée d'incidents / recommandations.
- Clic sur une ligne de tableau → modal ou route dédiée pour le détail.
- Breadcrumb pour naviguer en arrière.

**Labels:** `frontend`, `bi`, `navigation`, `priority-medium`

---

### US-BI-FILT-03 - Export des données BI
**Description:** En tant qu'utilisateur, je veux télécharger les données pour analyse locale.

**Critères d'acceptation:**
- Bouton Export CSV ou Excel.
- Inclure les métriques, graphiques sources de données.
- Formatage lisible: entêtes clairs, dates ISO.

**Labels:** `frontend`, `bi`, `export`, `priority-medium`

---

## Épic 8 - Fiabilité et Performance

### US-BI-REL-01 - Gestion des erreurs et fallback
**Description:** En tant que développeur, je veux que le dashboard reste fonctionnel même si un microservice est down.

**Critères d'acceptation:**
- Si resource-optimization n'est pas disponible → afficher message "Données indisponibles" mais les autres onglets restent actifs.
- Si incident-management est down → Onglet Incidents grisé.
- Spinner de chargement pendant le fetch.
- Messages d'erreur clairs (ex: "Impossible de récupérer les données incidents").

**Labels:** `backend`, `frontend`, `reliability`, `priority-high`

---

### US-BI-REL-02 - Optimisation des performances du dashboard
**Description:** En tant qu'utilisateur, je veux que le dashboard charge rapidement.

**Critères d'acceptation:**
- Temps de chargement initial < 3 sec.
- Temps d'actualisation < 2 sec.
- Lazy loading des onglets non actifs.
- TanStack Query pour caching et memoization.
- Websockets optionnels pour le temps réel.

**Labels:** `frontend`, `performance`, `optimization`, `priority-high`

---

### US-BI-REL-03 - Logs et monitoring du dashboard
**Description:** En tant qu'administrateur, je veux diagnostiquer les problèmes BI.

**Critères d'acceptation:**
- Logs des appels API (success/failure).
- Temps de réponse par endpoint tracé.
- Erreurs loggées avec stacktrace.
- Dashboard d'observabilité pour voir les tendances.

**Labels:** `backend`, `observability`, `monitoring`, `priority-medium`

---

## Épic 9 - Sécurité et Permissions

### US-BI-SEC-01 - Vérifier les permissions d'accès au BI
**Description:** En tant qu'administrateur, je veux que seuls les utilisateurs autorisés voient le BI.

**Critères d'acceptation:**
- Rôles autorisés: super_admin, director, manager.
- Utilisateurs autres rôles → accès refusé ou contenu limité.
- Validation côté front et backend.

**Labels:** `security`, `auth`, `permission`, `priority-high`

---

### US-BI-SEC-02 - Masquage des données sensibles
**Description:** En tant qu'utilisateur standard, je veux que seules mes données autorisées soient visibles.

**Critères d'acceptation:**
- Les employés ne voient que leur site / projet.
- Les managers voient leurs équipes.
- Super admin voit tout.
- Pas de fuite de données via les filtres URL.

**Labels:** `security`, `data-protection`, `priority-high`

---

## Épic 10 - Tests et Qualité

### US-BI-TEST-01 - Tests unitaires des calculs BI
**Description:** En tant que développeur, je veux garantir l'exactitude des KPIs.

**Critères d'acceptation:**
- Tests pour ROI, efficiency score, sustainability index.
- Tests avec données mock complètes et incomplètes.
- Couverture > 80%.

**Labels:** `testing`, `backend`, `unit-tests`, `priority-high`

---

### US-BI-TEST-02 - Tests d'intégration du dashboard
**Description:** En tant qu'équipe QA, je veux valider les flux complets.

**Critères d'acceptation:**
- Test: charger le dashboard → appels API → rendu.
- Test: appliquer filtres → données mises à jour.
- Test: export CSV → fichier valide.
- Couverture des cas d'erreur (500, timeout, etc.).

**Labels:** `testing`, `frontend`, `integration-tests`, `priority-high`

---

## Roadmap de Livraison

### Phase 1 (Sprint 1-2) - MVP Dashboard
- US-BI-CORE-01, US-BI-CORE-02
- US-BI-OVER-01, US-BI-OVER-02
- US-BI-FILT-01
- US-BI-REL-01, US-BI-SEC-01

### Phase 2 (Sprint 3-4) - Incidents & Resources
- US-BI-INC-01, US-BI-INC-02
- US-BI-RES-01, US-BI-RES-02, US-BI-RES-03
- US-BI-BUDGET-01, US-BI-BUDGET-02
- US-BI-FILT-02

### Phase 3 (Sprint 5-6) - Avancé & Optimisation
- US-BI-PERF-01, US-BI-PERF-02, US-BI-PERF-03
- US-BI-BUDGET-03
- US-BI-REL-02, US-BI-REL-03
- US-BI-TEST-01, US-BI-TEST-02

### Phase 4 (Sprint 7+) - Enhancements
- US-BI-INC-03, US-BI-RES-04
- US-BI-FILT-03
- US-BI-SEC-02

---

## Notes Techniques

### Endpoints Backend à Implémenter
```
GET /api/power-bi/dashboard-data/:siteId
GET /api/power-bi/recommendations-stream/:siteId?status=pending&limit=50
GET /api/power-bi/alerts-stream/:siteId?severity=critical&limit=20
GET /api/power-bi/performance-metrics/:siteId?period=30days
GET /api/power-bi/incidents-analysis/:siteId?period=7days
GET /api/power-bi/budget-report/:siteId
```

### Composants Frontend à Créer
```
/src/features/bi/pages/PowerBiDashboard.tsx (Route principale)
/src/features/bi/components/OverviewTab.tsx
/src/features/bi/components/IncidentsTab.tsx
/src/features/bi/components/ResourcesTab.tsx
/src/features/bi/components/BudgetTab.tsx
/src/features/bi/components/PerformancesTab.tsx
/src/features/bi/hooks/useBiDashboard.ts
/src/features/bi/hooks/useBiFilters.ts
/src/features/bi/types/bi.types.ts
```

### Dépendances Recommandées
- Recharts (visualisations)
- TanStack Query v5 (data fetching & caching)
- date-fns (manipulations de dates)
- axios (HTTP client)

---

## Critères d'Acceptation Globaux pour Phase 1

1. Dashboard accessible via `/power-bi/:siteId`.
2. Au moins 3 onglets fonctionnels (Aperçu, Incidents, Ressources).
3. Temps de chargement initial < 3 secondes.
4. Gestion élégante des erreurs API.
5. Tests d'intégration passent (> 80% couverture).
6. Permissions vérifiées et documentées.
7. Documentation README mise à jour.
