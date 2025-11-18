import { Router } from 'express';
import {
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  getBlogTags,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from '../controllers/blogController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllBlogs);
router.get('/tags', getBlogTags);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);
router.post('/', authenticateToken, requireAdmin, createBlog);
router.put('/:id', authenticateToken, requireAdmin, updateBlog);
router.delete('/:id', authenticateToken, requireAdmin, deleteBlog);
router.put('/:id/publish', authenticateToken, requireAdmin, publishBlog);
router.put('/:id/unpublish', authenticateToken, requireAdmin, unpublishBlog);

export default router;
