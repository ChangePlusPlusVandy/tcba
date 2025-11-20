import { Router } from 'express';
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteDocument,
  getPublicImageUrl,
  getAuthenticatedDownloadUrl,
  getPublicDownloadUrl,
} from '../controllers/fileUploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/public-image/:fileKey', getPublicImageUrl);
router.get('/public-download/:fileKey', getPublicDownloadUrl);
router.use(authenticateToken);
router.get('/presigned-upload', getPresignedUploadUrl);
router.get('/presigned-download/:fileKey', getPresignedDownloadUrl);
router.get('/authenticated-download/:fileKey', getAuthenticatedDownloadUrl);
router.delete('/document/:fileKey', deleteDocument);

export default router;
