import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
    staleTime: 30000,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboardActivity,
    queryFn: async () => {
      const { data } = await api.get('/dashboard/activity');
      // Backend returns { events: [...] }
      return data.events || [];
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
}
