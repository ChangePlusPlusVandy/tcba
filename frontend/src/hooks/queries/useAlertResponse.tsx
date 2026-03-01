import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAlert = (alertId: string | undefined) => {
  const api = useApi();

  return useQuery({
    queryKey: ['alert', alertId],
    queryFn: async () => {
      if (!alertId) throw new Error('Alert ID is required');
      const response = await api.get(`/api/alerts/${alertId}`);
      return response;
    },
    enabled: !!alertId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAlertResponsesByAlert = (alertId: string | undefined) => {
  const api = useApi();

  return useQuery({
    queryKey: ['alert-responses', 'alert', alertId],
    queryFn: async () => {
      if (!alertId) throw new Error('Alert ID is required');
      const response = await api.get(`/api/alert-responses/alert/${alertId}`);
      return response;
    },
    enabled: !!alertId,
    staleTime: 2 * 60 * 1000,
  });
};
