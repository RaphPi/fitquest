import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useBadgeStore } from '@/stores/badgeStore';
import { RARITY_META } from '@/lib/badgeIcons';
import BadgeIcon from '@/components/badge/BadgeIcon';
import type { BadgeState } from '@/types';

/** Tuile résumée badges pour la page Profil.
 *  3 derniers trophées obtenus + prochain à débloquer (le plus avancé en %). */
export default function BadgeSummaryTile() {
  const { badges, isLoading, fetchBadges } = useBadgeStore();
  const navigate = useNavigate();

  useEffect(() => {
    void fetchBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { recent, next } = useMemo(() => {
    const obtained = badges
      .filter((b) => b.obtained && b.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 3);

    const nextBadge = badges
      .filter((b) => !b.obtained)
      .sort((a, b) => {
        const ra = a.progress ? a.progress.current / a.progress.target : 0;
        const rb = b.progress ? b.progress.current / b.progress.target : 0;
        if (rb !== ra) return rb - ra;
        return a.order - b.order;
      })[0] ?? null;

    return { recent: obtained, next: nextBadge };
  }, [badges]);

  const obtainedCount = badges.filter((b) => b.obtained).length;

  if (isLoading && badges.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Trophées
        </h2>
        <span className="font-display text-xs text-xp">
          {obtainedCount}
          <span className="text-muted-foreground"> / {badges.length}</span>
        </span>
      </div>

      {/* Contenu : badges récents + prochain */}
      {recent.length === 0 && !next ? (
        <p className="text-xs italic text-muted-foreground">
          Lance ta première séance pour débloquer des trophées.
        </p>
      ) : (
        <div className="flex flex-wrap items-start gap-3">
          {/* 3 badges obtenus les plus récents */}
          {recent.map((b) => (
            <ObtainedTile key={b.id} badge={b} />
          ))}

          {/* Séparateur si on a les deux */}
          {recent.length > 0 && next && (
            <div className="self-stretch border-l border-border mx-1" />
          )}

          {/* Prochain badge à débloquer */}
          {next && <NextTile badge={next} />}
        </div>
      )}

      {/* Lien vers la vitrine complète */}
      <button
        onClick={() => navigate('/trophees')}
        className="flex w-full items-center justify-end gap-1 text-xs text-primary-soft transition-colors hover:text-primary"
      >
        Voir tous mes trophées
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ObtainedTile({ badge }: { badge: BadgeState }) {
  const meta = RARITY_META[badge.rarity];
  return (
    <div className="flex flex-col items-center gap-1.5 w-[60px]" title={badge.nameFr}>
      <div
        className="rounded-lg p-1.5"
        style={{
          border: `1px solid ${meta.glow}`,
          background: `radial-gradient(circle at 50% 35%, ${meta.glow}, transparent 70%), rgba(255,255,255,0.02)`,
          boxShadow: `0 0 10px -3px ${meta.glow}`,
        }}
      >
        <BadgeIcon iconType={badge.iconType} rarity={badge.rarity} scale={3} locked={false} />
      </div>
      <span
        className="w-full text-center line-clamp-2 text-[9px] font-semibold leading-tight"
        style={{ color: meta.color }}
      >
        {badge.nameFr}
      </span>
    </div>
  );
}

function NextTile({ badge }: { badge: BadgeState }) {
  const meta = RARITY_META[badge.rarity];
  const pct = badge.progress && badge.progress.target > 0
    ? Math.round((badge.progress.current / badge.progress.target) * 100)
    : 0;

  return (
    <div className="flex flex-col items-center gap-1.5 w-[60px] opacity-60" title={`Prochain : ${badge.nameFr}`}>
      <div
        className="rounded-lg p-1.5"
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <BadgeIcon iconType={badge.iconType} rarity={badge.rarity} scale={3} locked={true} />
      </div>
      <span className="w-full text-center line-clamp-2 text-[9px] leading-tight text-muted-foreground">
        {badge.nameFr}
      </span>
      {badge.progress && badge.progress.target > 1 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: meta.color, opacity: 0.7 }}
          />
        </div>
      )}
    </div>
  );
}
