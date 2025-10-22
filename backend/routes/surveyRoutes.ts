import { Router } from 'express';
import { getAllSurveys, getSurveyById, deleteSurvey } from '../controllers/surveyController.js';

const router = Router();

router.get('/', getAllSurveys);
router.get('/:id', getSurveyById);
router.delete('/:id', deleteSurvey);

export default router;
