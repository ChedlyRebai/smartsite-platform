import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from 'lucide-react';
import axios from 'axios';
import type { PowerBiDashboardData } from '@/features/resource-optimization/types';

const API_BASE_URL = import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL || '/api';

// Animation variants
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

interface PowerBiAdvancedDashboardProps {
  initialSiteId?: string;
}

export const PowerBiAdvancedDashboard: React.FC<PowerBiAdvancedDashboardProps> = ({ initialSiteId }) => {
  const [selectedSite, setSelectedSite] = useState<string>(initialSiteId || '');
  const [data, setData] = useState<PowerBiDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch available sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setSitesLoading(true);
        const response = await axios.get(`${API_BASE_URL}/sites`);
        setSites(response.data?.data || response.data || []);
        
        // Auto-select first site if no initial site provided
        if (!selectedSite && response.data?.length > 0) {
          const siteId = response.data[0]._id || response.data[0].id;
          setSelectedSite(siteId);
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
      } finally {
        setSitesLoading(false);
      }
    };

    fetchSites();
  }, []);

  // Fetch Power BI data when site changes
  useEffect(() => {
    if (!selectedSite) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<PowerBiDashboardData>(
          `${API_BASE_URL}/power-bi/dashboard-data/${selectedSite}`
        );
        setData(response.data);
        setLastUpdate(new Date());
      } catch (err: any) {
        setError(err.message || 'Failed to fetch Power BI data');
        console.error('Power BI dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedSite]);

  const handleRefresh = async () => {
    if (!selectedSite) return;
    setIsRefreshing(true);
    try {
      const response = await axios.get<PowerBiDashboardData>(
        `${API_BASE_URL}/power-bi/dashboard-data/${selectedSite}?refresh=true`
      );
      setData(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (sitesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div className="text-center" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Power BI Dashboard...</p>
        </motion.div>
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
                Power BI Intelligence
              </h1>
              <p className="text-gray-500 mt-1">Real-time Site Analytics & Insights</p>
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

        {/* Site Selector */}
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">Select Site:</label>
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a site..." />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site._id || site.id} value={site._id || site.id}>
                  {site.nom || site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Live Feed
          </Badge>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && !data ? (
        <motion.div
          className="flex items-center justify-center p-12"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </motion.div>
      ) : data ? (
        <>
          {/* KPI Cards Section */}
          <motion.div className="mb-8" variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Real-Time Metrics</h2>
            <motion.div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Active Recommendations */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Recommendations
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <div className="text-3xl font-bold text-blue-700">
                        {data.realTimeMetrics.activeRecommendations}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {data.realTimeMetrics.pendingApprovals} pending
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Live Savings */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Savings
                      <div className="p-2 bg-green-600 rounded-lg">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                      <div className="text-3xl font-bold text-green-700">
                        {data.realTimeMetrics.liveSavings.toLocaleString()} TND
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Realized to date</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* CO₂ Reduction */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-lime-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      CO₂ Reduction
                      <div className="p-2 bg-green-700 rounded-lg">
                        <Leaf className="h-4 w-4 text-white" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                      <div className="text-3xl font-bold text-lime-700">
                        {data.realTimeMetrics.liveCO2Reduction.toLocaleString()} kg
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Total impact</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ROI */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      ROI
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
                      <div className="text-3xl font-bold text-purple-700">
                        {data.kpis.roi.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Return on investment</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Efficiency */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Efficiency
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}>
                      <div className="text-3xl font-bold text-indigo-700">
                        {data.kpis.efficiencyScore.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Implementation rate</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Active Alerts */}
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Alerts
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}>
                      <div className="text-3xl font-bold text-orange-700">
                        {data.realTimeMetrics.activeAlerts}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {data.realTimeMetrics.criticalAlerts} critical
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Charts Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="predictive">Predictive</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <motion.div className="grid gap-6 lg:grid-cols-2" variants={containerVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle>Recommendations Trend</CardTitle>
                        <CardDescription>Last 7 days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={data.trends.recommendationsByDay}>
                            <defs>
                              <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorRec)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle>Recommendations by Type</CardTitle>
                        <CardDescription>Distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={Object.entries(data.recommendationsAnalysis.byType).map(([name, value]) => ({
                                name,
                                value,
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(data.recommendationsAnalysis.byType).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle>Recommendations by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={Object.entries(data.recommendationsAnalysis.byStatus).map(([name, value]) => ({ name, value }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle>Alerts by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={Object.entries(data.alertsAnalysis.byType).map(([name, value]) => ({
                              name,
                              value,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {Object.entries(data.alertsAnalysis.byType).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#84cc16'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Predictive Tab */}
              <TabsContent value="predictive" className="space-y-6">
                <motion.div className="grid gap-6 lg:grid-cols-2" variants={containerVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle>Forecast</CardTitle>
                        <CardDescription>Next week projections</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Projected Savings</p>
                            <p className="text-2xl font-bold text-green-600">
                              {data.predictiveInsights.nextWeekSavings.toLocaleString()} TND
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Risk Level</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {data.predictiveInsights.riskAlerts.length > 0 ? 'Elevated' : 'Low'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle>KPI Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">ROI</span>
                          <span className="font-bold text-blue-600">{data.kpis.roi.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sustainability Index</span>
                          <span className="font-bold text-green-600">{data.kpis.sustainabilityIndex.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Budget Variance</span>
                          <span className="font-bold text-purple-600">{data.kpis.budgetVariance}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      ) : null}

      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200 mt-8"
      >
        <p>Dashboard auto-refreshes every 30 seconds • Last updated: {lastUpdate.toLocaleString()}</p>
      </motion.div>
    </motion.div>
  );
};

export default PowerBiAdvancedDashboard;
