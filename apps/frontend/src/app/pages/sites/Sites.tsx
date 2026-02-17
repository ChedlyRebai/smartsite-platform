import { useState } from 'react';
import { Plus, MapPin, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { mockSites } from '../../utils/mockData';
import { toast } from 'sonner';

export default function Sites() {
  const user = useAuthStore((state) => state.user);
  const canManageSites = user && canEdit(user.role, 'sites');
  const [searchTerm, setSearchTerm] = useState('');
  const [sites, setSites] = useState(mockSites);
  const [newSite, setNewSite] = useState({ name: '', address: '', area: '', budget: '' });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [manageData, setManageData] = useState({ status: '', progress: 0 });

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || site.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddSite = () => {
    if (!newSite.name || !newSite.address || !newSite.area || !newSite.budget) {
      toast.error('All fields are required');
      return;
    }
    const site = {
      id: sites.length + 1,
      name: newSite.name,
      address: newSite.address,
      status: 'planning' as const,
      area: parseInt(newSite.area),
      budget: parseInt(newSite.budget),
      progress: 0,
      workStartDate: new Date().toISOString(),
      managerId: 0,
    };
    setSites([...sites, site]);
    setNewSite({ name: '', address: '', area: '', budget: '' });
    toast.success('Site added successfully!');
  };

  const handleViewDetails = (site: any) => {
    setSelectedSite(site);
    setViewDetailsOpen(true);
  };

  const handleManageSite = (site: any) => {
    setSelectedSite(site);
    setManageData({ status: site.status, progress: site.progress });
    setManageDialogOpen(true);
  };

  const handleSaveManage = () => {
    if (!manageData.status) {
      toast.error('Status is required');
      return;
    }
    setSites(sites.map(s => 
      s.id === selectedSite.id 
        ? { ...s, status: manageData.status, progress: manageData.progress }
        : s
    ));
    setManageDialogOpen(false);
    toast.success('Site updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Construction Sites</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all construction sites</p>
        </div>
        {canManageSites ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Construction Site</DialogTitle>
              <DialogDescription>
                Register a new construction site to your projects
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  placeholder="e.g., Downtown Office Tower"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main Street"
                  value={newSite.address}
                  onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="e.g., 5000"
                    value={newSite.area}
                    onChange={(e) => setNewSite({ ...newSite, area: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 2500000"
                    value={newSite.budget}
                    onChange={(e) => setNewSite({ ...newSite, budget: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleAddSite}
              >
                Create Site
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />
            Add New Site (No Permission)
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Sites</DialogTitle>
                  <DialogDescription>
                    Filter sites by status
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {['all', 'planning', 'in_progress', 'on_hold', 'completed'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status === 'all' ? 'All Sites' : status.replace('_', ' ').toUpperCase()}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => (
              <Card key={site.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{site.name}</CardTitle>
                      </div>
                    </div>
                    <Badge variant={
                      site.status === 'in_progress' ? 'default' :
                      site.status === 'completed' ? 'secondary' :
                      site.status === 'on_hold' ? 'destructive' :
                      'outline'
                    }>
                      {site.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">{site.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Area</p>
                      <p className="font-semibold text-gray-900">{site.area} m²</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Budget</p>
                      <p className="font-semibold text-gray-900">${(site.budget / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Date: {new Date(site.workStartDate).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{site.progress}%</span>
                    </div>
                    <Progress value={site.progress} className="h-2" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog open={viewDetailsOpen && selectedSite?.id === site.id} onOpenChange={setViewDetailsOpen}>
                      <DialogTrigger asChild onClick={() => handleViewDetails(site)}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Site Details</DialogTitle>
                        </DialogHeader>
                        {selectedSite && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600">Site Name</p>
                              <p className="font-semibold text-gray-900">{selectedSite.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-semibold text-gray-900">{selectedSite.address}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Area</p>
                                <p className="font-semibold text-gray-900">{selectedSite.area} m²</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Budget</p>
                                <p className="font-semibold text-gray-900">${(selectedSite.budget / 1000000).toFixed(1)}M</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <Badge>{selectedSite.status.replace('_', ' ')}</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Progress: {selectedSite.progress}%</p>
                              <Progress value={selectedSite.progress} className="h-2" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Start Date</p>
                              <p className="font-semibold text-gray-900">{new Date(selectedSite.workStartDate).toLocaleDateString()}</p>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600" onClick={() => setViewDetailsOpen(false)}>
                              Close
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Dialog open={manageDialogOpen && selectedSite?.id === site.id} onOpenChange={setManageDialogOpen}>
                      <DialogTrigger asChild onClick={() => handleManageSite(site)}>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
                        >
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Site</DialogTitle>
                          <DialogDescription>Update site status and progress</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="site-status">Status</Label>
                            <select
                              id="site-status"
                              className="w-full px-3 py-2 border rounded-md"
                              value={manageData.status}
                              onChange={(e) => setManageData({ ...manageData, status: e.target.value })}
                            >
                              <option value="planning">Planning</option>
                              <option value="in_progress">In Progress</option>
                              <option value="on_hold">On Hold</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="site-progress">Progress (%)</Label>
                            <Input
                              id="site-progress"
                              type="number"
                              min="0"
                              max="100"
                              value={manageData.progress}
                              onChange={(e) => setManageData({ ...manageData, progress: parseInt(e.target.value) })}
                            />
                          </div>
                          <div className="bg-blue-50 p-3 rounded text-sm">
                            <p><strong>Site:</strong> {selectedSite?.name}</p>
                            <p><strong>Address:</strong> {selectedSite?.address}</p>
                          </div>
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                            onClick={handleSaveManage}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
