import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  Site,
  User,
  Task,
  Milestone,
  ResourceAnalysis,
  IdleEquipment,
  PeakConsumptionPeriod,
  WorkerProductivity,
  Recommendation,
  RecommendationType,
  RecommendationStatus,
  Alert,
  AlertSummary,
  DashboardData,
  RecommendationsSummary,
  PowerBiDashboardData,
} from '../types';

// ============ EXTERNAL MICROSERVICE CONFIG ============

const GESTION_SITE_URL = import.meta.env.VITE_GESTION_SITE_URL || 'http://localhost:3001/api';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000';
const PLANNING_URL = 'http://localhost:3001';
/** Dev: '' → `/api` via proxy Vite → :3007 ; prod: URL absolue ex. https://api.example/resource-opt/api */
const RO_RAW = import.meta.env.VITE_RESOURCE_OPTIMIZATION_URL;
const API_BASE_URL = (RO_RAW && String(RO_RAW).replace(/\/$/, '')) || '/api';

// ============ SITES HOOKS (gestion-site:3001) ============

export const useSites = () => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await axios.get<{ data: Site[] }>(`${GESTION_SITE_URL}/gestion-sites?limit=100`);
      return response.data.data;
    },
  });
};

export const useSiteById = (id: string) => {
  return useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      const response = await axios.get<Site>(`${GESTION_SITE_URL}/gestion-sites/${id}`);
      return response.data;
    },
    enabled: !!id && id !== 'undefined' && id !== '',
  });
};

export const useSiteTeams = (siteId: string) => {
  return useQuery({
    queryKey: ['site-teams', siteId],
    queryFn: async () => {
      const response = await axios.get<User[]>(`${GESTION_SITE_URL}/gestion-sites/${siteId}/teams`);
      return response.data;
    },
    enabled: !!siteId && siteId !== 'undefined' && siteId !== '',
  });
};

// ============ USERS/WORKERS HOOKS (user-authentication:3000) ============

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get<User[]>(`${AUTH_API_URL}/users`);
      return response.data;
    },
  });
};

export const useUsersBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['users', 'site', siteId],
    queryFn: async () => {
      // Get all users and filter by siteId
      const response = await axios.get<User[]>(`${AUTH_API_URL}/users`);
      return response.data.filter(u => u.siteIds?.includes(siteId));
    },
    enabled: !!siteId,
  });
};

export const useUserById = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await axios.get<User>(`${AUTH_API_URL}/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============ TASKS HOOKS (gestion-planing:3002) ============

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await axios.get<Task[]>(`${PLANNING_URL}/task`);
      return response.data;
    },
  });
};

export const useTasksBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['tasks', 'site', siteId],
    queryFn: async () => {
      const response = await axios.get<Task[]>(`${PLANNING_URL}/task?siteId=${siteId}`);
      return response.data;
    },
    enabled: !!siteId,
  });
};

export const useMilestonesBySite = (siteId: string) => {
  return useQuery({
    queryKey: ['milestones', 'site', siteId],
    queryFn: async () => {
      const response = await axios.get<Milestone[]>(`${PLANNING_URL}/milestone?siteId=${siteId}`);
      return response.data;
    },
    enabled: !!siteId,
  });
};

// ============ RESOURCE OPTIMIZATION HOOKS (port 3007) ============

export const useIdleEquipment = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'idle-equipment', siteId],
    queryFn: async () => {
      const response = await axios.get<IdleEquipment[]>(
        `${API_BASE_URL}/resource-analysis/idle-equipment/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useEnergyAnalysis = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'energy-consumption', siteId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/resource-analysis/energy-consumption/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useWorkerProductivity = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'worker-productivity', siteId],
    queryFn: async () => {
      const response = await axios.get<WorkerProductivity[]>(
        `${API_BASE_URL}/resource-analysis/worker-productivity/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useResourceCosts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'resource-costs', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/resource-analysis/resource-costs/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useFullAnalysis = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['resource-analysis', 'full', siteId],
    queryFn: async () => {
      const response = await axios.get<ResourceAnalysis>(
        `${API_BASE_URL}/resource-analysis/full-analysis/${siteId}`
      );
      return response.data;
    },
    enabled: isValid,
  });
};

// ============ RECOMMENDATIONS HOOKS ============

export const useRecommendations = (siteId: string, status?: RecommendationStatus) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['recommendations', siteId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ siteId });
      if (status) params.set('status', status);
      const response = await axios.get<Recommendation[]>(
        `${API_BASE_URL}/recommendations?${params.toString()}`,
      );
      return response.data;
    },
    enabled: isValid,
  });
};

export const useGenerateRecommendations = (siteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await axios.post<{ recommendations?: Recommendation[] }>(
        `${API_BASE_URL}/recommendations/generate/${siteId}`,
      );
      return response.data?.recommendations ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', siteId] });
    },
  });
};

export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RecommendationStatus }) => {
      const response = await axios.put<Recommendation>(
        `${API_BASE_URL}/recommendations/${id}/status`,
        { status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRecommendationsSummary = (siteId: string) => {
  return useQuery({
    queryKey: ['recommendations', 'summary', siteId],
    queryFn: async () => {
      const response = await axios.get<RecommendationsSummary>(
        `${API_BASE_URL}/recommendations/site/${siteId}/summary`,
      );
      return response.data;
    },
    enabled: !!siteId,
  });
};

// ============ ALERTS HOOKS ============

export const useAlerts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', siteId],
    queryFn: async () => {
      const response = await axios.get<Alert[]>(`${API_BASE_URL}/alerts/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useUnreadAlerts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', 'unread', siteId],
    queryFn: async () => {
      const response = await axios.get<Alert[]>(`${API_BASE_URL}/alerts/unread/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useCriticalAlerts = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', 'critical', siteId],
    queryFn: async () => {
      const response = await axios.get<Alert[]>(`${API_BASE_URL}/alerts/critical/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useAlertsSummary = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['alerts', 'summary', siteId],
    queryFn: async () => {
      const response = await axios.get<AlertSummary>(`${API_BASE_URL}/alerts/${siteId}/summary`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useGenerateAlerts = (siteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await axios.post<Alert[]>(`${API_BASE_URL}/alerts/generate/${siteId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', siteId] });
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.put(`${API_BASE_URL}/alerts/${id}/read`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useMarkAlertAsResolved = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.put(`${API_BASE_URL}/alerts/${id}/resolve`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// ============ REPORTING HOOKS ============

export const usePerformanceReport = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'performance', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/reports/performance/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useEnvironmentalReport = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'environmental', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/reports/environmental/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useFinancialReport = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'financial', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/reports/financial/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

export const useDashboard = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery({
    queryKey: ['reports', 'dashboard', siteId],
    queryFn: async () => {
      const response = await axios.get<DashboardData>(`${API_BASE_URL}/reports/dashboard/${siteId}`);
      return response.data;
    },
    enabled: isValid,
  });
};

// ============ POWER BI HOOKS ============

export const usePowerBiDashboard = (siteId: string, refreshInterval: number = 30000) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery<PowerBiDashboardData>({
    queryKey: ['power-bi', 'dashboard', siteId],
    queryFn: async () => {
      const response = await axios.get<PowerBiDashboardData>(`${API_BASE_URL}/power-bi/dashboard-data/${siteId}?refresh=true`);
      return response.data;
    },
    enabled: isValid,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  });
};

export const usePowerBiRecommendationsStream = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery<{
    data: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      estimatedSavings: number;
      estimatedCO2Reduction: number;
      priority: number;
      createdAt: string;
      timestamp: string;
    }>;
    total: number;
  }>({
    queryKey: ['power-bi', 'recommendations-stream', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/power-bi/recommendations-stream/${siteId}`);
      return response.data;
    },
    enabled: isValid,
    refetchInterval: 5000, // Every 5 seconds for streaming
  });
};

export const usePowerBiAlertsStream = (siteId: string) => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery<{
    data: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      timestamp: string;
    }>;
    total: number;
  }>({
    queryKey: ['power-bi', 'alerts-stream', siteId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/power-bi/alerts-stream/${siteId}`);
      return response.data;
    },
    enabled: isValid,
    refetchInterval: 5000, // Every 5 seconds for streaming
  });
};

export const usePowerBiPerformanceMetrics = (siteId: string, period: string = '7d') => {
  const isValid = !!siteId && siteId !== 'undefined' && siteId !== '';
  return useQuery<{
    totalRecommendations: number;
    implementedCount: number;
    totalSavings: number;
    totalCO2Reduction: number;
    averagePriority: number;
    period: string;
  }>({
    queryKey: ['power-bi', 'performance', siteId, period],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/power-bi/performance-metrics/${siteId}?period=${period}`);
      return response.data;
    },
    enabled: isValid,
  });
};

// ============ COMBINED HOOKS ============

export const useResourceOptimization = (siteId: string) => {
  // Guard against empty siteId
  const hasValidSiteId = !!siteId && siteId !== 'undefined' && siteId !== '';

  const recommendations = useRecommendations(hasValidSiteId ? siteId : '');
  const alerts = useAlerts(hasValidSiteId ? siteId : '');
  const dashboard = useDashboard(hasValidSiteId ? siteId : '');
  const fullAnalysis = useFullAnalysis(hasValidSiteId ? siteId : '');

  // External data
  const site = useSiteById(hasValidSiteId ? siteId : '');
  const siteTeams = useSiteTeams(hasValidSiteId ? siteId : '');
  const tasks = useTasksBySite(hasValidSiteId ? siteId : '');

  return {
    // Internal data
    recommendations: recommendations.data || [],
    recommendationsLoading: recommendations.isLoading,
    alerts: alerts.data || [],
    alertsLoading: alerts.isLoading,
    dashboard: dashboard.data,
    dashboardLoading: dashboard.isLoading,
    fullAnalysis: fullAnalysis.data,
    fullAnalysisLoading: fullAnalysis.isLoading,

    // External data from microservices
    site: site.data,
    siteLoading: site.isLoading,
    siteTeams: siteTeams.data || [],
    siteTeamsLoading: siteTeams.isLoading,
    tasks: tasks.data || [],
    tasksLoading: tasks.isLoading,

    // Mutations
    generateRecommendations: useGenerateRecommendations(hasValidSiteId ? siteId : ''),
    generateAlerts: useGenerateAlerts(hasValidSiteId ? siteId : ''),
    updateRecommendationStatus: useUpdateRecommendationStatus(),
    markAlertAsRead: useMarkAlertAsRead(),
    markAlertAsResolved: useMarkAlertAsResolved(),
  };
};
