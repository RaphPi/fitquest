import { cn } from '@/lib/utils';
import type { Program, Level } from '@/types';
import { levelBadgeClass } from '@/lib/levelColors';
import { Calendar, Dumbbell, Clock, ChevronRight, Layers, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  estimateProgramMinutes,
  countProgramExercises,
  countProgramSets,
} from '@/lib/duration';

interface ProgramCardProps {
  program: Program;
  onClick: () => void;
  className?: string;
  recommended?: boolean;
}

export default function ProgramCard({ program, onClick, className, recommended }: ProgramCardProps) {
  const { t } = useTranslation();
  const level = program.level as Level;
  const avgMin = estimateProgramMinutes(program);
  const totalEx = countProgramExercises(program);
  const totalSets = countProgramSets(program);

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-0 rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-glow overflow-hidden',
        className,
      )}
    >
      {/* Main clickable area */}
      <button className="flex flex-col gap-3 p-4 text-left w-full" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
              levelBadgeClass[level],
            )}
          >
            {t(`workout.level.${level}`)}
          </span>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        <p className="font-display text-lg font-black leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">{program.nameFr}</p>

        {program.descFr && (
          <p className="line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{program.descFr}</p>
        )}

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {t('workout.card.daysPerWeek', { days: program.daysPerWeek })}
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <Dumbbell className="h-3 w-3" />
            {t('workout.card.sessions', { count: program.sessions.length })}
          </span>
          {totalEx > 0 && (
            <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              <Layers className="h-3 w-3" />
              {t('workout.card.exercises', { ex: totalEx, sets: totalSets })}
            </span>
          )}
          {avgMin > 0 && (
            <span className="flex items-center gap-1 rounded-lg border border-xp/30 bg-xp/10 px-2 py-1 text-[11px] font-semibold text-xp">
              <Clock className="h-3 w-3" />
              {t('workout.card.avgDuration', { min: avgMin })}
            </span>
          )}
        </div>
      </button>

      {recommended && (
        <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
          <Target className="h-3 w-3" />
          {t('programs.recommended')}
        </span>
      )}
    </div>
  );
}
