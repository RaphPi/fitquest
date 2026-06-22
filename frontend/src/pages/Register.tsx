import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/userStore';
import { AVATAR_CLASSES } from '@/lib/avatar';
import Avatar from '@/components/avatar/Avatar';

const LEVELS = [
  { value: 'novice', labelKey: 'auth.register.step2.levels.novice', descKey: 'auth.register.step2.levels.noviceDesc' },
  { value: 'warrior', labelKey: 'auth.register.step2.levels.warrior', descKey: 'auth.register.step2.levels.warriorDesc' },
  { value: 'fighter', labelKey: 'auth.register.step2.levels.fighter', descKey: 'auth.register.step2.levels.fighterDesc' },
];

/* ── Password strength ──────────────────────────────────────── */
function passwordStrength(pw: string): { score: number; labelKey: string; color: string } {
  if (pw.length === 0) return { score: 0, labelKey: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, labelKey: 'auth.register.strength.weak', color: '#ef4444' };
  if (s <= 3) return { score: s, labelKey: 'auth.register.strength.medium', color: '#f59e0b' };
  return { score: s, labelKey: 'auth.register.strength.strong', color: '#22c55e' };
}

/* ── Step indicator ─────────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === current ? 24 : 8,
            background: i <= current ? 'var(--accent)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Shared input class ─────────────────────────────────────── */
const inputCls =
  'w-full rounded-lg border border-border bg-card-shield px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary';

/* ── Shared back button class ───────────────────────────────── */
const backCls =
  'flex-1 rounded-lg border border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition';

/* ── Shared continue button class ───────────────────────────── */
const continueCls =
  'flex-1 rounded-lg bg-primary py-3 font-display text-sm font-bold uppercase tracking-widest text-white hover:bg-primary/90 transition';

/* ── Main component ─────────────────────────────────────────── */
export default function Register() {
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useUserStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [avatarStage, setAvatarStage] = useState(0);
  const [_level, setLevel] = useState('novice');
  const [password, setPassword] = useState('');

  const strength = passwordStrength(password);

  function next() {
    clearError();
    setStep((s) => s + 1);
  }
  function back() {
    clearError();
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    clearError();
    try {
      await register({
        username,
        password,
        avatarStage,
      });
      setFinishing(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch {
      // error shown via store
    }
  }

  /* ── Finishing animation ───────────────────────────────────── */
  if (finishing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-primary-soft">
            {t('auth.register.finishing')}
          </p>
          <p className="mt-2 text-sm text-primary">{t('app.tagline')}</p>
        </div>
      </div>
    );
  }

  /* ── Shared wrapper ────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-thin tracking-[0.3em] text-white">
          FIT<span className="font-black text-primary-soft">QUEST</span>
        </h1>
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <StepDots current={step} total={4} />
          <span className="text-xs text-muted-foreground">
            {t('auth.register.step', { current: step + 1, total: 4 })}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {/* ── Step 0 : Username ─────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-foreground">
              {t('auth.register.step0.title')}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('auth.register.step0.subtitle')}</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
              placeholder={t('auth.register.step0.placeholder')}
              className={inputCls}
              style={{
                boxShadow: username.length >= 3 ? '0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent)' : undefined,
              }}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{username.length}/20</p>
            <button
              onClick={next}
              disabled={username.length < 3}
              className="mt-6 w-full rounded-lg bg-primary py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
            >
              {t('auth.register.continue')}
            </button>
          </div>
        )}

        {/* ── Step 1 : Avatar ───────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-foreground">
              {t('auth.register.step1.title')}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('auth.register.step1.subtitle')}</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_CLASSES.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarStage(av.id)}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200"
                  style={{
                    borderColor: avatarStage === av.id ? 'var(--accent-soft)' : 'var(--border)',
                    background: 'var(--bg-shield)',
                    boxShadow: avatarStage === av.id
                      ? '0 0 20px color-mix(in srgb, var(--accent-soft) 38%, transparent)'
                      : undefined,
                    transform: avatarStage === av.id ? 'scale(1.06)' : undefined,
                  }}
                >
                  <Avatar
                    classKey={av.key}
                    level={1}
                    bare
                    size={40}
                    className="drop-shadow-lg"
                    style={{
                      filter: avatarStage === av.id ? 'none' : 'grayscale(0.7) brightness(0.7)',
                      opacity: avatarStage === av.id ? 1 : 0.65,
                      transition: 'filter .2s, opacity .2s',
                    }}
                  />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: avatarStage === av.id ? 'var(--accent-soft)' : 'var(--text-secondary)' }}
                  >
                    {av.labelFr}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={back} className={backCls}>{t('auth.register.back')}</button>
              <button onClick={next} className={continueCls}>{t('auth.register.continue')}</button>
            </div>
          </div>
        )}

        {/* ── Step 2 : Level ────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-foreground">
              {t('auth.register.step2.title')}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('auth.register.step2.subtitle')}</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className="w-full rounded-xl border-2 p-4 text-left transition"
                  style={{
                    borderColor: _level === l.value ? 'var(--accent)' : 'var(--border)',
                    background: _level === l.value ? 'var(--bg-shield)' : 'transparent',
                    boxShadow: _level === l.value
                      ? '0 0 16px color-mix(in srgb, var(--accent) 25%, transparent)'
                      : undefined,
                  }}
                >
                  <p
                    className="font-display font-bold"
                    style={{ color: _level === l.value ? 'var(--accent-soft)' : 'var(--text-primary)' }}
                  >
                    {t(l.labelKey)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t(l.descKey)}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={back} className={backCls}>{t('auth.register.back')}</button>
              <button onClick={next} className={continueCls}>{t('auth.register.continue')}</button>
            </div>
          </div>
        )}

        {/* ── Step 3 : Password + email ─────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-foreground">
              {t('auth.register.step3.title')}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">{t('auth.register.step3.subtitle')}</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {t('auth.register.step3.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder={t('auth.register.step3.passwordPlaceholder')}
                  className={inputCls}
                />
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : 'var(--border)' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.labelKey && t(strength.labelKey)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={back} className={backCls}>{t('auth.register.back')}</button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || password.length < 8}
                className="flex-1 rounded-lg bg-primary py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
              >
                {isLoading ? t('auth.register.step3.submitting') : t('auth.register.step3.submit')}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {t('auth.register.alreadyAccount')}{' '}
        <a href="/login" className="text-primary-soft hover:underline">
          {t('auth.register.login')}
        </a>
      </p>
    </div>
  );
}
