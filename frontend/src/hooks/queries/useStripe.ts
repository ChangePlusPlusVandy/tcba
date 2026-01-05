import { useQuery } from '@tanstack/react-query';
// import { useApi }from '../useApi';

/**
 * Fetch subscription status for current organization
 */
export function useSubscription() {
  // const api = useApi();

  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      // Implement API call to /api/stripe/subscription
      throw new Error('Not implemented');
    },
  });
}

/**
 * Fetch available Stripe prices
 */
export function usePrices() {
  // const api = useApi();

  return useQuery({
    queryKey: ['stripe-prices'],
    queryFn: async () => {
      // Implement API call to /api/stripe/prices
      throw new Error('Not implemented');
    },
  });
}
