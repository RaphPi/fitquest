import { prisma } from './prisma';

export type ActiveFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface DigestData {
  period: { from: Date; to: Date; label: string };
  workouts: number;
  totalSets: number;
  streak: number;
  xpGained: number;
  topExercises: Array<{ name: string; count: number }>;
  badgesEarned: Array<{ name: string; description: string }>;
}

function getPeriod(freq: ActiveFrequency): { from: Date; to: Date; label: string } {
  const now = new Date();

  if (freq === 'DAILY') {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    const label = from.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    return { from, to, label };
  }

  const days = freq === 'WEEKLY' ? 7 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const fromStr = from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const toStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return { from, to: now, label: `${fromStr} – ${toStr}` };
}

export async function getDigestData(userId: string, freq: ActiveFrequency): Promise<DigestData> {
  const period = getPeriod(freq);

  const [user, logs, badges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId, date: { gte: period.from, lte: period.to } },
      select: {
        xpEarned: true,
        completedSets: { select: { exerciseName: true } },
      },
    }),
    prisma.userBadge.findMany({
      where: { userId, unlockedAt: { gte: period.from, lte: period.to } },
      include: { badge: { select: { nameFr: true, descFr: true } } },
    }),
  ]);

  const workouts = logs.length;
  const totalSets = logs.reduce((sum, l) => sum + l.completedSets.length, 0);
  const xpGained = logs.reduce((sum, l) => sum + l.xpEarned, 0);
  const streak = user?.streak ?? 0;

  const exerciseCounts = new Map<string, number>();
  for (const log of logs) {
    for (const set of log.completedSets) {
      const prev = exerciseCounts.get(set.exerciseName) ?? 0;
      exerciseCounts.set(set.exerciseName, prev + 1);
    }
  }
  const topExercises = [...exerciseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const badgesEarned = badges.map((ub) => ({
    name: ub.badge.nameFr,
    description: ub.badge.descFr,
  }));

  return { period, workouts, totalSets, streak, xpGained, topExercises, badgesEarned };
}
