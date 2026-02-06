import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';
import Stripe from 'stripe';
import { env } from 'process';
import { connect } from 'http2';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

export class StripeService {
  baseUrl = 'https://api.stripe.com/v1/';

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
      }
    }

    /**
     * Create or update subscription
     * If an organization doesn't have a stripeId than guide them to createCustomer
     */
    static async createSubscription(organizationId: string, priceId: string) {
      // Implement subscription creation
      // Handle payment intent and client secret
      try {

        const organization = await prisma.organization.findUnique({
          where: {
            id: organizationId
          },
          include: {
            subscription: true,
          }
        })


        if(!organization){
          throw new Error("Organization id not found");
        }

        if(organization.subscription){
          throw new Error("Organization already has a subscription")
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
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
        });

        const stripeInvoice = newSubscription.latest_invoice;
        if (!stripeInvoice || typeof stripeInvoice === "string") {
          throw new Error("Stripe latest_invoice was not expanded");
        }

        const paymentIntent = stripeInvoice.payment_intent;
        if (!paymentIntent || typeof paymentIntent === "string") {
          throw new Error("Stripe payment_intent was not expanded");
        }


        const result = await prisma.subscription.create({
          data: {
            organizationId : organizationId,
            stripeCustomerId: customerInfo.id,
            stripeSubscriptionId: newSubscription.id,
            stripePriceId: priceId,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(newSubscription.currentPeriodStart * 1000),
            currentPeriodEnd: new Date(newSubscription.currentPeriodEnd * 1000),
            cancelAtPeriodEnd: newSubscription.cancel_at_period_end,
            payments: {
                create: {
                stripePaymentIntentId: paymentIntent.id,
                stripeInvoiceId: stripeInvoice.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: PaymentStatus.PENDING,
              }
            },
            invoices: {
              create: {
                stripeInvoiceId: stripeInvoice.id,
                amount:
                  stripeInvoice.amount_due ??
                  stripeInvoice.amount_paid ??
                  stripeInvoice.amount_remaining ??
                  0,
                currency: stripeInvoice.currency ?? "usd",
                status: stripeInvoice.status ?? "draft",
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
        })

      } catch (error: any) {
        console.error('Create subscription failed: ', error.message);
      }
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
    // Handle different webhook event types:
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - payment_intent.succeeded
    throw new Error('Not implemented');
  }
}
