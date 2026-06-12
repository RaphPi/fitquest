import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import type { AuthRequest } from '../middleware/requireAuth';
import { randomUUID } from 'node:crypto';

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

// POST /api/v1/exercises
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const {
    nameFr, nameEn, category, musclesPrimary, musclesSecondary,
    equipment, level, type, instructionsFr, instructionsEn,
    tipsFr, tipsEn, variations,
  } = req.body as Record<string, unknown>;

  if (!nameFr || !nameEn || !category || !equipment || !level || !type || !instructionsFr || !instructionsEn) {
    res.status(400).json({ error: 'Champs obligatoires manquants' });
    return;
  }

  try {
    const exercise = await prisma.exercise.create({
      data: {
        id: `ex_custom_${randomUUID().slice(0, 8)}`,
        nameFr: nameFr as string,
        nameEn: nameEn as string,
        category: category as string,
        musclesPrimary: (musclesPrimary as string[] | undefined) ?? [],
        musclesSecondary: (musclesSecondary as string[] | undefined) ?? [],
        equipment: equipment as string,
        level: level as string,
        type: type as string,
        instructionsFr: instructionsFr as string,
        instructionsEn: instructionsEn as string,
        tipsFr: (tipsFr as string | undefined) || null,
        tipsEn: (tipsEn as string | undefined) || null,
        variations: (variations as string[] | undefined) ?? [],
      },
    });
    res.status(201).json({ exercise });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/v1/exercises/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;

  const allowed = [
    'nameFr', 'nameEn', 'category', 'musclesPrimary', 'musclesSecondary',
    'equipment', 'level', 'type', 'instructionsFr', 'instructionsEn',
    'tipsFr', 'tipsEn', 'variations',
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) data[key] = req.body[key];
  }

  try {
    const exercise = await prisma.exercise.update({ where: { id }, data });
    res.json({ exercise });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'P2025') {
      res.status(404).json({ error: 'Exercice introuvable' });
    } else {
      console.error(e);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// DELETE /api/v1/exercises/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await prisma.exercise.delete({ where: { id } });
    res.status(204).end();
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'P2025') {
      res.status(404).json({ error: 'Exercice introuvable' });
    } else {
      console.error(e);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

export default router;
