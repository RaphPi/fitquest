import { cn } from '@/lib/utils';
import type { Program, Level } from '@/types';
import { Calendar, Dumbbell, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface ProgramCardProps {
  program: Program;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const levelColors: Record<Level, string> = {
  beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  advanced: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const levelLabels: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export default function ProgramCard({ program, onClick, onEdit, onDelete, className }: ProgramCardProps) {
  const level = program.level as Level;

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-glow',
        className,
      )}
    >
      <button className="flex w-full flex-col gap-3 text-left" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
              levelColors[level] ?? 'text-muted-foreground',
            )}
          >
            {levelLabels[level] ?? level}
          </span>
          {program.isCustom && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              Custom
            </span>
          )}
        </div>

        <p className="font-display text-base font-bold leading-tight text-foreground">{program.nameFr}</p>

        {program.descFr && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{program.descFr}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {program.daysPerWeek} j/semaine
          </span>
          {program.durationWeeks && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {program.durationWeeks} sem.
            </span>
          )}
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" />
            {program.sessions.length} séance{program.sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between">
        <button
          onClick={onClick}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Voir le détail
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {program.isCustom && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-red-400"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
