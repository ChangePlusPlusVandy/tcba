import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../config/api';

export const usePageContentMutations = (pageName: string) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updatePageContent = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/api/page-content/${pageName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update page content');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-content', pageName] });
    },
  });

  return { updatePageContent };
};
