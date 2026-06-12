import { cn } from '@/lib/utils';
import type { Exercise, Category, Equipment, Level } from '@/types';
import { Dumbbell, User, Zap, ChevronRight } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
  className?: string;
}

const categoryColors: Record<Category, string> = {
  push: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  pull: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  legs: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  core: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cardio: 'bg-red-500/20 text-red-300 border-red-500/30',
  back: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const categoryLabels: Record<Category, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Jambes',
  core: 'Core',
  cardio: 'Cardio',
  back: 'Dos',
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

const levelColors: Record<Level, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
};

const levelLabels: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export default function ExerciseCard({ exercise, onClick, className }: ExerciseCardProps) {
  const EquipIcon = equipmentIcons[exercise.equipment];

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-glow',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
              categoryColors[exercise.category],
            )}
          >
            {categoryLabels[exercise.category]}
          </span>
          <span className={cn('text-[11px] font-semibold uppercase tracking-wider', levelColors[exercise.level])}>
            {levelLabels[exercise.level]}
          </span>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <p className="font-display text-base font-bold leading-tight text-foreground">{exercise.nameFr}</p>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <EquipIcon className="h-3.5 w-3.5" />
        <span>{equipmentLabels[exercise.equipment]}</span>
      </div>

      <p className="text-xs text-muted-foreground">{exercise.musclesPrimary.join(', ')}</p>
    </button>
  );
}
