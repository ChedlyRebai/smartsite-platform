import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SiteRecommendationCard } from '../components/SiteRecommendationCard';
import { RecommendationAnalytics } from '../components/RecommendationAnalytics';
import { useResourceOptimization, useSites } from '../hooks/useResourceApi';
import { RecommendationsList } from '../components/RecommendationsList';
import { AlertsList } from '../components/AlertsList';
import { SummaryStats, SavingsChart, CO2ImpactChart, RecommendationStatusChart } from '../components/DashboardCharts';
import { Zap, Lightbulb, AlertTriangle, BarChart3, ChevronRight, TrendingUp, DollarSign, Loader2, X, Sparkles, ArrowLeft } from 'lucide-react';

type SubPage = 'overview' | 'resource-analysis' | 'recommendations' | 'analytics' | 'alerts' | 'reporting';

export const ResourceOptimizationDashboard: React.FC = () => {
  const { siteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const siteIdFromUrl = searchParams.get('siteId');

  // More robust check: ensure siteId is not 'undefined', 'null', or empty
  const isValidSiteId = (id: string) => id && id !== 'undefined' && id !== 'null' && id !== '';

  const siteIdParam = isValidSiteId(siteIdFromUrl || '') ? (siteIdFromUrl || '') : (isValidSiteId(siteId || '') ? siteId : '');

  const [currentPage, setCurrentPage] = useState<SubPage>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [previewSite, setPreviewSite] = useState<any | null>(null);

  // Fetch sites for selector
  const { data: sites, isLoading: sitesLoading } = useSites();

  const activeSites = sites?.filter(s => s.isActif) || [];

  // Sync selectedSiteId with URL changes
  useEffect(() => {
    console.log('Debug - siteIdFromUrl:', siteIdFromUrl);
    console.log('Debug - siteId:', siteId);
    console.log('Debug - selectedSiteId:', selectedSiteId);
    console.log('Debug - activeSites:', activeSites);
    console.log('Debug - first site ID:', activeSites[0]?._id);
    console.log('Debug - first site:', activeSites[0]);
    console.log('Debug - all keys of first site:', activeSites[0] ? Object.keys(activeSites[0]) : 'no site');

    if (siteIdFromUrl && isValidSiteId(siteIdFromUrl)) {
      setSelectedSiteId(siteIdFromUrl);
    } else if (siteId && isValidSiteId(siteId)) {
      setSelectedSiteId(siteId);
    }
    // Remove auto-selection - only select when user explicitly clicks
  }, [siteIdFromUrl, siteId, activeSites]);

  // Determine effective siteId with proper validation
  let effectiveSiteId = '';
  if (selectedSiteId && isValidSiteId(selectedSiteId)) {
    effectiveSiteId = selectedSiteId;
  } else if (siteIdParam && isValidSiteId(siteIdParam)) {
    effectiveSiteId = siteIdParam;
  }
  // Remove auto-selection - only use explicitly selected siteId

  const {
    recommendations,
    recommendationsLoading,
    alerts,
    alertsLoading,
    dashboard,
    dashboardLoading,
    site,
    siteTeams,
    tasks,
    generateRecommendations,
    generateAlerts,
    updateRecommendationStatus,
    markAlertAsRead,
    markAlertAsResolved,
  } = useResourceOptimization(effectiveSiteId);

  // Transform alerts to match expected interface
  const transformedAlerts = alerts?.map(alert => ({
    ...alert,
    createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : alert.createdAt,
    type: alert.type === 'equipment' ? 'equipment' : alert.type === 'energy' ? 'energy' : alert.type,
  })) || [];

  const handleSiteChange = (newSiteId: string) => {
    if (isValidSiteId(newSiteId)) {
      setSelectedSiteId(newSiteId);
      setSearchParams({ siteId: newSiteId });
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      await generateRecommendations.mutateAsync();
      await generateAlerts.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    await updateRecommendationStatus.mutateAsync({ id, status: 'approved' });
  };

  const handleReject = async (id: string) => {
    await updateRecommendationStatus.mutateAsync({ id, status: 'rejected' });
  };

  const handleImplement = async (id: string) => {
    await updateRecommendationStatus.mutateAsync({ id, status: 'implemented' });
  };

  const unreadAlertsCount = alerts.filter((a: any) => !a.isRead).length;
  const criticalAlertsCount = alerts.filter((a: any) => a.severity === 'critical').length;

  const savingsData = useMemo(() => {
    const realized = Number(dashboard?.financial?.realizedSavings) || 0;
    if (!realized || !Number.isFinite(realized)) {
      return [
        { name: 'Budget & matériaux', value: 0 },
        { name: 'Équipes & exécution', value: 0 },
        { name: 'Planning & délais', value: 0 },
      ];
    }
    const mat = Math.round(realized * 0.42);
    const equ = Math.round(realized * 0.35);
    const plan = Math.max(0, realized - mat - equ);
    return [
      { name: 'Budget & matériaux', value: mat },
      { name: 'Équipes & exécution', value: equ },
      { name: 'Planning & délais', value: plan },
    ];
  }, [dashboard]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resource-analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reporting', label: 'Reports', icon: DollarSign },
  ] as const;

  // No site selected - Show global view of all sites
  if (!isValidSiteId(effectiveSiteId) && !sitesLoading) {
    return (
      <div className="relative p-6">
        <div className={`space-y-6 transition-all duration-300 ${previewSite ? 'blur-[4px] scale-[0.995]' : ''}`}>
          <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card to-muted/30 px-6 py-5 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">Resource Management — All Sites</h1>
            <p className="text-muted-foreground mt-1 max-w-4xl">
            Cross-site view: site budgets, AI recommendations linked to planning and teams. Select a site
            for details and before/after implementation charts.
            </p>
          </div>

          {/* Global Statistics */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-sm">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-700">{activeSites.length}</div>
                <div className="text-sm text-blue-900/80">Active Sites</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-100/30 shadow-sm">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-emerald-700">
                  {activeSites.reduce((sum, site) => sum + (site.budget || 0), 0).toLocaleString()} TND
                </div>
                <div className="text-sm text-emerald-900/80">Total Budget</div>
              </CardContent>
            </Card>
            <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50 to-violet-100/30 shadow-sm">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-violet-700">
                  {activeSites.reduce((sum, site) => sum + (siteTeams?.length || 0), 0)}
                </div>
                <div className="text-sm text-violet-900/80">Total Teams</div>
              </CardContent>
            </Card>
            <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100/30 shadow-sm">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-amber-700">
                  {activeSites.reduce((sum, site) => sum + (tasks?.length || 0), 0)}
                </div>
                <div className="text-sm text-amber-900/80">Total Tasks</div>
              </CardContent>
            </Card>
          </div>

          {/* Sites with Recommendations */}
          <Card className="shadow-sm border-border/70">
            <CardHeader>
              <CardTitle>Active Sites and Recommendations</CardTitle>
              <CardDescription>
                Each card summarizes the site (site management). Open a site to approve recommendations and track
                impact in the Analytics tab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sitesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : activeSites.length === 0 ? (
                <p className="text-gray-500 text-center p-8">No available sites</p>
              ) : (
                <div className="space-y-6">
                  {activeSites.map((site, index) => {
                    const id = site._id || (site as any).id || `site-${index}`;
                    return (
                      <SiteRecommendationCard
                        key={id}
                        site={site}
                        siteId={id}
                        onSelect={() => setPreviewSite({ ...site, __siteId: id })}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Focused site preview with blurred background */}
        {previewSite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Selected Site
                  </p>
                  <h3 className="text-xl font-bold mt-1">{previewSite.nom}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPreviewSite(null)} aria-label="Close site preview">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-5">
                <div className="rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold mt-1">{previewSite.localisation || '—'}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-lg font-bold">{(previewSite.budget || 0).toLocaleString()} TND</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-lg font-bold capitalize">{previewSite.status || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p className="text-lg font-bold">{previewSite.surface ? `${previewSite.surface} m²` : 'N/A'}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200/50 bg-amber-50/60 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      Open this site to view AI recommendations, real-time alerts, and before/after implementation analytics.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewSite(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      const id = previewSite.__siteId as string;
                      setPreviewSite(null);
                      handleSiteChange(id);
                    }}
                  >
                    Open Site Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (sitesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (currentPage !== 'overview') {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-muted/30">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage('overview')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-gray-400">/</span>
          <span className="font-medium capitalize">{currentPage.replace('-', ' ')}</span>
        </div>

        {currentPage === 'resource-analysis' && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold">Site Resource Analysis</h3>
              <p className="text-gray-600">
                Connection to equipment usage, workload and cost indicators per site — module in development.
              </p>
            </CardContent>
          </Card>
        )}
        {currentPage === 'recommendations' && (
          <RecommendationsList
            recommendations={recommendations}
            onApprove={handleApprove}
            onReject={handleReject}
            onImplement={handleImplement}
            loading={recommendationsLoading}
          />
        )}
        {currentPage === 'analytics' && (
          <RecommendationAnalytics siteId={effectiveSiteId} />
        )}
        {currentPage === 'alerts' && (
          <AlertsList
            alerts={transformedAlerts}
            onMarkAsRead={(id) => markAlertAsRead.mutate(id)}
            onMarkAsResolved={(id) => markAlertAsResolved.mutate(id)}
            loading={alertsLoading}
          />
        )}
        {currentPage === 'reporting' && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold">Reports</h3>
              <p className="text-gray-600">Feature in development</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card to-muted/30 px-6 py-5 shadow-sm flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Site Resources</h1>
          <p className="text-muted-foreground mt-1 max-w-4xl">
            {site
              ? `${site.nom} — budget, tasks (planning) and teams; AI recommendations and tracking before/after approval.`
              : 'Select a site to analyze budget, planning and recommendations.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Site Selector */}
          <Select value={effectiveSiteId} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-72 bg-background">
              <SelectValue placeholder="Select a site" />
            </SelectTrigger>
            <SelectContent>
              {activeSites.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" className="gap-2 shadow-sm" onClick={handleGenerateRecommendations} disabled={isGenerating}>
            <Zap className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate All'}
          </Button>
        </div>
      </div>

      {/* Site Info Bar */}
      {site && (
        <Card className="border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
          <CardContent className="pt-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">{site.budget} TND</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Team</p>
                <p className="font-semibold">{siteTeams?.length || 0} members</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="font-semibold">{tasks?.length || 0} tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${site.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                site.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                  site.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                }`}>
                {site.status}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('resource-analysis')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Analysis</p>
                <p className="font-medium">View Insights</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('recommendations')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recommendations</p>
                <p className="font-medium">{recommendations.length} suggestions</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('alerts')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alerts</p>
                <p className="font-medium">{unreadAlertsCount} unread</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentPage('reporting')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reports</p>
                <p className="font-medium">Dashboards</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <SummaryStats dashboard={dashboard || null} />

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts ({unreadAlertsCount})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommandations pour ce chantier</CardTitle>
                  <CardDescription>
                    {recommendations.length} proposition(s) — approuvez pour figer un relevé ; mettez en œuvre pour
                    comparer les indicateurs dans Analytique.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RecommendationsList
                recommendations={recommendations}
                onApprove={handleApprove}
                onReject={handleReject}
                onImplement={handleImplement}
                loading={recommendationsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alertes en temps réel</CardTitle>
                  <CardDescription>
                    {unreadAlertsCount} alertes non lues, {criticalAlertsCount} critiques
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AlertsList
                alerts={transformedAlerts}
                onMarkAsRead={(id) => markAlertAsRead.mutate(id)}
                onMarkAsResolved={(id) => markAlertAsResolved.mutate(id)}
                loading={alertsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SavingsChart data={savingsData} />
            <CO2ImpactChart
              current={Number(dashboard?.environmental?.totalCO2Emissions) || 1000}
              potential={Number(dashboard?.environmental?.potentialCO2Reduction) || 500}
              realized={Number(dashboard?.environmental?.actualCO2Reduction) || 150}
            />
          </div>
          <RecommendationStatusChart
            pending={dashboard?.recommendations?.pending || 0}
            approved={dashboard?.recommendations?.approved || 0}
            implemented={dashboard?.recommendations?.implemented || 0}
          />
          <RecommendationAnalytics siteId={effectiveSiteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceOptimizationDashboard;
