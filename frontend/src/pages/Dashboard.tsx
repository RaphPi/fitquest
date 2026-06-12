import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/userStore';
import { Flame, Zap, Trophy, Calendar } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import XPBar from '@/components/ui/XPBar';

function xpRequired(level: number) {
  return level * 150;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useUserStore();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('dashboard.title')}</h1>
        {user && (
          <p className="mt-1 text-muted-foreground">
            {t('dashboard.welcome')}, <span className="text-primary-soft font-semibold">{user.username}</span>
          </p>
        )}
      </div>

      {user && (
        <>
          <XPBar
            current={user.currentXP}
            required={xpRequired(user.level)}
            level={user.level}
            className="max-w-sm"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Flame} value={user.streak} label="Streak" accent />
            <StatCard icon={Zap} value={user.totalXP} label="XP total" />
            <StatCard icon={Trophy} value={user.level} label="Niveau" />
            <StatCard icon={Calendar} value="—" label="Séances" />
          </div>
        </>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Sprint 3 — Design system en place. Streak animé, prochaine séance et feed arrivent au Sprint 8.
        </p>
      </div>
    </section>
  );
}
