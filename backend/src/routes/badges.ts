import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { BADGES, badgeProgress, buildBadgeContext } from '../lib/badges';

const router = Router();

// GET /api/v1/badges — catalogue complet + état (obtenu/locked, date, progression) pour l'utilisateur.
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { level: true, streak: true },
    });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

    const [owned, ctx] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId: req.userId! },
        select: { badgeId: true, unlockedAt: true },
      }),
      buildBadgeContext(req.userId!, user.level, user.streak),
    ]);
    const unlockedAt = new Map(owned.map((u) => [u.badgeId, u.unlockedAt]));

    const badges = BADGES.map((b) => ({
      ...b,
      obtained: unlockedAt.has(b.id),
      unlockedAt: unlockedAt.get(b.id) ?? null,
      progress: badgeProgress(b, ctx),
    })).sort((a, b) => a.order - b.order);

    res.json({ badges });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
