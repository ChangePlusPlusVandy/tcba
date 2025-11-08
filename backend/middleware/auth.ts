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

    const token = authHeader.substring(7);

    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      clockSkewInMs: 5000,
    });

    console.log('Token verification result:', {
      userId: verifiedToken.sub,
      sessionId: verifiedToken.sid,
      path: req.path,
      method: req.method,
    });

    const adminUser = await prisma.adminUser.findUnique({
      where: { clerkId: verifiedToken.sub },
    });

    if (adminUser) {
      console.log('Admin user lookup:', {
        clerkId: verifiedToken.sub,
        found: true,
      });

      req.user = {
        id: adminUser.id,
        clerkId: adminUser.clerkId,
        role: 'ADMIN',
        email: adminUser.email,
        name: adminUser.name,
      };
    } else {
      const organization = await prisma.organization.findUnique({
        where: { clerkId: verifiedToken.sub },
      });

      console.log('Organization lookup:', {
        clerkId: verifiedToken.sub,
        found: !!organization,
        role: organization?.role,
      });

      if (organization) {
        req.user = {
          id: organization.id,
          clerkId: organization.clerkId,
          role: organization.role,
          email: organization.email,
          name: organization.name,
        };
      }
    }
    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

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
