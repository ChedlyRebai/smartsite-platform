import { Briefcase, DollarSign, TrendingUp, AlertTriangle, Target, Calendar } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { mockProjects } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';

const performanceData = [
  { month: 'Sep', revenue: 1200000, profit: 180000 },
  { month: 'Oct', revenue: 1500000, profit: 240000 },
  { month: 'Nov', revenue: 1800000, profit: 310000 },
  { month: 'Dec', revenue: 2100000, profit: 350000 },
  { month: 'Jan', revenue: 2400000, profit: 420000 },
  { month: 'Feb', revenue: 2700000, profit: 480000 },
];

export default function DirectorDashboard() {
  const user = useAuthStore((state) => state.user);
  const totalRevenue = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const onTrackProjects = mockProjects.filter(p => p.progress >= 30).length;
  const totalProjects = mockProjects.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Overview</h1>
        <p className="text-gray-500 mt-1">Strategic Business Dashboard - {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend={{ value: 18.5, isPositive: true }}
        />
        <StatCard
          title="Active Projects"
          value={totalProjects}
          icon={Briefcase}
          subtitle="Across all sites"
        />
        <StatCard
          title="Profit Margin"
          value="17.8%"
          icon={TrendingUp}
          trend={{ value: 2.3, isPositive: true }}
        />
        <StatCard
          title="On-Track Projects"
          value={`${onTrackProjects}/${totalProjects}`}
          icon={Target}
          subtitle={`${Math.round((onTrackProjects/totalProjects)*100)}% success rate`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="profit" fill="#10b981" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategic Projects Overview</CardTitle>
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
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-semibold text-gray-900">${(project.budget / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-semibold text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-semibold text-gray-900">{new Date(project.plannedEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
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
    </div>
  );
}
