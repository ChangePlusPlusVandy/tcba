import { Router } from 'express';
import {
  sendCustomEmail,
  sendAnnouncementNotification,
  sendSurveyNotification,
  sendBlogNotification,
  sendAlertNotification,
  sendContactFormEmail,
  getEmailHistory,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/contact-form', sendContactFormEmail);
router.use(authenticateToken);
router.post('/send', sendCustomEmail);
router.get('/history', getEmailHistory);
router.post('/announcement/:id', sendAnnouncementNotification);
router.post('/survey/:id', sendSurveyNotification);
router.post('/blog/:id', sendBlogNotification);
router.post('/alert', sendAlertNotification);

export default router;
