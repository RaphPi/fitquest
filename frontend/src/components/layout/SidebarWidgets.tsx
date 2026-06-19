import { useEffect, useState } from 'react';
import { Flame, Zap, Clock, Activity, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore, type WidgetId } from '@/stores/settingsStore';
import { xpRequiredForLevel } from '@/lib/xp';
import PixelCanvas from '@/components/workout/active/PixelCanvas';
import { renderBadgeIcon } from '@/lib/badgeIcons';
import type { BadgeState, BodyMetric } from '@/types';

// ── Tile shell ───────────────────────────────────────────────────────────────

function WidgetTile({
  compact,
  icon,
  main,
  secondary,
  accent,
}: {
  compact: boolean;
  icon: React.ReactNode;
  main: string;
  secondary?: string;
  accent?: string;
}) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-card-shield px-1 transition-colors hover:border-primary/40">
      <div className={cn('shrink-0 text-muted-foreground', compact ? 'mb-0' : 'mb-0.5')}>
        {icon}
      </div>
      <span
        className={cn('leading-none font-bold tabular-nums', compact ? 'text-[10px]' : 'text-xs')}
        style={{ color: accent ?? 'var(--text-primary)' }}
      >
        {main}
      </span>
      {!compact && secondary && (
        <span className="text-center text-[9px] leading-tight text-muted-foreground">
          {secondary}
        </span>
      )}
    </div>
  );
}

// ── Individual widgets ───────────────────────────────────────────────────────

function StreakWidget({ compact, streak }: { compact: boolean; streak: number }) {
  return (
    <WidgetTile
      compact={compact}
      icon={<Flame className={compact ? 'h-3 w-3' : 'h-4 w-4'} style={{ color: 'rgba(249,115,22,1)' }} />}
      main={String(streak)}
      secondary="Série (j)"
      accent="rgba(249,115,22,1)"
    />
  );
}

function XpRemainingWidget({ compact, remaining, nextLevel }: { compact: boolean; remaining: number; nextLevel: number }) {
  const fmt = remaining >= 1000 ? `${Math.round(remaining / 100) / 10}k` : String(remaining);
  return (
    <WidgetTile
      compact={compact}
      icon={<Zap className={compact ? 'h-3 w-3' : 'h-4 w-4'} style={{ color: 'rgba(234,179,8,1)' }} />}
      main={fmt}
      secondary={`→ Niv ${nextLevel}`}
      accent="rgba(234,179,8,1)"
    />
  );
}

function LastWorkoutWidget({ compact, lastWorkout }: { compact: boolean; lastWorkout: string | null | undefined }) {
  let main: string;
  let secondary: string;

  if (!lastWorkout) {
    main = '—';
    secondary = 'Aucune séance';
  } else {
    const days = Math.floor((Date.now() - new Date(lastWorkout).getTime()) / 86_400_000);
    if (days === 0) { main = 'Auj.'; secondary = 'Dernière séance'; }
    else if (days === 1) { main = '-1j'; secondary = 'Dernière séance'; }
    else { main = `-${days}j`; secondary = 'Dernière séance'; }
  }

  return (
    <WidgetTile
      compact={compact}
      icon={<Clock className={compact ? 'h-3 w-3' : 'h-4 w-4'} />}
      main={main}
      secondary={secondary}
    />
  );
}

function BodyWeightWidget({ compact }: { compact: boolean }) {
  const [data, setData] = useState<{ current: number; prev: number | null } | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/body/metrics', { credentials: 'include' })
      .then((r) => r.json())
      .then(({ metrics }: { metrics: BodyMetric[] }) => {
        if (cancelled) return;
        const w = metrics.filter((m) => m.weightKg !== null);
        if (w.length === 0) { setData(null); return; }
        setData({ current: w[0].weightKg!, prev: w[1]?.weightKg ?? null });
      })
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, []);

  if (data === undefined) {
    return (
      <WidgetTile compact={compact} icon={<Activity className={compact ? 'h-3 w-3' : 'h-4 w-4'} />} main="…" />
    );
  }
  if (data === null) {
    return (
      <WidgetTile compact={compact} icon={<Activity className={compact ? 'h-3 w-3' : 'h-4 w-4'} />} main="—" secondary="Poids" />
    );
  }

  const trend = data.prev !== null
    ? data.current > data.prev ? ' ↗' : data.current < data.prev ? ' ↘' : ' →'
    : '';
  const delta = data.prev !== null ? ` (${data.current > data.prev ? '+' : ''}${(data.current - data.prev).toFixed(1)})` : '';

  return (
    <WidgetTile
      compact={compact}
      icon={<Activity className={compact ? 'h-3 w-3' : 'h-4 w-4'} style={{ color: 'rgba(34,211,238,1)' }} />}
      main={`${data.current}kg`}
      secondary={compact ? undefined : `Poids${trend}${delta}`}
      accent="rgba(34,211,238,1)"
    />
  );
}

function BadgeProgressWidget({ compact }: { compact: boolean }) {
  const [badge, setBadge] = useState<BadgeState | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/badges', { credentials: 'include' })
      .then((r) => r.json())
      .then(({ badges }: { badges: BadgeState[] }) => {
        if (cancelled) return;
        const candidates = badges
          .filter((b) => !b.obtained && b.progress !== null && b.progress!.target > 0)
          .sort((a, b) => (b.progress!.current / b.progress!.target) - (a.progress!.current / a.progress!.target));
        setBadge(candidates[0] ?? null);
      })
      .catch(() => { if (!cancelled) setBadge(null); });
    return () => { cancelled = true; };
  }, []);

  if (badge === undefined) {
    return (
      <WidgetTile compact={compact} icon={<Trophy className={compact ? 'h-3 w-3' : 'h-4 w-4'} />} main="…" />
    );
  }
  if (badge === null) {
    return (
      <WidgetTile compact={compact} icon={<Trophy className={compact ? 'h-3 w-3' : 'h-4 w-4'} />} main="—" secondary="Badge" />
    );
  }

  const pct = Math.round((badge.progress!.current / badge.progress!.target) * 100);

  return (
    <WidgetTile
      compact={compact}
      icon={
        compact
          ? <Trophy className="h-3 w-3 text-muted-foreground" />
          : (
            <PixelCanvas
              render={(c) => renderBadgeIcon(c, badge.iconType, badge.rarity, 2, false)}
              deps={[badge.id]}
              className="h-4"
            />
          )
      }
      main={`${pct}%`}
      secondary={compact ? undefined : badge.nameFr}
      accent="rgba(99,102,241,1)"
    />
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

function WidgetDispatcher({ id, compact }: { id: WidgetId; compact: boolean }) {
  const user = useUserStore((s) => s.user);
  if (!user) return null;

  switch (id) {
    case 'streak':
      return <StreakWidget compact={compact} streak={user.streak} />;
    case 'xp_remaining':
      return (
        <XpRemainingWidget
          compact={compact}
          remaining={xpRequiredForLevel(user.level) - user.currentXP}
          nextLevel={user.level + 1}
        />
      );
    case 'last_workout':
      return <LastWorkoutWidget compact={compact} lastWorkout={user.lastWorkout} />;
    case 'body_weight':
      return <BodyWeightWidget compact={compact} />;
    case 'badge_progress':
      return <BadgeProgressWidget compact={compact} />;
  }
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SidebarWidgets() {
  const widgets = useSettingsStore((s) => s.sidebarWidgets);
  const user = useUserStore((s) => s.user);

  if (!user || widgets.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border">
      {/* lg: single row, all widgets */}
      <div
        className="hidden p-2 lg:grid lg:gap-1.5"
        style={{ gridTemplateColumns: `repeat(${widgets.length}, 1fr)` }}
      >
        {widgets.map((id) => (
          <WidgetDispatcher key={id} id={id} compact={false} />
        ))}
      </div>
      {/* md (not lg): column */}
      <div className={cn('flex flex-col gap-1 p-1.5 lg:hidden', widgets.length > 2 && 'gap-0.5')}>
        {widgets.map((id) => (
          <WidgetDispatcher key={id} id={id} compact={true} />
        ))}
      </div>
    </div>
  );
}
