import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Ruler, Target, User } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { GOALS } from '@/lib/goals';
import type { Goal } from '@/lib/goals';
import { AVATAR_CLASSES } from '@/lib/avatar';
import NumberStepper from '@/components/ui/NumberStepper';
import Avatar from '@/components/avatar/Avatar';
import { cn } from '@/lib/utils';

const LS_PREFIX = 'fq_onboarding_done';
const TOTAL_STEPS = 3;

// Clé par utilisateur : un nouveau compte revoit l'onboarding même si un autre
// compte l'a déjà complété dans le même navigateur (localStorage est partagé).
function lsKey(userId: string): string {
  return `${LS_PREFIX}:${userId}`;
}

function shouldShow(user: { id: string; heightCm?: number | null; primaryGoal?: string | null } | null): boolean {
  if (!user) return false;
  if (localStorage.getItem(lsKey(user.id))) return false;
  return user.heightCm == null && user.primaryGoal == null;
}

function dismiss(userId: string) {
  localStorage.setItem(lsKey(userId), '1');
}

// Progress dots
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="block h-1.5 rounded-full transition-all duration-200"
          style={{
            width: i + 1 === current ? '1.5rem' : '0.375rem',
            background: i + 1 <= current ? 'var(--accent-soft)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingModal() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [height, setHeight] = useState(170);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [avatarStage, setAvatarStage] = useState(0);
  const [saving, setSaving] = useState(false);

  // Initialise l'état local dès que l'utilisateur est hydraté
  useEffect(() => {
    if (!user) return;
    setAvatarStage(user.avatarStage ?? 0);
    if (shouldShow(user)) setOpen(true);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function handleSkip() {
    if (user) dismiss(user.id);
    setOpen(false);
  }

  async function handleNext() {
    if (saving) return;
    setSaving(true);
    try {
      if (step === 1) {
        await updateProfile({ heightCm: height });
        setStep(2);
      } else if (step === 2) {
        await updateProfile({ primaryGoal: goal });
        setStep(3);
      } else {
        await updateProfile({ avatarStage });
        if (user) dismiss(user.id);
        setOpen(false);
      }
    } catch {
      // fire-and-forget : avancer quand même
      if (step < TOTAL_STEPS) setStep((s) => s + 1);
      else { if (user) dismiss(user.id); setOpen(false); }
    } finally {
      setSaving(false);
    }
  }

  const stepLabel = [
    { icon: Ruler, key: 'height' },
    { icon: Target, key: 'goal' },
    { icon: User, key: 'avatar' },
  ][step - 1];

  const StepIcon = stepLabel.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <StepIcon className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              {t(`onboarding.${stepLabel.key}.title`)}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {t(`onboarding.${stepLabel.key}.subtitle`)}
          </p>
          <StepDots current={step} total={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-3">
              <NumberStepper
                value={height}
                onChange={setHeight}
                step={1}
                min={50}
                max={300}
                suffix="cm"
                variant="primary"
                directEdit
              />
              <p className="text-xs text-muted-foreground">{t('onboarding.height.hint')}</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal((prev) => (prev === g ? null : g))}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                      goal === g
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    )}
                  >
                    {t(`goals.${g}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('onboarding.goal.hint')}</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_CLASSES.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatarStage(av.id)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200"
                    style={{
                      borderColor: avatarStage === av.id ? 'var(--accent-soft)' : 'var(--border)',
                      background: 'var(--bg-shield)',
                      boxShadow: avatarStage === av.id
                        ? '0 0 16px color-mix(in srgb, var(--accent-soft) 35%, transparent)'
                        : undefined,
                      transform: avatarStage === av.id ? 'scale(1.06)' : undefined,
                    }}
                  >
                    <Avatar
                      classKey={av.key}
                      level={1}
                      bare
                      size={36}
                      style={{
                        filter: avatarStage === av.id ? 'none' : 'grayscale(0.7) brightness(0.7)',
                        opacity: avatarStage === av.id ? 1 : 0.65,
                        transition: 'filter .2s, opacity .2s',
                      }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: avatarStage === av.id ? 'var(--accent-soft)' : 'var(--text-secondary)' }}
                    >
                      {i18n.language === 'en' ? av.labelEn : av.labelFr}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('onboarding.avatar.hint')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            {t('onboarding.skip')}
          </button>

          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
          >
            {saving ? (
              t('onboarding.saving')
            ) : step < TOTAL_STEPS ? (
              t('onboarding.next')
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                {t('onboarding.finish')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
