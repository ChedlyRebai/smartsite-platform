import { Building2, Users, Briefcase, DollarSign, AlertTriangle, TrendingUp, Shield, Clock, MapPin, Calendar, Target, Search, Lightbulb, Quote } from 'lucide-react';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../hooks/useTranslation';
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
import { getProverbOfTheDay } from '../../utils/chantier-proverbs';

export default function SuperAdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [urgentSectionSearch, setUrgentSectionSearch] = useState('');
  const [dailyProverb] = useState(() => getProverbOfTheDay());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
        <div className="text-lg">{t("dashboard.loadingDashboard")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("dashboard.welcome")}, {user?.firstName}!</h1>
          <p className="text-gray-500 mt-1">{t("dashboard.superAdminOverview")}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p className="font-medium">{currentTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-gray-600">{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Daily Proverb Card */}
      <Card className="relative overflow-hidden border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-100 shadow-lg">
        <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-blue-300/20 blur-3xl motion-safe:animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-indigo-300/20 blur-3xl motion-safe:animate-pulse" />
        <CardContent className="relative pt-6">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 motion-safe:animate-[pulse_3s_ease-in-out_infinite]">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 mb-2">
                {t("dashboard.proverbOfTheDay")}
              </p>
              <div className="rounded-xl border border-white/70 bg-white/70 backdrop-blur-sm px-4 py-3 shadow-sm">
                <p className="text-lg leading-relaxed font-semibold text-slate-900 italic">
                  <Quote className="inline-block mr-1 mb-1 h-4 w-4 text-blue-500" />
                  {dailyProverb.proverb}
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  {dailyProverb.meaning}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.totalProjects")}
          value={stats.totalProjects}
          icon={Briefcase}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title={t("dashboard.activeSites")}
          value={stats.activeSites}
          icon={Building2}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title={t("dashboard.totalSites")}
          value={stats.activeSites}
          icon={MapPin}
          subtitle={`${stats.totalSites} ${t("dashboard.sitesTotal")}`}
        />
        <StatCard
          title={t("dashboard.teamMembers")}
          value={stats.totalTeamMembers}
          icon={Users}
          subtitle={`${stats.activeTeamMembers} ${t("dashboard.total")}`}
        />
        <StatCard
          title={t("dashboard.totalBudget")}
          value={`TND ${(stats.totalBudget / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend={{ value: 15.3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.activeProjects")}
          value={stats.activeProjects}
          icon={TrendingUp}
          subtitle={t("dashboard.currentlyOngoing")}
        />
        <StatCard
          title={t("dashboard.criticalIncidents")}
          value={stats.criticalIncidents}
          icon={AlertTriangle}
          trend={{ value: 25, isPositive: false }}
        />
        <StatCard
          title={t("dashboard.urgentTasksLabel")}
          value={stats.urgentTasks}
          icon={Target}
          subtitle={t("dashboard.needAttention")}
        />
        <StatCard
          title={t("dashboard.avgProgress")}
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
              {t("dashboard.recentSites")}
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
                <div className="text-center py-4 text-gray-500">{t("dashboard.noSitesFound")}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {t("dashboard.recentProjectsTitle")}
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
                        <span>{t("dashboard.progress")}</span>
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
                <div className="text-center py-4 text-gray-500">{t("dashboard.noProjectsFound")}</div>
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
              {t("dashboard.teamMembers")}
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
                <div className="text-center py-4 text-gray-500">{t("dashboard.noTeamMembersFound")}</div>
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
                <span>{t("dashboard.urgentTasksAndIncidents")}</span>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t("dashboard.searchPlaceholder")}
                  value={urgentSectionSearch}
                  onChange={(e) => setUrgentSectionSearch(e.target.value)}
                  className="pl-10"
                  aria-label={t("dashboard.filterTasksIncidents")}
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
                    <p className="text-xs text-muted-foreground">{t("dashboard.dueLabel")} {new Date(task.deadline).toLocaleDateString()}</p>
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
                    ? t("dashboard.noResultsFound")
                    : t("dashboard.noUrgent")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
