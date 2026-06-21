import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './requireAuth';

// À utiliser TOUJOURS après requireAuth (qui peuple req.userRole depuis le JWT).
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    return;
  }
  next();
}
