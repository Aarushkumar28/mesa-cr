import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';

export function useDriftList(repo) {
  return useQuery({
    queryKey: queryKeys.driftList(repo),
    queryFn: async () => {
      const params = {};
      if (repo) params.repo = repo;
      const { data } = await api.get('/drift', { params });
      // Backend returns { snapshots: [...] }
      return data.snapshots || [];
    },
    staleTime: 60000,
  });
}

export function useDriftDetail(snapshotId) {
  return useQuery({
    queryKey: queryKeys.driftDetail(snapshotId),
    queryFn: async () => {
      const { data } = await api.get(`/drift/${snapshotId}`);
      return data;
    },
    enabled: !!snapshotId,
  });
}
