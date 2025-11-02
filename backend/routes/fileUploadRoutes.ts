import { Router } from 'express';
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteDocument,
} from '../controllers/fileUploadController.js';
// import { authenticate } from '../middleware/auth.js'; *will be used once middleware completed*

const router = Router();
// router.use(authenticate); *will be used once middleware completed*

router.get('/presigned-upload-url', getPresignedUploadUrl);
router.get('/presigned-download-url/:fileKey', getPresignedDownloadUrl);
router.delete('/:fileKey', deleteDocument);

export default router;
