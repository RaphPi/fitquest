import { X, Dumbbell, User, Zap, Info, Lightbulb, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise, Category, Equipment, Level } from '@/types';
import GlowButton from '@/components/ui/GlowButton';

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
}

const categoryLabels: Record<Category, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Jambes',
  core: 'Core',
  cardio: 'Cardio',
  back: 'Dos',
};

const categoryColors: Record<Category, string> = {
  push: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  pull: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  legs: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  core: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cardio: 'bg-red-500/20 text-red-300 border-red-500/30',
  back: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const equipmentIcons: Record<Equipment, typeof Dumbbell> = {
  none: User,
  dumbbells: Dumbbell,
  barbell: Dumbbell,
  pull_bar: Zap,
  other: Dumbbell,
};

const equipmentLabels: Record<Equipment, string> = {
  none: 'Poids du corps',
  dumbbells: 'Haltères',
  barbell: 'Barre',
  pull_bar: 'Barre de traction',
  other: 'Autre',
};

const levelLabels: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

const levelColors: Record<Level, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
};

export default function ExerciseDetail({ exercise, onClose }: ExerciseDetailProps) {
  const EquipIcon = equipmentIcons[exercise.equipment];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                  categoryColors[exercise.category],
                )}
              >
                {categoryLabels[exercise.category]}
              </span>
              <span className={cn('text-[11px] font-semibold uppercase tracking-wider self-center', levelColors[exercise.level])}>
                {levelLabels[exercise.level]}
              </span>
            </div>
            <h2 className="font-display text-xl font-black text-foreground">{exercise.nameFr}</h2>
            <p className="text-xs text-muted-foreground italic">{exercise.nameEn}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <EquipIcon className="h-4 w-4" />
              <span>{equipmentLabels[exercise.equipment]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-semibold text-foreground">Type :</span>
              <span>{exercise.type === 'reps' ? 'Répétitions' : 'Durée'}</span>
            </div>
          </div>

          {/* Muscles */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Muscles</p>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                {exercise.musclesPrimary.map((m) => (
                  <span key={m} className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    {m}
                  </span>
                ))}
              </div>
              {exercise.musclesSecondary.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exercise.musclesSecondary.map((m) => (
                    <span key={m} className="rounded-md bg-border px-2 py-0.5 text-xs text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Instructions</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{exercise.instructionsFr}</p>
          </div>

          {/* Tips */}
          {exercise.tipsFr && (
            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Conseil</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{exercise.tipsFr}</p>
            </div>
          )}

          {/* Variations */}
          {exercise.variations.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Variantes ({exercise.variations.length})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <GlowButton variant="primary" size="sm" className="w-full" onClick={onClose}>
            Fermer
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
