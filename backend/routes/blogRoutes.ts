import { Router } from 'express';
import {
  getAllBlogs,
  getBlogById,
  getBlogTags,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from '../controllers/blogController.js';

const router = Router();

// Public routes
router.get('/', getAllBlogs);
router.get('/tags', getBlogTags);

// Admin routes
router.get('/:id', getBlogById);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.put('/:id/publish', publishBlog);
router.put('/:id/unpublish', unpublishBlog);

export default router;
