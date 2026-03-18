import { UserCog, Edit, Eye, Trash2, Plus, Search, RefreshCw, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { toast } from 'sonner';
import { getAllClients, createClient, updateClient, deleteClient } from '@/app/action/user.action';
import { User } from '@/app/types';

export default function Clients() {
  const user = useAuthStore((state) => state.user);
  const canManageClients = user && canEdit(user.role.name, 'clients');
  const [clients, setClients] = useState<User[]>([]);
  const [filteredClients, setFilteredClients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [editData, setEditData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    telephone: '', 
    address: '', 
    companyName: '' 
  }); 
  const [newClientData, setNewClientData] = useState({
    cin: '',
    firstName: '',
    lastName: '',
    email: '',
    telephone: '',
    address: '',
    companyName: ''
  });

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client => 
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.telephone?.toLowerCase().includes(query) ||
        client.companyName?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await getAllClients(token);
      if (res.status === 200) {
        setClients(res.data);
        toast.success('Clients loaded successfully');
      } else {
        toast.error(res.data || 'Failed to load clients');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (client: User) => {
    setSelectedClient(client);
    setViewDetailsOpen(true);
  };

  const handleEditClient = (client: User) => {
    setSelectedClient(client);
    setEditData({ 
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '', 
      telephone: client.telephone || '',
      address: client.address || '',
      companyName: client.companyName || ''
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.firstName || !editData.lastName || !editData.email || !editData.telephone) {
      toast.error('First name, last name, email, and phone are required');
      return;
    }

    if (!selectedClient) return;

    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await updateClient(selectedClient._id, editData, token);
      if (res.status === 200) {
        toast.success('Client updated successfully!');
        setEditOpen(false);
        loadClients();
      } else {
        toast.error(res.data || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.cin || !newClientData.firstName || !newClientData.lastName || 
        !newClientData.email || !newClientData.telephone) {
      toast.error('CIN, first name, last name, email, and phone are required');
      return;
    }

    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await createClient(newClientData, token);
      if (res.status === 201) {
        toast.success('Client created successfully!');
        setCreateOpen(false);
        setNewClientData({
          cin: '',
          firstName: '',
          lastName: '',
          email: '',
          telephone: '',
          address: '',
          companyName: ''
        });
        loadClients();
      } else {
        toast.error(res.data || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await deleteClient(selectedClient._id, token);
      if (res.status === 200) {
        toast.success('Client deleted successfully!');
        setDeleteOpen(false);
        setSelectedClient(null);
        loadClients();
      } else {
        toast.error(res.data || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (client: User) => {
    setSelectedClient(client);
    setDeleteOpen(true);
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
              <div key={client._id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{client.firstName} {client.lastName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{client.email} • {client.telephone}</p>
                       <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-gray-600"><strong>Projects:</strong> {client.projectsCount}</span>
                        {/* <span className="text-gray-600"><strong>Total Value:</strong> ${(client.totalValue / 1000000).toFixed(1)}M</span> */}
                      </div> 
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog open={viewDetailsOpen && selectedClient?._id === client._id} onOpenChange={setViewDetailsOpen}>
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
                              <p className="font-semibold text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-semibold text-gray-900">{selectedClient.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-semibold text-gray-900">{selectedClient.telephone}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Active Projects</p>
                                <p className="font-semibold text-gray-900">{selectedClient.projectsCount}</p>
                              </div>
                              {/* <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="font-semibold text-gray-900">${(selectedClient.totalValue / 1000000).toFixed(1)}M</p>
                              </div> */}
                            </div>
                            <Badge variant="secondary">Active Client</Badge>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600" onClick={() => setViewDetailsOpen(false)}>
                              Close
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Dialog open={editOpen && selectedClient?._id === client._id} onOpenChange={setEditOpen}>
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
                              value={editData.firstName}
                              onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-last-name">Last Name</Label>
                            <Input
                              id="edit-last-name"
                              value={editData.lastName}
                              onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
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
                              value={editData.telephone}
                              onChange={(e) => setEditData({ ...editData, telephone: e.target.value })}
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
