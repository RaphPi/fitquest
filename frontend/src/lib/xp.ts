// FitQuest — courbe XP côté frontend (miroir de backend/src/lib/xp.ts).
// Utilisé pour l'affichage de la jauge XP (le calcul officiel reste serveur).

export function xpRequiredForLevel(level: number): number {
  return level * 150;
}

/** Pourcentage de progression dans le niveau courant (0–100). */
export function levelProgressPct(currentXP: number, level: number): number {
  const req = xpRequiredForLevel(level);
  if (req <= 0) return 0;
  return Math.min(100, Math.max(0, (currentXP / req) * 100));
}
