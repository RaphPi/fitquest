import { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useBadgeStore } from '@/stores/badgeStore';
import { RARITY_META } from '@/lib/badgeIcons';
import BadgeIcon from '@/components/badge/BadgeIcon';
import type { BadgeRarity, BadgeState } from '@/types';

const PX = "'Press Start 2P', monospace";

const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common'];

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

/** Vitrine des trophées : badges groupés par rareté, obtenus en couleur + locked grisés. */
export default function BadgeShowcase() {
  const { badges, isLoading, error, fetchBadges } = useBadgeStore();
  const [selected, setSelected] = useState<BadgeState | null>(null);

  useEffect(() => {
    void fetchBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    return RARITY_ORDER.map((rarity) => ({
      rarity,
      items: badges.filter((b) => b.rarity === rarity).sort((a, b) => a.order - b.order),
    })).filter((g) => g.items.length > 0);
  }, [badges]);

  const obtainedCount = badges.filter((b) => b.obtained).length;

  if (isLoading && badges.length === 0) {
    return <p className="text-sm text-muted-foreground">Chargement des trophées…</p>;
  }
  if (error && badges.length === 0) {
    return <p className="text-sm text-red-300">Impossible de charger les trophées : {error}</p>;
  }
  if (!isLoading && !error && badges.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
        <Trophy className="mb-4 h-12 w-12 opacity-20" />
        <p className="text-sm font-semibold">Aucun trophée disponible.</p>
        <p className="mt-1 text-xs">Complète tes premières séances pour débloquer des badges !</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Salle des trophées
        </h2>
        <span className="font-display text-sm text-xp">
          {obtainedCount}<span className="text-muted-foreground"> / {badges.length}</span>
        </span>
      </div>

      {grouped.map(({ rarity, items }) => {
        const meta = RARITY_META[rarity];
        return (
          <div key={rarity}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>
                {meta.fr}
              </span>
              <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${meta.glow}, transparent)` }} />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {items.map((b) => (
                <BadgeTile key={b.id} badge={b} onClick={() => setSelected(b)} />
              ))}
            </div>
          </div>
        );
      })}

      {selected && <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function BadgeTile({ badge, onClick }: { badge: BadgeState; onClick: () => void }) {
  const meta = RARITY_META[badge.rarity];
  const { obtained, progress } = badge;
  const pct = progress ? Math.round((progress.current / progress.target) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-transform hover:scale-[1.04]"
      style={{
        borderColor: obtained ? meta.glow : 'rgba(255,255,255,0.08)',
        background: obtained
          ? `radial-gradient(circle at 50% 35%, ${meta.glow}, transparent 70%), rgba(255,255,255,0.02)`
          : 'rgba(255,255,255,0.015)',
        boxShadow: obtained ? `0 0 14px -4px ${meta.glow}` : 'none',
      }}
    >
      <BadgeIcon iconType={badge.iconType} rarity={badge.rarity} scale={4} locked={!obtained} />
      <span
        className="line-clamp-2 text-[10px] font-semibold leading-tight"
        style={{ color: obtained ? meta.color : 'rgba(148,163,184,0.7)' }}
      >
        {badge.nameFr}
      </span>
      {!obtained && progress && progress.target > 1 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
        </div>
      )}
    </button>
  );
}

function BadgeDetailModal({ badge, onClose }: { badge: BadgeState; onClose: () => void }) {
  const meta = RARITY_META[badge.rarity];
  const { obtained, progress, unlockedAt } = badge;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-5 backdrop-blur-sm"
      style={{ background: 'rgba(6,6,10,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border-2 p-6 text-center"
        style={{ borderColor: meta.glow, background: 'linear-gradient(180deg,#12141d,#0c0d14)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <BadgeIcon iconType={badge.iconType} rarity={badge.rarity} scale={7} locked={!obtained} />
        </div>
        <div className="mt-3 text-[9px] uppercase tracking-widest" style={{ color: meta.color }}>
          {meta.fr}
        </div>
        <h3 className="mt-1 text-[12px] leading-relaxed" style={{ fontFamily: PX, color: obtained ? meta.color : 'rgba(226,232,240,0.85)' }}>
          {badge.nameFr}
        </h3>
        <p className="mt-3 text-xs text-muted-foreground">{badge.descFr}</p>

        {obtained ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-[11px] text-success">
            ✓ Débloqué{unlockedAt ? ` le ${fmtDate(unlockedAt)}` : ''}
          </div>
        ) : progress ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Progression</span>
              <span className="font-display" style={{ color: meta.color }}>
                {progress.current} / {progress.target}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.round((progress.current / progress.target) * 100)}%`, background: meta.color }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 text-[11px] italic text-muted-foreground">Encore verrouillé…</div>
        )}

        <button onClick={onClose} className="mt-5 w-full text-xs text-muted-foreground hover:text-foreground">
          Fermer
        </button>
      </div>
    </div>
  );
}
