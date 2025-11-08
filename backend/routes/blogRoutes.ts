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

const router = Router();

router.get('/', getAllBlogs);
router.get('/tags', getBlogTags);
router.get('/slug/:slug', getBlogBySlug);

router.get('/:id', getBlogById);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.put('/:id/publish', publishBlog);
router.put('/:id/unpublish', unpublishBlog);

export default router;
