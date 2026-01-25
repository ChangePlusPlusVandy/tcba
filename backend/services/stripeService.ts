import { stripe } from '../config/stripe.js';
import { prisma } from '../config/prisma.js';
import Stripe from 'stripe';
import { env } from 'process';

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
        select: {
          email: true,
          name: true,
          primaryContactPhone: true,
        },
      });
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const customer = await stripe.customer.create({
        email: organization?.email,
        name: organization?.name,
        phone: organization?.primaryContactPhone,
      });
      
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
    // Handle different webhook event types:
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - payment_intent.succeeded
    throw new Error('Not implemented');
  }
}
