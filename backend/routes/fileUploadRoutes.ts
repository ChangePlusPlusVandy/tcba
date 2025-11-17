import { Router } from 'express';
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteDocument,
  getPublicImageUrl,
} from '../controllers/fileUploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/public-image/:fileKey', getPublicImageUrl);
router.use(authenticateToken);
router.get('/presigned-upload', getPresignedUploadUrl);
router.get('/presigned-download/:fileKey', getPresignedDownloadUrl);
router.delete('/document/:fileKey', deleteDocument);

export default router;
