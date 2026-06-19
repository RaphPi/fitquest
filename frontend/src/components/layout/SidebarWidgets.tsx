import { useEffect } from 'react';
import { Flame, Zap, Clock, Activity, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore, type WidgetId } from '@/stores/settingsStore';
import { useBodyStore } from '@/stores/bodyStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { xpRequiredForLevel } from '@/lib/xp';
import PixelCanvas from '@/components/workout/active/PixelCanvas';
import { renderBadgeIcon } from '@/lib/badgeIcons';
import type { BadgeState } from '@/types';

// ── Color helpers ─────────────────────────────────────────────────────────────

function getStoredWeightColor(): string {
  try {
    const stored = localStorage.getItem('fq_metric_colors');
    if (stored) {
      const map = JSON.parse(stored) as Record<string, string>;
      if (map.weight) return map.weight;
    }
  } catch { /* ignore */ }
  return '#f59e0b';
}

// ── Tile shell ────────────────────────────────────────────────────────────────
// size = 'xl' (1 widget seul), 'md' (2 widgets), 'compact' (md sidebar icônes)
//
// xl/md vivent dans une cellule `container-type: size` : leurs tailles internes
// (icône, texte) s'expriment en `cqmin` (= côté du carré) pour suivre le carré
// quand il rétrécit en hauteur. compact reste en rem fixes (pas de container cq).

type TileSize = 'xl' | 'md' | 'compact';

// Taille d'icône proportionnelle au carré (cqmin) sauf en compact.
const ICON_CLS: Record<TileSize, string> = {
  xl: 'h-[22cqmin] w-[22cqmin]',
  md: 'h-[20cqmin] w-[20cqmin]',
  compact: 'h-3.5 w-3.5',
};

function WidgetTile({
  size,
  icon,
  main,
  secondary,
  accent,
}: {
  size: TileSize;
  icon: React.ReactNode;
  main: string;
  secondary?: string;
  accent?: string;
}) {
  // compact (md) : carré plein-largeur dans la colonne d'icônes 64px.
  // xl/md (lg)   : plus grand carré inscrit dans la cellule (W×H) via unités cq.
  const shell =
    size === 'compact'
      ? 'aspect-square w-full'
      : 'aspect-square w-[min(100cqw,100cqh)] max-w-full';

  return (
    <div className={cn(
      'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card-shield px-1 transition-colors hover:border-primary/40',
      shell,
    )}>
      <div className="shrink-0 text-muted-foreground">{icon}</div>
      <span
        className={cn(
          'max-w-full truncate leading-none font-bold tabular-nums',
          size === 'xl'
            ? 'text-[clamp(0.8rem,26cqmin,2.3rem)]'
            : size === 'md'
              ? 'text-[clamp(0.7rem,22cqmin,1.4rem)]'
              : 'text-[11px]',
        )}
        style={{ color: accent ?? 'var(--text-primary)' }}
      >
        {main}
      </span>
      {size !== 'compact' && secondary && (
        <span className="w-full truncate px-1 text-center leading-tight text-muted-foreground text-[clamp(0.55rem,10cqmin,0.85rem)]">
          {secondary}
        </span>
      )}
    </div>
  );
}

// ── Widgets ───────────────────────────────────────────────────────────────────

function StreakWidget({ size, streak }: { size: TileSize; streak: number }) {
  return (
    <WidgetTile
      size={size}
      icon={<Flame className={ICON_CLS[size]} style={{ color: 'rgba(249,115,22,1)' }} />}
      main={String(streak)}
      secondary="Série (jours)"
      accent="rgba(249,115,22,1)"
    />
  );
}

function XpRemainingWidget({ size, remaining, nextLevel }: { size: TileSize; remaining: number; nextLevel: number }) {
  const fmt = remaining >= 10000
    ? `${Math.round(remaining / 1000)}k`
    : remaining >= 1000
      ? `${(remaining / 1000).toFixed(1)}k`
      : String(remaining);
  return (
    <WidgetTile
      size={size}
      icon={<Zap className={ICON_CLS[size]} style={{ color: 'var(--xp)' }} />}
      main={fmt}
      secondary={`→ Niv. ${nextLevel}`}
      accent="var(--xp)"
    />
  );
}

function LastWorkoutWidget({ size, lastWorkout }: { size: TileSize; lastWorkout: string | null | undefined }) {
  let main: string;
  let secondary: string;

  if (!lastWorkout) {
    main = '—';
    secondary = 'Aucune séance';
  } else {
    const days = Math.floor((Date.now() - new Date(lastWorkout).getTime()) / 86_400_000);
    if (days === 0) { main = 'Auj.'; secondary = 'Dernière séance'; }
    else { main = `−${days}j`; secondary = 'Dernière séance'; }
  }

  return (
    <WidgetTile
      size={size}
      icon={<Clock className={ICON_CLS[size]} />}
      main={main}
      secondary={secondary}
    />
  );
}

function BodyWeightWidget({ size }: { size: TileSize }) {
  const metrics = useBodyStore((s) => s.metrics);
  const weightColor = getStoredWeightColor();

  // Sème le store si vide (une seule fois, sans toucher isLoading)
  useEffect(() => {
    if (useBodyStore.getState().metrics.length > 0) return;
    fetch('/api/v1/body/metrics', { credentials: 'include' })
      .then((r) => r.json())
      .then(({ metrics: fetched }) => useBodyStore.setState({ metrics: fetched }))
      .catch(() => {});
  }, []);

  const withWeight = metrics.filter((m) => m.weightKg !== null);

  if (withWeight.length === 0) {
    return (
      <WidgetTile
        size={size}
        icon={<Activity className={ICON_CLS[size]} />}
        main="—"
        secondary="Poids"
      />
    );
  }

  const current = withWeight[0].weightKg!;
  const prev = withWeight[1]?.weightKg ?? null;
  const trend = prev !== null ? (current > prev ? '↗' : current < prev ? '↘' : '→') : '';
  const delta = prev !== null ? ` ${current > prev ? '+' : ''}${(current - prev).toFixed(1)}` : '';
  const secondary = trend ? `${trend}${delta} kg` : 'Poids';

  return (
    <WidgetTile
      size={size}
      icon={<Activity className={ICON_CLS[size]} style={{ color: weightColor }} />}
      main={`${current}kg`}
      secondary={secondary}
      accent={weightColor}
    />
  );
}

function BadgeProgressWidget({ size }: { size: TileSize }) {
  const badges = useBadgeStore((s) => s.badges);

  // Sème le store si vide
  useEffect(() => {
    if (useBadgeStore.getState().badges.length > 0) return;
    useBadgeStore.getState().fetchBadges();
  }, []);

  const best: BadgeState | undefined = badges
    .filter((b) => !b.obtained && b.progress !== null && b.progress!.target > 0)
    .sort((a, b) => (b.progress!.current / b.progress!.target) - (a.progress!.current / a.progress!.target))[0];

  if (!best) {
    return (
      <WidgetTile
        size={size}
        icon={<Trophy className={ICON_CLS[size]} />}
        main="—"
        secondary="Badge"
      />
    );
  }

  const pct = Math.round((best.progress!.current / best.progress!.target) * 100);

  return (
    <WidgetTile
      size={size}
      icon={
        size === 'compact'
          ? <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
          : (
            <PixelCanvas
              render={(c) => renderBadgeIcon(c, best.iconType, best.rarity, size === 'xl' ? 4 : 3, false)}
              deps={[best.id]}
              className={size === 'xl' ? 'h-[22cqmin]' : 'h-[20cqmin]'}
            />
          )
      }
      main={`${pct}%`}
      secondary={best.nameFr}
      accent="rgba(99,102,241,1)"
    />
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

function WidgetDispatcher({ id, size }: { id: WidgetId; size: TileSize }) {
  const user = useUserStore((s) => s.user);
  if (!user) return null;

  switch (id) {
    case 'streak':
      return <StreakWidget size={size} streak={user.streak} />;
    case 'xp_remaining':
      return (
        <XpRemainingWidget
          size={size}
          remaining={xpRequiredForLevel(user.level) - user.currentXP}
          nextLevel={user.level + 1}
        />
      );
    case 'last_workout':
      return <LastWorkoutWidget size={size} lastWorkout={user.lastWorkout} />;
    case 'body_weight':
      return <BodyWeightWidget size={size} />;
    case 'badge_progress':
      return <BadgeProgressWidget size={size} />;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SidebarWidgets() {
  const widgets = useSettingsStore((s) => s.sidebarWidgets);
  const user = useUserStore((s) => s.user);

  if (!user || widgets.length === 0) return null;

  // count=1 → tuile pleine largeur agrandie ; count=2 → 2 tuiles côte à côte
  const lgSize: TileSize = widgets.length === 1 ? 'xl' : 'md';

  return (
    <div className="h-full border-t border-border">
      {/* lg : grille qui remplit toute la hauteur dispo ; chaque cellule = contexte
          container-query (hauteur définie) pour borner le carré par W ET H. */}
      <div
        className="hidden h-full overflow-hidden p-2 lg:grid lg:gap-2"
        style={{
          gridTemplateColumns: `repeat(${widgets.length}, minmax(0, 1fr))`,
          gridTemplateRows: '1fr',
        }}
      >
        {widgets.map((id) => (
          <div
            key={id}
            className="flex min-h-0 min-w-0 items-end justify-center"
            style={{ containerType: 'size' }}
          >
            <WidgetDispatcher id={id} size={lgSize} />
          </div>
        ))}
      </div>
      {/* md (icônes seules) : colonne compacte */}
      <div className="flex flex-col gap-1 p-1.5 lg:hidden">
        {widgets.map((id) => (
          <WidgetDispatcher key={id} id={id} size="compact" />
        ))}
      </div>
    </div>
  );
}
