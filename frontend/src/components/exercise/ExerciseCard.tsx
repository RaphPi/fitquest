import { cn } from '@/lib/utils';
import type { Exercise, Category, Equipment, Level } from '@/types';
import type { ExercisePR } from '@/stores/exerciseStore';
import { Dumbbell, User, Zap, ChevronRight, Trophy } from 'lucide-react';
import { formatPr } from '@/lib/formatPr';
import { useTranslation } from 'react-i18next';

interface ExerciseCardProps {
  exercise: Exercise;
  pr?: ExercisePR;
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

const equipmentIcons: Record<Equipment, typeof Dumbbell> = {
  none: User,
  dumbbells: Dumbbell,
  barbell: Dumbbell,
  pull_bar: Zap,
  other: Dumbbell,
};

const levelColors: Record<Level, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
};

export default function ExerciseCard({ exercise, pr, onClick, className }: ExerciseCardProps) {
  const { t } = useTranslation();
  const EquipIcon = equipmentIcons[exercise.equipment];
  const prLabel = formatPr(pr);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-glow min-h-[9rem]',
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
            {t(`library.category.${exercise.category}`)}
          </span>
          <span className={cn('text-[11px] font-semibold uppercase tracking-wider', levelColors[exercise.level])}>
            {t(`library.level.${exercise.level}`)}
          </span>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <p className="font-display text-base font-bold leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">{exercise.nameFr}</p>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <EquipIcon className="h-3.5 w-3.5" />
        <span>{t(`library.equipment.${exercise.equipment}`)}</span>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-1">{exercise.musclesPrimary.join(', ')}</p>

      {prLabel && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-bold leading-none text-amber-300">
          <Trophy className="h-3 w-3" />
          {prLabel}
        </span>
      )}
    </button>
  );
}
