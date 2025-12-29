import { useQuery, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export const useAnnouncements = (page = 1, limit = 100) => {
  return useQuery({
    queryKey: ['announcements', { page, limit }],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/announcements?page=${page}&limit=${limit}`);
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useAnnouncement = (slug: string) => {
  return useQuery({
    queryKey: ['announcement', slug],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/announcements/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
};
