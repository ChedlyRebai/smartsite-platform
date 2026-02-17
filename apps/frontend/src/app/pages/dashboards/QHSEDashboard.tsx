import { Shield, AlertTriangle, CheckCircle, HardHat } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { mockIncidents } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function QHSEDashboard() {
  const user = useAuthStore((state) => state.user);
  const openIncidents = mockIncidents.filter(i => i.status !== 'closed').length;
  const resolvedIncidents = mockIncidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QHSE & Safety Dashboard</h1>
        <p className="text-gray-500 mt-1">Safety monitoring and compliance - {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Safety Score" value="92%" icon={Shield} trend={{ value: 5, isPositive: true }} />
        <StatCard title="Open Incidents" value={openIncidents} icon={AlertTriangle} trend={{ value: 15, isPositive: false }} />
        <StatCard title="Resolved Incidents" value={resolvedIncidents} icon={CheckCircle} subtitle="This month" />
        <StatCard title="Compliance Rate" value="96%" icon={HardHat} trend={{ value: 2, isPositive: true }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Safety Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockIncidents.map((incident) => (
              <div key={incident.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      incident.severity === 'critical' ? 'bg-red-100' :
                      incident.severity === 'high' ? 'bg-orange-100' :
                      incident.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        incident.severity === 'critical' ? 'text-red-600' :
                        incident.severity === 'high' ? 'text-orange-600' :
                        incident.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{incident.type.toUpperCase()}</h4>
                      <p className="text-sm text-gray-500">{incident.description}</p>
                    </div>
                  </div>
                  <Badge variant={incident.status === 'resolved' || incident.status === 'closed' ? 'secondary' : 'destructive'}>
                    {incident.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span>Severity: {incident.severity}</span>
                  <span>•</span>
                  <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { item: 'PPE Inspection', status: 'completed', date: '2026-02-17' },
              { item: 'Site Safety Audit', status: 'in_progress', date: '2026-02-17' },
              { item: 'Equipment Certification', status: 'completed', date: '2026-02-15' },
              { item: 'Emergency Drill', status: 'pending', date: '2026-02-20' },
              { item: 'Safety Training Session', status: 'completed', date: '2026-02-10' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {item.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : item.status === 'in_progress' ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">{item.item}</span>
                </div>
                <span className="text-sm text-gray-500">{item.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
