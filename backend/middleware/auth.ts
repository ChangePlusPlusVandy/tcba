import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

// Helper
const isAdmin = (role?: string) => role === 'ADMIN';

/**
 * TODO: Replace with Clerk's requireAuth() middleware
 * This should verify that a valid Clerk session exists
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Placeholder - implement Clerk's requireAuth()
  next();
};

/**
 * TODO: Implement role-based authorization
 * Check if req.user.role is ADMIN
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!isAdmin(req.user?.role)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
