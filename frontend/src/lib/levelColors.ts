import type { Level } from '@/types';

/**
 * Code couleur des niveaux, partagé entre la Bibliothèque (ExerciseCard)
 * et les Programmes (ProgramCard) pour rester cohérent.
 * débutant = vert · intermédiaire = ambre · avancé = rouge.
 */
export const levelTextColor: Record<Level, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
};

/** Variante badge plein (bordure + fond) du même code couleur. */
export const levelBadgeClass: Record<Level, string> = {
  beginner: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  intermediate: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  advanced: 'border-red-500/40 bg-red-500/10 text-red-400',
};
