import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Server, Send, Check, Loader2,
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { DigestFrequency } from '@/types';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
        on ? 'border-primary bg-primary/30' : 'border-border bg-card',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all',
          on ? 'left-[26px] bg-primary' : 'left-0.5 bg-muted-foreground',
        )}
      />
    </button>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export default function EmailSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [form, setForm] = useState({
    email: '',
    emailDigest: 'NONE' as DigestFrequency,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (user && !initialized.current) {
      initialized.current = true;
      setForm({
        email: user.email ?? '',
        emailDigest: (user.emailDigest as DigestFrequency | null) ?? 'NONE',
        smtpHost: user.smtpHost ?? '',
        smtpPort: user.smtpPort ?? 587,
        smtpUser: user.smtpUser ?? '',
        smtpPass: '',
        smtpSecure: user.smtpSecure ?? false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        email: form.email || null,
        emailDigest: form.emailDigest,
        smtpHost: form.smtpHost || null,
        smtpPort: form.smtpPort || null,
        smtpUser: form.smtpUser || null,
        smtpSecure: form.smtpSecure,
      };
      if (form.smtpPass !== '') payload.smtpPass = form.smtpPass;
      await updateProfile(payload);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
    }
  };

  const handleTest = async () => {
    setTestState('sending');
    setTestError(null);
    try {
      const res = await fetch('/api/v1/digest/test', {
        method: 'POST',
        credentials: 'include',
      });
      const body = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setTestState('sent');
      setTimeout(() => setTestState('idle'), 4000);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Erreur inconnue');
      setTestState('error');
    }
  };

  const input =
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/60';

  return (
    <section className="space-y-6">
      {/* En-tête */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('settings.emailPage.backLink')}
        </button>
        <h1 className="font-display text-2xl font-bold">{t('settings.emailPage.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.emailPage.subtitle')}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        {/* Adresse email */}
        <div>
          <SubLabel>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              {t('settings.account.emailEdit')}
            </span>
          </SubLabel>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder={t('settings.account.emailPlaceholder')}
            className={input}
          />
        </div>

        {/* Fréquence */}
        <div>
          <SubLabel>{t('settings.account.digestFrequency')}</SubLabel>
          <p className="mb-2 text-xs text-muted-foreground">{t('settings.emailPage.frequencyHint')}</p>
          <div className="flex flex-wrap gap-2">
            {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map((freq) => {
              const labelKey = `settings.account.digest${freq.charAt(0)}${freq.slice(1).toLowerCase()}`;
              return (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, emailDigest: freq }))}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                    form.emailDigest === freq
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* SMTP */}
        <div>
          <SubLabel>
            <span className="inline-flex items-center gap-2">
              <Server className="h-3.5 w-3.5" />
              {t('settings.account.smtpTitle')}
            </span>
          </SubLabel>
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t('settings.account.smtpHost')}
                </label>
                <input
                  type="text"
                  value={form.smtpHost}
                  onChange={(e) => setForm((p) => ({ ...p, smtpHost: e.target.value }))}
                  placeholder={t('settings.account.smtpHostPlaceholder')}
                  className={input}
                />
              </div>
              <div className="w-20 shrink-0">
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t('settings.account.smtpPort')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={form.smtpPort}
                  onChange={(e) => setForm((p) => ({ ...p, smtpPort: parseInt(e.target.value) || 587 }))}
                  className={input}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                {t('settings.account.smtpUser')}
              </label>
              <input
                type="text"
                value={form.smtpUser}
                onChange={(e) => setForm((p) => ({ ...p, smtpUser: e.target.value }))}
                placeholder={t('settings.account.smtpUserPlaceholder')}
                className={input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                {t('settings.account.smtpPass')}
              </label>
              <input
                type="password"
                value={form.smtpPass}
                onChange={(e) => setForm((p) => ({ ...p, smtpPass: e.target.value }))}
                placeholder={user?.smtpPassSet ? t('settings.account.smtpPassPlaceholder') : undefined}
                className={input}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('settings.account.smtpSecure')}</span>
              <Toggle on={form.smtpSecure} onChange={(v) => setForm((p) => ({ ...p, smtpSecure: v }))} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState === 'saving'}
            className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none disabled:opacity-60"
          >
            {saveState === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveState === 'saved' && <Check className="h-4 w-4" />}
            {saveState === 'saving'
              ? t('settings.account.savingEmailSettings')
              : saveState === 'saved'
                ? t('settings.account.savedEmailSettings')
                : t('settings.account.saveEmailSettings')}
          </button>

          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={testState === 'sending'}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none disabled:opacity-60"
          >
            {testState === 'sending'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : testState === 'sent'
                ? <Check className="h-4 w-4 text-green-400" />
                : <Send className="h-4 w-4" />}
            {testState === 'sending'
              ? t('settings.account.testEmailSending')
              : testState === 'sent'
                ? t('settings.account.testEmailSent')
                : t('settings.account.testEmail')}
          </button>
        </div>

        {testState === 'error' && testError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {testError}
          </div>
        )}
        {saveState === 'error' && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {t('settings.account.saveEmailError')}
          </div>
        )}
      </div>
    </section>
  );
}
