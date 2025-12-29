import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../config/api';

export const useEmailMutations = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const sendEmail = useMutation({
    mutationFn: async (data: {
      subject: string;
      html: string;
      recipientEmails: string[];
      scheduledFor?: string;
    }) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/email-notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(data.scheduledFor ? 'Failed to schedule email' : 'Failed to send email');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-history'] });
    },
  });

  return { sendEmail };
};
