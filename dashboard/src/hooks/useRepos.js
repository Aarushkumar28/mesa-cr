import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';

export function useRepos() {
  return useQuery({
    queryKey: queryKeys.repos,
    queryFn: async () => {
      const { data } = await api.get('/repos');
      // Backend returns { repos: [...] }
      return data.repos || [];
    },
    staleTime: 60000,
  });
}
