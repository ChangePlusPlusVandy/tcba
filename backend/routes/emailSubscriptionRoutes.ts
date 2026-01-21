import { Router } from 'express';
import {
  getAllSubscriptions,
  registerSubscription,
  getSubscriptionById,
  getSubscriptionByEmail,
  updateSubscription,
  deleteSubscription,
} from '../controllers/emailSubscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllSubscriptions);
router.get('/:id', authenticateToken, getSubscriptionById);
router.put('/:id', authenticateToken, updateSubscription);
router.delete('/:id', authenticateToken, deleteSubscription);
router.get('/by-email', getSubscriptionByEmail);
router.post('/register', registerSubscription);

export default router;
