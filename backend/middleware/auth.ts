import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '../config/clerk.js';

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
  };
  user?: {
    id: string;
    clerkId: string;
    email: string;
    role?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  next();
};
