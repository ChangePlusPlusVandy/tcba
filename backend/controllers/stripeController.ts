import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../types/index.js';
import { StripeService } from '../services/stripeService.js';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../config/stripe.js';

export const stripeController = {
  /**
   * Create subscription: done
   */
  createSubscription: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get priceId from request body
      // Get organizationId from req.user
      // Call StripeService.createSubscription
      // Return subscription details with clientSecret
      if (!req.user?.id) {
        return res
          .status(401)
          .json({ error: 'User is not authenticated or lacks an organization' });
      }
      const organizationId = req.user.id;
      const { priceId } = req.body;

      const subscription = await StripeService.createSubscription(organizationId, priceId);
      res.status(201).json(subscription);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  },

  /**
   * Get subscription status: done
   */
  getSubscription: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get organizationId from req.user
      // Call StripeService.getSubscription
      if (!req.user?.id) {
        return res
          .status(401)
          .json({ error: 'User is not authenticated or lacks an organization' });
      }
      const organizationId = req.user?.id;

      const subscription = await StripeService.getSubscription(organizationId);
      res.status(200).json(subscription);
    } catch (error: any) {
      console.error('Error getting subscription:', error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res
          .status(401)
          .json({ error: 'User is not authenticated or lacks an organization' });
      }
      const organizationId = req.user.id;
      const { immediate = false } = req.body;

      await StripeService.cancelSubscription(organizationId, Boolean(immediate));
      res.status(200).json({ message: 'Subscription cancelled successfully' });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  },

  /**
   * Stripe webhook handler
   */
  handleWebhook: async (req: Request, res: Response) => {
    let event: Stripe.Event;
    try {
      const sig = req.headers['stripe-signature'] as string;
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      console.error('Error handling webhook:', error);
      return res
        .status(400)
        .send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      await StripeService.handleWebhook(event);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * Get available pricing plans
   */
  getPrices: async (_req: Request, res: Response) => {
    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });
      res.status(200).json(prices.data);
    } catch (error: any) {
      console.error('Error getting prices:', error);
      res.status(500).json({ error: 'Failed to get prices' });
    }
  },
};
