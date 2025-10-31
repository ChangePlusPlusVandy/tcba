import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncementsByPublishedDate,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController';

const router = Router();

router.get('/published-date/:publishedDate', getAnnouncementsByPublishedDate);
router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;
