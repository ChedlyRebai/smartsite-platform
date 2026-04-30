# 📝 Guide d'Implémentation - Flow Log dans Formulaire Ajout

## 🎯 Objectif

Enregistrer automatiquement les entrées/sorties de matériaux dans le flow log lors de l'ajout d'un matériau, avec détection automatique d'anomalies et envoi d'email si nécessaire.

---

## 🏗️ Architecture Backend (Déjà Implémenté)

### Endpoint Flow Log
```typescript
POST /api/flows
Body: {
  materialId: string,
  siteId: string,
  type: 'IN' | 'OUT' | 'ADJUSTMENT',
  quantity: number,
  reason?: string
}
```

### Service MaterialFlowService
- ✅ Enregistre chaque mouvement
- ✅ Calcule consommation normale (30 derniers jours)
- ✅ Détecte anomalies (EXCESSIVE_OUT si > 150% normale)
- ✅ Envoie email automatique si anomalie

### Types d'Anomalies
- `EXCESSIVE_OUT`: Sortie > 150% normale → Risque vol/gaspillage
- `EXCESSIVE_IN`: Entrée anormalement élevée
- `BELOW_SAFETY_STOCK`: Stock < seuil sécurité

---

## 📋 Implémentation Frontend

### Fichier à Modifier
`apps/frontend/src/app/pages/materials/CreateMaterialDialog.tsx`

### Étape 1: Ajouter la fonction d'enregistrement flow log

```typescript
const recordFlowLog = async (
  materialId: string,
  siteId: string,
  type: 'IN' | 'OUT',
  quantity: number,
  reason: string
) => {
  try {
    const response = await axios.post('/api/flows', {
      materialId,
      siteId,
      type,
      quantity,
      reason,
    });

    console.log('✅ Flow log enregistré:', response.data);

    // Vérifier si anomalie détectée
    if (response.data.anomalyDetected) {
      toast.warning(
        `⚠️ Anomalie détectée: ${response.data.anomalyType}`,
        {
          description: response.data.anomalyMessage,
          duration: 5000,
        }
      );
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur enregistrement flow log:', error);
    // Ne pas bloquer la création du matériau
    toast.error('Impossible d\'enregistrer le mouvement de stock');
  }
};
```

### Étape 2: Modifier la fonction handleSubmit

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Créer le matériau
    const newMaterial = await materialService.createMaterial({
      ...formData,
      quantity: formData.stockExistant || 0,
      stockMinimum: formData.stockMinimum || 0,
      minimumStock: formData.minimumStock || 0,
      maximumStock: formData.maximumStock || 0,
    });

    console.log('✅ Matériau créé:', newMaterial);

    // 2. Enregistrer l'entrée initiale dans flow log (si stockEntree > 0)
    if (formData.stockEntree && formData.stockEntree > 0 && formData.siteId) {
      await recordFlowLog(
        newMaterial._id,
        formData.siteId,
        'IN',
        formData.stockEntree,
        'Stock initial - Entrée'
      );
    }

    // 3. Enregistrer la sortie dans flow log (si stockSortie > 0)
    if (formData.stockSortie && formData.stockSortie > 0 && formData.siteId) {
      await recordFlowLog(
        newMaterial._id,
        formData.siteId,
        'OUT',
        formData.stockSortie,
        'Stock initial - Sortie'
      );
    }

    // 4. Calculer et enregistrer la quantité à commander (si nécessaire)
    const stockActuel = (formData.stockExistant || 0) + (formData.stockEntree || 0) - (formData.stockSortie || 0);
    const quantiteACommander = Math.max(0, (formData.stockMinimum || 0) - stockActuel);

    if (quantiteACommander > 0) {
      console.log(`📦 Quantité à commander calculée: ${quantiteACommander}`);
      // Optionnel: Enregistrer dans une table "orders" ou afficher une alerte
      toast.info(
        `📦 Quantité à commander: ${quantiteACommander} ${formData.unit}`,
        {
          description: 'Le stock est en dessous du minimum',
          duration: 5000,
        }
      );
    }

    toast.success('Matériau créé avec succès!');
    onSuccess();
    onClose();
  } catch (error: any) {
    console.error('❌ Erreur création matériau:', error);
    toast.error(error.response?.data?.message || 'Erreur lors de la création');
  } finally {
    setLoading(false);
  }
};
```

### Étape 3: Ajouter les champs dans le formulaire (si manquants)

```typescript
const [formData, setFormData] = useState({
  name: '',
  code: '',
  category: '',
  unit: '',
  stockExistant: 0,      // Stock actuel
  stockEntree: 0,        // Entrée
  stockSortie: 0,        // Sortie
  stockMinimum: 0,       // Seuil minimum
  minimumStock: 0,
  maximumStock: 0,
  siteId: '',            // Chantier assigné (OBLIGATOIRE pour flow log)
  // ... autres champs
});
```

### Étape 4: Validation du formulaire

```typescript
const validateForm = () => {
  if (!formData.name || !formData.code || !formData.category) {
    toast.error('Veuillez remplir tous les champs obligatoires');
    return false;
  }

  if ((formData.stockEntree > 0 || formData.stockSortie > 0) && !formData.siteId) {
    toast.error('Veuillez assigner un chantier pour enregistrer les mouvements de stock');
    return false;
  }

  const stockActuel = (formData.stockExistant || 0) + (formData.stockEntree || 0) - (formData.stockSortie || 0);
  if (stockActuel < 0) {
    toast.error('Le stock ne peut pas être négatif');
    return false;
  }

  return true;
};
```

---

## 🎨 Interface Utilisateur

### Affichage des Champs

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Stock Existant</Label>
    <Input
      type="number"
      min={0}
      value={formData.stockExistant}
      onChange={(e) => setFormData({ ...formData, stockExistant: parseInt(e.target.value) || 0 })}
    />
  </div>
  <div>
    <Label>Stock Minimum</Label>
    <Input
      type="number"
      min={0}
      value={formData.stockMinimum}
      onChange={(e) => setFormData({ ...formData, stockMinimum: parseInt(e.target.value) || 0 })}
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Entrée</Label>
    <Input
      type="number"
      min={0}
      value={formData.stockEntree}
      onChange={(e) => setFormData({ ...formData, stockEntree: parseInt(e.target.value) || 0 })}
      placeholder="Quantité entrée"
    />
  </div>
  <div>
    <Label>Sortie</Label>
    <Input
      type="number"
      min={0}
      value={formData.stockSortie}
      onChange={(e) => setFormData({ ...formData, stockSortie: parseInt(e.target.value) || 0 })}
      placeholder="Quantité sortie"
    />
  </div>
</div>

{/* Calcul automatique du stock actuel */}
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">Stock Actuel Calculé:</span>
    <span className="text-lg font-bold text-blue-700">
      {(formData.stockExistant || 0) + (formData.stockEntree || 0) - (formData.stockSortie || 0)} {formData.unit}
    </span>
  </div>
  <p className="text-xs text-gray-500 mt-1">
    Formule: Stock Existant + Entrée - Sortie
  </p>
</div>

{/* Calcul automatique de la quantité à commander */}
{(() => {
  const stockActuel = (formData.stockExistant || 0) + (formData.stockEntree || 0) - (formData.stockSortie || 0);
  const quantiteACommander = Math.max(0, (formData.stockMinimum || 0) - stockActuel);
  
  if (quantiteACommander > 0) {
    return (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="font-semibold text-yellow-700">Commande Nécessaire</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Quantité à Commander:</span>
          <span className="text-xl font-bold text-yellow-700">
            {quantiteACommander} {formData.unit}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Le stock actuel est en dessous du minimum
        </p>
      </div>
    );
  }
  return null;
})()}
```

---

## 🔔 Alertes et Notifications

### Alerte Anomalie Détectée

```typescript
// Si sortie > 150% de la normale
if (response.data.anomalyDetected && response.data.anomalyType === 'EXCESSIVE_OUT') {
  toast.warning(
    '🚨 Anomalie Détectée - Risque de Vol/Gaspillage',
    {
      description: `Sortie de ${quantity} ${unit} détectée (${response.data.deviationPercent}% au-dessus de la normale). Un email a été envoyé à l'administrateur.`,
      duration: 10000,
      action: {
        label: 'Voir Détails',
        onClick: () => {
          // Ouvrir modal avec détails anomalie
        },
      },
    }
  );
}
```

### Email Automatique (Backend)

Le backend envoie automatiquement un email si anomalie détectée:

```
À: admin@smartsite.com
Sujet: 🚨 Alerte Anomalie Stock - Ciment Portland

Bonjour,

Une anomalie de stock a été détectée:

Matériau: Ciment Portland (CIM001)
Chantier: Chantier Nord
Type: Sortie Excessive
Quantité: 150 unités
Consommation normale: 50 unités/jour
Écart: +200%

⚠️ Risque de vol ou gaspillage à vérifier

Cordialement,
SmartSite Platform
```

---

## 📊 Affichage des Mouvements dans MaterialDetails

### Modification MaterialDetails.tsx

```typescript
const loadMovements = async () => {
  setLoading(true);
  try {
    // Récupérer depuis flow log au lieu de l'ancien endpoint
    const { data } = await axios.get(`/api/flows`, {
      params: {
        materialId: material._id,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc',
      },
    });
    
    setMovements(data.flows || []);
  } catch (error) {
    console.error('Error loading movements:', error);
  } finally {
    setLoading(false);
  }
};
```

### Affichage avec Badges Colorés

```tsx
<Card>
  <CardContent className="pt-6">
    <h3 className="font-semibold mb-3">Mouvements récents</h3>
    {loading ? (
      <p className="text-center py-4">Chargement...</p>
    ) : movements.length === 0 ? (
      <p className="text-center py-4 text-gray-500">Aucun mouvement enregistré</p>
    ) : (
      <div className="space-y-2">
        {movements.map((movement, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {/* Badge type */}
              <Badge variant={
                movement.type === 'IN' ? 'default' : 
                movement.type === 'OUT' ? 'destructive' : 
                'secondary'
              } className={
                movement.type === 'IN' ? 'bg-green-500' :
                movement.type === 'OUT' ? 'bg-red-500' :
                'bg-yellow-500'
              }>
                {movement.type === 'IN' ? '🟢 Entrée' : 
                 movement.type === 'OUT' ? '🔴 Sortie' : 
                 '🟡 Ajustement'}
              </Badge>
              
              {/* Quantité */}
              <span className={`font-medium ${
                movement.type === 'IN' ? 'text-green-600' : 
                movement.type === 'OUT' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : ''} 
                {movement.quantity} {material.unit}
              </span>
              
              {/* Date */}
              <span className="text-sm text-gray-500">
                {new Date(movement.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            
            {/* Anomalie badge */}
            {movement.anomalyDetected && (
              <Badge variant="destructive" className="bg-red-100 text-red-700">
                ⚠️ Anomalie
              </Badge>
            )}
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

---

## 🧪 Tests de Validation

### Test 1: Création avec Entrée
1. Remplir formulaire ajout matériau
2. Saisir `stockEntree = 100`
3. Assigner un chantier
4. Créer le matériau
5. Vérifier toast succès
6. Vérifier flow log enregistré (console backend)

### Test 2: Création avec Sortie Excessive
1. Remplir formulaire
2. Saisir `stockSortie = 500` (très élevé)
3. Créer le matériau
4. Vérifier alerte anomalie (toast warning)
5. Vérifier email envoyé (logs backend)

### Test 3: Calcul Quantité à Commander
1. Remplir formulaire
2. Saisir `stockExistant = 50`, `stockMinimum = 100`
3. Vérifier carte jaune "Quantité à Commander: 50"
4. Créer le matériau
5. Vérifier toast info avec quantité

### Test 4: Affichage Mouvements
1. Créer un matériau avec entrée/sortie
2. Ouvrir détails du matériau
3. Vérifier section "Mouvements récents"
4. Vérifier badges colorés (🟢 Entrée, 🔴 Sortie)

---

## 💡 Points Clés

1. **Flow log automatique**: Enregistré après création matériau
2. **Détection anomalie**: Backend calcule automatiquement
3. **Email automatique**: Envoyé si sortie > 150% normale
4. **Validation**: Chantier obligatoire pour enregistrer mouvements
5. **Calcul temps réel**: Stock actuel et quantité à commander
6. **Affichage détaillé**: Mouvements avec badges colorés

---

**Date**: 28 avril 2026, 4:15 AM  
**Status**: 📋 Guide prêt pour implémentation  
**Prochaine étape**: Modifier CreateMaterialDialog.tsx
