import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { API_BASE_URL } from '../../config/api';

/**
 * Fetch subscription status for current organization
 */
export function useSubscription() {
  const api = useApi();

  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/api/stripe/subscription'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Fetch available Stripe prices
 */
export function usePrices() {
  return useQuery({
    queryKey: ['stripe-prices'],
    queryFn: () => fetch(`${API_BASE_URL}/api/stripe/prices`).then(r => r.json()),
    staleTime: 30 * 60 * 1000,
  });
}
