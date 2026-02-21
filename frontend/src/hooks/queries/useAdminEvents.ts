import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdminEvents = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['events', 'admin', { page, limit }],
    queryFn: async () => {
      const response = await api.get(`/api/events?page=${page}&limit=${limit}`);
      return response;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
