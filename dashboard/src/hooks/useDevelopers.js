import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';

export function useDevelopers(repo) {
  return useQuery({
    queryKey: queryKeys.developers(repo),
    queryFn: async () => {
      const params = {};
      if (repo) params.repo = repo;
      const { data } = await api.get('/developers', { params });
      // Backend returns { developers: [...] }
      return data.developers || [];
    },
    staleTime: 60000,
  });
}

export function useDeveloperDetail(username) {
  return useQuery({
    queryKey: queryKeys.developerDetail(username),
    queryFn: async () => {
      const { data } = await api.get(`/developers/${username}`);
      return data;
    },
    enabled: !!username,
  });
}
