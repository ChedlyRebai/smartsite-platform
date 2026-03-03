import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import materialService, { Material, CreateMaterialData } from '../../../services/materialService';

interface MaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Material | null;
}

export default function MaterialForm({ open, onClose, onSuccess, initialData }: MaterialFormProps) {
  const [formData, setFormData] = useState<CreateMaterialData>({
    name: '',
    code: '',
    category: '',
    unit: '',
    quantity: 0,
    minimumStock: 10,
    maximumStock: 100,
    reorderPoint: 20,
    location: '',
    manufacturer: '',
    expiryDate: '',
  });

  const [loading, setLoading] = useState(false);

  // Charger les données initiales si en mode édition
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        category: initialData.category || '',
        unit: initialData.unit || '',
        quantity: initialData.quantity || 0,
        minimumStock: initialData.minimumStock || 10,
        maximumStock: initialData.maximumStock || 100,
        reorderPoint: initialData.reorderPoint || 20,
        location: initialData.location || '',
        manufacturer: initialData.manufacturer || '',
        expiryDate: initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '',
      });
    } else {
      // Réinitialiser le formulaire en mode création
      setFormData({
        name: '',
        code: '',
        category: '',
        unit: '',
        quantity: 0,
        minimumStock: 10,
        maximumStock: 100,
        reorderPoint: 20,
        location: '',
        manufacturer: '',
        expiryDate: '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        // Mode édition
        await materialService.updateMaterial(initialData._id, formData);
        toast.success('Matériau modifié avec succès!');
      } else {
        // Mode création
        await materialService.createMaterial(formData);
        toast.success('Matériau ajouté avec succès!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Opération échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Modifier le matériau' : 'Ajouter un matériau'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifiez les informations ci-dessous.' : 'Remplissez les détails du matériau ci-dessous.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Input
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unité *</Label>
                <Input
                  id="unit"
                  required
                  placeholder="kg, m³, unités..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité initiale</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  placeholder="Entrepôt A, Étagère 1"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Stock minimum</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumStock">Stock maximum</Label>
                <Input
                  id="maximumStock"
                  type="number"
                  min="0"
                  value={formData.maximumStock}
                  onChange={(e) => setFormData({ ...formData, maximumStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Point de commande</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricant</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Date d'expiration</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}