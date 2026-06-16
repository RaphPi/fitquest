// FitQuest — logique XP / niveaux / streak

/** Points d'effort boss : 1 rép = 1 pt, 1 s = 1/SECONDS_PER_POINT pt. NE PAS modifier (boss HP uniquement). */
export const SECONDS_PER_POINT = 3;

/** Coefficients XP récompense — indépendants des PV boss. */
export const XP_PER_REP = 1.0;  // 1 répétition = 1 XP
export const XP_PER_SEC = 0.2;  // 1 seconde de gainage = 0.2 XP (60 s ≈ 12 reps = 1 série standard)

export interface CompletedSetEffort {
  reps?: number | null;
  durationSecs?: number | null;
}

/** Points d'effort infligés au boss (utilisés pour bossMaxHp — NE PAS utiliser pour l'XP). */
export function effortFromSets(sets: CompletedSetEffort[]): number {
  return sets.reduce((sum, s) => {
    if (s.reps != null) return sum + Math.max(0, Math.round(s.reps));
    if (s.durationSecs != null) return sum + Math.max(1, Math.round(s.durationSecs / SECONDS_PER_POINT));
    return sum;
  }, 0);
}

/** XP brute d'une séance — pondérée par type : reps × XP_PER_REP, durée × XP_PER_SEC. */
export function xpFromSets(sets: CompletedSetEffort[]): number {
  return sets.reduce((sum, s) => {
    if (s.reps != null) return sum + Math.max(0, s.reps) * XP_PER_REP;
    if (s.durationSecs != null) return sum + Math.max(0, s.durationSecs) * XP_PER_SEC;
    return sum;
  }, 0);
}

/**
 * XP nécessaire pour passer du niveau `level` au suivant.
 * Courbe quadratique : 10·level² + 90·level
 * L1=100, L5=700, L10=1 900, L20=5 800, L50=29 500.
 */
export function xpRequiredForLevel(level: number): number {
  return Math.round(10 * level * level + 90 * level);
}

/**
 * XP gagnée pour une séance terminée.
 * rawXP = xpFromSets() pondéré (reps + durée).
 * + bonus endurance : +1 XP / min au-delà de 20 min.
 * + bonus streak : +10 % / jour consécutif, plafonné à +50 %.
 * Une séance sans effort (abandon, tout passé) → 0 XP.
 */
export function computeWorkoutXp(rawXP: number, durationSecs: number, streak: number): number {
  if (rawXP <= 0) return 0;
  const minutes = Math.floor(Math.max(0, durationSecs) / 60);
  const durationBonus = Math.max(0, minutes - 20);
  const streakMult = 1 + Math.min(0.5, Math.max(0, streak) * 0.1);
  return Math.round((rawXP + durationBonus) * streakMult);
}

export interface XpResult {
  level: number;
  currentXP: number;
  totalXP: number;
  leveledUp: boolean;
  levelsGained: number;
}

/** Applique un gain d'XP en gérant les montées de niveau successives. */
export function applyXp(level: number, currentXP: number, totalXP: number, gained: number): XpResult {
  let lvl = level;
  let cur = currentXP + gained;
  const total = totalXP + gained;
  while (cur >= xpRequiredForLevel(lvl)) {
    cur -= xpRequiredForLevel(lvl);
    lvl += 1;
  }
  return { level: lvl, currentXP: cur, totalXP: total, leveledUp: lvl > level, levelsGained: lvl - level };
}

function dayDiff(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((db - da) / 86_400_000);
}

/**
 * Nouveau streak après une séance terminée maintenant.
 * jamais entraîné → 1 ; déjà entraîné aujourd'hui → inchangé ; hier → +1 ; trou ≥ 2 j → reset à 1.
 */
export function computeStreak(currentStreak: number, lastWorkout: Date | null, now: Date): number {
  if (!lastWorkout) return 1;
  const days = dayDiff(lastWorkout, now);
  if (days <= 0) return Math.max(1, currentStreak);
  if (days === 1) return currentStreak + 1;
  return 1;
}
