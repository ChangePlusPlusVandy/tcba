import { Router } from 'express';
import {
  getAllSurveys,
  createSurvey,
  getSurveyById,
  deleteSurvey,
  updateSurvey,
  getActiveSurveys,
  publishSurvey,
  closeSurvey,
} from '../controllers/surveyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllSurveys);
router.get('/active/list', getActiveSurveys);
router.get('/:id', getSurveyById);
router.post('/', authenticateToken, createSurvey);
router.put('/:id', authenticateToken, updateSurvey);
router.patch('/:id/publish', authenticateToken, publishSurvey);
router.patch('/:id/close', authenticateToken, closeSurvey);
router.delete('/:id', authenticateToken, deleteSurvey);

export default router;
