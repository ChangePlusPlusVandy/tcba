import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdminTags = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['tags', 'admin'],
    queryFn: async () => {
      const response = await api.get('/api/tags');
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
};
