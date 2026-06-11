import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

function makeToken(userId: string) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET ?? 'dev_secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] },
  );
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  const { username, password, email, emailDigest, avatarStage } = req.body as {
    username?: string;
    password?: string;
    email?: string;
    emailDigest?: string;
    avatarStage?: number;
  };

  if (!username || username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'username doit faire entre 3 et 20 caractères' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'password doit faire au moins 8 caractères' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Ce nom de héros est déjà pris' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      email: email || null,
      emailDigest: (emailDigest as any) ?? null,
      avatarStage: avatarStage ?? 0,
    },
    select: {
      id: true, username: true, email: true, avatarStage: true,
      themeId: true, level: true, totalXP: true, currentXP: true,
      xpBalance: true, streak: true, lastWorkout: true,
    },
  });

  res.cookie('token', makeToken(user.id), COOKIE_OPTS);
  res.status(201).json({ user });
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'username et password requis' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(401).json({ error: 'Identifiants incorrects' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Identifiants incorrects' });
    return;
  }

  const { passwordHash: _, ...safe } = user;
  res.cookie('token', makeToken(user.id), COOKIE_OPTS);
  res.json({ user: safe });
});

// POST /api/v1/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/v1/auth/me — vérifie le cookie et retourne l'utilisateur courant
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, username: true, email: true, avatarStage: true,
      themeId: true, level: true, totalXP: true, currentXP: true,
      xpBalance: true, streak: true, lastWorkout: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' });
    return;
  }
  res.json({ user });
});

export default router;
