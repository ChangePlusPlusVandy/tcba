import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { keepPreviousData } from '@tanstack/react-query';

export const useEmailHistory = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['email-history', { page, limit }],
    queryFn: async () => {
      const response = await api.get(
        `/api/email-notifications/history?page=${page}&limit=${limit}`
      );
      const data = response.data || response;
      const emailsArray = Array.isArray(data) ? data : [];
      const total = response.total || response.pagination?.total || emailsArray.length;

      return {
        data: emailsArray,
        total,
      };
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
