import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { clerkMiddleware, getAuth } from '@clerk/express';

// Helper
const isAdmin = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';

//Hyk dunno if this is needed here but leaving for now
export default clerkMiddleware();

/**
 * TODO: Replace with Clerk's requireAuth() middleware
 * This should verify that a valid Clerk session exists
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const auth = getAuth(req);

  //requireAuth() cant be used here
  if (!auth.userId || !auth.sessionId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  next();
};

/**
 * TODO: Implement role-based authorization
 * Check if req.user.role is ADMIN or SUPER_ADMIN
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

/**
 * TODO: Implement super admin authorization
 * Check if req.user.role is SUPER_ADMIN
 */
export const requireSuperAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Super admin access required' });
    return;
  }
  next();
};
