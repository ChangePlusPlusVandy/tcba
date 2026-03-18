import { mockReset } from 'jest-mock-extended';

// Preserve Prisma enums (SubscriptionStatus, PaymentStatus) - setup mocks entire @prisma/client
jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn().mockImplementation(() => require('../setup/prisma-mock').prismaMock),
}));

// Mock Stripe - the service uses require('stripe')(key) and calls methods on the result
const mockStripeInstance = {
  customers: {
    create: jest.fn(),
  },
  customer: {
    create: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  },
  paymentIntents: {
    retrieve: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn(() => mockStripeInstance);
});

// Use the prisma mock from global setup - don't override config/prisma
import { prismaMock } from '../setup/prisma-mock.js';
import { StripeService } from '../../services/stripeService.js';

beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
  // Handle both batch [op1, op2] and interactive (tx) => {} transaction forms
  (prismaMock.$transaction as jest.Mock).mockImplementation(async (arg: any) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg(prismaMock);
  });
});

describe('StripeService', () => {
  describe('updateSubscriptionAfterPaymentConfirmed', () => {
    const mockPayment = {
      id: 'pay-1',
      stripePaymentIntentId: 'pi_123',
      subscriptionId: 'sub-1',
      status: 'PENDING' as const,
      subscription: {
        id: 'sub-1',
        stripeSubscriptionId: 'stripe_sub_123',
      },
    } as any;

    const mockStripeSubscription = {
      status: 'active',
      current_period_start: 1609459200,
      current_period_end: 1612137600,
      cancel_at_period_end: false,
    };

    it('updates payment to SUCCEEDED and syncs subscription from Stripe', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(mockPayment);
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);

      await StripeService.updateSubscriptionAfterPaymentConfirmed('pi_123');

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        include: { subscription: true },
      });
      expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('stripe_sub_123');
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: { status: 'SUCCEEDED' },
      });
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }),
      });
    });

    it('returns early if payment not found (non-subscription payment)', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await StripeService.updateSubscriptionAfterPaymentConfirmed('pi_unknown');

      expect(mockStripeInstance.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('updateSubscriptionAfterPaymentFailed', () => {
    const mockSubscription = {
      id: 'sub-1',
      stripeSubscriptionId: 'stripe_sub_123',
    } as any;

    const mockStripeSubscription = {
      status: 'past_due',
      current_period_start: 1609459200,
      current_period_end: 1612137600,
      cancel_at_period_end: false,
    };

    const mockPaymentIntent = {
      id: 'pi_123',
      status: 'requires_payment_method',
    };

    it('updates subscription and payment status when payment found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        stripePaymentIntentId: 'pi_123',
      } as any);
      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      await StripeService.updateSubscriptionAfterPaymentFailed('stripe_sub_123', 'pi_123');

      expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('stripe_sub_123');
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          status: 'PAST_DUE',
        }),
      });
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_123' },
        data: { status: 'FAILED' },
      });
    });

    it('updates only subscription when payment intent id not provided', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      await StripeService.updateSubscriptionAfterPaymentFailed('stripe_sub_123');

      expect(prismaMock.subscription.update).toHaveBeenCalled();
      expect(prismaMock.payment.update).not.toHaveBeenCalled();
    });

    it('returns early if subscription not found in our DB', async () => {
      // Service fetches from Stripe first, then checks our DB
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
        status: 'past_due',
        current_period_start: 1609459200,
        current_period_end: 1612137600,
        cancel_at_period_end: false,
      });
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await StripeService.updateSubscriptionAfterPaymentFailed('stripe_sub_unknown', 'pi_123');

      // No DB updates when subscription not in our DB
      expect(prismaMock.subscription.update).not.toHaveBeenCalled();
      expect(prismaMock.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('handles events without throwing', async () => {
      await expect(
        StripeService.handleWebhook({
          type: 'invoice.payment_succeeded',
          data: { object: { payment_intent: 'pi_123' } },
        } as any)
      ).resolves.toBeUndefined();
    });

    it('handles unknown event types', async () => {
      await expect(
        StripeService.handleWebhook({
          type: 'customer.unknown',
          data: { object: {} },
        } as any)
      ).resolves.toBeUndefined();
    });
  });

  describe('getSubscription', () => {
    it('returns subscription status for organization', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        status: 'ACTIVE' as const,
      } as any);

      const result = await StripeService.getSubscription('org-1');

      expect(result).toBe('ACTIVE');
      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        select: { status: true },
      });
    });

    it('returns undefined when organization has no subscription (service logs error)', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      const result = await StripeService.getSubscription('org-unknown');

      expect(result).toBeUndefined();
    });
  });
});
