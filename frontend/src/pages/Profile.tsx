import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/userStore';
import { getLevelTier } from '@/lib/levelTier';
import { xpRequiredForLevel } from '@/lib/xp';
import LevelBadge from '@/components/ui/LevelBadge';
import XPBar from '@/components/ui/XPBar';
import BadgeShowcase from '@/components/badge/BadgeShowcase';

export default function Profile() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);

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

      {user && (
        <div className="flex items-center gap-4">
          <LevelBadge level={user.level} size="lg" />
          <XPBar
            current={user.currentXP}
            required={xpRequiredForLevel(user.level)}
            level={user.level}
            className="max-w-sm flex-1"
          />
        </div>
      )}

      <BadgeShowcase />
    </section>
  );
}
