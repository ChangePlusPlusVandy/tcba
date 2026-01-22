import { Router } from 'express';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { stripeController } from '../controllers/stripeController.js';
import { StripeService } from '../services/stripeService.js';

const router = Router();
router.post('/', express.raw({ type: 'application/json' }), stripeController.handleWebhook);
export default router;
