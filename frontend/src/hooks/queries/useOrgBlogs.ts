import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgBlogs = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['blogs', 'org', { page, limit }],
    queryFn: async () => {
      const response = await api.get(`/api/blogs?page=${page}&limit=${limit}`);
      const data = response.data || response;
      const blogsArray = Array.isArray(data) ? data : [];
      const publishedBlogs = blogsArray.filter((blog: any) => blog.isPublished);

      return {
        data: publishedBlogs,
        total: response.total || response.pagination?.total || publishedBlogs.length,
      };
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
