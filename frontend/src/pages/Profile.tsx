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
    <section className="space-y-8">
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
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
          {/* Grand avatar évolutif */}
          <Avatar classKey={avatarClassFromStage(user.avatarStage)} level={user.level} size={150} />

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <p className="font-display text-xl font-bold" style={{ color: meta.tier.color }}>
                {meta.name}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Stade {meta.stage} / {AVATAR_STAGE_COUNT} — {meta.tier.name}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <LevelBadge level={user.level} size="xl" />
              <XPBar
                current={user.currentXP}
                required={xpRequiredForLevel(user.level)}
                level={user.level}
                className="max-w-xs flex-1"
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
