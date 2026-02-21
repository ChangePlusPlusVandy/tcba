import { Router } from 'express';
import { eventsController } from '../controllers/eventsController.js';
import { clerkMiddleware, requireAuth } from '@clerk/express';

const router = Router();

// Apply Clerk middleware to all routes
router.use(clerkMiddleware());

// Public routes (no auth required)
// Add middleware to inject isPublic=true for public routes
router.get('/public', (req, res, next) => {
  req.query.isPublic = 'true';
  next();
}, eventsController.getAll); // Get public events only
router.get('/public/:id', eventsController.getById); // Get single public event
router.post('/public/:id/rsvp', eventsController.publicRsvp); // Public RSVP (email required)

// Protected routes (auth required)
router.use(requireAuth());

// Event listing and details
router.get('/', eventsController.getAll); // Get all events (with filters)
router.get('/:id', eventsController.getById); // Get single event

// RSVP management (Organization users)
router.post('/:id/rsvp', eventsController.rsvp); // RSVP to event
router.delete('/:id/rsvp', eventsController.cancelRsvp); // Cancel RSVP
router.get('/my/rsvps', eventsController.getMyRSVPs); // Get user's RSVPs

// Admin-only routes (event management)
router.post('/', eventsController.create); // Create event
router.put('/:id', eventsController.update); // Update event
router.post('/:id/publish', eventsController.publish); // Publish event (sends notifications)
router.delete('/:id', eventsController.delete); // Delete/cancel event

export default router;
