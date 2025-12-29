import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgAnnouncements = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['announcements', 'org', { page, limit }],
    queryFn: async () => {
      const response = await api.get(`/api/announcements?page=${page}&limit=${limit}`);
      const data = response.data || response;
      const announcementsArray = Array.isArray(data) ? data : [];
      const publishedAnnouncements = announcementsArray.filter((announcement: any) => announcement.isPublished);

      return {
        data: publishedAnnouncements,
        total: response.total || response.pagination?.total || publishedAnnouncements.length,
      };
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
