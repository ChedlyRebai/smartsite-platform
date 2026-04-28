# 🚀 Quick Start - Corrections Materials Service

## ✅ Corrections Déjà Appliquées

### 1. Météo dans Prédictions ML ✅
- Fichier modifié: `apps/frontend/src/app/pages/materials/PredictionsList.tsx`
- Changements: Interface weather ajoutée, chargement automatique, affichage avec impact

### 2. Entrée/Sortie → Flow Log ✅
- Fichier modifié: `apps/backend/materials-service/src/materials/materials.service.ts`
- Changements: Méthode `recordFlowFromMaterialData()` ajoutée, appels dans create/update

---

## 🔨 Corrections Restantes (Copier-Coller)

### 3. Dialog Paiement Automatique

**Fichier**: `apps/frontend/src/app/pages/materials/OrderMap.tsx`

**Ajouter après les imports existants**:
```typescript
import PaymentDialog from './PaymentDialog';
```

**Ajouter après les states existants (ligne ~80)**:
```typescript
const [showPaymentDialog, setShowPaymentDialog] = useState(false);
const [paymentOrderData, setPaymentOrderData] = useState<any>(null);
```

**Remplacer la fonction `handleArrival` (ligne ~400)**:
```typescript
const handleArrival = async () => {
  console.log("🏁 ARRIVÉE DESTINATION");
  setIsArrived(true);
  setIsDelivering(false);
  setProgress(100);
  setRemainingTime(0);
  
  await orderService.updateOrderStatus(orderId!, { status: 'delivered' });
  toast.success(`✅ Le camion est arrivé chez ${selectedFournisseur?.nom}!`);
  
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    sender: 'System',
    text: `✅ Livraison terminée! Le camion est arrivé chez ${selectedFournisseur?.nom}`,
    type: 'arrival'
  }]);
  
  // 💰 OUVRIR LE DIALOG DE PAIEMENT
  if (selectedOrder) {
    const amount = selectedOrder.quantity * 100; // Prix unitaire * quantité
    setPaymentOrderData({
      orderId: selectedOrder._id,
      orderNumber: selectedOrder.orderNumber,
      materialName: selectedOrder.materialName,
      supplierName: selectedOrder.supplierName,
      siteName: selectedOrder.destinationSiteName,
      amount,
    });
    setShowPaymentDialog(true);
  }
  
  onOrderConfirmed?.();
};
```

**Ajouter avant la fermeture du div principal (ligne ~900)**:
```typescript
{showPaymentDialog && paymentOrderData && (
  <PaymentDialog
    open={showPaymentDialog}
    onClose={() => setShowPaymentDialog(false)}
    onSuccess={() => {
      setShowPaymentDialog(false);
      toast.success('💰 Paiement effectué avec succès!');
    }}
    {...paymentOrderData}
  />
)}
```

---

### 4. Rating Fournisseur Automatique

**Étape 1: Créer le controller backend**

Créer le fichier: `apps/backend/materials-service/src/materials/controllers/supplier-rating.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { SupplierRatingService } from '../services/supplier-rating.service';

@Controller('supplier-ratings')
export class SupplierRatingController {
  private readonly logger = new Logger(SupplierRatingController.name);

  constructor(private readonly ratingService: SupplierRatingService) {}

  @Get('check-rating-needed/:materialId')
  async checkRatingNeeded(
    @Param('materialId') materialId: string,
    @Query('userId') userId: string,
  ) {
    this.logger.log(`🔍 Vérification rating pour matériau ${materialId}, user ${userId}`);
    return this.ratingService.checkIfRatingNeeded(materialId, userId);
  }

  @Post()
  async createRating(@Body() createDto: any) {
    this.logger.log(`📝 Création rating pour fournisseur ${createDto.supplierId}`);
    return this.ratingService.createRating(createDto);
  }

  @Get('supplier/:supplierId')
  async getSupplierRatings(@Param('supplierId') supplierId: string) {
    return this.ratingService.getSupplierRatings(supplierId);
  }

  @Get('supplier/:supplierId/stats')
  async getSupplierStats(@Param('supplierId') supplierId: string) {
    return this.ratingService.getSupplierStats(supplierId);
  }

  @Get('reclamations')
  async getAllReclamations(@Query('status') status?: string) {
    return this.ratingService.getAllReclamations(status);
  }

  @Post(':ratingId/resolve')
  async resolveReclamation(@Param('ratingId') ratingId: string) {
    return this.ratingService.resolveReclamation(ratingId);
  }
}
```

**Étape 2: Ajouter le controller au module**

Dans `apps/backend/materials-service/src/materials/materials.module.ts`, ajouter:

```typescript
import { SupplierRatingController } from './controllers/supplier-rating.controller';

@Module({
  controllers: [
    MaterialsController,
    OrdersController,
    QRCodeController,
    SiteMaterialsController,
    SupplierRatingController, // ← AJOUTER ICI
  ],
  // ... reste du code
})
```

**Étape 3: Créer le hook frontend**

Créer le fichier: `apps/frontend/src/app/pages/materials/useSupplierRating.ts`

```typescript
import { useEffect, useState } from 'react';
import axios from 'axios';

export function useSupplierRating(materialId: string | undefined, userId: string | undefined) {
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingData, setRatingData] = useState<any>(null);

  useEffect(() => {
    const checkRating = async () => {
      if (!materialId || !userId) return;
      
      try {
        const response = await axios.get(
          `http://localhost:3002/api/supplier-ratings/check-rating-needed/${materialId}?userId=${userId}`
        );
        
        console.log('🔍 Rating check response:', response.data);
        
        if (response.data.needed && !response.data.alreadyRated) {
          setRatingData({
            materialId,
            materialName: response.data.material.name,
            supplierId: response.data.material.supplierId,
            supplierName: response.data.material.supplierName,
            siteId: response.data.material.siteId,
            consumptionPercentage: response.data.consumptionPercentage,
          });
          setShowRatingDialog(true);
          console.log('✅ Rating dialog ouvert:', response.data.consumptionPercentage + '%');
        }
      } catch (error) {
        console.error('❌ Error checking rating:', error);
      }
    };

    // Vérifier toutes les 10 secondes
    const interval = setInterval(checkRating, 10000);
    checkRating(); // Vérification immédiate

    return () => clearInterval(interval);
  }, [materialId, userId]);

  return { showRatingDialog, setShowRatingDialog, ratingData };
}
```

**Étape 4: Utiliser dans Materials.tsx**

Dans `apps/frontend/src/app/pages/materials/Materials.tsx`, ajouter:

```typescript
// Imports
import { useSupplierRating } from './useSupplierRating';
import SupplierRatingDialog from './SupplierRatingDialog';

// Dans le composant Materials (après les autres hooks)
const currentUser = { id: 'user123', name: 'John Doe' }; // TODO: Récupérer depuis authStore

const { showRatingDialog, setShowRatingDialog, ratingData } = useSupplierRating(
  selectedMaterial?._id,
  currentUser?.id
);

// Ajouter le dialog dans le JSX (avant la fermeture du composant)
{showRatingDialog && ratingData && (
  <SupplierRatingDialog
    open={showRatingDialog}
    onClose={() => setShowRatingDialog(false)}
    {...ratingData}
    userId={currentUser?.id}
    userName={currentUser?.name}
  />
)}
```

---

### 5. Supprimer SmartScore

**Commandes à exécuter**:

```bash
# Backend
rm apps/backend/materials-service/src/materials/services/smart-score.service.ts

# Frontend
rm apps/frontend/src/app/pages/materials/SmartScoreCard.tsx
rm apps/frontend/src/app/pages/materials/SmartScoreDashboard.tsx
rm apps/frontend/src/app/pages/materials/SmartSiteDashboard.tsx
```

**Fichier**: `apps/backend/materials-service/src/materials/materials.controller.ts`

Supprimer ces lignes:
```typescript
// SUPPRIMER L'IMPORT
import { SmartScoreService } from './services/smart-score.service';

// SUPPRIMER DU CONSTRUCTOR
private readonly smartScoreService: SmartScoreService,

// SUPPRIMER CES ENDPOINTS (lignes ~300-350)
@Post('smart-score/site')
async calculateSiteSmartScore(...)

@Post('smart-score/sites')
async calculateMultipleSitesScores(...)

@Get('smart-score/material/:materialId')
async getMaterialScores(...)
```

**Fichier**: `apps/backend/materials-service/src/materials/materials.module.ts`

Supprimer:
```typescript
// SUPPRIMER L'IMPORT
import { SmartScoreService } from './services/smart-score.service';

// SUPPRIMER DES PROVIDERS
SmartScoreService,
```

**Fichier**: `apps/frontend/src/app/pages/materials/Materials.tsx`

Supprimer:
```typescript
// SUPPRIMER LES IMPORTS
import SmartScoreCard from './SmartScoreCard';
import SmartScoreDashboard from './SmartScoreDashboard';

// SUPPRIMER LES COMPOSANTS DU JSX
<SmartScoreCard ... />
<SmartScoreDashboard ... />
```

---

## 🧪 Tests Rapides

### Test 1: Météo dans Prédictions
```bash
# Ouvrir le navigateur
http://localhost:5173/materials

# Vérifier:
# - Prédictions affichent la météo
# - Température, description, impact visible
```

### Test 2: Entrée/Sortie → Flow Log
```bash
# 1. Créer un matériau avec:
#    - Stock Existant: 100
#    - Stock Entrée: 50
#    - Stock Sortie: 20

# 2. Vérifier dans MongoDB:
db.materialflowlogs.find({ materialId: ObjectId("...") })

# Résultat attendu:
# - 1 document type: "IN", quantity: 50
# - 1 document type: "OUT", quantity: 20
```

### Test 3: Dialog Paiement
```bash
# 1. Créer une commande
# 2. Ouvrir OrderMap
# 3. Démarrer la livraison
# 4. Attendre l'arrivée (progress = 100%)

# Résultat attendu:
# - Dialog de paiement s'ouvre automatiquement
# - Montant affiché
# - Options: Espèces / Carte
```

### Test 4: Rating Fournisseur
```bash
# 1. Créer un matériau avec stock 100
# 2. Consommer 35 unités (35%)
# 3. Attendre 10 secondes

# Résultat attendu:
# - Dialog de rating s'ouvre automatiquement
# - Informations correctes affichées
# - Formulaire fonctionnel
```

---

## 📊 Checklist Finale

- [x] Météo dans prédictions ML
- [x] Entrée/Sortie → Flow Log
- [x] Alerte de danger (déjà implémenté)
- [x] Suivi orders (déjà implémenté)
- [ ] Dialog paiement automatique
- [ ] Rating fournisseur automatique
- [ ] Supprimer SmartScore

---

## 🚀 Commandes de Démarrage

```bash
# Backend
cd apps/backend/materials-service
npm install
npm run start:dev

# Frontend
cd apps/frontend
npm install
npm run dev

# MongoDB (si nécessaire)
mongod --dbpath /path/to/data
```

---

## 📝 Notes

- Les corrections 1 et 2 sont **déjà appliquées** ✅
- Les corrections 3, 4, 5 nécessitent un **copier-coller** des codes ci-dessus
- Temps estimé pour les corrections restantes: **1h30**
- Tous les fichiers nécessaires existent déjà (PaymentDialog, SupplierRatingDialog)

---

**Date**: 28 Avril 2026
**Version**: 1.0
**Prêt à l'emploi**: Oui ✅
