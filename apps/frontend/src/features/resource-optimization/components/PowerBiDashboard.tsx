import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Leaf,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import axios from 'axios';
import type { PowerBiDashboardData } from '../types';

const API_BASE_URL = import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL || '/api';

interface PowerBiDashboardProps {
  siteId: string;
  refreshInterval?: number; // in milliseconds
}

export const PowerBiDashboard: React.FC<PowerBiDashboardProps> = ({
  siteId,
  refreshInterval = 30000, // 30 seconds default
}) => {
  const [data, setData] = useState<PowerBiDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const formatCurrency = (value: number) => `${value.toLocaleString()} TND`;
  const formatKg = (value: number) => `${value.toLocaleString()} kg`;

  const fetchData = async () => {
    try {
      setError(null);
      const response = await axios.get<PowerBiDashboardData>(
        `${API_BASE_URL}/power-bi/dashboard-data/${siteId}?refresh=true`
      );
      setData(response.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Power BI data');
      console.error('Power BI dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!siteId) return;

    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [siteId, refreshInterval]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Chargement du dashboard Power BI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>Erreur de chargement du dashboard : {error}</p>
          </div>
          <Button onClick={handleManualRefresh} variant="outline" className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6 p-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Power BI Intelligence Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Pilotage temps réel et insights prédictifs pour le site {siteId}
            </p>
          </div>
        </div>
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Last updated */}
      <div className="text-xs text-gray-400 text-right">
        Dernière mise à jour : {new Date(data.lastUpdated).toLocaleTimeString()} (refresh local : {lastRefresh.toLocaleTimeString()})
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {data.realTimeMetrics.activeRecommendations}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.realTimeMetrics.pendingApprovals} pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Live Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(data.realTimeMetrics.liveSavings)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Realized to date</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CO₂ Reduction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatKg(data.realTimeMetrics.liveCO2Reduction)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total impact</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{data.kpis.roi.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Return on investment</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">{data.kpis.efficiencyScore.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Implementation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sustainability Index</CardTitle>
                <Leaf className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.kpis.sustainabilityIndex.toFixed(1)}%
                </div>
                <Progress value={data.kpis.sustainabilityIndex} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data.kpis.budgetVariance}%</div>
                <Progress value={100 - data.kpis.budgetVariance} className="mt-2 h-2" />
                <p className="text-xs text-gray-500 mt-2">
                  {data.kpis.budgetVariance < 20 ? 'Optimal' : 'Needs optimization'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Week Forecast</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {data.predictiveInsights.nextWeekSavings.toLocaleString()} TND
                </div>
                <p className="text-xs text-gray-500 mt-2">Projected savings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {data.predictiveInsights.riskAlerts.length > 0 ? 'Elevated' : 'Low'}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {data.predictiveInsights.riskAlerts.length} active risks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recommendations by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations by Type</CardTitle>
                <CardDescription>Distribution across categories</CardDescription>
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
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(data.recommendationsAnalysis.byType).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Performance</CardTitle>
                <CardDescription>Savings and CO₂ reduction trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends.performanceByWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Savings (TND)"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="co2"
                      name="CO₂ (kg)"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Analysis Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Status</CardTitle>
                <CardDescription>Current pipeline overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(data.recommendationsAnalysis.byStatus).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.entries(data.recommendationsAnalysis.byStatus).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Recommendations</CardTitle>
                <CardDescription>Highest impact implementations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recommendationsAnalysis.topPerforming.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{item.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">Savings: {item.savings.toLocaleString()} TND</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">CO₂: {item.impact.toLocaleString()} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Analysis of recommendation priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(data.recommendationsAnalysis.byPriority).map(([name, value]) => ({
                      name: name.charAt(0).toUpperCase() + name.slice(1),
                      value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Insights Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Risk Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Risk Assessment
                </CardTitle>
                <CardDescription>Potential issues and their probabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictiveInsights.riskAlerts.length > 0 ? (
                    data.predictiveInsights.riskAlerts.map((risk, index) => (
                      <div key={index} className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold capitalize">
                            {risk.type.replace('_', ' ')}
                          </h4>
                          <Badge
                            variant={risk.probability > 0.7 ? 'destructive' : 'secondary'}
                          >
                            {(risk.probability * 100).toFixed(0)}% probability
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 capitalize">
                          Impact: {risk.impact}
                        </p>
                        <div className="mt-2">
                          <Progress
                            value={risk.probability * 100}
                            className="h-2"
                            style={{
                              background: risk.probability > 0.7 ? '#fee2e2' : '#fef3c7',
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                      <p>No significant risks detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optimization Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Optimization Opportunities
                </CardTitle>
                <CardDescription>Areas with potential for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictiveInsights.optimizationOpportunities.length > 0 ? (
                    data.predictiveInsights.optimizationOpportunities.map((opp, index) => (
                      <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold capitalize">
                            {opp.area.replace('_', ' ')}
                          </h4>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {opp.potentialSavings.toLocaleString()} TND
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Potential savings identified through AI analysis
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            High Priority
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>No clear optimization opportunity detected yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Forecast */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Forecast</CardTitle>
                <CardDescription>AI-powered predictions for next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Projected Savings</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {data.predictiveInsights.nextWeekSavings.toLocaleString()} TND
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Efficiency Target</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {(data.kpis.efficiencyScore + 5).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">+5% improvement goal</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">CO₂ Goal</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">+15%</p>
                    <p className="text-xs text-gray-500 mt-1">Increase reduction</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-amber-600" />
                      <span className="font-medium">Recommendations</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      {data.realTimeMetrics.activeRecommendations + 10}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Expected new</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};