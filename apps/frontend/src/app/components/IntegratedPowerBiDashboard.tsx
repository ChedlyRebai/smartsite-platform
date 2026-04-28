import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Leaf,
  Activity,
  Award,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  Briefcase,
  Search,
} from 'lucide-react';
import {
  getSites,
  getProjects,
  getRecentIncidents,
  getUrgentTasks,
  type Site,
  type Project,
  type Task,
  type Incident,
} from '@/app/action/dashboard.action';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  hover: {
    y: -8,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export const IntegratedPowerBiDashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sitesData, projectsData, incidentsData, tasksData] = await Promise.all([
          getSites(),
          getProjects(),
          getRecentIncidents(50),
          getUrgentTasks(),
        ]);
        setSites(sitesData);
        setProjects(projectsData);
        setIncidents(incidentsData);
        setTasks(tasksData);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [sitesData, projectsData, incidentsData, tasksData] = await Promise.all([
        getSites(),
        getProjects(),
        getRecentIncidents(50),
        getUrgentTasks(),
      ]);
      setSites(sitesData);
      setProjects(projectsData);
      setIncidents(incidentsData);
      setTasks(tasksData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const activeSitesCount = sites.filter(s => s.status === 'in_progress').length;
    const totalBudget = sites.reduce((sum, s) => sum + (s.budget || 0), 0);
    const activeProjectsCount = projects.filter(p => p.status !== 'completed').length;
    const criticalIncidentsCount = incidents.filter(i => i.severity === 'critical').length;
    const avgProgress = projects.length
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

    return {
      totalSites: sites.length,
      activeSites: activeSitesCount,
      totalProjects: projects.length,
      activeProjects: activeProjectsCount,
      totalBudget,
      avgProgress,
      totalTeamMembers: 0,
      criticalIncidents: criticalIncidentsCount,
      urgentTasks: tasks.length,
    };
  }, [sites, projects, incidents, tasks]);

  // Prepare chart data
  const siteStatusData = useMemo(() => {
    const statuses = {} as Record<string, number>;
    sites.forEach(site => {
      statuses[site.status] = (statuses[site.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [sites]);

  const projectProgressData = useMemo(() => {
    return projects
      .slice(0, 10)
      .map(p => ({
        name: p.name?.substring(0, 15) || 'Project',
        progress: p.progress || 0,
        budget: (p.budget || 0) / 1000,
      }));
  }, [projects]);

  const incidentSeverityData = useMemo(() => {
    const severities = { critical: 0, high: 0, medium: 0, low: 0 };
    incidents.forEach(i => {
      severities[i.severity]++;
    });
    return [
      { name: 'Critical', value: severities.critical, color: '#ef4444' },
      { name: 'High', value: severities.high, color: '#f97316' },
      { name: 'Medium', value: severities.medium, color: '#eab308' },
      { name: 'Low', value: severities.low, color: '#84cc16' },
    ];
  }, [incidents]);

  const filteredSites = useMemo(() => {
    return sites.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.localisation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sites, searchTerm]);

  if (loading && sites.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div className="text-center" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Platform Intelligence
              </h1>
              <p className="text-gray-500 mt-1">Real-time Dashboard with Advanced Analytics</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 2, repeat: isRefreshing ? Infinity : 0 }}>
              <RefreshCw className="h-4 w-4" />
            </motion.div>
            Refresh
          </motion.button>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Key Metrics</h2>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Total Sites */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Sites
                  <MapPin className="h-5 w-5 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <div className="text-3xl font-bold text-blue-700">{stats.totalSites}</div>
                  <p className="text-xs text-gray-600 mt-1">{stats.activeSites} active</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Projects */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Projects
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                  <div className="text-3xl font-bold text-purple-700">{stats.totalProjects}</div>
                  <p className="text-xs text-gray-600 mt-1">{stats.activeProjects} in progress</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Budget */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Budget
                  <DollarSign className="h-5 w-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                  <div className="text-2xl font-bold text-green-700">
                    {(stats.totalBudget / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Total allocated</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average Progress */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Progress
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
                  <div className="text-3xl font-bold text-indigo-700">{stats.avgProgress}%</div>
                  <Progress value={stats.avgProgress} className="mt-2" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Critical Incidents */}
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Alerts
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}>
                  <div className="text-3xl font-bold text-red-700">{stats.criticalIncidents}</div>
                  <p className="text-xs text-gray-600 mt-1">critical issues</p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div className="grid gap-6 lg:grid-cols-2" variants={containerVariants} initial="hidden" animate="visible">
              {/* Site Status Distribution */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Site Status Distribution</CardTitle>
                    <CardDescription>Sites by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={siteStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {siteStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Project Progress */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Incident Severity</CardTitle>
                    <CardDescription>By severity level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={incidentSeverityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                          {incidentSeverityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Sites Tab */}
          <TabsContent value="sites" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>All Sites</CardTitle>
                  <CardDescription>Manage your sites</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search sites..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredSites.map((site) => (
                      <motion.div
                        key={site._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{site.name}</h4>
                          <p className="text-sm text-gray-600">{site.localisation}</p>
                          <p className="text-xs text-gray-500 mt-1">Budget: {(site.budget / 1000).toFixed(0)}K TND</p>
                        </div>
                        <Badge variant={site.status === 'in_progress' ? 'default' : 'secondary'}>
                          {site.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Projects Overview</CardTitle>
                  <CardDescription>Project progress across portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={projectProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div className="grid gap-6" variants={containerVariants} initial="hidden" animate="visible">
              {projects.slice(0, 6).map((project) => (
                <motion.div key={project._id} variants={itemVariants}>
                  <Card className="shadow-lg border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <CardDescription>{project.projectManagerName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-bold">{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} />
                        <div className="flex justify-between items-center text-xs text-gray-600 mt-3">
                          <Badge variant="outline">{project.status}</Badge>
                          <span>Priority: {project.priority}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Recent Incidents</CardTitle>
                  <CardDescription>All reported incidents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {incidents.map((incident) => (
                      <motion.div
                        key={incident._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{incident.type}</h4>
                          <p className="text-sm text-gray-600">{incident.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className={
                              incident.severity === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : incident.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {incident.severity}
                          </Badge>
                          <Badge variant="secondary">{incident.status}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Urgent Tasks</CardTitle>
                  <CardDescription>High priority tasks requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tasks.map((task) => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-xs text-gray-600">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {task.priority}
                          </Badge>
                          <Badge variant="secondary">{task.status}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200 mt-8"
      >
        <p>Dashboard integrates data from all platform services • Last updated: {lastUpdate.toLocaleString()}</p>
      </motion.div>
    </motion.div>
  );
};

export default IntegratedPowerBiDashboard;
