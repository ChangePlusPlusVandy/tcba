import { Router } from 'express';
import {
  getAllSubscriptions,
  registerSubscription,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from '../controllers/emailSubscriptionController.js';

const router = Router();

router.get('/', getAllSubscriptions);
router.post('/register', registerSubscription);
router.get('/:id', getSubscriptionById);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;
