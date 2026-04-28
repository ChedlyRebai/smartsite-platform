import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Leaf,
  Activity,
  Award,
  Clock,
  Loader2,
  MapPin,
} from 'lucide-react';
import axios from 'axios';
import {
  getSites,
  getProjects,
  getRecentIncidents,
  getUrgentTasks,
  getTeamMembers,
  type Site,
  type Project,
  type Task,
  type Incident,
} from '@/app/action/dashboard.action';

const RO_BASE_URL = import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL || '/api';

// Animation variants for staggered loading
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface KPICardProps {
  item: any;
  index: number;
}

const AnimatedKPICard: React.FC<KPICardProps> = ({ item, index }) => {
  const IconComponent = item.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`relative overflow-hidden border-0 shadow-lg bg-gradient-to-br ${item.bgColor}`}>
        {/* Animated gradient overlay */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0`}
          animate={{ opacity: isHovered ? 0.1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <motion.div
              className={`p-3 rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}
              animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <div className="text-3xl font-bold text-gray-900 mb-2">{item.value}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={item.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                <motion.span
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-1"
                >
                  {item.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {item.change}
                </motion.span>
              </Badge>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface MetricProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
}

const AnimatedMetric: React.FC<MetricProps> = ({ label, value, unit, icon, gradient }) => {
  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} p-4 rounded-lg shadow-lg`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold mt-1">
            {value}
            {unit && <span className="text-sm ml-1 opacity-75">{unit}</span>}
          </p>
        </div>
        <div className="opacity-20">{icon}</div>
      </div>
    </motion.div>
  );
};

export const ProfessionalPowerBiDashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avgRecommendationsPerSite, setAvgRecommendationsPerSite] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    const [sitesData, projectsData, incidentsData, tasksData, usersData] = await Promise.all([
      getSites(),
      getProjects(),
      getRecentIncidents(50),
      getUrgentTasks(),
      getTeamMembers(),
    ]);
    setSites(sitesData);
    setProjects(projectsData);
    setIncidents(incidentsData);
    setTasks(tasksData);
    setTotalUsers(usersData.length);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${RO_BASE_URL}/recommendations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const raw = response.data?.data ?? response.data;
      const list = Array.isArray(raw) ? raw : [];
      const totalRecommendations = list.length;
      const denominator = sitesData.length || 1;
      setAvgRecommendationsPerSite(Number((totalRecommendations / denominator).toFixed(1)));
    } catch {
      setAvgRecommendationsPerSite(0);
    }

    setLastUpdate(new Date());
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchData();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const totalBudget = sites.reduce((sum, s) => sum + (s.budget || 0), 0);
    const normalizeStatus = (status: string) => status.toLowerCase().replace(/\s|-/g, '_');
    const toProgressNumber = (value: unknown): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(',', '.').replace(/[^0-9.\-]/g, '');
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };
    const isInProgressSite = (s: Site) => {
      const status = normalizeStatus(s.status || '');
      const progress = Number(s.progress || 0);
      return (
        status === 'in_progress' ||
        status === 'en_cours' ||
        status === 'active' ||
        (progress > 0 && progress < 100)
      );
    };

    const activeSites = sites.filter(isInProgressSite).length;
    const inProgressSites = sites.filter(isInProgressSite).length;
    const isCompletedProject = (p: Project) => {
      const status = normalizeStatus(String(p.status || ''));
      const progress = toProgressNumber(p.progress);
      const doneByStatus =
        status.includes('termine') ||
        status.includes('terminé') ||
        status.includes('completed') ||
        status.includes('done') ||
        status.includes('closed') ||
        status.includes('annule') ||
        status.includes('cancel');

      return doneByStatus || progress >= 100;
    };

    // Filter by project status, not just progress percentage
    const actualInProgressProjects = projects.filter((p) => {
      const status = normalizeStatus(String(p.status || ''));
      const isRunning =
        status.includes('en_cours') ||
        status.includes('in_progress') ||
        status.includes('running') ||
        status.includes('active');

      return isRunning && !isCompletedProject(p);
    }).length;

    const inProgressProjects = actualInProgressProjects;
    const completedProjects = projects.filter(isCompletedProject).length;
    const completedRate = projects.length ? Math.round((completedProjects / projects.length) * 100) : 0;
    const avgProgress = projects.length
      ? Math.round(projects.reduce((sum, p) => sum + toProgressNumber(p.progress), 0) / projects.length)
      : 0;
    const criticalIncidents = incidents.filter((i) => i.severity === 'critical' || i.severity === 'high').length;

    return {
      totalBudget,
      activeSites,
      inProgressSites,
      inProgressProjects,
      completedRate,
      avgProgress,
      criticalIncidents,
    };
  }, [sites, projects, incidents]);

  const sampleKPIData = useMemo(() => [
    {
      id: 1,
      title: 'Tasks',
      value: String(tasks.length),
      change: 'total tasks urgentes',
      isPositive: true,
      icon: Activity,
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      id: 2,
      title: 'Incidents',
      value: String(incidents.length),
      change: `${stats.criticalIncidents} high/critical`,
      isPositive: stats.criticalIncidents === 0,
      icon: AlertTriangle,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
    },
    {
      id: 3,
      title: 'Moy. Recommandations / Site',
      value: `${avgRecommendationsPerSite}`,
      change: 'resource optimization',
      isPositive: true,
      icon: TrendingUp,
      color: 'from-yellow-600 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50',
    },
    {
      id: 4,
      title: 'Sites en Progress',
      value: `${stats.inProgressSites}`,
      change: `${sites.length} sites total`,
      isPositive: true,
      icon: CheckCircle2,
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      id: 5,
      title: 'Total Users',
      value: String(totalUsers),
      change: `${stats.activeSites} sites actifs`,
      isPositive: true,
      icon: Users,
      color: 'from-indigo-600 to-blue-600',
      bgColor: 'from-indigo-50 to-blue-50',
    },
    {
      id: 6,
      title: 'Total Sites',
      value: String(sites.length),
      change: `${stats.activeSites} actifs`,
      isPositive: true,
      icon: MapPin,
      color: 'from-teal-600 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-50',
    },
  ], [tasks.length, incidents.length, avgRecommendationsPerSite, stats, sites.length, totalUsers]);

  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Array<{ month: string; revenue: number; expenses: number; savings: number }> = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      buckets.push({ month: monthNames[d.getMonth()], revenue: 0, expenses: 0, savings: 0 });
    }

    const monthIndexMap = new Map<string, number>();
    buckets.forEach((b, idx) => monthIndexMap.set(b.month, idx));

    for (const site of sites) {
      const date = new Date(site.createdAt);
      const key = monthNames[date.getMonth()];
      const idx = monthIndexMap.get(key);
      if (idx != null) buckets[idx].revenue += site.budget || 0;
    }

    for (const incident of incidents) {
      const date = new Date(incident.createdAt);
      const key = monthNames[date.getMonth()];
      const idx = monthIndexMap.get(key);
      if (idx != null) buckets[idx].expenses += 1;
    }

    for (const task of tasks) {
      const date = new Date(task.createdAt);
      const key = monthNames[date.getMonth()];
      const idx = monthIndexMap.get(key);
      if (idx != null) buckets[idx].savings += 1;
    }

    return buckets;
  }, [sites, incidents, tasks]);

  const distributionData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const site of sites) {
      const name = site.status || 'unknown';
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    const total = sites.length || 1;
    const rows = Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
    }));

    return rows.length > 0 ? rows : [{ name: 'No Data', value: 100 }];
  }, [sites]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div
        className="mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Smart Site
              </h1>
              <p className="text-gray-500 mt-1">Manage your projects, sites, and resources efficiently in one place</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 2, repeat: isRefreshing ? Infinity : 0 }}>
              <RefreshCw className="h-4 w-4" />
            </motion.div>
            Refresh
          </motion.button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Last update: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </motion.div>

      {/* KPI Cards Section */}
      <motion.div
        className="mb-8"
        variants={itemVariants}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Key Performance Indicators</h2>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sampleKPIData.map((item, index) => (
            <AnimatedKPICard key={item.id} item={item} index={index} />
          ))}
        </motion.div>
      </motion.div>

      {/* Main Dashboard Content */}
      <motion.div variants={itemVariants} className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              className="grid gap-6 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Revenue Chart */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Last 7 months performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#0088FE" fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Distribution Pie Chart */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white h-full">
                  <CardHeader>
                    <CardTitle>Distribution</CardTitle>
                    <CardDescription>By category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Metrics Summary */}
            <motion.div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatedMetric
                label="Total Projects"
                value={String(projects.length)}
                icon={<BarChart3 className="h-12 w-12" />}
                gradient="from-blue-600 to-cyan-600"
              />
              <AnimatedMetric
                label="Projects in Progress"
                value={String(stats.inProgressProjects)}
                icon={<Users className="h-12 w-12" />}
                gradient="from-purple-600 to-pink-600"
              />
              <AnimatedMetric
                label="Completed"
                value={`${stats.completedRate}%`}
                icon={<CheckCircle2 className="h-12 w-12" />}
                gradient="from-green-600 to-emerald-600"
              />
              <AnimatedMetric
                label="Efficiency"
                value={`${stats.avgProgress}%`}
                icon={<Award className="h-12 w-12" />}
                gradient="from-yellow-600 to-orange-600"
              />
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <motion.div
              className="grid gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>Revenue vs Expenses vs Savings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#0088FE" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="expenses" fill="#FF8042" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="savings" fill="#00C49F" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <motion.div
              className="grid gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>System performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} dot={{ fill: '#0088FE', r: 4 }} />
                          <Line type="monotone" dataKey="savings" stroke="#00C49F" strokeWidth={2} dot={{ fill: '#00C49F', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200"
      >
        <p>Dashboard auto-refreshes every 30 seconds • Last updated: {lastUpdate.toLocaleString()}</p>
      </motion.div>
    </motion.div>
  );
};

export default ProfessionalPowerBiDashboard;
