import { Router } from 'express';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  promoteToAdmin,
  getDashboardStats,
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getAllAdmins);
router.get('/stats', getDashboardStats);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.post('/promote', promoteToAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
