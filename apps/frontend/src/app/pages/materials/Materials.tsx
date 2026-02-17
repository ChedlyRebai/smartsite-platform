import { Package } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { toast } from 'sonner';

export default function Materials() {
  const user = useAuthStore((state) => state.user);
  const canManageMaterials = user && canEdit(user.role, 'materials');
  const [materials, setMaterials] = useState([
    { id: 1, name: 'Concrete (m³)', quantity: 150, unit: 'm³', status: 'in_stock' },
    { id: 2, name: 'Steel Rebar (kg)', quantity: 5000, unit: 'kg', status: 'in_stock' },
    { id: 3, name: 'Bricks (units)', quantity: 10000, unit: 'units', status: 'low' },
    { id: 4, name: 'Cement Bags', quantity: 200, unit: 'bags', status: 'in_stock' },
  ]);
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', unit: '' });
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [updateData, setUpdateData] = useState({ quantity: '', status: '' });

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.quantity || !newMaterial.unit) {
      toast.error('All fields are required');
      return;
    }
    const material = { 
      id: materials.length + 1, 
      name: newMaterial.name,
      quantity: parseInt(newMaterial.quantity),
      unit: newMaterial.unit,
      status: 'in_stock'
    };
    setMaterials([...materials, material]);
    setNewMaterial({ name: '', quantity: '', unit: '' });
    toast.success('Material added successfully!');
  };

  const handleUpdateMaterial = (material: any) => {
    setSelectedMaterial(material);
    setUpdateData({ quantity: material.quantity.toString(), status: material.status });
    setUpdateDialogOpen(true);
  };

  const handleSaveUpdate = () => {
    if (!updateData.quantity || !updateData.status) {
      toast.error('All fields are required');
      return;
    }
    setMaterials(materials.map(m => 
      m.id === selectedMaterial.id 
        ? { ...m, quantity: parseInt(updateData.quantity), status: updateData.status }
        : m
    ));
    setUpdateDialogOpen(false);
    toast.success('Material updated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materials Inventory</h1>
          <p className="text-gray-500 mt-1">Track and manage construction materials</p>
        </div>
        {canManageMaterials ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              + Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>
                Add a new material to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mat-name">Material Name</Label>
                <Input
                  id="mat-name"
                  placeholder="e.g., Concrete"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 100"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g., m³, kg, units"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleAddMaterial}
              >
                Add to Inventory
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            + Add Material (No Permission)
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{material.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    In Stock: {material.quantity} {material.unit}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(material.status)}>
                    {material.status === 'in_stock' ? 'In Stock' : material.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                  </Badge>
                  {canManageMaterials ? (
                  <Dialog open={updateDialogOpen && selectedMaterial?.id === material.id} onOpenChange={setUpdateDialogOpen}>
                    <DialogTrigger asChild onClick={() => handleUpdateMaterial(material)}>
                      <Button size="sm" variant="outline">
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Material</DialogTitle>
                        <DialogDescription>Update quantity and status for {selectedMaterial?.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="update-qty">Quantity</Label>
                          <Input
                            id="update-qty"
                            type="number"
                            value={updateData.quantity}
                            onChange={(e) => setUpdateData({ ...updateData, quantity: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="update-status">Status</Label>
                          <select
                            id="update-status"
                            className="w-full px-3 py-2 border rounded-md"
                            value={updateData.status}
                            onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                          >
                            <option value="in_stock">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                          onClick={handleSaveUpdate}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="opacity-50 cursor-not-allowed">
                      Update
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
