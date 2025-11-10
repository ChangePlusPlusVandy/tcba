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

const router = Router();

router.get('/published-date/:publishedDate', getAnnouncementsByPublishedDate);
router.get('/slug/:slug', getAnnouncementBySlug);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;
