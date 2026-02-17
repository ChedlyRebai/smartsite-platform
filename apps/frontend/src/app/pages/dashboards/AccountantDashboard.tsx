import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { mockProjects } from '../../utils/mockData';
import { useAuthStore } from '../../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const financialData = [
  { month: 'Sep', income: 980000, expenses: 750000 },
  { month: 'Oct', income: 1350000, expenses: 1020000 },
  { month: 'Nov', income: 1620000, expenses: 1250000 },
  { month: 'Dec', income: 1890000, expenses: 1480000 },
  { month: 'Jan', income: 2160000, expenses: 1680000 },
  { month: 'Feb', income: 2200000, expenses: 1750000 },
];

export default function AccountantDashboard() {
  const user = useAuthStore((state) => state.user);
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Control Dashboard</h1>
        <p className="text-gray-500 mt-1">Budget tracking and financial analysis - {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Budget" value={`$${(totalBudget / 1000000).toFixed(1)}M`} icon={DollarSign} trend={{ value: 15, isPositive: true }} />
        <StatCard title="Revenue (MTD)" value="$2.2M" icon={TrendingUp} subtitle="Month to date" />
        <StatCard title="Expenses (MTD)" value="$1.75M" icon={TrendingDown} subtitle="Month to date" />
        <StatCard title="Profit Margin" value="20.5%" icon={PieChart} trend={{ value: 3.2, isPositive: true }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses - Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-500">{project.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${(project.budget / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-gray-500">{project.progress}% spent</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
