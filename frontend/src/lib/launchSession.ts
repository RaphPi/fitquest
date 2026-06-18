// FitQuest — construction d'une séance active à partir d'une WorkoutSession + catalogue d'exercices.
// Partagé entre le lancement depuis ProgramDetail et le « Relancer » de l'historique.
import type { ActiveExercise, Exercise, WorkoutSession } from '@/types';
import { bossTitle } from '@/lib/bossFight';
import type { ActiveSessionData } from '@/stores/workoutStore';

/** Résout les exercices d'une séance et renvoie les données prêtes pour `workoutStore.start`. */
export function buildActiveSession(
  programId: string,
  session: WorkoutSession,
  exMap: Map<string, Exercise>,
): ActiveSessionData | null {
  const resolved: ActiveExercise[] = session.exercises
    .filter((se) => se.sets > 0)
    .map((se) => {
      const ex = exMap.get(se.exerciseId);
      const type = ex?.type ?? (se.durationSeconds ? 'duration' : 'reps');
      // reps null = "max reps" : target 0 → pré-remplissage à 0, surpass dès la 1ère répétition
      const target = type === 'duration' ? (se.durationSeconds ?? 30) : (se.reps ?? 0);
      return {
        sessionExerciseId: se.id,
        exerciseId: se.exerciseId,
        name: ex?.nameFr ?? se.exerciseId,
        category: ex?.category ?? 'core',
        type,
        sets: se.sets,
        target,
        restBetweenSetsSeconds: se.restBetweenSetsSeconds,
        restAfterExerciseSeconds: se.restAfterExerciseSeconds,
      };
    });
  if (resolved.length === 0) return null;
  return {
    programId,
    sessionId: session.id,
    sessionName: session.nameFr,
    exercises: resolved,
    bossTitle: bossTitle(resolved),
  };
}
