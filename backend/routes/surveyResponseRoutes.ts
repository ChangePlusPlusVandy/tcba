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

const router = Router();

router.get('/', getAllResponses);
router.post('/', createResponse);
router.get('/survey/:surveyId', getResponsesBySurvey);
router.get('/organization/:orgId', getResponsesByOrganization);
router.get('/:id', getResponseById);
router.put('/:id', updateResponse);
router.delete('/:id', deleteResponse);

export default router;
