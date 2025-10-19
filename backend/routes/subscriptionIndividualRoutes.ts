import { Router } from 'express';
import {
  getAllIndividualSubscriptions,
  createIndividualSubscription,
  getIndividualSubscriptionById,
  updateIndividualSubscription,
  deleteIndividualSubscription
} from '../controllers/subscriptionIndividualController.js';

const router = Router();

router.get('/', getAllIndividualSubscriptions);
router.post('/', createIndividualSubscription);
router.get('/:id', getIndividualSubscriptionById);
router.put('/:id', updateIndividualSubscription);
router.delete('/:id', deleteIndividualSubscription);

export default router;