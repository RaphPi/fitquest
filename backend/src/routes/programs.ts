import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import type { AuthRequest } from '../middleware/requireAuth';

const router = Router();

const include = {
  sessions: {
    include: { exercises: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  },
} as const;

// GET /api/v1/programs
router.get('/', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const programs = await prisma.program.findMany({
      include,
      orderBy: { nameFr: 'asc' },
    });
    res.json({ programs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/v1/programs/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const program = await prisma.program.findUnique({ where: { id }, include });
    if (!program) { res.status(404).json({ error: 'Programme introuvable' }); return; }
    res.json({ program });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/v1/programs
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { nameFr, nameEn, descFr, descEn, level, daysPerWeek, durationWeeks, equipment } =
    req.body as Record<string, unknown>;
  if (!nameFr || !nameEn || !level || !daysPerWeek) {
    res.status(400).json({ error: 'Champs obligatoires manquants' });
    return;
  }
  try {
    const program = await prisma.program.create({
      data: {
        nameFr: nameFr as string,
        nameEn: nameEn as string,
        descFr: (descFr as string | undefined) || null,
        descEn: (descEn as string | undefined) || null,
        level: level as string,
        daysPerWeek: Number(daysPerWeek),
        durationWeeks: durationWeeks ? Number(durationWeeks) : null,
        equipment: (equipment as string[] | undefined) ?? [],
        isCustom: true,
        createdBy: req.userId!,
      },
      include,
    });
    res.status(201).json({ program });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/v1/programs/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: 'Programme introuvable' }); return; }

  const allowed = ['nameFr', 'nameEn', 'descFr', 'descEn', 'level', 'daysPerWeek', 'durationWeeks', 'equipment'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) data[key] = (req.body as Record<string, unknown>)[key];
  }
  if (data.daysPerWeek !== undefined) data.daysPerWeek = Number(data.daysPerWeek);
  if (data.durationWeeks !== undefined) data.durationWeeks = data.durationWeeks ? Number(data.durationWeeks) : null;
  try {
    const program = await prisma.program.update({ where: { id }, data, include });
    res.json({ program });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/v1/programs/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await prisma.program.delete({ where: { id } });
    res.status(204).end();
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'P2025') res.status(404).json({ error: 'Programme introuvable' });
    else { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
  }
});

interface SessionExerciseInput {
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number | null;
  durationSeconds?: number | null;
  restBetweenSetsSeconds?: number;
  restAfterExerciseSeconds?: number;
}

function mapExercise(ex: SessionExerciseInput) {
  return {
    exerciseId: ex.exerciseId,
    order: ex.order,
    sets: ex.sets,
    reps: ex.reps ?? null,
    durationSeconds: ex.durationSeconds ?? null,
    restBetweenSetsSeconds: ex.restBetweenSetsSeconds ?? 60,
    restAfterExerciseSeconds: ex.restAfterExerciseSeconds ?? 20,
  };
}

// POST /api/v1/programs/:id/sessions
router.post('/:id/sessions', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) { res.status(404).json({ error: 'Programme introuvable' }); return; }

  const { nameFr, nameEn, order, exercises } = req.body as {
    nameFr: string; nameEn: string; order: number; exercises?: SessionExerciseInput[];
  };
  if (!nameFr || !nameEn || order === undefined) {
    res.status(400).json({ error: 'Champs obligatoires manquants' }); return;
  }
  try {
    const session = await prisma.session.create({
      data: {
        programId: id,
        nameFr, nameEn,
        order: Number(order),
        exercises: { create: (exercises ?? []).map(mapExercise) },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json({ session });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/v1/programs/:id/sessions/:sessionId
router.patch('/:id/sessions/:sessionId', requireAuth, async (req: AuthRequest, res) => {
  const { id, sessionId } = req.params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) { res.status(404).json({ error: 'Programme introuvable' }); return; }

  const { nameFr, nameEn, order, exercises } = req.body as {
    nameFr?: string; nameEn?: string; order?: number; exercises?: SessionExerciseInput[];
  };
  try {
    if (exercises !== undefined) {
      await prisma.sessionExercise.deleteMany({ where: { sessionId } });
    }
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(nameFr !== undefined && { nameFr }),
        ...(nameEn !== undefined && { nameEn }),
        ...(order !== undefined && { order: Number(order) }),
        ...(exercises !== undefined && { exercises: { create: exercises.map(mapExercise) } }),
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    res.json({ session });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'P2025') res.status(404).json({ error: 'Séance introuvable' });
    else { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
  }
});

// DELETE /api/v1/programs/:id/sessions/:sessionId
router.delete('/:id/sessions/:sessionId', requireAuth, async (req: AuthRequest, res) => {
  const { id, sessionId } = req.params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) { res.status(404).json({ error: 'Programme introuvable' }); return; }
  try {
    await prisma.session.delete({ where: { id: sessionId } });
    res.status(204).end();
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'P2025') res.status(404).json({ error: 'Séance introuvable' });
    else { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
  }
});

export default router;
