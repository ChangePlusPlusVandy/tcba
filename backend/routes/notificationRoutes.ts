import { Router } from 'express';
import {
  sendCustomEmail,
  sendAnnouncementNotification,
  sendSurveyNotification,
  sendBlogNotification,
  sendAlertNotification,
} from '../controllers/notificationController.js';
// import { authenticate } from '../middleware/auth.js'; *will be used once middleware completed*

const router = Router();

// router.use(authenticate); *will be used once middleware completed*

router.post('/send', sendCustomEmail);
router.post('/announcement/:id', sendAnnouncementNotification);
router.post('/survey/:id', sendSurveyNotification);
router.post('/blog/:id', sendBlogNotification);
router.post('/alert', sendAlertNotification);

export default router;
