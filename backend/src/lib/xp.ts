// FitQuest — logique XP / niveaux / streak (Sprint 6)
// Source : FitQuest_ProjectPlan.md §9 Système de Gamification.

/** 1 rép = 1 point. 1 point de gainage = SECONDS_PER_POINT secondes tenues. (miroir lib/bossFight) */
export const SECONDS_PER_POINT = 3;

export interface CompletedSetEffort {
  reps?: number | null;
  durationSecs?: number | null;
}

/** Points d'effort réellement infligés au boss, sommés sur les séries réalisées. */
export function effortFromSets(sets: CompletedSetEffort[]): number {
  return sets.reduce((sum, s) => {
    if (s.reps != null) return sum + Math.max(0, Math.round(s.reps));
    if (s.durationSecs != null) return sum + Math.max(1, Math.round(s.durationSecs / SECONDS_PER_POINT));
    return sum;
  }, 0);
}

/** XP nécessaire pour passer du niveau `level` au suivant. Courbe RPG : level * 150. */
export function xpRequiredForLevel(level: number): number {
  return level * 150;
}

/**
 * XP gagnée pour une séance terminée — proportionnelle à l'EFFORT réellement fourni.
 * - 1 XP par point d'effort infligé (reps + secondes/SECONDS_PER_POINT)
 * - + petit bonus d'endurance : +1 XP / minute au-delà de 20 min (uniquement si effort > 0)
 * - bonus streak : +10 % par jour consécutif, plafonné à +50 %
 * Une séance sans effort réalisé (abandon immédiat, exercices tous passés) rapporte 0 XP.
 */
export function computeWorkoutXp(effortDealt: number, durationSecs: number, streak: number): number {
  const effort = Math.max(0, Math.round(effortDealt));
  if (effort <= 0) return 0;
  const minutes = Math.floor(Math.max(0, durationSecs) / 60);
  const durationBonus = Math.max(0, minutes - 20);
  const streakMult = 1 + Math.min(0.5, Math.max(0, streak) * 0.1);
  return Math.round((effort + durationBonus) * streakMult);
}

export interface XpResult {
  level: number;
  currentXP: number;
  totalXP: number;
  leveledUp: boolean;
  levelsGained: number;
}

/** Applique un gain d'XP, en gérant les montées de niveau successives. */
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

/** Nombre de jours calendaires entre deux dates (en se basant sur minuit local). */
function dayDiff(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((db - da) / 86_400_000);
}

/**
 * Nouveau streak après une séance terminée maintenant.
 * - jamais entraîné → 1
 * - déjà entraîné aujourd'hui → inchangé
 * - hier → +1
 * - trou ≥ 2 jours → reset à 1
 */
export function computeStreak(currentStreak: number, lastWorkout: Date | null, now: Date): number {
  if (!lastWorkout) return 1;
  const days = dayDiff(lastWorkout, now);
  if (days <= 0) return Math.max(1, currentStreak);
  if (days === 1) return currentStreak + 1;
  return 1;
}
