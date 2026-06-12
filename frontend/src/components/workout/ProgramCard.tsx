import { cn } from '@/lib/utils';
import type { Program, Level } from '@/types';
import { Calendar, Dumbbell, Clock, Pencil, Trash2, ChevronRight, Layers } from 'lucide-react';
import {
  estimateProgramMinutes,
  countProgramExercises,
  countProgramSets,
} from '@/lib/duration';

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
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
              levelColors[level] ?? 'text-muted-foreground border-border',
            )}
          >
            {levelLabels[level] ?? level}
          </span>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        <p className="font-display text-base font-bold leading-tight text-foreground">{program.nameFr}</p>

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

      {/* Edit / delete actions */}
      {(onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 border-t border-border px-3 py-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-danger/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
