import { Router } from 'express';
import {
  getTags,
  createTag,
  addTagToAnnouncement,
  removeTagFromAnnouncement,
  deleteTag,
} from '../controllers/tagController.js';

const router = Router();

router.get('/', getTags);
router.post('/', createTag);
router.post('/attach', addTagToAnnouncement);
router.post('/detach', removeTagFromAnnouncement);
router.delete('/:id', deleteTag);

export default router;
