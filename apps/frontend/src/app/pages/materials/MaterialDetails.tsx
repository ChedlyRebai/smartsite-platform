import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Package, Calendar, MapPin, Factory, Barcode, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import materialService, { Material } from '../../../services/materialService';
import { toast } from 'sonner';

interface MaterialDetailsProps {
  material: Material;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MaterialDetails({ material, onClose, onUpdate }: MaterialDetailsProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMovements();
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

  const handleReorder = async () => {
    try {
      const result = await materialService.reorderMaterial(material._id);
      if (result.success) {
        toast.success(`Commande créée! Livraison prévue: ${new Date(result.expectedDelivery).toLocaleDateString()}`);
      } else {
        toast.warning(result.message || 'Commande initiée');
      }
      onUpdate();
    } catch (error) {
      toast.error('Échec de la commande');
    }
  };

  const getStatusBadge = () => {
    if (material.quantity === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    }
    if (material.quantity <= material.reorderPoint) {
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
          {/* Info Cards */}
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
                  <span>Emplacement</span>
                </div>
                <p className="text-lg font-bold">{material.location || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock Levels */}
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

          {/* Recent Movements */}
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {material.quantity <= material.reorderPoint && (
              <Button onClick={handleReorder} variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Commander
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}