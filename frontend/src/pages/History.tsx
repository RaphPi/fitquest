import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Clock, Zap, Flame, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useUserStore } from '@/stores/userStore';
import WorkoutHistory from '@/components/workout/WorkoutHistory';
import { resolveSession } from '@/components/workout/WorkoutHistory';
import type { WorkoutLog, Program } from '@/types';

// ── helpers ─────────────────────────────────────────────────────────────────

type Period = '7' | '30' | '90' | 'all';

function formatTotalDuration(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, '0')}`;
}

function maxStreak(logs: WorkoutLog[]): number {
  if (!logs.length) return 0;
  const days = [...new Set(logs.map((l) => l.date.slice(0, 10)))].sort();
  let max = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round(
      (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000,
    );
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return days.length ? max : 0;
}

function uniquePrograms(logs: WorkoutLog[], programs: Program[]) {
  const seen = new Set<string>();
  const result: { id: string; name: string }[] = [];
  for (const log of logs) {
    const r = resolveSession(programs, log.sessionId);
    if (r && !seen.has(r.program.id)) {
      seen.add(r.program.id);
      result.push({ id: r.program.id, name: r.program.nameFr });
    }
  }
  return result;
}

// ── component ────────────────────────────────────────────────────────────────

export default function History() {
  const { t } = useTranslation();
  const { history, isLoadingHistory, fetchHistory } = useWorkoutStore();
  const { programs, fetchPrograms } = useProgramStore();
  const { exercises, fetchExercises } = useExerciseStore();
  const { user } = useUserStore();

  const [period, setPeriod] = useState<Period>('all');
  const [programFilter, setProgramFilter] = useState<string>('');

  useEffect(() => {
    void fetchHistory();
    if (programs.length === 0) void fetchPrograms();
    if (exercises.length === 0) void fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = useMemo<WorkoutLog[]>(() => {
    let result = history;
    if (period !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(period));
      result = result.filter((l) => new Date(l.date) >= cutoff);
    }
    if (programFilter) {
      result = result.filter((l) => {
        const r = resolveSession(programs, l.sessionId);
        return r?.program.id === programFilter;
      });
    }
    return result;
  }, [history, period, programFilter, programs]);

  const programOptions = useMemo(() => uniquePrograms(history, programs), [history, programs]);

  const stats = useMemo(() => ({
    total: filteredLogs.length,
    duration: filteredLogs.reduce((s, l) => s + l.durationSecs, 0),
    xp: filteredLogs.reduce((s, l) => s + l.xpEarned, 0),
    maxStrk: maxStreak(history),
  }), [filteredLogs, history]);

  const PERIODS = (['7', '30', '90', 'all'] as Period[]);

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-xl font-bold">{t('history.title')}</h1>
        <span className="ml-auto text-xs text-muted-foreground">{t('history.count', { count: history.length })}</span>
      </div>

      {/* Stats summary */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryTile icon={<Calendar className="h-4 w-4" />} value={String(stats.total)} label={t('history.stats.sessions')} />
          <SummaryTile
            icon={<Clock className="h-4 w-4" />}
            value={formatTotalDuration(stats.duration)}
            label={t('history.stats.totalDuration')}
            color="rgba(34,211,238,1)"
          />
          <SummaryTile
            icon={<Zap className="h-4 w-4" />}
            value={String(stats.xp)}
            label={t('history.stats.xpGained')}
            color="var(--xp)"
          />
          <SummaryTile
            icon={<Flame className="h-4 w-4" />}
            value={user ? String(Math.max(stats.maxStrk, user.streak)) : String(stats.maxStrk)}
            label={t('history.stats.maxStreak')}
            color="#f97316"
          />
        </div>
      )}

      {/* Filters */}
      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Period pills */}
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="rounded-md px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide transition-all"
                style={
                  period === p
                    ? { background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)' }
                    : { color: 'var(--text-secondary)', border: '1px solid transparent' }
                }
              >
                {t(`history.periods.${p}`)}
              </button>
            ))}
          </div>

          {/* Program select */}
          {programOptions.length > 0 && (
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t('history.allPrograms')}</option>
              {programOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {(period !== 'all' || programFilter) && (
            <button
              type="button"
              onClick={() => { setPeriod('all'); setProgramFilter(''); }}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              {t('history.reset')}
            </button>
          )}
        </div>
      )}

      {/* Result count when filtered */}
      {(period !== 'all' || programFilter) && filteredLogs.length !== history.length && (
        <p className="text-xs text-muted-foreground">
          {t('history.filteredCount', { filtered: filteredLogs.length, total: history.length, count: filteredLogs.length })}
        </p>
      )}

      {/* History list */}
      {isLoadingHistory && history.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t('history.loading')}
        </div>
      ) : (
        <WorkoutHistory overrideLogs={filteredLogs} />
      )}
    </section>
  );
}

function SummaryTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground" style={color ? { color } : {}}>
        {icon}
        <span className="font-display text-xs uppercase tracking-widest">{label}</span>
      </div>
      <span className="font-display text-xl font-black" style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  );
}
