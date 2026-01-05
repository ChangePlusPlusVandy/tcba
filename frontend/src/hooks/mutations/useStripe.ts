import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { useApi } from '../useApi';

/**
 * Create subscription mutation
 */
export function useCreateSubscription() {
  // const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_priceId: string) => {
      // Implement API call to POST /api/stripe/subscription
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

/**
 * Cancel subscription mutation
 */
export function useCancelSubscription() {
  // const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_immediate: boolean = false) => {
      // Implement API call to POST /api/stripe/subscription/cancel
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
