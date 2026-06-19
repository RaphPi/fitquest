import type { ExercisePR } from '@/stores/exerciseStore';

/**
 * Formate le record personnel d'un exercice en libellé court pour pastille.
 * Priorité au poids (plus parlant que les reps) ; sinon les reps.
 * Renvoie null si aucun record exploitable (ex. exercices en durée).
 */
export function formatPr(pr: ExercisePR | undefined): string | null {
  if (!pr) return null;
  if (pr.maxWeightKg != null && pr.maxWeightKg > 0) return `max : ${pr.maxWeightKg} kg`;
  if (pr.maxReps != null && pr.maxReps > 0) return `max : ${pr.maxReps} reps`;
  return null;
}
