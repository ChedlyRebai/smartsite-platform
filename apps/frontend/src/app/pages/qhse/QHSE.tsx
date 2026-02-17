import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { mockIncidents } from '../../utils/mockData';

export default function QHSE() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QHSE & Safety</h1>
        <p className="text-gray-500 mt-1">Quality, Health, Safety & Environment Management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockIncidents.map((incident) => (
                <div key={incident.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        incident.severity === 'critical' ? 'text-red-600' :
                        incident.severity === 'high' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                      <h4 className="font-semibold text-sm">{incident.type.toUpperCase()}</h4>
                    </div>
                    <Badge variant={incident.status === 'resolved' ? 'secondary' : 'destructive'}>
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{incident.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-green-50">
                <h4 className="font-semibold text-sm text-green-900">PPE Compliance</h4>
                <p className="text-sm text-green-700 mt-1">96% compliance rate</p>
              </div>
              <div className="p-3 border rounded-lg bg-green-50">
                <h4 className="font-semibold text-sm text-green-900">Safety Training</h4>
                <p className="text-sm text-green-700 mt-1">All personnel certified</p>
              </div>
              <div className="p-3 border rounded-lg bg-yellow-50">
                <h4 className="font-semibold text-sm text-yellow-900">Equipment Inspection</h4>
                <p className="text-sm text-yellow-700 mt-1">2 items pending review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
