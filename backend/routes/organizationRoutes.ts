import { Router } from 'express';
import {
  getAllOrganizations,
  registerOrganization,
  getOrganizationById,
  updateOrganization,
  approveOrganization,
  declineOrganization,
  archiveOrganization,
  unarchiveOrganization,
  deleteOrganization,
  deactivateAccount,
} from '../controllers/organizationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllOrganizations);
router.post('/register', registerOrganization);
router.get('/:id', authenticateToken, getOrganizationById);
router.put('/:id', authenticateToken, updateOrganization);
router.put('/:id/approve', authenticateToken, approveOrganization);
router.put('/:id/decline', authenticateToken, declineOrganization);
router.put('/:id/archive', authenticateToken, archiveOrganization);
router.put('/:id/unarchive', authenticateToken, unarchiveOrganization);
router.delete('/:id', authenticateToken, deleteOrganization);
router.delete('/profile/deactivate', authenticateToken, deactivateAccount);

export default router;
