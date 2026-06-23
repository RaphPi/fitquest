import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev_secret') as { sub: string };
    // Le rôle est lu en base (et non depuis le JWT) : une promotion/rétrogradation
    // prend effet immédiatement, sans attendre un re-login. Un compte supprimé
    // dont le token est encore valide est aussi rejeté.
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true } });
    if (!user) {
      res.status(401).json({ error: 'Compte introuvable' });
      return;
    }
    req.userId = payload.sub;
    req.userRole = user.role;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
