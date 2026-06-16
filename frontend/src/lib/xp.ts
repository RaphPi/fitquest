// FitQuest — courbe XP côté frontend (miroir partiel de backend/src/lib/xp.ts).

/** Coefficients XP récompense (miroir backend). */
export const XP_PER_REP = 1.0;  // 1 répétition = 1 XP
export const XP_PER_SEC = 0.2;  // 1 seconde de gainage = 0.2 XP (60 s ≈ 12 reps)

/**
 * XP nécessaire pour passer du niveau `level` au suivant.
 * Courbe quadratique : 10·level² + 90·level
 * L1=100, L5=700, L10=1 900, L20=5 800, L50=29 500.
 */
export function xpRequiredForLevel(level: number): number {
  return Math.round(10 * level * level + 90 * level);
}

/** Pourcentage de progression dans le niveau courant (0–100). */
export function levelProgressPct(currentXP: number, level: number): number {
  const req = xpRequiredForLevel(level);
  if (req <= 0) return 0;
  return Math.min(100, Math.max(0, (currentXP / req) * 100));
}
