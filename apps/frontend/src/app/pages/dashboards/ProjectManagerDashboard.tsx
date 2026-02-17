import { Calendar, CheckCircle2, Clock, AlertCircle, Users, ListTodo } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { mockProjects, mockTasks, mockSites } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function ProjectManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  const activeTasks = mockTasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = mockTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = mockTasks.filter(t => t.status === 'todo').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Management Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.firstName} - Track and manage your projects</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Projects" value={mockProjects.length} icon={Calendar} subtitle="Currently managing" />
        <StatCard title="Active Tasks" value={activeTasks} icon={ListTodo} trend={{ value: 5, isPositive: true }} />
        <StatCard title="Completed Tasks" value={completedTasks} icon={CheckCircle2} subtitle="This month" />
        <StatCard title="Pending Tasks" value={pendingTasks} icon={Clock} trend={{ value: 8, isPositive: false }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <Badge>{project.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{project.code}</p>
                  <Progress value={project.progress} className="h-2 mb-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress: {project.progress}%</span>
                    <span className="text-gray-600">{project.estimatedHours}h estimated</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    task.status === 'completed' ? 'bg-green-100' :
                    task.status === 'in_progress' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={task.priority === 'critical' ? 'destructive' : 'outline'} className="text-xs">
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{task.workedHours}h worked</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sites Under Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockSites.map((site) => (
              <div key={site.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{site.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{site.address}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-semibold">{site.area} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-semibold">${(site.budget / 1000000).toFixed(1)}M</span>
                  </div>
                  <Progress value={site.progress} className="h-2 mt-2" />
                  <p className="text-sm text-gray-600 text-center">{site.progress}% Complete</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
