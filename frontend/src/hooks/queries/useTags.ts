import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export const useBlogTags = () => {
  return useQuery({
    queryKey: ['tags', 'blogs'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/blogs/tags`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/tags`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000,
  });
};
