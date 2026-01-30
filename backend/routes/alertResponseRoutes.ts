import { Router } from 'express';
import { get } from 'http';
import { authenticateToken } from '../middleware/auth';
import {
  getAllAlertResponses,
  createAlertResponse,
  getResponseByAlertId,
  getAlertReponseById,
  updateAlertResponse,
  deleteAlertResponse,
  getResponsesByOrgId,
} from '../controllers/alertReponseController';

const router = Router();

router.get('/', authenticateToken, getAllAlertResponses);
router.post('/', authenticateToken, createAlertResponse);
router.get('/alert/:id', authenticateToken, getResponseByAlertId);
router.get('/:id', authenticateToken, getAlertReponseById);
router.put('/:id', authenticateToken, updateAlertResponse);
router.delete('/:id', authenticateToken, deleteAlertResponse);
router.get('/organization/:orgId', authenticateToken, getResponsesByOrgId);

export default router;
