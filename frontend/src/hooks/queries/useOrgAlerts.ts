import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgAlerts = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['alerts', 'org', { page, limit }],
    queryFn: async () => {
      const response = await api.get(`/api/alerts?page=${page}&limit=${limit}`);
      const data = response.data || response;
      const alertsArray = Array.isArray(data) ? data : [];
      const publishedAlerts = alertsArray.filter((alert: any) => alert.isPublished);

      return {
        data: publishedAlerts,
        total: response.total || response.pagination?.total || publishedAlerts.length,
      };
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
