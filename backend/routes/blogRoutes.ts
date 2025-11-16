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
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllBlogs);
router.get('/tags', getBlogTags);
router.get('/slug/:slug', getBlogBySlug);

router.get('/:id', authenticateToken, getBlogById);
router.post('/', authenticateToken, createBlog);
router.put('/:id', authenticateToken, updateBlog);
router.delete('/:id', authenticateToken, deleteBlog);
router.put('/:id/publish', authenticateToken, publishBlog);
router.put('/:id/unpublish', authenticateToken, unpublishBlog);

export default router;
