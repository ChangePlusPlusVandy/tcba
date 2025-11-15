import { Router } from 'express';
import {
  getAllPageContent,
  getPageContent,
  updatePageContent,
  bulkUpdatePageContent,
  createPageContent,
  deletePageContent,
} from '../controllers/pageContentController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getAllPageContent);
router.get('/:page', getPageContent);

router.post('/', authenticateToken, requireAdmin, createPageContent);
router.put('/bulk', authenticateToken, requireAdmin, bulkUpdatePageContent);
router.put('/:id', authenticateToken, requireAdmin, updatePageContent);
router.delete('/:id', authenticateToken, requireAdmin, deletePageContent);

export default router;
