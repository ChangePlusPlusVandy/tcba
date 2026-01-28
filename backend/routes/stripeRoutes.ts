import { Router } from 'express';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { stripeController } from '../controllers/stripeController.js';
import { StripeService } from '../services/stripeService.js';

const router = Router();

// Protected routes
router.get('/subscription', authenticateToken, stripeController.getSubscription);
router.post('/subscription', authenticateToken, stripeController.createSubscription);
router.post('/subscription/cancel', authenticateToken, stripeController.cancelSubscription);

// Public routes
router.post('/customer', StripeService.createCustomer);

export default router;
