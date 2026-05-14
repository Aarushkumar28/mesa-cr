import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';
import useUiStore from '../store/uiStore';

export function useConfig(repo) {
  return useQuery({
    queryKey: queryKeys.config(repo),
    queryFn: async () => {
      const endpoint = repo ? `/repos/${encodeURIComponent(repo)}/rules` : '/repos/global/rules';
      const { data } = await api.get(endpoint);
      // Backend returns { repo, rules: {...} }
      return data;
    },
    staleTime: 60000,
  });
}

export function useSaveConfig(repo) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (rulesData) => {
      const endpoint = repo ? `/repos/${encodeURIComponent(repo)}/rules` : '/repos/global/rules';
      const { data } = await api.put(endpoint, rulesData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config(repo) });
      addToast({ type: 'success', title: 'Config Saved', message: 'Rules updated successfully.' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Save Failed', message: 'Failed to save rules. Please try again.' });
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => {
      const { data } = await api.get('/health');
      return data;
    },
    staleTime: 10000,
    refetchInterval: 30000,
    retry: 1,
  });
}
