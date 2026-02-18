import { Router } from 'express';
import { eventsController } from '../controllers/eventsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// public routes
router.get('/', eventsController.getAll);
router.get('/my-rsvps', authenticateToken, eventsController.getMyRSVPs);
router.get('/:id', eventsController.getById);

// admin routes
router.post('/', authenticateToken, eventsController.create);
router.put('/:id', authenticateToken, eventsController.update);
router.post('/:id/publish', authenticateToken, eventsController.publish);
router.delete('/:id', authenticateToken, eventsController.delete);

// RSVP routes
router.post('/:eventId/rsvp', authenticateToken, eventsController.rsvp);

export default router;
