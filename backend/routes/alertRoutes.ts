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

router.get('/', getAlerts);
router.get('/priority/:priority', getAlertsByPriority);
router.get('/:id', getAlertById);
router.post('/', authenticateToken, requireAdmin, createAlert);
router.put('/:id', authenticateToken, requireAdmin, updateAlert);
router.delete('/:id', authenticateToken, requireAdmin, deleteAlert);
router.post('/:id/publish', authenticateToken, requireAdmin, publishAlert);

export default router;
