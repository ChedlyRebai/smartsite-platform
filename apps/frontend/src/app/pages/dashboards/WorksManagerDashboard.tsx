import { Building2, MapPin, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { mockSites, mockProjects } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function WorksManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Works Management Overview</h1>
        <p className="text-gray-500 mt-1">Multi-site supervision - {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sites" value={mockSites.length} icon={Building2} subtitle="Under supervision" />
        <StatCard title="Active Sites" value={mockSites.filter(s => s.status === 'in_progress').length} icon={MapPin} trend={{ value: 10, isPositive: true }} />
        <StatCard title="Overall Progress" value="42%" icon={TrendingUp} subtitle="Average across sites" />
        <StatCard title="Total Workforce" value={156} icon={Users} subtitle="Across all sites" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sites Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSites.map((site) => (
              <div key={site.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{site.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{site.address}</p>
                <Progress value={site.progress} className="h-2 mb-2" />
                <p className="text-sm text-gray-600">Progress: {site.progress}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
