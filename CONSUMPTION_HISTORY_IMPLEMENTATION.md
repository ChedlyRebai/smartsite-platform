# 📊 Implémentation du système d'historique de consommation centralisé

## ✅ Ce qui a été créé

### 1. Schema MongoDB
- ✅ `consumption-history.entity.ts` - Schema complet avec tous les champs et index

### 2. Types TypeScript
- ✅ `consumption-history.types.ts` - Toutes les interfaces pour les retours de données

### 3. DTOs
- ✅ `create-consumption-history.dto.ts` - DTO pour créer une entrée
- ✅ `history-filters.dto.ts` - DTOs pour filtrage, statistiques et cleanup

### 4. Service
- ✅ `consumption-history.service.ts` - Service complet avec toutes les méthodes :
  - `syncFromExistingData()` - Migration des données existantes
  - `addEntry()` - Ajout d'une entrée
  - `getHistory()` - Récupération paginée avec filtres
  - `getStatistics()` - Statistiques pour graphiques
  - `getMaterialTrend()` - Tendance d'un matériau
  - `getById()` - Récupération par ID
  - `cleanup()` - Nettoyage des anciennes entrées

### 5. Controller
- ✅ `consumption-history.controller.ts` - Controller avec tous les endpoints

### 6. Module
- ✅ `materials.module.ts` - Modifié pour enregistrer le nouveau service et controller

---

## ⚠️ Ce qui reste à faire

### 1. Modifier `MaterialFlowService`

**Fichier** : `apps/backend/materials-service/src/materials/services/material-flow.service.ts`

**Modifications nécessaires** :

#### A. Ajouter l'injection dans le constructor

```typescript
import { ConsumptionHistoryService } from './consumption-history.service';
import { CreateConsumptionHistoryDto } from '../dto/create-consumption-history.dto';
import { FlowType as HistoryFlowType, SourceCollection } from '../entities/consumption-history.entity';

constructor(
  @InjectModel(MaterialFlowLog.name) private flowLogModel: Model<MaterialFlowLog>,
  @InjectModel(Material.name) private materialModel: Model<Material>,
  private readonly anomalyEmailService: AnomalyEmailService,
  private readonly historyService: ConsumptionHistoryService, // ← AJOUTER
) {}
```

#### B. Appeler `addEntry()` après la sauvegarde

Dans la méthode `recordMovement()`, après `const savedFlow = await flowLog.save();` (ligne ~90), ajouter :

```typescript
// 5. Sauvegarder le flux
const savedFlow = await flowLog.save();

// 🔥 NOUVEAU : Ajouter à l'historique centralisé
try {
  await this.historyService.addEntry({
    materialId: material._id.toString(),
    materialName: material.name,
    materialCode: material.code,
    materialCategory: material.category,
    materialUnit: material.unit,
    siteId: createFlowDto.siteId,
    siteName: undefined, // Sera enrichi par le service
    date: savedFlow.timestamp,
    quantity: createFlowDto.quantity,
    flowType: this.mapToHistoryFlowType(createFlowDto.type),
    expectedQuantity: 0,
    anomalyScore: 0,
    anomalyType: this.mapToHistoryAnomalyType(validation.anomalyType),
    anomalySeverity: this.calculateHistorySeverity(validation.anomalyType),
    stockBefore: previousStock,
    stockAfter: newStock,
    sourceCollection: SourceCollection.MATERIAL_FLOW_LOG,
    sourceId: savedFlow._id.toString(),
    recordedBy: userId,
    reason: createFlowDto.reason,
    reference: createFlowDto.reference,
    projectId: createFlowDto.projectId,
  });
} catch (error) {
  // Ne pas faire échouer l'opération principale
  this.logger.error(`⚠️ Erreur lors de l'ajout à l'historique: ${error.message}`);
}

// 6. Mettre à jour le stock du matériau
await this.updateMaterialStock(...);
```

#### C. Ajouter les méthodes de mapping

À la fin du fichier, avant la dernière accolade, ajouter :

```typescript
/**
 * Mapper le FlowType de MaterialFlowLog vers ConsumptionHistory
 */
private mapToHistoryFlowType(type: FlowType): HistoryFlowType {
  const mapping: Record<FlowType, HistoryFlowType> = {
    [FlowType.IN]: HistoryFlowType.IN,
    [FlowType.OUT]: HistoryFlowType.OUT,
    [FlowType.ADJUSTMENT]: HistoryFlowType.ADJUSTMENT,
    [FlowType.DAMAGE]: HistoryFlowType.DAMAGE,
    [FlowType.RETURN]: HistoryFlowType.RETURN,
    [FlowType.RESERVE]: HistoryFlowType.RESERVE,
  };
  return mapping[type] || HistoryFlowType.OUT;
}

/**
 * Mapper le AnomalyType de MaterialFlowLog vers ConsumptionHistory
 */
private mapToHistoryAnomalyType(type: AnomalyType): import('../entities/consumption-history.entity').AnomalyType {
  const HistoryAnomalyType = require('../entities/consumption-history.entity').AnomalyType;
  
  const mapping: Record<AnomalyType, any> = {
    [AnomalyType.NONE]: HistoryAnomalyType.NONE,
    [AnomalyType.THEFT]: HistoryAnomalyType.VOL,
    [AnomalyType.BLOCKED_SITE]: HistoryAnomalyType.PROBLEME,
    [AnomalyType.EXCESSIVE_CONSUMPTION]: HistoryAnomalyType.PROBLEME,
  };
  return mapping[type] || HistoryAnomalyType.NONE;
}

/**
 * Calculer la sévérité de l'anomalie
 */
private calculateHistorySeverity(type: AnomalyType): import('../entities/consumption-history.entity').AnomalySeverity {
  const HistoryAnomalySeverity = require('../entities/consumption-history.entity').AnomalySeverity;
  
  if (type === AnomalyType.NONE) return HistoryAnomalySeverity.NONE;
  if (type === AnomalyType.THEFT) return HistoryAnomalySeverity.CRITICAL;
  if (type === AnomalyType.BLOCKED_SITE) return HistoryAnomalySeverity.WARNING;
  if (type === AnomalyType.EXCESSIVE_CONSUMPTION) return HistoryAnomalySeverity.WARNING;
  return HistoryAnomalySeverity.LOW;
}
```

---

### 2. Modifier `ConsumptionAnomalyService`

**Fichier** : `apps/backend/materials-service/src/materials/services/consumption-anomaly.service.ts`

**Modifications nécessaires** :

#### A. Ajouter l'injection dans le constructor

```typescript
import { ConsumptionHistoryService } from './consumption-history.service';
import { FlowType, SourceCollection } from '../entities/consumption-history.entity';

constructor(
  @InjectModel(DailyConsumptionLog.name) private consumptionLogModel: Model<DailyConsumptionLog>,
  @InjectModel(Material.name) private materialModel: Model<Material>,
  private readonly anomalyEmailService: AnomalyEmailService,
  private readonly historyService: ConsumptionHistoryService, // ← AJOUTER
) {}
```

#### B. Appeler `addEntry()` après la sauvegarde

Dans la méthode `recordConsumption()`, après `const saved = await consumptionLog.save();`, ajouter :

```typescript
const saved = await consumptionLog.save();

// 🔥 NOUVEAU : Ajouter à l'historique centralisé
try {
  await this.historyService.addEntry({
    materialId: material._id.toString(),
    materialName: material.name,
    materialCode: material.code,
    materialCategory: material.category,
    materialUnit: material.unit,
    siteId: dto.siteId,
    siteName: undefined, // Sera enrichi par le service
    date: new Date(dto.date),
    quantity: dto.quantityUsed,
    flowType: FlowType.DAILY_CONSUMPTION,
    expectedQuantity: dto.expectedConsumption,
    anomalyScore: result.anomalyScore,
    anomalyType: this.mapToHistoryAnomalyType(result.anomalyType),
    anomalySeverity: this.calculateHistorySeverity(result.severity),
    stockBefore: 0,
    stockAfter: 0,
    sourceCollection: SourceCollection.DAILY_CONSUMPTION_LOG,
    sourceId: saved._id.toString(),
    recordedBy: undefined,
    reason: result.message,
  });
} catch (error) {
  // Ne pas faire échouer l'opération principale
  this.logger.error(`⚠️ Erreur lors de l'ajout à l'historique: ${error.message}`);
}

this.logger.log(`✅ Consumption recorded: ${dto.quantityUsed} ${material.unit}`);
```

#### C. Ajouter les méthodes de mapping

À la fin du fichier, avant la dernière accolade, ajouter :

```typescript
/**
 * Mapper le type d'anomalie vers ConsumptionHistory
 */
private mapToHistoryAnomalyType(type: string): import('../entities/consumption-history.entity').AnomalyType {
  const HistoryAnomalyType = require('../entities/consumption-history.entity').AnomalyType;
  
  if (type === 'VOL_POSSIBLE') return HistoryAnomalyType.VOL;
  if (type === 'CHANTIER_BLOQUE') return HistoryAnomalyType.PROBLEME;
  if (type === 'NORMAL') return HistoryAnomalyType.NORMAL;
  return HistoryAnomalyType.NONE;
}

/**
 * Calculer la sévérité de l'anomalie
 */
private calculateHistorySeverity(severity: string): import('../entities/consumption-history.entity').AnomalySeverity {
  const HistoryAnomalySeverity = require('../entities/consumption-history.entity').AnomalySeverity;
  
  if (severity === 'critical') return HistoryAnomalySeverity.CRITICAL;
  if (severity === 'warning') return HistoryAnomalySeverity.WARNING;
  if (severity === 'normal') return HistoryAnomalySeverity.NONE;
  return HistoryAnomalySeverity.LOW;
}
```

---

## 🧪 Tests à effectuer

### 1. Démarrer le service

```bash
cd apps/backend/materials-service
npm start
```

### 2. Synchroniser les données existantes

```http
POST http://localhost:3002/api/consumption-history/sync
```

**Réponse attendue** :
```json
{
  "synced": 150,
  "skipped": 0,
  "errors": 0,
  "details": []
}
```

### 3. Récupérer l'historique

```http
GET http://localhost:3002/api/consumption-history?page=1&limit=50&sortBy=date&sortOrder=desc
```

### 4. Récupérer les statistiques

```http
GET http://localhost:3002/api/consumption-history/statistics?groupBy=day&startDate=2026-04-01&endDate=2026-04-27
```

### 5. Récupérer la tendance d'un matériau

```http
GET http://localhost:3002/api/consumption-history/material/MATERIAL_ID/trend?days=30
```

### 6. Tester l'ajout automatique

Créer un nouveau flux de matériau :

```http
POST http://localhost:3002/api/material-flow
Content-Type: application/json

{
  "siteId": "SITE_ID",
  "materialId": "MATERIAL_ID",
  "type": "OUT",
  "quantity": 100,
  "reason": "Test historique"
}
```

Puis vérifier que l'entrée apparaît dans l'historique :

```http
GET http://localhost:3002/api/consumption-history?materialId=MATERIAL_ID&limit=1
```

---

## 📊 Endpoints disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/consumption-history` | Historique paginé avec filtres |
| `GET` | `/consumption-history/statistics` | Statistiques pour graphiques |
| `GET` | `/consumption-history/material/:id/trend` | Tendance d'un matériau |
| `GET` | `/consumption-history/:id` | Détail d'une entrée |
| `POST` | `/consumption-history/sync` | Synchroniser les données existantes |
| `DELETE` | `/consumption-history/cleanup` | Nettoyer les anciennes entrées |

---

## 🎯 Résultat final

Une fois tout implémenté, vous aurez :

1. ✅ Un historique centralisé de toutes les consommations
2. ✅ Des statistiques visuelles pour graphiques
3. ✅ Une API de filtrage avancée
4. ✅ Une synchronisation automatique des nouvelles données
5. ✅ Une migration des données existantes
6. ✅ Des tendances de consommation par matériau
7. ✅ Une traçabilité complète avec source des données

---

## 🔧 Dépannage

### Erreur : "Cannot find module ConsumptionHistoryService"

Vérifiez que le service est bien exporté dans `materials.module.ts`.

### Erreur : "Model not found"

Vérifiez que le schema est bien enregistré dans `MongooseModule.forFeature()`.

### Les données ne se synchronisent pas

Vérifiez les logs du service pour voir les erreurs détaillées. Le service continue même en cas d'erreur sur une entrée.

### Les appels à `addEntry()` échouent

C'est normal si le service n'est pas encore injecté. Les erreurs sont loggées mais ne font pas échouer l'opération principale.

---

## 📝 Notes importantes

1. **Pas de breaking changes** : Les collections existantes ne sont pas modifiées
2. **Performance** : Utilise `lean()` et `$facet` pour optimiser les requêtes
3. **Résilience** : Les erreurs dans `addEntry()` ne font pas échouer les opérations principales
4. **Dénormalisation** : Les noms de matériaux/sites sont stockés directement pour éviter les jointures
5. **Compatibilité** : Fonctionne même si le service de sites est indisponible

---

Bonne implémentation ! 🚀
