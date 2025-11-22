import { Router } from 'express';
import {
  getAllResponses,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  getResponsesBySurvey,
  getResponsesByOrganization,
} from '../controllers/surveyResponseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllResponses);
router.post('/', authenticateToken, createResponse);
router.get('/survey/:surveyId', authenticateToken, getResponsesBySurvey);
router.get('/organization/:orgId', authenticateToken, getResponsesByOrganization);
router.get('/:id', authenticateToken, getResponseById);
router.put('/:id', authenticateToken, updateResponse);
router.delete('/:id', authenticateToken, deleteResponse);

export default router;
