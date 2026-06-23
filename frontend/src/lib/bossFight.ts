// FitQuest — logique du combat de boss (Sprint 6).
// Le boss = adversaire de SÉANCE. Ses PV = total des « points d'effort » cibles.
// Pondération configurable pour ne pas privilégier les exercices de durée.

import type { ActiveExercise, Category, ExerciseType } from '@/types';

/** 1 rép = 1 point. 1 point de gainage = SECONDS_PER_POINT secondes tenues. */
export const SECONDS_PER_POINT = 3;

/** Points d'effort (= dégâts) pour une valeur réalisée selon le type d'exercice. */
export function effortPoints(type: ExerciseType, value: number): number {
  if (type === 'reps') return Math.max(0, Math.round(value));
  return Math.max(1, Math.round(value / SECONDS_PER_POINT));
}

/** PV totaux du boss = somme des points d'effort cibles de tous les exercices. */
export function bossMaxHp(exercises: ActiveExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets * effortPoints(ex.type, ex.target), 0);
}

/** Catégorie dominante d'une séance (la plus fréquente parmi ses exercices). */
export function dominantCategory(exercises: ActiveExercise[]): Category {
  const counts = new Map<Category, number>();
  for (const ex of exercises) counts.set(ex.category, (counts.get(ex.category) ?? 0) + 1);
  let best: Category = exercises[0]?.category ?? 'core';
  let max = 0;
  for (const [cat, n] of counts) if (n > max) { max = n; best = cat; }
  return best;
}

export function bossTitle(exercises: ActiveExercise[]): string {
  const titles: Record<Category, string> = {
    push: 'Colosse du Push',
    pull: 'Titan du Pull',
    legs: 'Béhémoth des Jambes',
    core: 'Gardien du Gainage',
    cardio: 'Spectre du Cardio',
    back: 'Golem du Dos',
  };
  return titles[dominantCategory(exercises)];
}

// ─── Clés i18n indexées sur le TYPE d'exercice ───
export interface TypeCopyKeys {
  cta: string;
  confirmTitle: string;
  confirmHint: string;
  unit: string;
}

export function typeCopyKeys(type: ExerciseType): TypeCopyKeys {
  const ns = type === 'duration' ? 'activeWorkout.bossFight.duration' : 'activeWorkout.bossFight.reps';
  return {
    cta: `${ns}.cta`,
    confirmTitle: `${ns}.confirmTitle`,
    confirmHint: `${ns}.confirmHint`,
    unit: `${ns}.unit`,
  };
}
