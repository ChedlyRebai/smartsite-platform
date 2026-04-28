import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Package, Calendar, MapPin, Factory, Barcode, TrendingUp, Cloud, CloudRain, CloudSnow, Sun, Wind, CloudDrizzle, Truck, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import materialService, { Material } from '../../../services/materialService';
import materialFlowService from '../../../services/materialFlowService';
import weatherService from '../../../services/weatherService';
import AIPredictionWidget from '../../components/materials/AIPredictionWidget';
import MaterialWeatherWidget from '../../components/materials/MaterialWeatherWidget';
import { toast } from 'sonner';
interface MaterialDetailsProps {
  material: Material;
  onClose: () => void;
  onUpdate: () => void;
  onOrder?: (materialId: string, materialName: string, materialCode: string, materialCategory: string, siteId?: string, siteName?: string, siteCoordinates?: { lat: number; lng: number }) => void;
}

export default function MaterialDetails({ material, onClose, onUpdate, onOrder }: MaterialDetailsProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aggregateStats, setAggregateStats] = useState<{
    totalEntries: number;
    totalExits: number;
    netFlow: number;
    totalAnomalies: number;
  } | null>(null);

  useEffect(() => {
    loadMovements();
    loadAggregateStats();
  }, [material._id]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await materialService.getMovements(material._id);
      setMovements(data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAggregateStats = async () => {
    try {
      const stats = await materialFlowService.getAggregateStats(material._id, material.siteId);
      setAggregateStats(stats);
    } catch (error) {
      console.error('Error loading aggregate stats:', error);
    }
  };

  const handleReorder = () => {
    if (onOrder) {
      onOrder(
        material._id,
        material.name,
        material.code,
        material.category,
        material.siteId,
        material.siteName,
        material.siteCoordinates
      );
      onClose();
    } else {
      toast.error('Fonction de commande non disponible');
    }
  };

  const shouldShowOrderButton = () => {
    // Utiliser stockMinimum en priorité, sinon reorderPoint
    const threshold = material.stockMinimum || material.reorderPoint || material.minimumStock || 0;
    return material.quantity === 0 || material.quantity <= threshold;
  };

  const getStatusBadge = () => {
    const threshold = material.stockMinimum || material.reorderPoint || material.minimumStock || 0;
    
    if (material.quantity === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (material.quantity <= threshold) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Stock bas</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">En stock</Badge>;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            Détails du matériau: {material.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <Barcode className="h-4 w-4" />
                  <span>Code</span>
                </div>
                <p className="text-lg font-bold">{material.code}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <Factory className="h-4 w-4" />
                  <span>Catégorie</span>
                </div>
                <p className="text-lg font-bold">{material.category}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <Package className="h-4 w-4" />
                  <span>Quantité</span>
                </div>
                <p className="text-lg font-bold">{material.quantity} {material.unit}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>Chantier Assigné</span>
                </div>
                <p className="text-lg font-bold">{material.siteName || 'Non assigné'}</p>
                {material.siteCoordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {material.siteCoordinates.lat.toFixed(4)}, {material.siteCoordinates.lng.toFixed(4)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Météo du chantier - Nouveau MaterialWeatherWidget */}
          {(material.siteCoordinates || material.siteAddress || material.siteName) && (
            <MaterialWeatherWidget
              siteCoordinates={material.siteCoordinates}
              siteAddress={material.siteAddress}
              siteName={material.siteName}
              materialCategory={material.category}
              onWeatherUpdate={(weather) => {
                console.log('🌤️ Météo mise à jour:', weather);
              }}
            />
          )}

          {/* Prédiction IA - Nouveau AIPredictionWidget */}
          <AIPredictionWidget
            material={{
              _id: material._id,
              name: material.name,
              quantity: material.quantity,
              category: material.category,
              siteId: material.siteId,
              siteName: material.siteName,
              siteCoordinates: material.siteCoordinates,
              siteAddress: material.siteAddress
            }}
            onPredictionUpdate={(prediction) => {
              console.log('🤖 Prédiction mise à jour:', prediction);
            }}
          />

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Niveaux de stock
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Stock actuel:</span>
                  <span className="font-bold">{material.quantity} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock minimum:</span>
                  <span>{material.minimumStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock maximum:</span>
                  <span>{material.maximumStock} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Point de commande:</span>
                  <span>{material.reorderPoint} {material.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Statut:</span>
                  {getStatusBadge()}
                </div>
                {material.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date d'expiration:</span>
                    <span className={new Date(material.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                      {new Date(material.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {material.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fabricant:</span>
                    <span>{material.manufacturer}</span>
                  </div>
                   )}
                 </div>
               </CardContent>
             </Card>

            {/* Aggregated Flow Stats */}
            {aggregateStats && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Synthèse des Mouvements</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{aggregateStats.totalEntries}</p>
                      <p className="text-xs text-gray-500">Total Entrées</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{aggregateStats.totalExits}</p>
                      <p className="text-xs text-gray-500">Total Sorties</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${aggregateStats.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {aggregateStats.netFlow}
                      </p>
                      <p className="text-xs text-gray-500">Solde Net</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{aggregateStats.totalAnomalies}</p>
                      <p className="text-xs text-gray-500">Anomalies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Mouvements récents</h3>
              {loading ? (
                <p className="text-center py-4">Chargement...</p>
              ) : movements.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Aucun mouvement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {movements.slice(-5).reverse().map((movement, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className={`font-medium ${
                          movement.type === 'in' ? 'text-green-600' : 
                          movement.type === 'out' ? 'text-red-600' : 
                          movement.type === 'damage' ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {movement.type === 'in' ? '+' : 
                           movement.type === 'out' ? '-' : 
                           movement.type === 'damage' ? '✗' : ''} 
                          {movement.quantity} {material.unit}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(movement.date).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {movement.type === 'in' ? 'Entrée' : 
                         movement.type === 'out' ? 'Sortie' : 
                         movement.type === 'damage' ? 'Endommagé' : 
                         movement.type === 'reserve' ? 'Réservé' : movement.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {shouldShowOrderButton() && (
              <Button 
                onClick={handleReorder} 
                className={`${
                  material.quantity === 0 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                } text-white flex items-center gap-2`}
              >
                {material.quantity === 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Commander Urgent
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    Commander
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}