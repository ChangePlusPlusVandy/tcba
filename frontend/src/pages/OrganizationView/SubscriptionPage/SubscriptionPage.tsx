// import { useState } from 'react';
// Import Stripe Elements and stripePromise
// import { Elements } from '@stripe/react-stripe-js';
// import { stripePromise } from '../../../config/stripe';
// import { StripePaymentForm } from '../../../components/StripePaymentForm';

// Import hooks
// import { useSubscription, usePrices } from '../../../hooks/queries/useStripe';
// import { useCreateSubscription, useCancelSubscription } from '../../../hooks/mutations/useStripe';

export function SubscriptionPage() {
  // const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  // const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch subscription status with useSubscription()
  // Fetch available prices with usePrices()
  // Handle create subscription with useCreateSubscription()
  // Handle cancel subscription with useCancelSubscription()

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6'>Subscription Management</h1>

      <div className='alert alert-info'>
        <span>Implement subscription page</span>
        <ul className='list-disc ml-6 mt-2'>
          <li>Show current subscription status</li>
          <li>Display available pricing plans</li>
          <li>Handle subscription creation with Stripe</li>
          <li>Allow subscription cancellation</li>
        </ul>
      </div>
    </div>
  );
}
