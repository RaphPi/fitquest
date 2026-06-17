import { cn } from '@/lib/utils';
import type { Program, Level } from '@/types';
import { getLevelTier } from '@/lib/levelTier';
import { Calendar, Dumbbell, Clock, ChevronRight, Layers } from 'lucide-react';
import {
  estimateProgramMinutes,
  countProgramExercises,
  countProgramSets,
} from '@/lib/duration';

interface ProgramCardProps {
  program: Program;
  onClick: () => void;
  className?: string;
}

const LEVEL_REP: Record<Level, number> = { beginner: 1, intermediate: 20, advanced: 50 };

const levelLabels: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

function tierBadgeStyle(level: Level) {
  const tier = getLevelTier(LEVEL_REP[level] ?? 1);
  return {
    color: tier.color,
    backgroundColor: tier.color.replace(', 1)', ', 0.12)'),
    borderColor: tier.color.replace(', 1)', ', 0.4)'),
  };
}

export default function ProgramCard({ program, onClick, className }: ProgramCardProps) {
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
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={tierBadgeStyle(level)}
          >
            {levelLabels[level] ?? level}
          </span>
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
            {program.daysPerWeek} j/sem
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <Dumbbell className="h-3 w-3" />
            {program.sessions.length} séance{program.sessions.length !== 1 ? 's' : ''}
          </span>
          {totalEx > 0 && (
            <span className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              <Layers className="h-3 w-3" />
              {totalEx} ex · {totalSets} séries
            </span>
          )}
          {avgMin > 0 && (
            <span className="flex items-center gap-1 rounded-lg border border-xp/30 bg-xp/10 px-2 py-1 text-[11px] font-semibold text-xp">
              <Clock className="h-3 w-3" />
              ~{avgMin} min/séance
            </span>
          )}
        </div>
      </button>

    </div>
  );
}
