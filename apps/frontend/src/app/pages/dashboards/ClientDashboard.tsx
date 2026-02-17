import { Eye, Calendar, DollarSign, FileText } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { mockProjects, mockSites } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function ClientDashboard() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
        <p className="text-gray-500 mt-1">Track your project progress - Welcome, {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Projects" value={mockProjects.length} icon={Eye} subtitle="In your portfolio" />
        <StatCard title="Average Progress" value="40%" icon={Calendar} subtitle="Across all projects" />
        <StatCard title="Total Investment" value="$16M" icon={DollarSign} subtitle="Total project value" />
        <StatCard title="Reports Available" value={8} icon={FileText} subtitle="Ready to view" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{project.code}</p>
                  </div>
                  <Badge variant={project.status === 'in_progress' ? 'default' : 'secondary'}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-semibold text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expected Completion</p>
                    <p className="font-semibold text-gray-900">{new Date(project.plannedEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Site Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockSites.map((site) => (
              <div key={site.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{site.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{site.address}</p>
                <Progress value={site.progress} className="h-2 mb-2" />
                <p className="text-sm text-gray-600">{site.progress}% Complete</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
