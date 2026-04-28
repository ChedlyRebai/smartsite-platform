# 🔌 Intégration du Système de Rating - Exemple

## Comment Intégrer le Dialog de Rating

### Exemple 1: Dans MaterialDetails.tsx

```typescript
import { useSupplierRating } from './useSupplierRating';
import SupplierRatingDialog from './SupplierRatingDialog';

export default function MaterialDetails({ materialId }: Props) {
  const [material, setMaterial] = useState<Material | null>(null);
  const currentUser = useAuth(); // Votre hook d'authentification
  
  // 🎯 Hook pour gérer le rating automatique
  const {
    showDialog,
    closeDialog,
    ratingData,
  } = useSupplierRating({
    materialId,
    userId: currentUser.id,
    enabled: !!material, // Activer seulement si matériau chargé
  });

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  const loadMaterial = async () => {
    const data = await materialService.getMaterialById(materialId);
    setMaterial(data);
  };

  return (
    <div>
      {/* Votre contenu existant */}
      <h1>{material?.name}</h1>
      <p>Stock: {material?.stockActuel}</p>
      
      {/* ... */}

      {/* 🌟 Dialog de Rating (s'ouvre automatiquement si besoin) */}
      {showDialog && ratingData?.material && (
        <SupplierRatingDialog
          open={showDialog}
          onClose={closeDialog}
          materialId={materialId}
          materialName={ratingData.material.name}
          supplierId={ratingData.material.preferredSuppliers[0]} // Premier fournisseur
          supplierName="ABC Materials" // À récupérer via API
          siteId={ratingData.material.siteId}
          consumptionPercentage={ratingData.consumptionPercentage}
          userId={currentUser.id}
          userName={currentUser.name}
        />
      )}
    </div>
  );
}
```

---

### Exemple 2: Dans SiteConsumptionTracker.tsx

```typescript
import { useSupplierRating } from './useSupplierRating';
import SupplierRatingDialog from './SupplierRatingDialog';

export default function SiteConsumptionTracker({ siteId }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const currentUser = useAuth();

  // 🎯 Hook pour le matériau sélectionné
  const {
    showDialog,
    closeDialog,
    ratingData,
  } = useSupplierRating({
    materialId: selectedMaterial?._id || '',
    userId: currentUser.id,
    enabled: !!selectedMaterial,
  });

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
    // Le hook vérifiera automatiquement si un rating est nécessaire
  };

  return (
    <div>
      {/* Liste des matériaux */}
      {materials.map(material => (
        <div key={material._id} onClick={() => handleMaterialClick(material)}>
          <h3>{material.name}</h3>
          <p>Consommation: {calculateConsumption(material)}%</p>
        </div>
      ))}

      {/* Dialog de Rating */}
      {showDialog && selectedMaterial && ratingData?.material && (
        <SupplierRatingDialog
          open={showDialog}
          onClose={() => {
            closeDialog();
            setSelectedMaterial(null);
          }}
          materialId={selectedMaterial._id}
          materialName={selectedMaterial.name}
          supplierId={selectedMaterial.preferredSuppliers[0]}
          supplierName="ABC Materials"
          siteId={siteId}
          consumptionPercentage={ratingData.consumptionPercentage}
          userId={currentUser.id}
          userName={currentUser.name}
        />
      )}
    </div>
  );
}
```

---

### Exemple 3: Déclenchement Manuel

Si vous voulez permettre à l'utilisateur de noter manuellement:

```typescript
import { useState } from 'react';
import SupplierRatingDialog from './SupplierRatingDialog';
import { Button } from '../../../components/ui/button';
import { Star } from 'lucide-react';

export default function MaterialCard({ material }: Props) {
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const currentUser = useAuth();

  return (
    <div className="material-card">
      <h3>{material.name}</h3>
      <p>Stock: {material.stockActuel}</p>
      
      {/* Bouton pour noter manuellement */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowRatingDialog(true)}
      >
        <Star className="h-4 w-4 mr-2" />
        Noter le fournisseur
      </Button>

      {/* Dialog */}
      {showRatingDialog && (
        <SupplierRatingDialog
          open={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          materialId={material._id}
          materialName={material.name}
          supplierId={material.preferredSuppliers[0]}
          supplierName="ABC Materials"
          siteId={material.siteId}
          consumptionPercentage={calculateConsumption(material)}
          userId={currentUser.id}
          userName={currentUser.name}
        />
      )}
    </div>
  );
}
```

---

## 🔧 Configuration Backend

### 1. Ajouter l'Entité au Module

```typescript
// materials.module.ts
import { SupplierRating, SupplierRatingSchema } from './entities/supplier-rating.entity';
import { SupplierRatingService } from './services/supplier-rating.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
      { name: ConsumptionHistory.name, schema: ConsumptionHistorySchema },
      { name: SupplierRating.name, schema: SupplierRatingSchema }, // 🆕
    ]),
  ],
  providers: [
    MaterialsService,
    SupplierRatingService, // 🆕
    // ... autres services
  ],
  controllers: [MaterialsController],
})
export class MaterialsModule {}
```

### 2. Créer le Controller

```typescript
// supplier-rating.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { SupplierRatingService, CreateRatingDto } from '../services/supplier-rating.service';

@Controller('supplier-ratings')
export class SupplierRatingController {
  constructor(private readonly ratingService: SupplierRatingService) {}

  @Get('check/:materialId')
  async checkIfRatingNeeded(
    @Param('materialId') materialId: string,
    @Query('userId') userId: string,
  ) {
    return this.ratingService.checkIfRatingNeeded(materialId, userId);
  }

  @Post()
  async createRating(@Body() createDto: CreateRatingDto) {
    return this.ratingService.createRating(createDto);
  }

  @Get('stats/:supplierId')
  async getSupplierStats(@Param('supplierId') supplierId: string) {
    return this.ratingService.getSupplierStats(supplierId);
  }

  @Get('supplier/:supplierId')
  async getSupplierRatings(@Param('supplierId') supplierId: string) {
    return this.ratingService.getSupplierRatings(supplierId);
  }

  @Get('reclamations')
  async getAllReclamations(@Query('status') status?: string) {
    return this.ratingService.getAllReclamations(status);
  }

  @Put(':id/resolve')
  async resolveReclamation(@Param('id') id: string) {
    return this.ratingService.resolveReclamation(id);
  }

  @Get('global-stats')
  async getGlobalStats() {
    return this.ratingService.getGlobalStats();
  }
}
```

### 3. Enregistrer le Controller

```typescript
// materials.module.ts
import { SupplierRatingController } from './controllers/supplier-rating.controller';

@Module({
  // ...
  controllers: [
    MaterialsController,
    SupplierRatingController, // 🆕
  ],
})
export class MaterialsModule {}
```

---

## 📱 Service Frontend

Créer un service pour les appels API:

```typescript
// services/supplierRatingService.ts
import axios from 'axios';

export interface CreateRatingData {
  materialId: string;
  supplierId: string;
  siteId: string;
  userId: string;
  userName: string;
  avis: 'POSITIF' | 'NEGATIF';
  note: number;
  commentaire?: string;
  hasReclamation: boolean;
  reclamationMotif?: string;
  reclamationDescription?: string;
  consumptionPercentage: number;
}

export const supplierRatingService = {
  checkIfRatingNeeded: (materialId: string, userId: string) =>
    axios.get(`/api/supplier-ratings/check/${materialId}?userId=${userId}`),

  createRating: (data: CreateRatingData) =>
    axios.post('/api/supplier-ratings', data),

  getSupplierStats: (supplierId: string) =>
    axios.get(`/api/supplier-ratings/stats/${supplierId}`),

  getSupplierRatings: (supplierId: string) =>
    axios.get(`/api/supplier-ratings/supplier/${supplierId}`),

  getReclamations: (status?: string) =>
    axios.get('/api/supplier-ratings/reclamations', { params: { status } }),

  resolveReclamation: (ratingId: string) =>
    axios.put(`/api/supplier-ratings/${ratingId}/resolve`),

  getGlobalStats: () =>
    axios.get('/api/supplier-ratings/global-stats'),
};
```

---

## 🎨 Composant Statistiques Fournisseur

```typescript
// SupplierStats.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Star, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { supplierRatingService } from '../../../services/supplierRatingService';

export default function SupplierStats({ supplierId }: { supplierId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [supplierId]);

  const loadStats = async () => {
    try {
      const { data } = await supplierRatingService.getSupplierStats(supplierId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Statistiques - {stats.supplierName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Note Moyenne */}
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Note Moyenne</p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.averageNote} <Star className="inline h-6 w-6" fill="currentColor" />
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Taux de Satisfaction</p>
            <p className="text-2xl font-bold text-green-600">{stats.tauxSatisfaction}%</p>
          </div>
        </div>

        {/* Répartition */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-700">{stats.positifs}</p>
            <p className="text-sm text-gray-600">Positifs</p>
          </div>

          <div className="p-4 bg-red-50 rounded-lg text-center">
            <ThumbsDown className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-700">{stats.negatifs}</p>
            <p className="text-sm text-gray-600">Négatifs</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold text-orange-700">{stats.reclamations}</p>
            <p className="text-sm text-gray-600">Réclamations</p>
          </div>
        </div>

        {/* Total */}
        <div className="text-center text-sm text-gray-600">
          Total: {stats.totalRatings} avis
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Checklist d'Intégration

### Backend
- [ ] Créer l'entité `SupplierRating`
- [ ] Créer le service `SupplierRatingService`
- [ ] Créer le controller `SupplierRatingController`
- [ ] Enregistrer dans le module
- [ ] Tester les endpoints

### Frontend
- [ ] Créer le composant `SupplierRatingDialog`
- [ ] Créer le hook `useSupplierRating`
- [ ] Créer le service `supplierRatingService`
- [ ] Intégrer dans les composants existants
- [ ] Créer le composant `SupplierStats` (optionnel)
- [ ] Tester le flux complet

### Tests
- [ ] Test: Dialog s'ouvre à 30%
- [ ] Test: Dialog ne s'ouvre pas si déjà noté
- [ ] Test: Création d'un rating positif
- [ ] Test: Création d'un rating négatif avec réclamation
- [ ] Test: Mise à jour d'un rating existant
- [ ] Test: Calcul des statistiques
- [ ] Test: Résolution d'une réclamation

---

**Dernière mise à jour:** 28 avril 2026  
**Version:** 1.0.0  
**Auteur:** Équipe SmartSite
