import { HardHat, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { mockTasks, mockIncidents } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function SiteManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Site Operations Dashboard</h1>
        <p className="text-gray-500 mt-1">Daily site management - {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Workers" value={24} icon={Users} subtitle="On site today" />
        <StatCard title="Tasks Today" value={mockTasks.length} icon={HardHat} trend={{ value: 3, isPositive: true }} />
        <StatCard title="Safety Incidents" value={mockIncidents.length} icon={AlertTriangle} subtitle="This week" />
        <StatCard title="Completed Tasks" value={mockTasks.filter(t => t.status === 'completed').length} icon={CheckCircle} trend={{ value: 12, isPositive: true }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                </div>
                <Badge variant={task.status === 'completed' ? 'secondary' : 'default'}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
