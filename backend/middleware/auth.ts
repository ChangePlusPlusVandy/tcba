import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';

// Helper
const isAdmin = (role?: string) => role === 'ADMIN';
const jwt = require('jsonwebtoken');
//Hyk dunno if this is needed here but leaving for now
export default clerkMiddleware();

/**
 * TODO: Replace with Clerk's requireAuth() middleware
 * This should verify that a valid Clerk session exists
 */
export const authenticateToken = [
  requireAuth(),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const auth = getAuth(req);

    //requireAuth() cant be used here
    if (!auth.userId || !auth.sessionId) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.CLERK_SECRET_KEY!);
      // Optionally attach the decoded payload to the request for later use
      (req as any).user = decoded; // Or use a more specific type for req
      next(); // Token is valid, proceed to the next middleware/route handler
    } catch (err) {
      console.error('JWT verification error:', err); // Log the actual error for debugging
      return res.status(401).json({ error: 'Invalid token' }); // Token is invalid
    }
  },
];

/**
 * TODO: Implement role-based authorization
 * Check if req.user.role is ADMIN
 */
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
