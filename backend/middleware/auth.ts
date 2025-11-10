import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyToken } from '@clerk/express';
import { prisma } from '../config/prisma.js';

const isAdmin = (role?: string) => role === 'ADMIN';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

  next();
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const auth = getAuth(req);
  if (!isAdmin(req.user?.role)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
