import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import type { AuthRequest } from '../middleware/requireAuth';

const router = Router();

// GET /api/v1/exercises
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const { category, equipment, level, search } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = {};

  if (category) where.category = category;
  if (equipment) where.equipment = equipment;
  if (level) where.level = level;

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { nameFr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
    ];
  }

  try {
    const exercises = await prisma.exercise.findMany({ where, orderBy: { nameFr: 'asc' } });
    res.json({ exercises });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/v1/exercises/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      res.status(404).json({ error: 'Exercice introuvable' });
      return;
    }
    res.json({ exercise });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
