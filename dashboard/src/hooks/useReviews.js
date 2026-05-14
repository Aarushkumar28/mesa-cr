import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import api from '../api/client';

export function useReviews(filters = {}) {
  return useQuery({
    queryKey: queryKeys.reviews(filters),
    queryFn: async () => {
      const params = {};
      if (filters.repo) params.repo = filters.repo;
      const { data } = await api.get('/reviews', { params });
      // Backend returns { reviews: [...] }
      return data.reviews || [];
    },
    staleTime: 30000,
  });
}

export function useReviewDetail(prNumber) {
  return useQuery({
    queryKey: queryKeys.reviewDetail(prNumber),
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${prNumber}`);
      return data;
    },
    enabled: !!prNumber,
  });
}
