import { Building2, Users, Briefcase, DollarSign, AlertTriangle, TrendingUp, Shield, Clock } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { mockProjects, mockSites, mockIncidents, mockTeamMembers } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

const projectStatusData = [
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'Planning', value: 3, color: '#f59e0b' },
  { name: 'On Hold', value: 2, color: '#ef4444' },
  { name: 'Completed', value: 12, color: '#10b981' },
];

const monthlyBudgetData = [
  { month: 'Sep', budget: 1200000, spent: 980000 },
  { month: 'Oct', budget: 1500000, spent: 1350000 },
  { month: 'Nov', budget: 1800000, spent: 1620000 },
  { month: 'Dec', budget: 2100000, spent: 1890000 },
  { month: 'Jan', budget: 2400000, spent: 2160000 },
  { month: 'Feb', budget: 2700000, spent: 2200000 },
];

export default function SuperAdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const activeProjects = mockProjects.filter(p => p.status === 'in_progress').length;
  const activeSites = mockSites.filter(s => s.status === 'in_progress').length;
  const activeUsers = mockTeamMembers.filter(u => u.isActive).length;
  const criticalIncidents = mockIncidents.filter(i => i.severity === 'high' || i.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-500 mt-1">System Overview - Super Administrator Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={mockProjects.length}
          icon={Briefcase}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Active Sites"
          value={activeSites}
          icon={Building2}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Team Members"
          value={activeUsers + 10}
          icon={Users}
          subtitle={`${activeUsers} active`}
        />
        <StatCard
          title="Total Budget"
          value={`$${(totalBudget / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend={{ value: 15.3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={TrendingUp}
          subtitle="Currently ongoing"
        />
        <StatCard
          title="Critical Incidents"
          value={criticalIncidents}
          icon={AlertTriangle}
          trend={{ value: 25, isPositive: false }}
        />
        <StatCard
          title="Safety Score"
          value="92%"
          icon={Shield}
          trend={{ value: 3.5, isPositive: true }}
        />
        <StatCard
          title="On-Time Delivery"
          value="85%"
          icon={Clock}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview - Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyBudgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="budget" fill="#3b82f6" name="Budgeted" />
                <Bar dataKey="spent" fill="#10b981" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <Badge variant={
                      project.status === 'in_progress' ? 'default' :
                      project.status === 'completed' ? 'secondary' :
                      project.status === 'on_hold' ? 'destructive' :
                      'outline'
                    }>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{project.code} • Budget: ${project.budget.toLocaleString()}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents & Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockIncidents.map((incident) => (
              <div key={incident.id} className="flex items-start gap-3 p-3 border rounded-lg">
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
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-900">{incident.type.toUpperCase()}</h4>
                    <Badge variant={incident.status === 'resolved' ? 'secondary' : 'destructive'} className="text-xs">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(incident.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
