import { Briefcase, CheckCircle, Clock, FileUp } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { mockTasks } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function SubcontractorDashboard() {
  const user = useAuthStore((state) => state.user);
  const assignedTasks = mockTasks.filter(t => t.assignees.includes('10'));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subcontractor Portal</h1>
        <p className="text-gray-500 mt-1">Your assigned work - {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Assigned Tasks" value={assignedTasks.length} icon={Briefcase} subtitle="Active assignments" />
        <StatCard title="Completed" value={assignedTasks.filter(t => t.status === 'completed').length} icon={CheckCircle} subtitle="This month" />
        <StatCard title="In Progress" value={assignedTasks.filter(t => t.status === 'in_progress').length} icon={Clock} subtitle="Currently working" />
        <StatCard title="Documents" value={5} icon={FileUp} subtitle="Uploaded this month" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignedTasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  </div>
                  <Badge variant={
                    task.status === 'completed' ? 'secondary' :
                    task.status === 'in_progress' ? 'default' :
                    'outline'
                  }>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-semibold text-gray-900">{new Date(task.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-semibold text-gray-900">{new Date(task.plannedEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant={
                    task.priority === 'critical' ? 'destructive' :
                    task.priority === 'high' ? 'destructive' :
                    'outline'
                  } className="text-xs">
                    Priority: {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
