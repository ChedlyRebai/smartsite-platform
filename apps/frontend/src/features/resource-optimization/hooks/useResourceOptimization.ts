import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const RO_RAW = (import.meta as any).env?.VITE_RESOURCE_OPTIMIZATION_URL;

const API_BASE_URL =
  (RO_RAW && String(RO_RAW).replace(/\/$/, '')) || '/api';

export const useResourceOptimization = (siteId: string) => {
  const recommendationsQuery = useQuery({
    queryKey: ['recommendations', siteId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/recommendations?siteId=${encodeURIComponent(siteId)}`,
      );
      return response.data;
    },
    enabled: !!siteId,
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts', siteId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/alerts/${siteId}`,
      );
      return response.data;
    },
    enabled: !!siteId,
  });

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', siteId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/reports/dashboard/${siteId}`,
      );
      return response.data;
    },
    enabled: !!siteId,
  });

  const generateRecommendations = async () => {
    const response = await axios.post(
      `${API_BASE_URL}/recommendations/generate/${siteId}`,
    );
    recommendationsQuery.refetch();
    return response.data;
  };

  const generateAlerts = async () => {
    const response = await axios.post(
      `${API_BASE_URL}/recommendations/generate/${siteId}`,
    );
    alertsQuery.refetch();
    return response.data;
  };

  const updateRecommendationStatus = async (
    id: string,
    status: 'approved' | 'rejected' | 'implemented',
  ) => {
    const response = await axios.put(
      `${API_BASE_URL}/recommendations/${id}/status`,
      { status },
    );
    recommendationsQuery.refetch();
    return response.data;
  };

  const markAlertAsRead = async (id: string) => {
    await axios.put(`${API_BASE_URL}/alerts/${id}/read`);
    alertsQuery.refetch();
  };

  const markAlertAsResolved = async (id: string) => {
    await axios.put(`${API_BASE_URL}/alerts/${id}/resolve`);
    alertsQuery.refetch();
  };

  return {
    recommendations: recommendationsQuery.data || [],
    recommendationsLoading: recommendationsQuery.isLoading,
    recommendationsError: recommendationsQuery.error,
    alerts: alertsQuery.data || [],
    alertsLoading: alertsQuery.isLoading,
    alertsError: alertsQuery.error,
    dashboard: dashboardQuery.data,
    dashboardLoading: dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error,
    generateRecommendations,
    generateAlerts,
    updateRecommendationStatus,
    markAlertAsRead,
    markAlertAsResolved,
  };
};
