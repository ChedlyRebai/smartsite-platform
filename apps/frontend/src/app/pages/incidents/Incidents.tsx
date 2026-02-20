import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { mockIncidents } from '../../utils/mockData';
import { toast } from 'sonner';

export default function Incidents() {
  const user = useAuthStore((state) => state.user);
  const canManageIncidents = user && canEdit(user.role, 'incidents');
  const [incidents, setIncidents] = useState(mockIncidents);
  const [newIncident, setNewIncident] = useState({ type: '', description: '', severity: 'medium' });

  const handleAddIncident = () => {
    if (!newIncident.type || !newIncident.description) {
      toast.error('All fields are required');
      return;
    }
    const incident = {
      id: incidents.length + 1,
      type: newIncident.type,
      description: newIncident.description,
      severity: newIncident.severity as 'low' | 'medium' | 'high' | 'critical',
      status: 'open',
      createdAt: new Date().toISOString(),
      reportedBy: 'Current User',
    };
    setIncidents([...incidents, incident]);
    setNewIncident({ type: '', description: '', severity: 'medium' });
    toast.success('Incident reported successfully!');
  };

  const handleResolveIncident = (id: number) => {
    setIncidents(incidents.map(i => 
      i.id === id ? { ...i, status: 'resolved' } : i
    ));
    toast.success('Incident marked as resolved');
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-gray-500 mt-1">Track and resolve safety and quality incidents</p>
        </div>
        {canManageIncidents ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              + Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>
                Document a safety or quality incident
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incident-type">Incident Type</Label>
                <Input
                  id="incident-type"
                  placeholder="e.g., Safety Hazard, Quality Issue"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Describe the incident in detail"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select 
                  id="severity"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleAddIncident}
              >
                Report Incident
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            + Report Incident (No Permission)
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            All Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No incidents reported</p>
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{incident.type.toUpperCase()}</h3>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(incident.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant={
                          incident.severity === 'critical' || incident.severity === 'high' ? 'destructive' : 
                          incident.severity === 'medium' ? 'default' : 'secondary'
                        }
                      >
                        {incident.severity}
                      </Badge>
                      <Badge variant={incident.status === 'resolved' || incident.status === 'closed' ? 'secondary' : 'destructive'}>
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                  {incident.status !== 'resolved' && incident.status !== 'closed' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => handleResolveIncident(incident.id)}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
