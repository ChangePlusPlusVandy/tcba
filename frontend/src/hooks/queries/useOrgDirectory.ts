import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgDirectory = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['organizations', 'directory'],
    queryFn: async () => {
      const response = await api.get('/api/organizations/directory');
      return response;
    },
    staleTime: 3 * 60 * 1000,
  });
};
