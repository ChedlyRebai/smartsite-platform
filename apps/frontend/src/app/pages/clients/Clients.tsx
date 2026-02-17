import { UserCog, Edit, Eye } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { mockClients } from '../../utils/mockData';
import { toast } from 'sonner';

export default function Clients() {
  const user = useAuthStore((state) => state.user);
  const canManageClients = user && canEdit(user.role, 'clients');
  const [clients, setClients] = useState(mockClients);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '' });

  const handleViewDetails = (client: any) => {
    setSelectedClient(client);
    setViewDetailsOpen(true);
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setEditData({ name: client.name, email: client.email, phone: client.phone });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editData.name || !editData.email || !editData.phone) {
      toast.error('All fields are required');
      return;
    }
    setClients(clients.map(c => 
      c.id === selectedClient.id 
        ? { ...c, name: editData.name, email: editData.email, phone: editData.phone }
        : c
    ));
    setEditOpen(false);
    toast.success('Client updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-500 mt-1">Manage client relationships</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Client Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{client.email} • {client.phone}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="text-gray-600"><strong>Projects:</strong> {client.projects}</span>
                      <span className="text-gray-600"><strong>Total Value:</strong> ${(client.totalValue / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog open={viewDetailsOpen && selectedClient?.id === client.id} onOpenChange={setViewDetailsOpen}>
                      <DialogTrigger asChild onClick={() => handleViewDetails(client)}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Client Details</DialogTitle>
                        </DialogHeader>
                        {selectedClient && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600">Client Name</p>
                              <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-semibold text-gray-900">{selectedClient.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-semibold text-gray-900">{selectedClient.phone}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Active Projects</p>
                                <p className="font-semibold text-gray-900">{selectedClient.projects}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="font-semibold text-gray-900">${(selectedClient.totalValue / 1000000).toFixed(1)}M</p>
                              </div>
                            </div>
                            <Badge variant="secondary">Active Client</Badge>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600" onClick={() => setViewDetailsOpen(false)}>
                              Close
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Dialog open={editOpen && selectedClient?.id === client.id} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild onClick={() => handleEditClient(client)}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Client</DialogTitle>
                          <DialogDescription>Update client information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Client Name</Label>
                            <Input
                              id="edit-name"
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={editData.email}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                              id="edit-phone"
                              value={editData.phone}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            />
                          </div>
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                            onClick={handleSaveEdit}
                          >
                            Save Changes
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
