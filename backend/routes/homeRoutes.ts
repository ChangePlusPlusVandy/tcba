import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to the Tennessee Coalition for Better Aging API',
  });
});

export default router;
