import { Router } from 'express';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '../controllers/adminController.js';

const router = Router();

router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
