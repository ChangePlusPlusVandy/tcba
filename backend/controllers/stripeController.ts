import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from '../services/stripeService.js';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../config/stripe.js';

export const stripeController = {
  /**
   * Create subscription: done
   */
  createSubscription: async (req: Request, res: Response) => {
    try {
      // Get priceId from request body
      // Get organizationId from req.user
      // Call StripeService.createSubscription
      // Return subscription details with clientSecret
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get subscription status: done
   */
  getSubscription: async (req: Request, res: Response) => {
    try {
      // Get organizationId from req.user
      // Call StripeService.getSubscription
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      console.error('Error getting subscription:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (req: Request, res: Response) => {
    try {
      // Get immediate flag from request body
      // Get organizationId from req.user
      // Call StripeService.cancelSubscription
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: error.message });
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
        .sendStatus(400)
        .send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      await StripeService.handleWebhook(event);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return res.json({ received: true });
    }
  },

  /**
   * Get available pricing plans
   */
  getPrices: async (req: Request, res: Response) => {
    try {
      // Fetch active prices from Stripe
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      console.error('Error getting prices:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
