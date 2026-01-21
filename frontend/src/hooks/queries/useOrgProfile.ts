import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgProfile = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['organization', 'profile'],
    queryFn: async () => {
      const response = await api.get('/api/organizations/profile');
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
};
