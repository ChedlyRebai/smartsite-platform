import { ListTodo, CheckCircle, Clock, Calendar } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { mockTasks } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const myTasks = mockTasks.slice(0, 2); // Simulate user's tasks
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.firstName} - Your daily tasks and activities</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Tasks" value={myTasks.length} icon={ListTodo} subtitle="Assigned to you" />
        <StatCard title="Completed" value={myTasks.filter(t => t.status === 'completed').length} icon={CheckCircle} subtitle="This week" />
        <StatCard title="In Progress" value={myTasks.filter(t => t.status === 'in_progress').length} icon={Clock} subtitle="Currently working" />
        <StatCard title="This Week" value={myTasks.length} icon={Calendar} subtitle="Upcoming tasks" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myTasks.map((task) => (
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
                <div className="flex items-center gap-4 text-sm mt-3">
                  <div>
                    <span className="text-gray-500">Due: </span>
                    <span className="font-semibold text-gray-900">{new Date(task.plannedEndDate).toLocaleDateString()}</span>
                  </div>
                  <Badge variant={task.priority === 'critical' || task.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <h4 className="font-semibold text-gray-900 mb-1">Clock In/Out</h4>
              <p className="text-sm text-gray-500">Log your working hours</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <h4 className="font-semibold text-gray-900 mb-1">Report Issue</h4>
              <p className="text-sm text-gray-500">Submit a safety or quality concern</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <h4 className="font-semibold text-gray-900 mb-1">View Schedule</h4>
              <p className="text-sm text-gray-500">Check your weekly schedule</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <h4 className="font-semibold text-gray-900 mb-1">Request Time Off</h4>
              <p className="text-sm text-gray-500">Submit leave request</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
