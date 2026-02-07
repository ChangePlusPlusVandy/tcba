import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';
import Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client';

export class StripeService {
  /**
   * Create a Stripe customer for an organization: done
   */
  static async createCustomer(organizationId: string) {
    // Implement customer creation
    throw new Error('Not implemented');
  }

  /**
   * Create or update subscription
   */
  static async createSubscription(organizationId: string, priceId: string) {
    // Implement subscription creation
    // Handle payment intent and client secret
    throw new Error('Not implemented');
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(organizationId: string, immediate = false) {
    // Implement subscription cancellation
    throw new Error('Not implemented');
  }

  /**
   * Get subscription status
   */
  static async getSubscription(organizationId: string) {
    // Implement get subscription with payments and invoices
    throw new Error('Not implemented');
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        const validStatuses = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALING'];
        const status = subscription.status.toUpperCase();
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: (validStatuses.includes(status) ? status : 'INCOMPLETE') as SubscriptionStatus,
            currentPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : new Date(),
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : new Date(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        console.log(`Subscription info: ${JSON.stringify(subscription)}`);
        console.log(`Subscription ${subscription.id} updated.`);
        // Update subscription in your database
        break;
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: deletedSubscription.id },
          data: {
            status: 'CANCELED' as SubscriptionStatus,
            cancelAtPeriodEnd: false,
          },
        });
        console.log(`Subscription ${deletedSubscription.id} deleted.`);
        // Handle subscription deletion in your database
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice ${invoice.id} payment succeeded.`);

        // await prisma.invoice.create({
        //   data: {
        //     stripeInvoiceId: invoice.id,
        //     amountPaid: invoice.amount_paid,
        //     currency: invoice.currency,
        //     status: invoice.status.toUpperCase(),
        //     subscription: {
        //       connect: { stripeSubscriptionId: invoice.subscription as string },
        //     },
        //   },
        // });
        // Handle successful payment in your database
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        // await prisma.invoice.create({
        //   data: {
        //     stripeInvoiceId: failedInvoice.id,
        //     amountPaid: failedInvoice.amount_paid,
        //     currency: failedInvoice.currency,
        //     status: failedInvoice.status.toUpperCase(),
        //     subscription: {
        //       connect: { stripeSubscriptionId: failedInvoice.subscription as string },
        //     },
        //   },
        // });
        console.log(`Invoice ${failedInvoice.id} payment failed.`);
        // Handle failed payment in your database
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // await prisma.paymentIntent.create({
        //   data: {
        //     stripePaymentIntentId: paymentIntent.id,
        //     amount: paymentIntent.amount,
        //     currency: paymentIntent.currency,
        //     status: paymentIntent.status.toUpperCase(),
        //   },
        // });
        console.log(`PaymentIntent ${paymentIntent.id} succeeded.`);
        // Handle successful payment intent in your database
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    // Handle different webhook event types:
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - payment_intent.succeeded
  }
}
