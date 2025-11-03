import { Router } from 'express';
import {
  getAllOrganizations,
  registerOrganization,
  getOrganizationById,
  updateOrganization,
  approveOrganization,
  deleteOrganization,
} from '../controllers/organizationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllOrganizations);
router.post('/register', registerOrganization);
router.get('/:id', authenticateToken, getOrganizationById);
router.put('/:id', authenticateToken, updateOrganization);
router.put('/:id/approve', authenticateToken, approveOrganization);
router.delete('/:id', authenticateToken, deleteOrganization);

export default router;
