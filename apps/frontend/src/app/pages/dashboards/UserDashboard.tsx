import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { AlertTriangle, Users, MapPin, Clock, CheckCircle, TrendingUp, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
  getDashboardStats,
  type Site,
  type Project,
  type Task,
  type TeamMember,
  type Incident
} from '../../action/dashboard.action';
import axios from 'axios';
import { incidentMatchesSearch, taskMatchesSearch } from '../../utils/incidentSearchFilter';

// API pour les incidents (port différent)
const incidentsApi = axios.create({
  baseURL: "http://localhost:3003",
  timeout: 10000,
});

// Récupérer le token depuis plusieurs sources
const getAuthToken = (): string | null => {
  const directToken = localStorage.getItem("access_token");
  if (directToken) return directToken;
  const persisted = localStorage.getItem("smartsite-auth");
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
};

// Configuration des headers pour l'authentification
incidentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [urgentSectionSearch, setUrgentSectionSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setDashboardData(data);

        // Charger les incidents depuis la base de données réelle
        try {
          const response = await incidentsApi.get("/incidents");
          console.log("Incidents chargés depuis la base:", response.data.length);
          setAllIncidents(response.data);
        } catch (error) {
          console.error("Erreur lors du chargement des incidents:", error);
          setAllIncidents([]);
        }
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

  const urgentSeverityIncidents = useMemo(
    () =>
      allIncidents.filter(
        (i) => i.severity === 'critical' || i.severity === 'high' || i.severity === 'medium',
      ),
    [allIncidents],
  );

  const filteredUrgentTasks = useMemo(
    () => urgentTasks.filter((task: Task) => taskMatchesSearch(task, urgentSectionSearch)).slice(0, 5),
    [urgentTasks, urgentSectionSearch],
  );

  const filteredUrgentIncidents = useMemo(
    () =>
      urgentSeverityIncidents
        .filter((inc) => incidentMatchesSearch(inc, urgentSectionSearch))
        .slice(0, 5),
    [urgentSeverityIncidents, urgentSectionSearch],
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
        <p className="text-gray-500 mt-1">User Dashboard - Your daily overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Critical Incidents"
          value={stats.criticalIncidents}
          icon={AlertTriangle}
          trend={{ value: -5.2, isPositive: false }}
        />
        <StatCard
          title="Active Sites"
          value={stats.activeSites}
          icon={MapPin}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Team Members"
          value={stats.activeTeamMembers}
          icon={Users}
          subtitle={`${stats.totalTeamMembers} total`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Urgent Tasks"
          value={stats.urgentTasks}
          icon={Clock}
          trend={{ value: 12.5, isPositive: false }}
        />
        <StatCard
          title="Recent Sites"
          value={sites.slice(0, 5).length}
          icon={MapPin}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Completed Tasks"
          value={projects.filter(p => p.status === 'completed').length}
          icon={CheckCircle}
          trend={{ value: 18.3, isPositive: true }}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Urgent Tasks & Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <span>Urgent Tasks & Incidents</span>
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
            <div className="space-y-4">
              {filteredUrgentTasks.map((task: Task) => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="destructive">{task.priority}</Badge>
                </div>
              ))}
              {filteredUrgentIncidents.map((incident: any) => (
                <div key={incident._id || incident.id} className={`flex items-center justify-between p-3 rounded-lg ${incident.severity === 'critical' ? 'bg-red-50 dark:bg-red-950/30' :
                  incident.severity === 'high' ? 'bg-orange-50 dark:bg-orange-950/30' :
                    'bg-yellow-50 dark:bg-yellow-950/30'
                  }`}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{incident.title || incident.type}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{incident.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(incident.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={
                    incident.severity === 'critical' ? 'destructive' :
                      incident.severity === 'high' ? 'destructive' :
                        'secondary'
                  }>{incident.severity}</Badge>
                </div>
              ))}
              {filteredUrgentTasks.length === 0 && filteredUrgentIncidents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {urgentSectionSearch.trim()
                    ? 'Aucun incident trouvé pour cette recherche'
                    : 'No urgent tasks or incidents'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sites */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sites.slice(0, 4).map((site: Site) => (
                <div key={site._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{site.name}</p>
                    <p className="text-xs text-gray-500">{site.localisation}</p>
                  </div>
                  <Badge variant={site.status === 'in_progress' ? 'default' : 'secondary'}>
                    {site.status}
                  </Badge>
                </div>
              ))}
              {sites.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent sites</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
