import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Dumbbell, ClipboardList, Tag, Loader2, ShieldAlert,
  ShieldCheck, ShieldOff, Trash2, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import StatCard from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const GITHUB_RELEASES = 'https://github.com/RaphPi/fitquest/releases';

interface AdminStats {
  userCount: number;
  workoutCount: number;
  programCount: number;
  version: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  level: number;
  createdAt: string;
  lastWorkout: string | null;
  totalXP: number;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: 'include', ...init });
  } catch {
    throw new Error('Impossible de contacter le serveur');
  }
  if (res.status === 204) return undefined as T;
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return undefined as T;
  }
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const currentUser = useUserStore((s) => s.user);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Reset zone
  const [resetAck, setResetAck] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u] = await Promise.all([
        adminFetch<AdminStats>('/api/v1/admin/stats'),
        adminFetch<{ users: AdminUser[] }>('/api/v1/admin/users'),
      ]);
      setStats(s);
      setUsers(u.users);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : '—';

  const handleToggleRole = async (target: AdminUser) => {
    const nextRole: UserRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setBusyId(target.id);
    setError(null);
    try {
      const { user } = await adminFetch<{ user: AdminUser }>(
        `/api/v1/admin/users/${target.id}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: nextRole }),
        },
      );
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (target: AdminUser) => {
    if (!window.confirm(t('admin.users.confirmDelete', { username: target.username }))) return;
    setBusyId(target.id);
    setError(null);
    try {
      await adminFetch<void>(`/api/v1/admin/users/${target.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setStats((prev) => (prev ? { ...prev, userCount: prev.userCount - 1 } : prev));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = async () => {
    if (!resetAck) return;
    if (!window.confirm(t('admin.danger.confirmReset'))) return;
    setResetting(true);
    setResetMsg(null);
    setError(null);
    try {
      const r = await adminFetch<{ ok: boolean; photosDeleted: number }>(
        '/api/v1/admin/reset-data',
        { method: 'POST' },
      );
      setResetMsg(t('admin.danger.resetDone', { photos: r.photosDeleted }));
      setResetAck(false);
      // Les compteurs séances changent → recharger les stats.
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 shadow-glow">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">{t('admin.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Users} value={stats?.userCount ?? 0} label={t('admin.stats.users')} accent />
            <StatCard icon={Dumbbell} value={stats?.workoutCount ?? 0} label={t('admin.stats.workouts')} />
            <StatCard icon={ClipboardList} value={stats?.programCount ?? 0} label={t('admin.stats.programs')} />
            <StatCard icon={Tag} value={stats?.version ?? '—'} label={t('admin.stats.version')} />
          </div>

          {/* Users table */}
          <div className="mb-8">
            <h2 className="mb-3 font-display text-lg font-bold">{t('admin.users.title')}</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">{t('admin.users.colUser')}</th>
                      <th className="px-4 py-3 font-semibold">{t('admin.users.colRole')}</th>
                      <th className="px-4 py-3 font-semibold">{t('admin.users.colCreated')}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t('admin.users.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const isAdmin = u.role === 'ADMIN';
                      const busy = busyId === u.id;
                      return (
                        <tr key={u.id} className="transition-colors hover:bg-card-shield/30">
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {u.username}
                                {isSelf && (
                                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                                    ({t('admin.users.you')})
                                  </span>
                                )}
                              </p>
                              {u.email && (
                                <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                                isAdmin
                                  ? 'border-primary/50 bg-primary/15 text-primary'
                                  : 'border-border text-muted-foreground',
                              )}
                            >
                              {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleToggleRole(u)}
                                disabled={busy}
                                title={isAdmin ? t('admin.users.demote') : t('admin.users.promote')}
                                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isAdmin ? (
                                  <ShieldOff className="h-3.5 w-3.5" />
                                ) : (
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                )}
                                <span className="hidden sm:inline">
                                  {isAdmin ? t('admin.users.demote') : t('admin.users.promote')}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(u)}
                                disabled={busy || isSelf}
                                title={t('common.delete')}
                                className="flex items-center justify-center rounded-lg border border-red-500/30 p-1.5 text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <h2 className="font-display text-lg font-bold text-red-400">{t('admin.danger.title')}</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t('admin.danger.desc')}</p>

            {resetMsg && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                {resetMsg}
              </div>
            )}

            <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={resetAck}
                onChange={(e) => setResetAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-red-500"
              />
              <span>{t('admin.danger.ack')}</span>
            </label>

            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={!resetAck || resetting}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-widest transition-all',
                resetAck && !resetting
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'cursor-not-allowed bg-red-500/30 text-white/50',
              )}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {t('admin.danger.resetBtn')}
            </button>

            <div className="mt-5 border-t border-red-500/20 pt-4 text-sm text-muted-foreground">
              <p>
                {t('admin.danger.versionLabel')}{' '}
                <span className="font-semibold text-foreground">{stats?.version ?? '—'}</span>
              </p>
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-primary transition-colors hover:underline"
              >
                {t('admin.danger.releasesLink')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
