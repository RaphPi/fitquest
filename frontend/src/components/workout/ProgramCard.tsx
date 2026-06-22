import { cn } from '@/lib/utils';
import type { Program, Level } from '@/types';
import { getLevelTier } from '@/lib/levelTier';
import { Calendar, Dumbbell, Clock, ChevronRight, Layers } from 'lucide-react';
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

const LEVEL_REP: Record<Level, number> = { beginner: 1, intermediate: 20, advanced: 50 };

function tierBadgeStyle(level: Level) {
  const tier = getLevelTier(LEVEL_REP[level] ?? 1);
  return {
    color: tier.color,
    backgroundColor: tier.color.replace(', 1)', ', 0.12)'),
    borderColor: tier.color.replace(', 1)', ', 0.4)'),
  };
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
        'group flex flex-col gap-0 rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-glow overflow-hidden',
        className,
      )}
    >
      {/* Main clickable area */}
      <button className="flex flex-col gap-3 p-4 text-left w-full" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              style={tierBadgeStyle(level)}
            >
              {t(`workout.level.${level}`)}
            </span>
            {recommended && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                {t('programs.recommended')}
              </span>
            )}
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        <p className="font-display text-base font-bold leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">{program.nameFr}</p>

        {program.descFr && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{program.descFr}</p>
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

    </div>
  );
}
