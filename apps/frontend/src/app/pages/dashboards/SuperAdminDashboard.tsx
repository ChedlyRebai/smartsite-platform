import { Building2, Users, Briefcase, DollarSign, AlertTriangle, TrendingUp, Shield, Clock, MapPin, Calendar, Target, Search } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import {
  getDashboardStats,
  type Site,
  type Project,
  type Task,
  type TeamMember,
  type Incident
} from '../../action/dashboard.action';
import { useState, useEffect, useMemo } from 'react';
import { incidentMatchesSearch, taskMatchesSearch } from '../../utils/incidentSearchFilter';

export default function SuperAdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [urgentSectionSearch, setUrgentSectionSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Utiliser les données réelles ou des valeurs par défaut
  const stats = dashboardData?.stats || {};
  const sites = dashboardData?.sites || [];
  const projects = dashboardData?.projects || [];
  const urgentTasks = dashboardData?.urgentTasks || [];
  const incidents = dashboardData?.incidents || [];
  const teamMembers = dashboardData?.teamMembers || [];

  const filteredUrgentTasks = useMemo(
    () => urgentTasks.filter((task: Task) => taskMatchesSearch(task, urgentSectionSearch)).slice(0, 5),
    [urgentTasks, urgentSectionSearch],
  );
  const filteredIncidentsForCard = useMemo(
    () =>
      incidents
        .filter((inc: Incident) => incidentMatchesSearch(inc, urgentSectionSearch))
        .slice(0, 5),
    [incidents, urgentSectionSearch],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement du dashboard...</div>
      </div>
    );
  }

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
          value={stats.totalProjects}
          icon={Briefcase}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Active Sites"
          value={stats.activeSites}
          icon={Building2}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Team Members"
          value={stats.totalTeamMembers}
          icon={Users}
          subtitle={`${stats.activeTeamMembers} active`}
        />
        <StatCard
          title="Total Budget"
          value={`$${(stats.totalBudget / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend={{ value: 15.3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={TrendingUp}
          subtitle="Currently ongoing"
        />
        <StatCard
          title="Critical Incidents"
          value={stats.criticalIncidents}
          icon={AlertTriangle}
          trend={{ value: 25, isPositive: false }}
        />
        <StatCard
          title="Urgent Tasks"
          value={stats.urgentTasks}
          icon={Target}
          subtitle="Need attention"
        />
        <StatCard
          title="Avg Progress"
          value={`${stats.avgProgress}%`}
          icon={Clock}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Data Overview Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Recent Sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sites.slice(0, 5).map((site: Site) => (
                <div key={site._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{site.name}</h4>
                    <p className="text-sm text-gray-600">{site.localisation}</p>
                  </div>
                  <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                    {site.status}
                  </Badge>
                </div>
              ))}
              {sites.length === 0 && (
                <div className="text-center py-4 text-gray-500">No sites found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project: Project) => (
                <div key={project._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-sm text-gray-600">{project.assignedToName}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                  <Badge variant={project.status === 'en_cours' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-4 text-gray-500">No projects found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team and Tasks Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.slice(0, 5).map((member: TeamMember) => (
                <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{member.firstName} {member.lastName}</h4>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeof member.role === 'object' ? (member.role as any).name || 'Unknown' : member.role}</Badge>
                    <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <div className="text-center py-4 text-gray-500">No team members found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Tasks & Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Urgent Tasks & Incidents</span>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher par nom d'incident, type..."
                  value={urgentSectionSearch}
                  onChange={(e) => setUrgentSectionSearch(e.target.value)}
                  className="pl-10"
                  aria-label="Filtrer tâches et incidents"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUrgentTasks.map((task: Task) => (
                <div key={task._id} className="flex items-center gap-3 p-3 border rounded-lg bg-red-50 dark:bg-red-950/30">
                  <Target className="h-4 w-4 text-red-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="destructive">{task.priority}</Badge>
                </div>
              ))}
              {filteredIncidentsForCard.map((incident: Incident) => (
                <div key={incident._id} className="flex items-center gap-3 p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/30">
                  <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{incident.type}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                  </div>
                  <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {incident.severity}
                  </Badge>
                </div>
              ))}
              {filteredUrgentTasks.length === 0 && filteredIncidentsForCard.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {urgentSectionSearch.trim()
                    ? 'Aucun incident trouvé pour cette recherche'
                    : 'No urgent items'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
