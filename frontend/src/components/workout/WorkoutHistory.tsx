import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Swords, ChevronDown, Zap } from 'lucide-react';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { WorkoutLog } from '@/types';

interface Props {
  /** Nombre max de séances affichées (le reste est résumé en pied de liste). */
  limit?: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m} min ${s.toString().padStart(2, '0')}` : `${m} min`;
}

/** Liste de l'historique des séances terminées (récentes d'abord). */
export default function WorkoutHistory({ limit }: Props) {
  const { history, isLoadingHistory, fetchHistory } = useWorkoutStore();

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  if (isLoadingHistory && history.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Chargement de l'historique…
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <Swords className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Aucune séance enregistrée pour l'instant.
        </p>
        <Link
          to="/workout"
          className="mt-3 inline-block rounded-lg border border-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary transition-all hover:shadow-glow"
        >
          Lancer ton premier combat ⚔
        </Link>
      </div>
    );
  }

  const shown = limit ? history.slice(0, limit) : history;
  const remaining = history.length - shown.length;

  return (
    <div className="space-y-2.5">
      {shown.map((log) => (
        <HistoryItem key={log.id} log={log} />
      ))}
      {remaining > 0 && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          + {remaining} autre{remaining > 1 ? 's' : ''} séance{remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function HistoryItem({ log }: { log: WorkoutLog }) {
  const [open, setOpen] = useState(false);
  const setCount = log.completedSets.length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
          <Swords className="h-5 w-5 text-primary-soft" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-bold">{log.sessionName}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{formatDate(log.date)} · {formatTime(log.date)}</span>
            <span className="inline-flex items-center gap-1" style={{ color: 'rgba(34,211,238,1)' }}>
              <Clock className="h-3 w-3" /> {formatDuration(log.durationSecs)}
            </span>
            <span>{setCount} série{setCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-1 font-display text-sm font-black text-xp">
            <Zap className="h-3.5 w-3.5" /> +{log.xpEarned}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-3">
          {setCount === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune série enregistrée (séance abandonnée).</p>
          ) : (
            <ul className="space-y-1.5">
              {log.completedSets.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between text-xs">
                  <span className="truncate text-foreground">
                    <span className="text-muted-foreground">#{s.setNumber}</span> {s.exerciseName}
                  </span>
                  <span className="ml-2 shrink-0 font-display font-bold">
                    {s.reps != null
                      ? `${s.reps} rép`
                      : s.durationSecs != null
                        ? `${s.durationSecs}s`
                        : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
