import { Router } from 'express';
import {
  sendCustomEmail,
  sendAnnouncementNotification,
  sendSurveyNotification,
  sendBlogNotification,
  sendAlertNotification,
} from '../controllers/notificationController.js';

const router = Router();

router.post('/send', sendCustomEmail);
router.post('/announcement/:id', sendAnnouncementNotification);
router.post('/survey/:id', sendSurveyNotification);
router.post('/blog/:id', sendBlogNotification);
router.post('/alert', sendAlertNotification);

export default router;
