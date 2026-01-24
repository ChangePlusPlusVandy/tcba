import e, { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { StripeService } from '../services/stripeService.js';
// import { stripe } from '../config/stripe.js';
// import { STRIPE_WEBHOOK_SECRET } from '../config/stripe.js';

export const stripeController = {
  /**
   * Create subscription
   */
  createSubscription: async (req: AuthenticatedRequest, res: Response) => {
    try {

      // Get priceId from request body
      // Get organizationId from req.user
      // Call StripeService.createSubscription
      // Return subscription details with clientSecret
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User is not authenticated or lacks an organization' });
      }
      const organizationId = req.user.id;
      const {priceId} = req.body;

      const subscription = StripeService.createSubscription(organizationId, priceId);
      res.status(201).json(subscription)
    
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get subscription status
   */
  getSubscription: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get organizationId from req.user
      // Call StripeService.getSubscription
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User is not authenticated or lacks an organization' });
      }
      const organizationId = req.user?.id;

      const subscription = StripeService.getSubscription(organizationId);
      res.status(201).json(subscription);
    } catch (error: any) {
      console.error('Error getting subscription:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (req: AuthenticatedRequest, res: Response) => {
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
  handleWebhook: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Verify webhook signature
      // Call StripeService.handleWebhook
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Get available pricing plans
   */
  getPrices: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Fetch active prices from Stripe
      res.status(501).json({ error: 'Not implemented' });
    } catch (error: any) {
      console.error('Error getting prices:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
