import { Router } from 'express';
import {
  getAllOrganizations,
  registerOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from '../controllers/organizationController.js';

const router = Router();

router.get('/', getAllOrganizations);
router.post('/register', registerOrganization);
router.get('/:id', getOrganizationById);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

export default router;
