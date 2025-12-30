import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdminSurveys = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['surveys', 'admin'],
    queryFn: async () => {
      const response = await api.get('/api/surveys');
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
};
