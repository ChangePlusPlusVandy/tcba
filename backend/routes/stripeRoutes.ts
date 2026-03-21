import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { stripeController } from '../controllers/stripeController.js';

const router = Router();

// Public routes
router.get('/prices', stripeController.getPrices);

// Protected routes
router.get('/subscription', authenticateToken, stripeController.getSubscription);
router.post('/subscription', authenticateToken, stripeController.createSubscription);
router.post('/subscription/cancel', authenticateToken, stripeController.cancelSubscription);

export default router;
