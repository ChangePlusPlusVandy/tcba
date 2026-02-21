import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';
import Stripe from 'stripe';
import { env } from 'process';
import { connect } from 'http2';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

export class StripeService {
  private static mapStripeSubscriptionStatus(s: string): SubscriptionStatus {
    switch (s) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete_expired':
        return SubscriptionStatus.CANCELED; // or INCOMPLETE if you prefer
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }
  private static mapStripePaymentIntentStatus(piStatus: string): PaymentStatus {
    switch (piStatus) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
  /**
   * Create a Stripe customer for an organization
   */
  static async createCustomer(organizationId: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const customer = await stripe.customer.create({
        email: organization?.email,
        name: organization?.name,
        phone: organization?.primaryContactPhone,
      });

      return customer;
    } catch (error: any) {
      console.error('Create customer error: ', error.message);
      throw error;
    }
  }

  /**
   * Create or update subscription
   * If an organization doesn't have a stripeId than guide them to createCustomer
   */
  static async createSubscription(organizationId: string, priceId: string) {
    // Implement subscription creation
    // Handle payment intent and client secret
    // ToDo: Handle issues with paymentIntent and the cases that come with that
    try {
      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        include: {
          subscription: true,
        },
      });

      if (!organization) {
        throw new Error('Organization id not found');
      }

      if (organization.subscription) {
        throw new Error('Organization already has a subscription');
      }

      const customerInfo = await this.createCustomer(organizationId);

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const newSubscription = await stripe.subscriptions.create({
        customer: customerInfo.id,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      const subscriptionStatus = StripeService.mapStripeSubscriptionStatus(newSubscription.status);

      const stripeInvoice = newSubscription.latest_invoice;
      if (!stripeInvoice || typeof stripeInvoice === 'string') {
        throw new Error('Stripe latest_invoice was not expanded');
      }

      const paymentIntent = stripeInvoice.payment_intent;

      const paymentStatus =
        paymentIntent && typeof paymentIntent !== 'string'
          ? StripeService.mapStripePaymentIntentStatus(paymentIntent.status)
          : PaymentStatus.PENDING;

      const result = await prisma.subscription.create({
        data: {
          organizationId: organizationId,
          stripeCustomerId: customerInfo.id,
          stripeSubscriptionId: newSubscription.id,
          stripePriceId: priceId,
          status: subscriptionStatus,
          currentPeriodStart: new Date(newSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(newSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: newSubscription.cancel_at_period_end,
          payments: {
            create: {
              stripePaymentIntentId: paymentIntent.id,
              stripeInvoiceId: stripeInvoice.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentStatus,
            },
          },
          invoices: {
            create: {
              stripeInvoiceId: stripeInvoice.id,
              amount:
                stripeInvoice.amount_due ??
                stripeInvoice.amount_paid ??
                stripeInvoice.amount_remaining ??
                0,
              currency: stripeInvoice.currency ?? 'usd',
              status: stripeInvoice.status ?? 'draft',
              invoicePdf: stripeInvoice.invoice_pdf ?? null,
              hostedInvoiceUrl: stripeInvoice.hosted_invoice_url ?? null,

              periodStart: new Date(
                ((stripeInvoice.period_start ?? stripeInvoice.created) as number) * 1000
              ),
              periodEnd: new Date(
                ((stripeInvoice.period_end ?? stripeInvoice.created) as number) * 1000
              ),
            },
          },
          createdAt: new Date(newSubscription.created * 1000),
          updatedAt: new Date(newSubscription.created * 1000),
        },
      });
      return {
        subscription: result,
        clientSecret: paymentIntent.client_secret,
        stripeSubscriptionId: newSubscription.id,
        stripeInvoiceId: stripeInvoice.id,
        stripePaymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Create subscription failed: ', error.message);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(organizationId: string, immediate = false) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const subscriptionID = await prisma.subscription.findUnique({
        where: {
          organizationId: organizationId,
        },
        select: {
          id: true,
          stripeSubscriptionId: true,
        },
      });

      if (!subscriptionID) {
        throw new Error(`No subscription found for : ${organizationId}`);
      }

      if (immediate) {
        await stripe.subscriptions.cancel(subscriptionID.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscriptionID.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      await prisma.subscription.update({
        where: { id: subscriptionID.id },
        data: {
          cancelAtPeriodEnd: !immediate,
          status: immediate ? SubscriptionStatus.CANCELED : SubscriptionStatus.ACTIVE,
        },
      });
    } catch (error: any) {
      console.error('Cancel subscription failed: ', error);
      throw error;
    }
  }

  /**
   * Update subscription status
   */

  /**
   * Get subscription status
   */
  static async getSubscription(organizationId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: {
          organizationId: organizationId,
        },
        select: {
          status: true,
        },
      });

      if (!subscription) {
        throw new Error("Organization doesn't have subscription");
      }

      return subscription.status;
    } catch (error: any) {
      console.error(`Error getting subscription status for ${organizationId}: `, error);
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(event: Stripe.Event) {
    // Handle different webhook event types:
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - payment_intent.succeeded
    throw new Error('Not implemented');
  }
}
