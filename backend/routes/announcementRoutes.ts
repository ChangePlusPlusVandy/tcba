import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  getAnnouncementBySlug,
  getAnnouncementsByPublishedDate,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
} from '../controllers/announcementController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/published-date/:publishedDate', getAnnouncementsByPublishedDate);
router.get('/slug/:slug', getAnnouncementBySlug);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', authenticateToken, createAnnouncement);
router.put('/:id', authenticateToken, updateAnnouncement);
router.delete('/:id', authenticateToken, deleteAnnouncement);
router.post('/:id/publish', authenticateToken, publishAnnouncement);
router.post('/:id/unpublish', authenticateToken, unpublishAnnouncement);

export default router;
