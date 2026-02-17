import { Warehouse } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { mockSuppliers } from '../../utils/mockData';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { toast } from 'sonner';

export default function Suppliers() {
  const user = useAuthStore((state) => state.user);
  const canManageSuppliers = user && canEdit(user.role, 'suppliers');
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [newSupplier, setNewSupplier] = useState({ name: '', category: '', email: '', phone: '' });
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [contactData, setContactData] = useState({ message: '', subject: '' });

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.category || !newSupplier.email || !newSupplier.phone) {
      toast.error('All fields are required');
      return;
    }
    const supplier = {
      id: suppliers.length + 1,
      name: newSupplier.name,
      category: newSupplier.category,
      email: newSupplier.email,
      phone: newSupplier.phone,
      rating: 4.5,
      joinDate: new Date().toISOString(),
    };
    setSuppliers([...suppliers, supplier]);
    setNewSupplier({ name: '', category: '', email: '', phone: '' });
    toast.success('Supplier added successfully!');
  };

  const handleContactSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setContactData({ message: '', subject: '' });
    setContactDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!contactData.subject || !contactData.message) {
      toast.error('Subject and message are required');
      return;
    }
    toast.success(`Message sent to ${selectedSupplier.name}`);
    setContactDialogOpen(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage supplier relationships and orders</p>
        </div>
        {canManageSuppliers ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              + Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Register a new supplier for your projects
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sup-name">Supplier Name</Label>
                <Input
                  id="sup-name"
                  placeholder="e.g., ABC Construction Suppliers"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Concrete, Steel, Lumber"
                  value={newSupplier.category}
                  onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-email">Email</Label>
                <Input
                  id="sup-email"
                  type="email"
                  placeholder="contact@supplier.com"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-phone">Phone</Label>
                <Input
                  id="sup-phone"
                  placeholder="+216 12 345 678"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleAddSupplier}
              >
                Add Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            + Add Supplier (No Permission)
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Supplier Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{supplier.category}</p>
                    <p className="text-sm text-gray-600 mt-2">{supplier.email} • {supplier.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">Rating: {supplier.rating}/5</Badge>
                    <Dialog open={contactDialogOpen && selectedSupplier?.id === supplier.id} onOpenChange={setContactDialogOpen}>
                      <DialogTrigger asChild onClick={() => handleContactSupplier(supplier)}>
                        <Button size="sm" variant="outline">
                          Contact
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact {selectedSupplier?.name}</DialogTitle>
                          <DialogDescription>
                            Send a message to the supplier
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-3 rounded text-sm">
                            <p><strong>Email:</strong> {selectedSupplier?.email}</p>
                            <p><strong>Phone:</strong> {selectedSupplier?.phone}</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              placeholder="e.g., Quote Request for Concrete Supplies"
                              value={contactData.subject}
                              onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <textarea
                              id="message"
                              placeholder="Type your message here..."
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              rows={4}
                              value={contactData.message}
                              onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                            />
                          </div>
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                            onClick={handleSendMessage}
                          >
                            Send Message
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
