import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
} from '../controllers/inAppNotificationController.js';

const router = Router();

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/mark-read', markAsRead);

export default router;
