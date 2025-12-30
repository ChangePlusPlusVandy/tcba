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
import { CacheService } from '../utils/cache.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getAllAdmins);
router.get('/stats', getDashboardStats);
router.post('/clear-cache', async (req, res) => {
  try {
    await CacheService.clear();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.post('/promote', promoteToAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
