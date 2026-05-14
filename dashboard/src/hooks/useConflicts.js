import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';

export function useConflicts(filters = {}) {
  return useQuery({
    queryKey: queryKeys.conflicts(filters),
    queryFn: async () => {
      const params = {};
      if (filters.repo) params.repo = filters.repo;
      const { data } = await api.get('/conflicts', { params });
      // Backend returns { open_prs: [...], conflicts: [...] }
      return data;
    },
    staleTime: 30000,
  });
}

export function useConflictDetail(id) {
  return useQuery({
    queryKey: queryKeys.conflictDetail(id),
    queryFn: async () => {
      const { data } = await api.get(`/conflicts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
