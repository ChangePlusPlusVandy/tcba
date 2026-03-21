import { Router } from 'express';
import {
  getTags,
  createTag,
  addTagToAnnouncement,
  removeTagFromAnnouncement,
  deleteTag,
} from '../controllers/tagController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getTags);
router.post('/', authenticateToken, requireAdmin, createTag);
router.post('/attach', authenticateToken, requireAdmin, addTagToAnnouncement);
router.post('/detach', authenticateToken, requireAdmin, removeTagFromAnnouncement);
router.delete('/:id', authenticateToken, requireAdmin, deleteTag);

export default router;
