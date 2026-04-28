import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SiteRecommendationCard } from '../components/SiteRecommendationCard';
import { useResourceOptimization, useSites } from '../hooks/useResourceApi';
import { RecommendationsList } from '../components/RecommendationsList';
import { PowerBiDashboard } from '../components/PowerBiDashboard';
import { Zap, Lightbulb, AlertTriangle, BarChart3, ChevronRight, TrendingUp, DollarSign, Loader2, X, Sparkles, ArrowLeft, Target, Users } from 'lucide-react';
import { getSiteId, type Recommendation } from '../types';
import type { RecommendationStatus } from '../types';

type SubPage = 'overview' | 'resource-analysis' | 'recommendations' | 'powerbi' | 'analytics' | 'alerts' | 'reporting';
const API_BASE_URL = (import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL && String(import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL).replace(/\/$/, '')) || '/api';

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
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [siteStatusFilter, setSiteStatusFilter] = useState<'all' | 'planning' | 'in_progress' | 'completed' | 'suspended'>('all');
  const [sitePage, setSitePage] = useState(1);
  const [globalRecSearchTerm, setGlobalRecSearchTerm] = useState('');
  const [globalRecStatusFilter, setGlobalRecStatusFilter] = useState<'all' | 'pending' | 'approved' | 'implemented'>('all');
  const [globalRecPage, setGlobalRecPage] = useState(1);

  // Fetch sites for selector
  const { data: sites, isLoading: sitesLoading } = useSites();

  const activeSites = sites?.filter(s => s.isActif) || [];
  const globalTeams = activeSites.reduce((sum, currentSite) => sum + (currentSite.teamIds?.length || 0), 0);
  const { data: allRecommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ['recommendations', 'global-all-sites'],
    queryFn: async () => {
      const response = await axios.get<Recommendation[]>(`${API_BASE_URL}/recommendations`);
      return response.data || [];
    },
  });
  const recommendationsBySite = useMemo(() => {
    const siteNameById = new Map(activeSites.map((site) => [getSiteId(site), site.nom]));
    const grouped = new Map<string, { siteId: string; siteName: string; total: number; pending: number; approved: number; implemented: number }>();
    for (const recommendation of allRecommendations) {
      const recommendationSiteId = recommendation.siteId || '';
      if (!recommendationSiteId) continue;
      const current = grouped.get(recommendationSiteId) || {
        siteId: recommendationSiteId,
        siteName: siteNameById.get(recommendationSiteId) || recommendationSiteId,
        total: 0,
        pending: 0,
        approved: 0,
        implemented: 0,
      };
      current.total += 1;
      if (recommendation.status === 'pending') current.pending += 1;
      if (recommendation.status === 'approved') current.approved += 1;
      if (recommendation.status === 'implemented') current.implemented += 1;
      grouped.set(recommendationSiteId, current);
    }
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [allRecommendations, activeSites]);
  const totalRecommendationsAvailable = allRecommendations.length;
  const sitesWithRecommendations = recommendationsBySite.length;
  const pendingRecommendationsGlobal = allRecommendations.filter((item) => item.status === 'pending').length;
  const sitesPerPage = 5;
  const recommendationsPerPage = 5;
  const filteredActiveSites = useMemo(() => {
    return activeSites.filter((site) => {
      const siteName = site.nom?.toLowerCase() || '';
      const matchesSearch = siteName.includes(siteSearchTerm.toLowerCase().trim());
      const matchesStatus = siteStatusFilter === 'all' || site.status === siteStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeSites, siteSearchTerm, siteStatusFilter]);
  const sitePageCount = Math.max(1, Math.ceil(filteredActiveSites.length / sitesPerPage));
  const paginatedSites = filteredActiveSites.slice((sitePage - 1) * sitesPerPage, sitePage * sitesPerPage);
  const filteredRecommendationsBySite = useMemo(() => {
    return recommendationsBySite.filter((item) => {
      const matchesSearch = item.siteName.toLowerCase().includes(globalRecSearchTerm.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (globalRecStatusFilter === 'all') return true;
      return item[globalRecStatusFilter] > 0;
    });
  }, [recommendationsBySite, globalRecSearchTerm, globalRecStatusFilter]);
  const globalRecPageCount = Math.max(1, Math.ceil(filteredRecommendationsBySite.length / recommendationsPerPage));
  const paginatedGlobalRecommendations = filteredRecommendationsBySite.slice(
    (globalRecPage - 1) * recommendationsPerPage,
    globalRecPage * recommendationsPerPage,
  );

  useEffect(() => {
    setSitePage(1);
  }, [siteSearchTerm, siteStatusFilter]);

  useEffect(() => {
    setGlobalRecPage(1);
  }, [globalRecSearchTerm, globalRecStatusFilter]);

  // Sync selectedSiteId with URL changes
  useEffect(() => {
    if (siteIdFromUrl && isValidSiteId(siteIdFromUrl)) {
      setSelectedSiteId(siteIdFromUrl);
    } else if (siteId && isValidSiteId(siteId)) {
      setSelectedSiteId(siteId);
    }
  }, [siteIdFromUrl, siteId]);

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
  const handleMoveStatus = async (id: string, status: RecommendationStatus) => {
    await updateRecommendationStatus.mutateAsync({ id, status });
  };

  const unreadAlertsCount = alerts.filter((a: any) => !a.isRead).length;
  const criticalAlertsCount = alerts.filter((a: any) => a.severity === 'critical').length;

  const savingsData = useMemo(() => {
    const realized = Number(dashboard?.financial?.realizedSavings) || 0;
    if (!realized || !Number.isFinite(realized)) {
      return [
        { name: 'Budget & Materials', value: 0 },
        { name: 'Teams & Execution', value: 0 },
        { name: 'Planning & Deadlines', value: 0 },
      ];
    }
    const mat = Math.round(realized * 0.42);
    const equ = Math.round(realized * 0.35);
    const plan = Math.max(0, realized - mat - equ);
    return [
      { name: 'Budget & Materials', value: mat },
      { name: 'Teams & Execution', value: equ },
      { name: 'Planning & Deadlines', value: plan },
    ];
  }, [dashboard]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resource-analysis', label: 'Analysis', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'powerbi', label: 'Power BI', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reporting', label: 'Reports', icon: DollarSign },
  ] as const;

  // No site selected - Show global view of all sites
  if (!isValidSiteId(effectiveSiteId) && !sitesLoading) {
    return (
      <div className="relative p-6 bg-slate-50/60 min-h-screen">
        <div className={`space-y-6 transition-all duration-300 ${previewSite ? 'blur-[4px] scale-[0.995]' : ''}`}>
          {/* Enhanced Header */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-7 shadow-lg relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full -mr-36 -mt-36 opacity-20" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400 rounded-full -ml-28 -mb-28 opacity-15" />

            <div className="relative z-10 flex items-start gap-5">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20 shadow-sm backdrop-blur">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                  Resource Management — All Sites
                </h1>
                <p className="text-slate-200 max-w-4xl leading-relaxed">
                  Cross-site overview with AI-powered recommendations, budget tracking, and team analytics. Select any site to dive into detailed optimization insights and implementation metrics.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs uppercase text-muted-foreground">Active sites</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{activeSites.length}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs uppercase text-muted-foreground">Team capacity</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{globalTeams}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs uppercase text-muted-foreground">Available recommendations</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{totalRecommendationsAvailable}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs uppercase text-muted-foreground">Pending recommendations</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{pendingRecommendationsGlobal}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                Power BI - Global recommendations
              </CardTitle>
              <CardDescription>
                Recommendation statistics by site with multi-site totals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr,220px]">
                <input
                  type="text"
                  value={globalRecSearchTerm}
                  onChange={(event) => setGlobalRecSearchTerm(event.target.value)}
                  placeholder="Search by site..."
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
                <Select
                  value={globalRecStatusFilter}
                  onValueChange={(value: 'all' | 'pending' | 'approved' | 'implemented') => setGlobalRecStatusFilter(value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Total sites with recommendations: <span className="font-bold">{sitesWithRecommendations}</span> / {activeSites.length}
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-semibold">Site</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Pending</th>
                      <th className="px-4 py-3 font-semibold">Approved</th>
                      <th className="px-4 py-3 font-semibold">Implemented</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGlobalRecommendations.map((item) => (
                      <tr key={item.siteId} className="border-t border-border">
                        <td className="px-4 py-3">{item.siteName}</td>
                        <td className="px-4 py-3 font-semibold">{item.total}</td>
                        <td className="px-4 py-3">{item.pending}</td>
                        <td className="px-4 py-3">{item.approved}</td>
                        <td className="px-4 py-3">{item.implemented}</td>
                      </tr>
                    ))}
                    {filteredRecommendationsBySite.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                          No recommendations found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGlobalRecPage((current) => Math.max(1, current - 1))}
                  disabled={globalRecPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {globalRecPage} / {globalRecPageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGlobalRecPage((current) => Math.min(globalRecPageCount, current + 1))}
                  disabled={globalRecPage >= globalRecPageCount}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sites with Recommendations - Improved Design */}
          <Card className="shadow-sm border border-slate-200 bg-white">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl">Active sites</CardTitle>
              <CardDescription>
                Select a site to open its recommendations and analytics dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr,220px]">
                <input
                  type="text"
                  value={siteSearchTerm}
                  onChange={(event) => setSiteSearchTerm(event.target.value)}
                  placeholder="Search active sites..."
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
                <Select
                  value={siteStatusFilter}
                  onValueChange={(value: 'all' | 'planning' | 'in_progress' | 'completed' | 'suspended') => setSiteStatusFilter(value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {sitesLoading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                  <p className="text-gray-600">Loading sites...</p>
                </div>
              ) : filteredActiveSites.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <BarChart3 className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No matching sites</p>
                  <p className="text-sm text-gray-500">Try another keyword or status filter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedSites.map((site, index) => {
                    const id = getSiteId(site);
                    return (
                      <SiteRecommendationCard
                        key={id || `site-${index}`}
                        site={site}
                        siteId={id}
                        onSelect={() => setPreviewSite({ ...site, __siteId: id })}
                      />
                    );
                  })}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSitePage((current) => Math.max(1, current - 1))}
                      disabled={sitePage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {sitePage} / {sitePageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSitePage((current) => Math.min(sitePageCount, current + 1))}
                      disabled={sitePage >= sitePageCount}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Focused site preview with blurred background - Improved Design */}
        {previewSite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              {/* Header with gradient */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 rounded-xl shadow-sm">
                    <BarChart3 className="h-6 w-6 text-slate-100" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                      Selected Site
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900">{previewSite.nom}</h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewSite(null)}
                  className="hover:bg-slate-100 rounded-full"
                  aria-label="Close site preview"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Location Card */}
                <div className="rounded-2xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-blue-900">Location</p>
                  </div>
                  <p className="text-lg font-bold text-blue-800">{previewSite.localisation || '—'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-900">Budget</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{(previewSite.budget || 0).toLocaleString()} TND</p>
                  </div>
                  <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-semibold text-purple-900">Status</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 capitalize">{previewSite.status || '—'}</p>
                  </div>
                  <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <p className="text-xs font-semibold text-amber-900">Area</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{previewSite.surface ? `${previewSite.surface} m²` : 'N/A'}</p>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="rounded-2xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-indigo-900 mb-1">AI-Powered Optimization</h4>
                      <p className="text-sm text-indigo-800 leading-relaxed">
                        Open this site to access intelligent recommendations, real-time performance alerts, and comprehensive before/after analytics to track your optimization impact.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewSite(null)}
                    className="px-6 border-2 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
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
            onMoveStatus={handleMoveStatus}
            loading={recommendationsLoading}
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
        {currentPage === 'powerbi' && (
          <div>
            <PowerBiDashboard siteId={effectiveSiteId} refreshInterval={30000} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50/60 min-h-screen">
      {effectiveSiteId && (
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedSiteId('');
            setSearchParams({});
          }}
          className="mb-2 gap-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Sites
        </Button>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-200 rounded-full -mr-32 -mt-32 opacity-25" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100 rounded-full -ml-24 -mb-24 opacity-35" />

        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl shadow-sm">
              <BarChart3 className="h-8 w-8 text-slate-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Site Resources
              </h1>
              <p className="text-muted-foreground mt-2 max-w-4xl leading-relaxed">
                {site
                  ? `${site.nom} — Optimize budget, tasks, and teams with AI-powered recommendations and real-time analytics.`
                  : 'Select a site to unlock intelligent resource optimization and performance tracking.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Site Selector */}
            <Select value={effectiveSiteId} onValueChange={handleSiteChange}>
              <SelectTrigger className="w-72 bg-white border border-slate-300 hover:border-slate-400 transition-colors shadow-sm">
                <SelectValue placeholder="🏗️ Select a site" />
              </SelectTrigger>
              <SelectContent>
                {activeSites.map((s) => {
                  const siteId = getSiteId(s);
                  return (
                    <SelectItem key={siteId} value={siteId}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏗️</span>
                        <span>{s.nom}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              size="lg"
              className="gap-2 shadow-sm bg-slate-900 hover:bg-slate-800 transition-all duration-300"
              onClick={handleGenerateRecommendations}
              disabled={isGenerating}
            >
              <Zap className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate AI Insights'}
            </Button>
          </div>
        </div>
      </div>

      {/* Site Info Bar */}
      {site && (
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-slate-100 rounded-full -mr-20 -mt-20 opacity-60 group-hover:scale-110 transition-transform duration-500" />
          <CardContent className="pt-5 pb-5 relative z-10">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <DollarSign className="h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Budget</p>
                    <p className="text-lg font-bold text-slate-900">{site.budget.toLocaleString()} TND</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Users className="h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Team</p>
                    <p className="text-lg font-bold text-slate-900">{siteTeams?.length || 0} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Target className="h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tasks</p>
                    <p className="text-lg font-bold text-slate-900">{tasks?.length || 0} active</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${site.status === 'in_progress' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                    site.status === 'planning' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                      site.status === 'completed' ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200' :
                        'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                  }`}>
                  {site.status === 'in_progress' ? '🚧 In Progress' :
                    site.status === 'planning' ? '📋 Planning' :
                      site.status === 'completed' ? '✅ Completed' :
                        '⚠️ ' + site.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Cards - Improved Design */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className="group cursor-pointer hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 bg-white overflow-hidden relative"
          onClick={() => setCurrentPage('recommendations')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16 opacity-80 group-hover:scale-110 transition-transform duration-300" />
          <CardContent className="pt-6 pb-4 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-slate-900 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Recommendations</h3>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-slate-700 bg-slate-200 rounded-full">
                {recommendations.length}
              </span>
              <span className="ml-2">AI suggestions</span>
            </p>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 bg-white overflow-hidden relative"
          onClick={() => setCurrentPage('powerbi')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16 opacity-80 group-hover:scale-110 transition-transform duration-300" />
          <CardContent className="pt-6 pb-4 relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-slate-900 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300 relative">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Power BI Intelligence</h3>
            <p className="text-sm text-gray-600">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-slate-700 bg-slate-200 rounded-full">
                Live
              </span>
              <span className="ml-2">Real-time analytics & insights</span>
            </p>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="powerbi" className="gap-2">
            <Zap className="h-4 w-4" />
            Power BI Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Site Recommendations</CardTitle>
                  <CardDescription>
                    {recommendations.length} proposal(s) — approve to freeze a reading; implement to
                    compare indicators in Analytics.
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
                onMoveStatus={handleMoveStatus}
                loading={recommendationsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="powerbi" className="space-y-6">
          <PowerBiDashboard siteId={effectiveSiteId} refreshInterval={30000} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceOptimizationDashboard;
