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

const router = Router();

router.get('/', getAllSurveys);
router.get('/active/list', getActiveSurveys);
router.get('/:id', getSurveyById);

router.post('/', createSurvey);
router.put('/:id', updateSurvey);

router.patch('/:id/publish', publishSurvey);
router.patch('/:id/close', closeSurvey);

router.delete('/:id', deleteSurvey);

export default router;
