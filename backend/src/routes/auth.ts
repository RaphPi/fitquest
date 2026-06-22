import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { encrypt } from '../lib/crypto';
import { detectBadges } from '../lib/badges';

const router = Router();

// Champs renvoyés au front. `smtpPass` est inclus pour calculer smtpPassSet,
// puis retiré par toSafeUser — jamais exposé en clair.
const USER_SELECT = {
  id: true, username: true, email: true, emailDigest: true, avatarStage: true,
  heightCm: true,
  themeId: true, level: true, totalXP: true, currentXP: true,
  xpBalance: true, streak: true, lastWorkout: true, role: true,
  smtpHost: true, smtpPort: true, smtpUser: true, smtpSecure: true, smtpPass: true,
} as const;

// Retire smtpPass (chiffré) et expose un booléen smtpPassSet à la place.
function toSafeUser<T extends { smtpPass?: string | null }>(u: T) {
  const { smtpPass, ...rest } = u;
  return { ...rest, smtpPassSet: Boolean(smtpPass) };
}

// COOKIE_SECURE=true uniquement si HTTPS est activé côté reverse proxy.
// En self-hosted HTTP (LXC sans TLS), laisser à false (défaut).
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

function makeToken(userId: string, role: string) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET ?? 'dev_secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] },
  );
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, avatarStage } = req.body as {
      username?: string;
      password?: string;
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

    // Le tout premier inscrit devient ADMIN automatiquement (instance self-hosted mono-user).
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        avatarStage: avatarStage ?? 0,
        role,
      },
      select: USER_SELECT,
    });

    res.cookie('token', makeToken(user.id, user.role), COOKIE_OPTS);
    res.status(201).json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
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
    res.cookie('token', makeToken(user.id, user.role), COOKIE_OPTS);
    res.json({ user: toSafeUser(safe) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// PATCH /api/v1/auth/me — met à jour le profil (avatarStage + notifications email/SMTP)
router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      avatarStage, heightCm, email, emailDigest,
      smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure,
    } = req.body as {
      avatarStage?: unknown;
      heightCm?: unknown;
      email?: unknown;
      emailDigest?: unknown;
      smtpHost?: unknown;
      smtpPort?: unknown;
      smtpUser?: unknown;
      smtpPass?: unknown;
      smtpSecure?: unknown;
    };

    const data: Record<string, unknown> = {};

    if (avatarStage !== undefined) {
      if (!Number.isInteger(avatarStage) || (avatarStage as number) < 0 || (avatarStage as number) > 3) {
        res.status(400).json({ error: 'avatarStage doit être entre 0 et 3' });
        return;
      }
      data.avatarStage = avatarStage as number;
    }

    if (heightCm !== undefined) {
      if (heightCm === null) {
        data.heightCm = null;
      } else {
        const h = Number(heightCm);
        if (!Number.isFinite(h) || h < 50 || h > 300) {
          res.status(400).json({ error: 'heightCm doit être entre 50 et 300' });
          return;
        }
        data.heightCm = h;
      }
    }

    if (email !== undefined) {
      if (email !== null && typeof email !== 'string') {
        res.status(400).json({ error: 'email invalide' });
        return;
      }
      data.email = email ? (email as string) : null;
    }

    if (emailDigest !== undefined) {
      const allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'NONE'];
      // NONE = désabonné → on stocke null.
      if (emailDigest !== null && !allowed.includes(emailDigest as string)) {
        res.status(400).json({ error: 'emailDigest invalide' });
        return;
      }
      data.emailDigest = emailDigest && emailDigest !== 'NONE' ? (emailDigest as string) : null;
    }

    if (smtpHost !== undefined) data.smtpHost = smtpHost ? (smtpHost as string) : null;
    if (smtpUser !== undefined) data.smtpUser = smtpUser ? (smtpUser as string) : null;
    if (smtpSecure !== undefined) data.smtpSecure = smtpSecure === null ? null : Boolean(smtpSecure);

    if (smtpPort !== undefined) {
      if (smtpPort === null || smtpPort === '') {
        data.smtpPort = null;
      } else {
        const port = Number(smtpPort);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          res.status(400).json({ error: 'smtpPort invalide' });
          return;
        }
        data.smtpPort = port;
      }
    }

    // smtpPass : chiffré à l'écriture. '' explicite = effacer. Absent = inchangé.
    if (smtpPass !== undefined) {
      if (smtpPass === null || smtpPass === '') {
        data.smtpPass = null;
      } else if (typeof smtpPass === 'string') {
        data.smtpPass = encrypt(smtpPass);
      } else {
        res.status(400).json({ error: 'smtpPass invalide' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: USER_SELECT,
    });

    // Renseigner sa taille peut compléter le bilan corporel → réévaluer les badges
    // (sinon « Bilan complet » n'aurait été détecté qu'au prochain relevé).
    if ('heightCm' in data && data.heightCm != null) {
      await detectBadges(req.userId!, user.level, user.streak);
    }

    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('[auth/me PATCH]', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/v1/auth/me — vérifie le cookie et retourne l'utilisateur courant
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
    });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export default router;
