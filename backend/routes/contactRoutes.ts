import { Router } from 'express';
import { sendContactFormEmail } from '../controllers/notificationController.js';

const router = Router();

router.post('/', sendContactFormEmail);

export default router;
