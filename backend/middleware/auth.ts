import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

interface AuthRequest extends Request {
  user?: {
    [key: string]: any;
    uid: string;
    email: string;
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

    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? '',
    };

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
