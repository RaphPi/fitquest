import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { applyXp, computeStreak, computeWorkoutXp, xpFromSets } from '../lib/xp';

const router = Router();

const userSelect = {
  id: true, username: true, email: true, avatarStage: true,
  themeId: true, level: true, totalXP: true, currentXP: true,
  xpBalance: true, streak: true, lastWorkout: true,
} as const;

interface CompletedSetInput {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number | null;
  durationSecs?: number | null;
  weightKg?: number | null;
}

// POST /api/v1/workouts — enregistre une séance terminée + applique XP/niveau/streak
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { sessionId, sessionName, durationSecs, completedSets } = req.body as {
    sessionId?: string | null;
    sessionName?: string;
    durationSecs?: number;
    completedSets?: CompletedSetInput[];
  };

  if (!sessionName || durationSecs === undefined) {
    res.status(400).json({ error: 'sessionName et durationSecs requis' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

    const now = new Date();
    const sets = completedSets ?? [];
    const rawXP = xpFromSets(sets);
    // Une séance sans effort (abandon immédiat / tout passé) n'est pas une vraie séance :
    // ni XP, ni streak, ni mise à jour de lastWorkout. Le log est conservé pour l'historique.
    const counts = rawXP > 0;
    const newStreak = counts ? computeStreak(user.streak, user.lastWorkout, now) : user.streak;
    const xpEarned = computeWorkoutXp(rawXP, Number(durationSecs), newStreak);
    const xp = applyXp(user.level, user.currentXP, user.totalXP, xpEarned);

    const [log, updatedUser] = await prisma.$transaction([
      prisma.workoutLog.create({
        data: {
          userId: user.id,
          sessionId: sessionId ?? null,
          sessionName,
          date: now,
          durationSecs: Number(durationSecs),
          xpEarned,
          completedSets: {
            create: sets.map((s) => ({
              exerciseId: s.exerciseId,
              exerciseName: s.exerciseName,
              setNumber: s.setNumber,
              reps: s.reps ?? null,
              durationSecs: s.durationSecs ?? null,
              weightKg: s.weightKg ?? null,
            })),
          },
        },
        include: { completedSets: { orderBy: { setNumber: 'asc' } } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          level: xp.level,
          currentXP: xp.currentXP,
          totalXP: xp.totalXP,
          xpBalance: user.xpBalance + xpEarned,
          streak: newStreak,
          lastWorkout: counts ? now : user.lastWorkout,
        },
        select: userSelect,
      }),
    ]);

    res.status(201).json({
      log,
      user: updatedUser,
      xpEarned,
      leveledUp: xp.leveledUp,
      levelsGained: xp.levelsGained,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/v1/workouts — historique des séances de l'utilisateur (récentes d'abord)
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.workoutLog.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
      include: { completedSets: { orderBy: { setNumber: 'asc' } } },
    });
    res.json({ logs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/v1/workouts/:id — détail d'une séance
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const log = await prisma.workoutLog.findFirst({
      where: { id, userId: req.userId! },
      include: { completedSets: { orderBy: { setNumber: 'asc' } } },
    });
    if (!log) { res.status(404).json({ error: 'Séance introuvable' }); return; }
    res.json({ log });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
