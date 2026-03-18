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

      case 'customer.subscription.created':
        const createdSubscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.create({
          data: {
            stripeSubscriptionId: createdSubscription.id,
            stripeCustomerId: createdSubscription.customer as string,
            stripePriceId: createdSubscription.items.data[0].price.id,
            status: createdSubscription.status.toUpperCase() as SubscriptionStatus,
            currentPeriodStart: createdSubscription.current_period_start
              ? new Date(createdSubscription.current_period_start * 1000)
              : new Date(),
            currentPeriodEnd: createdSubscription.current_period_end
              ? new Date(createdSubscription.current_period_end * 1000)
              : new Date(),
            cancelAtPeriodEnd: createdSubscription.cancel_at_period_end,
            organization: {
              connect: { id: createdSubscription.metadata.organizationId },
            },
          },
        });
        console.log(`Subscription ${createdSubscription.id} created.`);
        // Handle subscription creation in your database
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) {
          console.log(`Invoice ${invoice.id} has no subscription, skipping.`);
          break;
        }
        await prisma.invoice.create({
          data: {
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: (invoice.status ?? 'unknown').toUpperCase(),
            invoicePdf: invoice.invoice_pdf ?? null,
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
            periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : new Date(),
            periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : new Date(),
            subscription: {
              connect: { stripeSubscriptionId: invoice.subscription as string },
            },
          },
        });
        console.log(`Invoice ${invoice.id} payment succeeded.`);
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (!failedInvoice.subscription) {
          console.log(`Invoice ${failedInvoice.id} has no subscription, skipping.`);
          break;
        }
        await prisma.invoice.create({
          data: {
            stripeInvoiceId: failedInvoice.id,
            amount: failedInvoice.amount_due,
            currency: failedInvoice.currency,
            status: (failedInvoice.status ?? 'unknown').toUpperCase(),
            invoicePdf: failedInvoice.invoice_pdf ?? null,
            hostedInvoiceUrl: failedInvoice.hosted_invoice_url ?? null,
            periodStart: failedInvoice.period_start
              ? new Date(failedInvoice.period_start * 1000)
              : new Date(),
            periodEnd: failedInvoice.period_end
              ? new Date(failedInvoice.period_end * 1000)
              : new Date(),
            subscription: {
              connect: { stripeSubscriptionId: failedInvoice.subscription as string },
            },
          },
        });
        console.log(`Invoice ${failedInvoice.id} payment failed.`);
        break;
      case 'payment_intent.succeeded':
        // TODO: requires subscriptionId — coordinate with whoever implements createSubscription
        // prisma model is Payment (not PaymentIntent), needs subscription relation
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${paymentIntent.id} succeeded.`);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}
