import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { getLevelTier, nextTierLevel } from '@/lib/levelTier';
import { getAvatarStageMeta, avatarClassFromStage, AVATAR_CLASSES, AVATAR_STAGE_COUNT } from '@/lib/avatar';
import { xpRequiredForLevel } from '@/lib/xp';
import { cn } from '@/lib/utils';
import LevelBadge from '@/components/ui/LevelBadge';
import XPBar from '@/components/ui/XPBar';
import Avatar from '@/components/avatar/Avatar';
import BadgeSummaryTile from '@/components/badge/BadgeSummaryTile';

function AvatarPicker() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number>(user?.avatarStage ?? 0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const unchanged = selected === user.avatarStage;

  async function handleSave() {
    if (unchanged || saving) return;
    setSaving(true);
    try {
      await updateProfile({ avatarStage: selected });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-card-shield/30"
      >
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">
            {t('profile.avatarPicker.title')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('profile.avatarPicker.currentClass', {
              class: AVATAR_CLASSES.find((a) => a.id === user.avatarStage)?.labelFr ?? '—',
            })}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border p-5">
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_CLASSES.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelected(av.id)}
                className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200"
                style={{
                  borderColor: selected === av.id ? 'var(--accent-soft)' : 'var(--border)',
                  background: 'var(--bg-shield)',
                  boxShadow: selected === av.id
                    ? '0 0 20px color-mix(in srgb, var(--accent-soft) 38%, transparent)'
                    : undefined,
                  transform: selected === av.id ? 'scale(1.06)' : undefined,
                }}
              >
                <Avatar
                  classKey={av.key}
                  level={1}
                  bare
                  size={40}
                  className="drop-shadow-lg"
                  style={{
                    filter: selected === av.id ? 'none' : 'grayscale(0.7) brightness(0.7)',
                    opacity: selected === av.id ? 1 : 0.65,
                    transition: 'filter .2s, opacity .2s',
                  }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: selected === av.id ? 'var(--accent-soft)' : 'var(--text-secondary)' }}
                >
                  {av.labelFr}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            {success && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="h-3.5 w-3.5" /> {t('profile.avatarPicker.saved')}
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={unchanged || saving}
              className="rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
            >
              {saving ? t('profile.avatarPicker.saving') : t('profile.avatarPicker.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);

  const meta = user ? getAvatarStageMeta(user.level) : null;
  const nextLevel = user ? nextTierLevel(user.level) : null;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('profile.title')}</h1>
        {user && (
          <p className="mt-1 text-muted-foreground">
            <span className="font-semibold text-primary-soft">{user.username}</span> —{' '}
            <span style={{ color: getLevelTier(user.level).color }}>{getLevelTier(user.level).name}</span>
          </p>
        )}
      </div>

      {user && meta && (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:gap-8 sm:p-6">
          <div className="shrink-0 sm:hidden">
            <Avatar classKey={avatarClassFromStage(user.avatarStage)} level={user.level} size={80} />
          </div>
          <div className="hidden shrink-0 sm:block">
            <Avatar classKey={avatarClassFromStage(user.avatarStage)} level={user.level} size={150} />
          </div>

          <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
            <div>
              <p className="font-display text-xl font-bold" style={{ color: meta.tier.color }}>
                {meta.name}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t('profile.stage', { stage: meta.stage, total: AVATAR_STAGE_COUNT, tier: meta.tier.name })}
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
                ? t('profile.nextStage', { level: nextLevel })
                : t('profile.ultimateStage')}
            </p>
          </div>
        </div>
      )}

      <AvatarPicker />

      <BadgeSummaryTile />
    </section>
  );
}
