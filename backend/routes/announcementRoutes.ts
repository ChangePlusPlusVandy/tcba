import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  getAnnouncementBySlug,
  getAnnouncementsByPublishedDate,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/published-date/:publishedDate', getAnnouncementsByPublishedDate);
router.get('/slug/:slug', getAnnouncementBySlug);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', authenticateToken, createAnnouncement);
router.put('/:id', authenticateToken, updateAnnouncement);
router.delete('/:id', authenticateToken, deleteAnnouncement);

export default router;
