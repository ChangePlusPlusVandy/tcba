import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdminBlogs = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['blogs', 'admin', { page, limit }],
    queryFn: async () => {
      const response = await api.get(`/api/blogs?page=${page}&limit=${limit}`);
      return response;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
