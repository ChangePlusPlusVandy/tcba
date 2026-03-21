import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../config/api';

export const useAlertResponseMutations = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const submitResponse = useMutation({
    mutationFn: async (data: {
      alertId: string;
      organizationId: string;
      responses: Record<string, any>;
    }) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/alert-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit response');
      }
      if (response.status === 204) return null;
      return response.json();
    },
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-responses'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'active'] });
    },
  });

  return { submitResponse };
};
