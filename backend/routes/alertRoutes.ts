import { Router } from 'express';
import {
  getAlerts,
  getAlertById,
  getAlertsByPriority,
  createAlert,
  updateAlert,
  deleteAlert,
  publishAlert,
} from '../controllers/alertController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes (require authentication but accessible to all authenticated orgs)
router.get('/', authenticateToken, getAlerts);
router.get('/priority/:priority', authenticateToken, getAlertsByPriority);
router.get('/:id', authenticateToken, getAlertById);

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, createAlert);
router.put('/:id', authenticateToken, requireAdmin, updateAlert);
router.delete('/:id', authenticateToken, requireAdmin, deleteAlert);
router.post('/:id/publish', authenticateToken, requireAdmin, publishAlert);

export default router;

