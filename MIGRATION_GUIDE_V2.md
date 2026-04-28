# 🔄 Guide de Migration - Materials Service V2

## Vue d'Ensemble

Ce guide explique comment migrer les données existantes du Materials Service V1 vers V2.

---

## 📊 Changements de Schéma

### Champs Supprimés
- `location` → Remplacé par `siteId` (emplacement du chantier)
- `manufacturer` → Supprimé (non nécessaire)
- `reorderPoint` → Remplacé par `stockMinimum`

### Nouveaux Champs
- `stockEntree` (number, default: 0)
- `stockSortie` (number, default: 0)
- `stockExistant` (number, default: 0)
- `stockMinimum` (number, default: 0)
- `stockActuel` (number, default: 0)
- `needsReorder` (boolean, default: false)
- `lastMovementDate` (Date, optional)
- `lastMovementType` ('IN' | 'OUT', optional)

---

## 🔧 Script de Migration MongoDB

### Option 1: Migration Automatique (Recommandé)

```javascript
// migration-v2.js
db.materials.find().forEach(function(material) {
  // Initialiser les nouveaux champs
  const updates = {
    stockExistant: material.quantity || 0,
    stockMinimum: material.reorderPoint || material.minimumStock || 10,
    stockEntree: 0,
    stockSortie: 0,
    stockActuel: material.quantity || 0,
    needsReorder: (material.quantity || 0) < (material.reorderPoint || material.minimumStock || 10),
  };
  
  // Mettre à jour le document
  db.materials.updateOne(
    { _id: material._id },
    { $set: updates }
  );
  
  print(`✅ Migré: ${material.name} (${material.code})`);
});

print('🎉 Migration terminée!');
```

**Exécution:**
```bash
mongo materials-service < migration-v2.js
```

### Option 2: Migration Progressive

```javascript
// migration-v2-progressive.js
// Migrer par lots de 100 pour éviter la surcharge

const batchSize = 100;
let skip = 0;
let migrated = 0;

while (true) {
  const materials = db.materials.find().skip(skip).limit(batchSize).toArray();
  
  if (materials.length === 0) break;
  
  materials.forEach(function(material) {
    const updates = {
      stockExistant: material.quantity || 0,
      stockMinimum: material.reorderPoint || material.minimumStock || 10,
      stockEntree: 0,
      stockSortie: 0,
      stockActuel: material.quantity || 0,
      needsReorder: (material.quantity || 0) < (material.reorderPoint || material.minimumStock || 10),
    };
    
    db.materials.updateOne(
      { _id: material._id },
      { $set: updates }
    );
    
    migrated++;
  });
  
  skip += batchSize;
  print(`📊 Migré: ${migrated} matériaux`);
}

print(`🎉 Migration terminée! Total: ${migrated} matériaux`);
```

### Option 3: Migration avec Validation

```javascript
// migration-v2-with-validation.js
let success = 0;
let errors = 0;

db.materials.find().forEach(function(material) {
  try {
    // Validation
    if (!material.name || !material.code) {
      throw new Error('Champs obligatoires manquants');
    }
    
    // Calculs
    const quantity = material.quantity || 0;
    const reorderPoint = material.reorderPoint || material.minimumStock || 10;
    
    const updates = {
      stockExistant: quantity,
      stockMinimum: reorderPoint,
      stockEntree: 0,
      stockSortie: 0,
      stockActuel: quantity,
      needsReorder: quantity < reorderPoint,
    };
    
    // Mise à jour
    const result = db.materials.updateOne(
      { _id: material._id },
      { $set: updates }
    );
    
    if (result.modifiedCount === 1) {
      success++;
      print(`✅ ${material.name} (${material.code})`);
    } else {
      throw new Error('Échec de la mise à jour');
    }
  } catch (e) {
    errors++;
    print(`❌ Erreur pour ${material.name}: ${e.message}`);
  }
});

print(`\n📊 Résumé:`);
print(`✅ Succès: ${success}`);
print(`❌ Erreurs: ${errors}`);
```

---

## 🔍 Vérification Post-Migration

### 1. Vérifier les Nouveaux Champs

```javascript
// verification.js
const total = db.materials.count();
const withNewFields = db.materials.count({
  stockExistant: { $exists: true },
  stockMinimum: { $exists: true },
  stockActuel: { $exists: true }
});

print(`Total matériaux: ${total}`);
print(`Avec nouveaux champs: ${withNewFields}`);
print(`Taux de migration: ${(withNewFields / total * 100).toFixed(2)}%`);

// Vérifier les valeurs
const samples = db.materials.find().limit(5).toArray();
samples.forEach(m => {
  print(`\n${m.name} (${m.code}):`);
  print(`  - stockExistant: ${m.stockExistant}`);
  print(`  - stockMinimum: ${m.stockMinimum}`);
  print(`  - stockActuel: ${m.stockActuel}`);
  print(`  - needsReorder: ${m.needsReorder}`);
});
```

### 2. Vérifier la Cohérence

```javascript
// coherence-check.js
const incoherent = db.materials.find({
  $expr: {
    $ne: [
      "$stockActuel",
      { $subtract: [
        { $add: ["$stockExistant", "$stockEntree"] },
        "$stockSortie"
      ]}
    ]
  }
}).toArray();

if (incoherent.length > 0) {
  print(`⚠️ ${incoherent.length} matériaux avec incohérence détectée`);
  incoherent.forEach(m => {
    print(`  - ${m.name}: stockActuel=${m.stockActuel}, calculé=${m.stockExistant + m.stockEntree - m.stockSortie}`);
  });
} else {
  print('✅ Tous les matériaux sont cohérents');
}
```

---

## 📝 Checklist de Migration

### Avant la Migration

- [ ] Sauvegarder la base de données
  ```bash
  mongodump --db materials-service --out backup-$(date +%Y%m%d)
  ```
- [ ] Tester le script sur un environnement de développement
- [ ] Vérifier que tous les services sont arrêtés
- [ ] Informer les utilisateurs de la maintenance

### Pendant la Migration

- [ ] Exécuter le script de migration
- [ ] Surveiller les logs pour détecter les erreurs
- [ ] Vérifier le taux de progression

### Après la Migration

- [ ] Exécuter les scripts de vérification
- [ ] Tester les fonctionnalités principales:
  - [ ] Création d'un matériau
  - [ ] Modification d'un matériau
  - [ ] Ajout d'un mouvement
  - [ ] Calcul du Smart Score
  - [ ] Génération de rapport IA
- [ ] Vérifier les performances
- [ ] Restaurer le service
- [ ] Informer les utilisateurs

---

## 🔄 Rollback (En cas de problème)

### Option 1: Restauration Complète

```bash
# Arrêter le service
pm2 stop materials-service

# Restaurer la sauvegarde
mongorestore --db materials-service backup-20260428/materials-service

# Redémarrer le service
pm2 start materials-service
```

### Option 2: Rollback Partiel

```javascript
// rollback-v2.js
db.materials.updateMany(
  {},
  {
    $unset: {
      stockEntree: "",
      stockSortie: "",
      stockExistant: "",
      stockMinimum: "",
      stockActuel: "",
      needsReorder: "",
      lastMovementDate: "",
      lastMovementType: ""
    }
  }
);

print('✅ Rollback effectué');
```

---

## 📊 Estimation du Temps de Migration

| Nombre de Matériaux | Temps Estimé | Recommandation |
|---------------------|--------------|----------------|
| < 1,000 | 1-2 minutes | Migration directe |
| 1,000 - 10,000 | 5-10 minutes | Migration progressive |
| 10,000 - 100,000 | 30-60 minutes | Migration par lots |
| > 100,000 | 2-4 heures | Migration nocturne |

---

## 🚨 Problèmes Courants et Solutions

### Problème 1: Champs Manquants

**Symptôme:** Certains matériaux n'ont pas de `quantity` ou `reorderPoint`

**Solution:**
```javascript
db.materials.updateMany(
  { quantity: { $exists: false } },
  { $set: { quantity: 0 } }
);

db.materials.updateMany(
  { reorderPoint: { $exists: false } },
  { $set: { reorderPoint: 10 } }
);
```

### Problème 2: Valeurs Négatives

**Symptôme:** Certains matériaux ont des quantités négatives

**Solution:**
```javascript
db.materials.updateMany(
  { quantity: { $lt: 0 } },
  { $set: { quantity: 0 } }
);
```

### Problème 3: Incohérence après Migration

**Symptôme:** `stockActuel` ne correspond pas au calcul

**Solution:**
```javascript
db.materials.find().forEach(function(m) {
  const calculated = (m.stockExistant || 0) + (m.stockEntree || 0) - (m.stockSortie || 0);
  if (m.stockActuel !== calculated) {
    db.materials.updateOne(
      { _id: m._id },
      { $set: { stockActuel: calculated } }
    );
  }
});
```

---

## 📞 Support

En cas de problème pendant la migration:

1. **Arrêter immédiatement** le processus
2. **Consulter les logs** pour identifier l'erreur
3. **Contacter l'équipe technique**:
   - Email: tech@smartsite.com
   - Téléphone: +216 XX XXX XXX
   - Slack: #materials-service-v2

---

## ✅ Validation Finale

Après la migration, exécuter ce script de validation complète:

```javascript
// final-validation.js
print('🔍 Validation finale de la migration V2\n');

// 1. Compter les matériaux
const total = db.materials.count();
print(`1. Total matériaux: ${total}`);

// 2. Vérifier les nouveaux champs
const withNewFields = db.materials.count({
  stockExistant: { $exists: true },
  stockMinimum: { $exists: true },
  stockActuel: { $exists: true },
  needsReorder: { $exists: true }
});
print(`2. Avec nouveaux champs: ${withNewFields} (${(withNewFields/total*100).toFixed(1)}%)`);

// 3. Vérifier la cohérence
let coherent = 0;
db.materials.find().forEach(function(m) {
  const calculated = (m.stockExistant || 0) + (m.stockEntree || 0) - (m.stockSortie || 0);
  if (m.stockActuel === calculated) coherent++;
});
print(`3. Matériaux cohérents: ${coherent} (${(coherent/total*100).toFixed(1)}%)`);

// 4. Vérifier needsReorder
let correctReorder = 0;
db.materials.find().forEach(function(m) {
  const shouldReorder = m.stockActuel < m.stockMinimum;
  if (m.needsReorder === shouldReorder) correctReorder++;
});
print(`4. needsReorder correct: ${correctReorder} (${(correctReorder/total*100).toFixed(1)}%)`);

// 5. Vérifier les valeurs négatives
const negative = db.materials.count({ stockActuel: { $lt: 0 } });
print(`5. Stocks négatifs: ${negative}`);

// 6. Résumé
print('\n📊 RÉSUMÉ:');
if (withNewFields === total && coherent === total && correctReorder === total && negative === 0) {
  print('✅ Migration réussie à 100%!');
} else {
  print('⚠️ Migration incomplète ou avec erreurs');
  print('   Veuillez vérifier les points ci-dessus');
}
```

---

**Dernière mise à jour:** 28 avril 2026  
**Version:** 2.0.0  
**Auteur:** Équipe SmartSite
