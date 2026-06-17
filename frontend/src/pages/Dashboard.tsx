import { useTranslation } from 'react-i18next';
import { xpRequiredForLevel } from '@/lib/xp';
import { avatarClassFromStage, getAvatarStageMeta } from '@/lib/avatar';
import { useUserStore } from '@/stores/userStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Flame, Zap, Trophy, Calendar } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import XPBar from '@/components/ui/XPBar';
import Avatar from '@/components/avatar/Avatar';
import WorkoutHistory from '@/components/workout/WorkoutHistory';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const history = useWorkoutStore((s) => s.history);

  return (
    <section className="space-y-6">
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
          <h1 className="font-display text-2xl font-bold">{t('dashboard.title')}</h1>
          {user && (
            <p className="mt-1 text-muted-foreground">
              {t('dashboard.welcome')}, <span className="text-primary-soft font-semibold">{user.username}</span>
              {' · '}
              <span style={{ color: getAvatarStageMeta(user.level).tier.color }}>
                {getAvatarStageMeta(user.level).name}
              </span>
            </p>
          )}
        </div>
      </div>

      {user && (
        <>
          <XPBar
            current={user.currentXP}
            required={xpRequiredForLevel(user.level)}
            level={user.level}
            className="max-w-sm"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Flame} value={user.streak} label="Streak" accent={user.streak > 0} />
            <StatCard icon={Zap} value={user.totalXP} label="XP total" />
            <StatCard icon={Trophy} value={user.level} label="Niveau" />
            <StatCard icon={Calendar} value={history.length} label="Séances" />
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Activité récente
        </h2>
        <WorkoutHistory limit={5} />
      </div>
    </section>
  );
}
