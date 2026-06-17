import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/userStore';
import { getLevelTier, nextTierLevel } from '@/lib/levelTier';
import { getAvatarStageMeta, avatarClassFromStage, AVATAR_STAGE_COUNT } from '@/lib/avatar';
import { xpRequiredForLevel } from '@/lib/xp';
import LevelBadge from '@/components/ui/LevelBadge';
import XPBar from '@/components/ui/XPBar';
import Avatar from '@/components/avatar/Avatar';
import BadgeSummaryTile from '@/components/badge/BadgeSummaryTile';

export default function Profile() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);

  const meta = user ? getAvatarStageMeta(user.level) : null;
  const nextLevel = user ? nextTierLevel(user.level) : null;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('nav.profile')}</h1>
        {user && (
          <p className="mt-1 text-muted-foreground">
            <span className="font-semibold text-primary-soft">{user.username}</span> —{' '}
            <span style={{ color: getLevelTier(user.level).color }}>{getLevelTier(user.level).name}</span>
          </p>
        )}
      </div>

      {user && meta && (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:gap-8 sm:p-6">
          {/* Avatar mobile (petit) */}
          <Avatar classKey={avatarClassFromStage(user.avatarStage)} level={user.level} size={80} className="shrink-0 sm:hidden" />
          {/* Avatar desktop (grand) */}
          <Avatar classKey={avatarClassFromStage(user.avatarStage)} level={user.level} size={150} className="hidden shrink-0 sm:block" />

          <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
            <div>
              <p className="font-display text-xl font-bold" style={{ color: meta.tier.color }}>
                {meta.name}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Stade {meta.stage} / {AVATAR_STAGE_COUNT} — {meta.tier.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <LevelBadge level={user.level} size="xl" />
              <XPBar
                current={user.currentXP}
                required={xpRequiredForLevel(user.level)}
                level={user.level}
                className="flex-1"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {nextLevel
                ? <>Prochain stade au <span style={{ color: meta.tier.color }}>niveau {nextLevel}</span>.</>
                : <>Stade ultime atteint — tu es une <span style={{ color: meta.tier.color }}>Légende</span>.</>}
            </p>
          </div>
        </div>
      )}

      <BadgeSummaryTile />
    </section>
  );
}
