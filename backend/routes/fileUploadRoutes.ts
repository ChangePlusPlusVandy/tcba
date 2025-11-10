import { Router } from 'express';
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteDocument,
} from '../controllers/fileUploadController.js';

const router = Router();

router.get('/presigned-upload', getPresignedUploadUrl);
router.get('/presigned-download/:fileKey', getPresignedDownloadUrl);
router.delete('/document/:fileKey', deleteDocument);

export default router;
