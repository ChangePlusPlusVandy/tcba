import { Router } from 'express';
import express from 'express';
import { stripeController } from '../controllers/stripeController.js';

const router = Router();
router.post('/', express.raw({ type: 'application/json' }), stripeController.handleWebhook);
export default router;
