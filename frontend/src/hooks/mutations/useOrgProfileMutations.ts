import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../config/api';

export const useOrgProfileMutations = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/organizations/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'profile'] });
    },
  });

  const deactivateAccount = useMutation({
    mutationFn: async (reason: string) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/organizations/profile/deactivate`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate account');
      }
      return response.json();
    },
  });

  return { updateProfile, deactivateAccount };
};
