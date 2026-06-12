import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Swords, ChevronDown, Zap, RotateCcw } from 'lucide-react';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { buildActiveSession } from '@/lib/launchSession';
import type { Exercise, Program, WorkoutLog, WorkoutSession } from '@/types';

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

/** Retrouve le programme + la séance d'origine d'un log via son sessionId. */
function resolveSession(
  programs: Program[],
  sessionId: string | null | undefined,
): { program: Program; session: WorkoutSession } | null {
  if (!sessionId) return null;
  for (const program of programs) {
    const session = program.sessions.find((s) => s.id === sessionId);
    if (session) return { program, session };
  }
  return null;
}

/** Liste de l'historique des séances terminées (récentes d'abord). */
export default function WorkoutHistory({ limit }: Props) {
  const navigate = useNavigate();
  const { history, isLoadingHistory, fetchHistory, start } = useWorkoutStore();
  const { programs, fetchPrograms } = useProgramStore();
  const { exercises, fetchExercises } = useExerciseStore();

  useEffect(() => {
    void fetchHistory();
    if (programs.length === 0) void fetchPrograms();
    if (exercises.length === 0) void fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exMap = useMemo(() => new Map<string, Exercise>(exercises.map((e) => [e.id, e])), [exercises]);

  function relaunch(log: WorkoutLog) {
    const resolved = resolveSession(programs, log.sessionId);
    if (!resolved) return;
    const data = buildActiveSession(resolved.program.id, resolved.session, exMap);
    if (!data) return;
    start(data);
    navigate('/workout/active');
  }

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
        <HistoryItem
          key={log.id}
          log={log}
          programName={resolveSession(programs, log.sessionId)?.program.nameFr ?? null}
          canRelaunch={resolveSession(programs, log.sessionId) !== null}
          onRelaunch={() => relaunch(log)}
        />
      ))}
      {remaining > 0 && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          + {remaining} autre{remaining > 1 ? 's' : ''} séance{remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function HistoryItem({
  log,
  programName,
  canRelaunch,
  onRelaunch,
}: {
  log: WorkoutLog;
  programName: string | null;
  canRelaunch: boolean;
  onRelaunch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const setCount = log.completedSets.length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
            <Swords className="h-5 w-5 text-primary-soft" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-bold">{log.sessionName}</div>
            {programName && (
              <div className="truncate text-[11px] font-semibold text-primary-soft/80">{programName}</div>
            )}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>{formatDate(log.date)} · {formatTime(log.date)}</span>
              <span className="inline-flex items-center gap-1" style={{ color: 'rgba(34,211,238,1)' }}>
                <Clock className="h-3 w-3" /> {formatDuration(log.durationSecs)}
              </span>
              <span>{setCount} série{setCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </button>

        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-1 font-display text-sm font-black text-xp">
            <Zap className="h-3.5 w-3.5" /> +{log.xpEarned}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</div>
        </div>

        {canRelaunch && (
          <button
            type="button"
            onClick={onRelaunch}
            title="Relancer cette séance"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary-soft transition-all hover:shadow-glow"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}

        <button type="button" onClick={() => setOpen((o) => !o)} className="shrink-0 p-1">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

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
