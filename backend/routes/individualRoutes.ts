import { Router } from 'express';
import {
  getAllIndividuals,
  registerIndividual,
  getIndividualById,
  updateIndividual,
  deleteIndividual,
} from '../controllers/individualController.js';

const router = Router();

router.get('/', getAllIndividuals);
router.post('/register', registerIndividual);
router.get('/:id', getIndividualById);
router.put('/:id', updateIndividual);
router.delete('/:id', deleteIndividual);

export default router;
