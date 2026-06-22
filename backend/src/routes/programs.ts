import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import type { AuthRequest } from '../middleware/requireAuth';
import { detectBadges } from '../lib/badges';

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

// GET /api/v1/programs/export?ids=id1,id2 OR ?ids=all
router.get('/export', requireAuth, async (req: AuthRequest, res) => {
  const { ids } = req.query;
  if (!ids || typeof ids !== 'string') {
    res.status(400).json({ error: 'Paramètre ids requis (ex: ?ids=all ou ?ids=id1,id2)' });
    return;
  }

  try {
    let programs;
    if (ids === 'all') {
      programs = await prisma.program.findMany({ include, orderBy: { nameFr: 'asc' } });
    } else {
      const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (idList.length === 0) {
        res.status(400).json({ error: "Liste d'ids vide" });
        return;
      }
      programs = await prisma.program.findMany({ where: { id: { in: idList } }, include });
    }

    const exerciseIds = new Set<string>();
    for (const prog of programs) {
      for (const session of prog.sessions) {
        for (const ex of session.exercises) {
          exerciseIds.add(ex.exerciseId);
        }
      }
    }

    const exercises = await prisma.exercise.findMany({
      where: { id: { in: [...exerciseIds] } },
      orderBy: { nameFr: 'asc' },
    });

    const exportedPrograms = programs.map((p) => ({
      nameFr: p.nameFr,
      nameEn: p.nameEn,
      descFr: p.descFr,
      descEn: p.descEn,
      level: p.level,
      daysPerWeek: p.daysPerWeek,
      durationWeeks: p.durationWeeks,
      equipment: p.equipment,
      sessions: p.sessions.map((s, si) => ({
        nameFr: s.nameFr,
        nameEn: s.nameEn,
        order: si + 1,
        exercises: s.exercises.map((e, ei) => ({
          exerciseId: e.exerciseId,
          order: ei + 1,
          sets: e.sets,
          reps: e.reps ?? null,
          durationSeconds: e.durationSeconds ?? null,
          restBetweenSetsSeconds: e.restBetweenSetsSeconds,
          restAfterExerciseSeconds: e.restAfterExerciseSeconds,
        })),
      })),
    }));

    const exportedExercises = exercises.map((e) => ({
      id: e.id,
      nameFr: e.nameFr,
      nameEn: e.nameEn,
      category: e.category,
      musclesPrimary: e.musclesPrimary,
      musclesSecondary: e.musclesSecondary,
      equipment: e.equipment,
      level: e.level,
      type: e.type,
      instructionsFr: e.instructionsFr,
      instructionsEn: e.instructionsEn,
      tipsFr: e.tipsFr ?? null,
      tipsEn: e.tipsEn ?? null,
      variations: e.variations,
    }));

    res.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      programs: exportedPrograms,
      exercises: exportedExercises,
    });
  } catch (e) {
    console.error('[programs/export]', e);
    res.status(500).json({ error: "Erreur lors de l'export" });
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
    // Badge "Architecte" : 1er programme custom. On lit niveau/streak pour évaluer aussi
    // les autres conditions (sans effet de bord si déjà obtenues).
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { level: true, streak: true },
    });
    const newBadges = user ? await detectBadges(req.userId!, user.level, user.streak) : [];
    res.status(201).json({ program, newBadges });
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

// ── Import JSON générique ────────────────────────────────────────────────────

const SessionExerciseImportSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().min(1),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1).nullable().optional(),
  durationSeconds: z.number().int().min(1).nullable().optional(),
  restBetweenSetsSeconds: z.number().int().min(0).optional(),
  restAfterExerciseSeconds: z.number().int().min(0).optional(),
});

const SessionImportSchema = z.object({
  nameFr: z.string().min(1),
  nameEn: z.string().min(1),
  order: z.number().int().min(1),
  exercises: z.array(SessionExerciseImportSchema).default([]),
});

const ProgramImportItemSchema = z.object({
  nameFr: z.string().min(1),
  nameEn: z.string().min(1),
  descFr: z.string().nullable().optional(),
  descEn: z.string().nullable().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().int().min(1).max(7),
  durationWeeks: z.number().int().min(1).nullable().optional(),
  equipment: z.array(z.string()).default([]),
  sessions: z.array(SessionImportSchema).default([]),
});

const ExerciseImportItemSchema = z.object({
  id: z.string().min(1),
  nameFr: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.string().min(1),
  musclesPrimary: z.array(z.string()).default([]),
  musclesSecondary: z.array(z.string()).default([]),
  equipment: z.string().min(1),
  level: z.string().min(1),
  type: z.string().min(1),
  instructionsFr: z.string().min(1),
  instructionsEn: z.string().min(1),
  tipsFr: z.string().nullable().optional(),
  tipsEn: z.string().nullable().optional(),
  variations: z.array(z.string()).default([]),
});

const ImportPayloadSchema = z.object({
  version: z.string().optional(),
  sourcePrefix: z.string().optional(), // label optionnel (ex: "lfy")
  programs: z.array(ProgramImportItemSchema),
  exercises: z.array(ExerciseImportItemSchema),
});

// GET /api/v1/programs/import/logs
// Retourne l'historique de tous les imports, du plus récent au plus ancien.
router.get('/import/logs', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const logs = await prisma.importLog.findMany({ orderBy: { importedAt: 'desc' } });
    res.json(logs);
  } catch (e) {
    console.error('[programs/import/logs GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/v1/programs/import/:logId
// Purge par ID de log : supprime exactement les programmes et exercices trackés.
router.delete('/import/:logId', requireAuth, async (req: AuthRequest, res) => {
  const { logId } = req.params;
  const log = await prisma.importLog.findUnique({ where: { id: logId } });
  if (!log) {
    res.status(404).json({ error: 'Import introuvable' });
    return;
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Programmes trackés → cascade vers Sessions et SessionExercises
      const { count: programs } = await tx.program.deleteMany({
        where: { id: { in: log.programIds } },
      });
      // Exercices nouveaux trackés (pas les exercices catalogue déjà existants)
      const { count: exercises } = await tx.exercise.deleteMany({
        where: { id: { in: log.exerciseIds } },
      });
      await tx.importLog.delete({ where: { id: logId } });
      return { programs, exercises };
    }, { timeout: 30000 });
    res.json({ deleted: result });
  } catch (e) {
    console.error('[programs/import/:logId DELETE]', e);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// POST /api/v1/programs/import
// Ingère un payload JSON (exercises + programs) et peuple la BDD.
// Exercices : upsert par id. Programmes : créé seulement si le nameFr n'existe pas déjà.
// Crée un ImportLog avec les IDs exacts importés pour permettre une purge propre.
router.post('/import', requireAuth, async (req: AuthRequest, res) => {
  const parsed = ImportPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten() });
    return;
  }

  const { programs, exercises } = parsed.data;
  let importedExercises = 0;
  let importedPrograms = 0;
  let skipped = 0;
  const newExerciseIds: string[] = [];
  const createdProgramIds: string[] = [];

  try {
    // Pré-vérifie quels exercices existent déjà (1 requête batch) pour tracker uniquement les nouveaux
    const existingExIds = new Set(
      (await prisma.exercise.findMany({
        where: { id: { in: exercises.map((e) => e.id) } },
        select: { id: true },
      })).map((e) => e.id),
    );

    await prisma.$transaction(async (tx) => {
      for (const ex of exercises) {
        const data = {
          nameFr: ex.nameFr,
          nameEn: ex.nameEn,
          category: ex.category,
          musclesPrimary: ex.musclesPrimary,
          musclesSecondary: ex.musclesSecondary,
          equipment: ex.equipment,
          level: ex.level,
          type: ex.type,
          instructionsFr: ex.instructionsFr,
          instructionsEn: ex.instructionsEn,
          tipsFr: ex.tipsFr ?? null,
          tipsEn: ex.tipsEn ?? null,
          variations: ex.variations,
        };
        await tx.exercise.upsert({ where: { id: ex.id }, update: data, create: { id: ex.id, ...data } });
        importedExercises++;
        if (!existingExIds.has(ex.id)) newExerciseIds.push(ex.id);
      }

      for (const prog of programs) {
        const existing = await tx.program.findFirst({ where: { nameFr: prog.nameFr } });
        if (existing) { skipped++; continue; }

        const created = await tx.program.create({
          data: {
            nameFr: prog.nameFr,
            nameEn: prog.nameEn,
            descFr: prog.descFr ?? null,
            descEn: prog.descEn ?? null,
            level: prog.level,
            daysPerWeek: prog.daysPerWeek,
            durationWeeks: prog.durationWeeks ?? null,
            equipment: prog.equipment,
            isCustom: false,
            isAiGen: false,
            sessions: {
              create: prog.sessions.map((s) => ({
                nameFr: s.nameFr,
                nameEn: s.nameEn,
                order: s.order,
                exercises: {
                  create: s.exercises.map((e) => ({
                    exerciseId: e.exerciseId,
                    order: e.order,
                    sets: e.sets,
                    reps: e.reps ?? null,
                    durationSeconds: e.durationSeconds ?? null,
                    restBetweenSetsSeconds: e.restBetweenSetsSeconds ?? 60,
                    restAfterExerciseSeconds: e.restAfterExerciseSeconds ?? 20,
                  })),
                },
              })),
            },
          },
          select: { id: true },
        });
        createdProgramIds.push(created.id);
        importedPrograms++;
      }
    }, { timeout: 30000 });

    if (createdProgramIds.length + newExerciseIds.length > 0) {
      prisma.importLog.create({
        data: {
          label: parsed.data.sourcePrefix?.trim() || null,
          programIds: createdProgramIds,
          exerciseIds: newExerciseIds,
        },
      }).catch((logErr) => console.error('[programs/import] ImportLog non-bloquant:', logErr));
    }

    res.json({ imported: { exercises: importedExercises, programs: importedPrograms }, skipped, errors: [] });
  } catch (e) {
    console.error('[programs/import]', e);
    res.status(500).json({ error: "Erreur lors de l'import", details: String(e) });
  }
});

export default router;
