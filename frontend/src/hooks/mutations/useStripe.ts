import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

/**
 * Create subscription mutation
 */
export function useCreateSubscription() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (priceId: string) =>
      api.post('/api/stripe/subscription', { priceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

/**
 * Cancel subscription mutation
 */
export function useCancelSubscription() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (immediate: boolean = false) =>
      api.post('/api/stripe/subscription/cancel', { immediate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
