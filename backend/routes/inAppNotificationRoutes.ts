import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
} from '../controllers/inAppNotificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.post('/mark-read', authenticateToken, markAsRead);

export default router;
