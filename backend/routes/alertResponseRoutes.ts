import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAllAlertResponses,
  createAlertResponse,
  getResponsesByAlertId,
  getAlertReponseById,
  updateAlertResponse,
  deleteAlertResponse,
  getResponsesByOrgId,
} from '../controllers/alertReponseController.js';

const router = Router();

router.get('/', authenticateToken, getAllAlertResponses);
router.post('/', authenticateToken, createAlertResponse);
router.get('/alert/:id', authenticateToken, getResponsesByAlertId);
router.get('/organization/:orgId', authenticateToken, getResponsesByOrgId);
router.get('/:id', authenticateToken, getAlertReponseById);
router.put('/:id', authenticateToken, updateAlertResponse);
router.delete('/:id', authenticateToken, deleteAlertResponse);

export default router;
