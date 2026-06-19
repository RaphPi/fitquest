import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { xpRequiredForLevel } from '@/lib/xp';
import { avatarClassFromStage, getAvatarStageMeta } from '@/lib/avatar';
import { buildActiveSession } from '@/lib/launchSession';
import { useUserStore } from '@/stores/userStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useBodyStore } from '@/stores/bodyStore';
import { Zap, Trophy, Calendar, ArrowRight, Swords, Play, Info, ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import StatCard from '@/components/ui/StatCard';
import StreakCard from '@/components/ui/StreakCard';
import XPBar from '@/components/ui/XPBar';
import Avatar from '@/components/avatar/Avatar';
import WorkoutHistory from '@/components/workout/WorkoutHistory';
import type { Program, WorkoutLog } from '@/types';

// ── helpers ─────────────────────────────────────────────────────────────────

function resolveNextSession(programs: Program[], history: WorkoutLog[]) {
  if (!history.length || !programs.length) return null;
  const lastLog = history[0];
  if (!lastLog.sessionId) return null;
  for (const prog of programs) {
    const idx = prog.sessions.findIndex((s) => s.id === lastLog.sessionId);
    if (idx !== -1) {
      const sorted = [...prog.sessions].sort((a, b) => a.order - b.order);
      const doneIdx = sorted.findIndex((s) => s.id === lastLog.sessionId);
      const nextSess = sorted[(doneIdx + 1) % sorted.length];
      return { program: prog, session: nextSess };
    }
  }
  return null;
}

function computeWeeklyData(history: WorkoutLog[]) {
  const now = new Date();
  const dow = now.getDay();
  const daysToMon = dow === 0 ? 6 : dow - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToMon);
  thisMonday.setHours(0, 0, 0, 0);

  return Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const label = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const count = history.filter((l) => {
      const d = new Date(l.date);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { label, count };
  });
}

// ── component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const history = useWorkoutStore((s) => s.history);
  const { programs, fetchPrograms, isLoading: programsLoading } = useProgramStore();
  const { exercises, fetchExercises } = useExerciseStore();
  const { metrics, fetchMetrics, isLoading: metricsLoading } = useBodyStore();

  const [showExercises, setShowExercises] = useState(false);

  useEffect(() => {
    if (programs.length === 0) void fetchPrograms();
    if (exercises.length === 0) void fetchExercises();
    if (metrics.length === 0) void fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weeklyData = useMemo(() => computeWeeklyData(history), [history]);

  const weightColor = useMemo(() => {
    try {
      const stored = localStorage.getItem('fq_metric_colors');
      if (stored) {
        const map = JSON.parse(stored) as Record<string, string>;
        if (map.weight) return map.weight;
      }
    } catch { /* ignore */ }
    return '#f59e0b';
  }, []);

  const weightData = useMemo(() => {
    const withW = [...metrics]
      .filter((m) => m.weightKg != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-6);
    if (!withW.length) return null;
    return {
      current: withW[withW.length - 1].weightKg!,
      sparkline: withW.map((m) => ({ v: m.weightKg! })),
    };
  }, [metrics]);

  const nextSession = useMemo(() => resolveNextSession(programs, history), [programs, history]);

  const exMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  function launchNext() {
    if (!nextSession) return;
    const data = buildActiveSession(nextSession.program.id, nextSession.session, exMap);
    if (!data) return;
    useWorkoutStore.getState().start(data);
    navigate('/workout/active');
  }

  const hasWeeklyActivity = weeklyData.some((w) => w.count > 0);
  const stageMeta = user ? getAvatarStageMeta(user.level) : null;
  const isDashboardLoading = programsLoading || metricsLoading;

  return (
    <section className="space-y-5">
      {/* ── En-tête ── */}
      <div className="flex items-center gap-3">
        {user && (
          <Avatar
            classKey={avatarClassFromStage(user.avatarStage)}
            level={user.level}
            size={56}
            animate={false}
            className="shrink-0"
          />
        )}
        <div>
          <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
          {user && stageMeta && (
            <>
              <p className="mt-0.5 text-sm">
                <span className="font-semibold text-primary-soft">{user.username}</span>
                {' · '}
                <span style={{ color: stageMeta.tier.color }}>{stageMeta.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Prêt à monter de niveau ?</p>
            </>
          )}
        </div>
      </div>

      {user && (
        <>
          <XPBar
            current={user.currentXP}
            required={xpRequiredForLevel(user.level)}
            level={user.level}
          />

          {/* ── 4 tuiles compact homogènes ── */}
          {isDashboardLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StreakCard streak={user.streak} />
              <StatCard icon={Zap} value={user.totalXP} label="XP total" compact />
              <StatCard icon={Trophy} value={user.level} label="Niveau" compact />
              <StatCard icon={Calendar} value={history.length} label="Séances" compact />
            </div>
          )}

          {/* ── Fréquence + Poids : toujours 2 colonnes ── */}
          {isDashboardLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="h-28 animate-pulse rounded-lg border border-border bg-card" />
              <div className="h-28 animate-pulse rounded-lg border border-border bg-card" />
            </div>
          ) : (hasWeeklyActivity || weightData) && (
            <div className="grid grid-cols-2 gap-3">
              {hasWeeklyActivity && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Fréq. hebdo
                  </h2>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={weeklyData} margin={{ top: 2, right: 0, left: -32, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}
                        labelStyle={{ color: 'var(--text-secondary)', fontSize: 12 }}
                        itemStyle={{ color: 'var(--accent)', fontSize: 12 }}
                        formatter={(v: number) => [v, v !== 1 ? 'séances' : 'séance']}
                        cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                      />
                      <Bar dataKey="count" fill="var(--accent)" fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {weightData ? (
                <div className="rounded-lg border border-border bg-card p-3">
                  <h2 className="mb-1 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Poids actuel
                  </h2>
                  <p className="font-display text-xl font-black" style={{ color: weightColor }}>
                    {weightData.current.toFixed(1)}{' '}
                    <span className="text-xs font-normal text-muted-foreground">kg</span>
                  </p>
                  {weightData.sparkline.length > 1 && (
                    <div className="mt-1.5">
                      <ResponsiveContainer width="100%" height={36}>
                        <LineChart data={weightData.sparkline} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Line type="monotone" dataKey="v" stroke={weightColor} dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                /* Placeholder quand pas de données poids mais graphe actif */
                !hasWeeklyActivity ? null : <div />
              )}
            </div>
          )}

          {/* ── Prochaine séance ── */}
          {isDashboardLoading ? (
            <div className="h-28 animate-pulse rounded-lg border border-border bg-card" />
          ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Prochaine séance
            </h2>
            {nextSession ? (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-sm font-bold leading-tight">{nextSession.session.nameFr}</p>
                    <button
                      type="button"
                      onClick={() => setShowExercises((v) => !v)}
                      aria-label={showExercises ? 'Masquer les exercices' : 'Voir les exercices'}
                      title={showExercises ? 'Masquer les exercices' : 'Voir les exercices'}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-primary-soft focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
                    >
                      {showExercises
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <Info className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-primary-soft/80">
                    {nextSession.program.nameFr}
                  </p>

                  {/* Liste inline des exercices */}
                  {showExercises && (
                    <div className="mt-2 rounded-md border border-border/60 bg-muted/10 px-3 py-2">
                      <ul className="space-y-1">
                        {[...nextSession.session.exercises]
                          .sort((a, b) => a.order - b.order)
                          .map((se, i) => {
                            const ex = exMap.get(se.exerciseId);
                            return (
                              <li key={se.id} className="flex items-center gap-2 text-xs">
                                <span className="w-3.5 shrink-0 text-right text-muted-foreground">{i + 1}.</span>
                                <span className="flex-1 text-foreground">{ex?.nameFr ?? '…'}</span>
                                <span className="shrink-0 text-muted-foreground">
                                  {se.sets}×{se.reps != null ? `${se.reps}` : `${se.durationSeconds ?? 0}s`}
                                </span>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    {nextSession.session.exercises.length} exercice
                    {nextSession.session.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={launchNext}
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary-soft transition-all hover:shadow-glow focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
                >
                  <Play className="h-3.5 w-3.5" /> Lancer
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <Swords className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Aucun programme actif.</p>
                <Link
                  to="/workout"
                  className="rounded-lg border border-primary px-3 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-primary transition-all hover:shadow-glow"
                >
                  Lancer un programme
                </Link>
              </div>
            )}
          </div>
          )}
        </>
      )}

      {/* ── Activité récente ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Activité récente
          </h2>
          {history.length > 5 && (
            <Link
              to="/history"
              className="flex items-center gap-1 text-xs font-semibold text-primary-soft hover:underline"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {isDashboardLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          <WorkoutHistory limit={5} />
        )}
      </div>
    </section>
  );
}
