import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev_secret') as { sub: string; role?: string };
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
