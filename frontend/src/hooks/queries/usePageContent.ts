import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config/api';

type PageContent = {
  [key: string]: { id: string; value: string; type: string };
};

export const usePageContent = (pageName: string) => {
  return useQuery({
    queryKey: ['page-content', pageName],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/page-content/${pageName}`);
      if (!response.ok) throw new Error('Failed to fetch page content');
      return response.json() as Promise<PageContent>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useMapOrganizations = () => {
  return useQuery({
    queryKey: ['map-organizations'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/map/organizations`);
      if (!response.ok) throw new Error('Failed to fetch map organizations');
      return response.json();
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
