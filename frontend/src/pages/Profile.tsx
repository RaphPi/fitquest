import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, FileDown, Loader2, Ruler, Target } from 'lucide-react';
import { GOALS } from '@/lib/goals';
import type { Goal } from '@/lib/goals';
import NumberStepper from '@/components/ui/NumberStepper';
import { useUserStore } from '@/stores/userStore';
import { getLevelTier, nextTierLevel } from '@/lib/levelTier';
import { getAvatarStageMeta, getAvatarStage, avatarClassFromStage, AVATAR_CLASSES, AVATAR_STAGE_COUNT } from '@/lib/avatar';
import { renderAvatarSprite } from '@/lib/avatarSprites';
import { renderBadgeIcon } from '@/lib/badgeIcons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { xpRequiredForLevel } from '@/lib/xp';
import { cn } from '@/lib/utils';
import LevelBadge from '@/components/ui/LevelBadge';
import XPBar from '@/components/ui/XPBar';
import Avatar from '@/components/avatar/Avatar';
import BadgeSummaryTile from '@/components/badge/BadgeSummaryTile';

function HeightSection() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>(user?.heightCm ?? 175);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const unchanged = value === user.heightCm;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ heightCm: value });
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
        <div className="flex items-center gap-3">
          <Ruler className="h-4 w-4 text-primary" />
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              {t('profile.height.title')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user.heightCm != null
                ? t('profile.height.current', { value: user.heightCm })
                : t('profile.height.notSet')}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="flex items-center gap-4">
            <NumberStepper
              value={value}
              onChange={setValue}
              step={1}
              min={50}
              max={300}
              suffix="cm"
              variant="primary"
              directEdit
            />
            <div className="flex items-center gap-3">
              {success && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="h-3.5 w-3.5" /> {t('profile.height.saved')}
                </span>
              )}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || unchanged}
                className="rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
              >
                {saving ? t('profile.height.saving') : t('profile.height.save')}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('profile.height.hint')}</p>
        </div>
      )}
    </div>
  );
}

function GoalSection() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(user?.primaryGoal ?? null);
  const [note, setNote] = useState<string>(user?.goalNote ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const unchanged = goal === (user.primaryGoal ?? null) && note === (user.goalNote ?? '');

  function handleChip(g: Goal) {
    setGoal((prev) => (prev === g ? null : g));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ primaryGoal: goal, goalNote: note || null });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const currentLabel = user.primaryGoal
    ? t(`goals.${user.primaryGoal}`)
    : t('profile.goal.notSet');

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-card-shield/30"
      >
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4 text-primary" />
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              {t('profile.goal.title')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{currentLabel}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => {
              const selected = goal === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleChip(g)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {t(`goals.${g}`)}
                </button>
              );
            })}
          </div>

          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              placeholder={t('profile.goal.notePlaceholder')}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {t('profile.goal.noteCount', { count: note.length })}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            {success && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="h-3.5 w-3.5" /> {t('profile.goal.saved')}
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || unchanged}
              className="rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
            >
              {saving ? t('profile.goal.saving') : t('profile.goal.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

/** Bouton d'export de la fiche de personnage en PDF.
 *  L'avatar pixel art est rendu hors-écran en PNG puis envoyé au backend
 *  (qui génère le PDF via Puppeteer) pour un rendu fidèle au jeu. */
// Options d'export persistées en localStorage (défaut : évolution + trophées ON, photos OFF).
const PDF_OPT_KEYS = {
  evolution: 'fq_pdf_evolution',
  photos: 'fq_pdf_photos',
  badges: 'fq_pdf_badges',
} as const;

function readOpt(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key);
  return v === null ? fallback : v === '1';
}

function ExportSheetButton() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const theme = useSettingsStore((s) => s.theme);
  const badges = useBadgeStore((s) => s.badges);
  const fetchBadges = useBadgeStore((s) => s.fetchBadges);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(false);
  const [includeEvolution, setIncludeEvolution] = useState(() => readOpt(PDF_OPT_KEYS.evolution, true));
  const [includePhotos, setIncludePhotos] = useState(() => readOpt(PDF_OPT_KEYS.photos, false));
  const [includeBadges, setIncludeBadges] = useState(() => readOpt(PDF_OPT_KEYS.badges, true));

  if (!user) return null;

  function toggle(key: string, value: boolean, setter: (v: boolean) => void) {
    localStorage.setItem(key, value ? '1' : '0');
    setter(value);
  }

  async function handleExport() {
    if (!user || exporting) return;
    setExporting(true);
    setError(false);
    try {
      // Rendu hors-écran de l'avatar (scale élevé = net à l'impression).
      const canvas = document.createElement('canvas');
      renderAvatarSprite(canvas, {
        classKey: avatarClassFromStage(user.avatarStage),
        stage: getAvatarStage(user.level),
        tier: getLevelTier(user.level),
        scale: 14,
        bare: false,
      });
      const avatarPng = canvas.toDataURL('image/png');

      // Icônes de trophées obtenus → PNG pixel art, indexées par "iconType__rarity"
      // (clé reconstruite côté backend pour chaque UserBadge). Inutile si trophées exclus.
      const iconMap: Record<string, string> = {};
      if (includeBadges) {
        let badgeList = badges;
        if (badgeList.length === 0) {
          await fetchBadges();
          badgeList = useBadgeStore.getState().badges;
        }
        for (const b of badgeList) {
          if (!b.obtained) continue;
          const key = `${b.iconType}__${b.rarity}`;
          if (iconMap[key]) continue;
          const c = document.createElement('canvas');
          renderBadgeIcon(c, b.iconType, b.rarity, 6, false);
          iconMap[key] = c.toDataURL('image/png');
        }
      }

      const res = await fetch('/api/v1/profile/pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarPng, themeId: theme, iconMap,
          includeEvolution, includePhotos, includeBadges,
        }),
      });
      if (!res.ok) throw new Error('export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitquest-fiche-${user.username}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setExporting(false);
    }
  }

  const checkbox = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-primary"
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">
            {t('profile.exportSheet.title')}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {error ? t('profile.exportSheet.error') : t('profile.exportSheet.hint')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-40"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {exporting ? t('profile.exportSheet.generating') : t('profile.exportSheet.button')}
        </button>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3">
        {checkbox(t('profile.exportSheet.optEvolution'), includeEvolution,
          (v) => toggle(PDF_OPT_KEYS.evolution, v, setIncludeEvolution))}
        {checkbox(t('profile.exportSheet.optPhotos'), includePhotos,
          (v) => toggle(PDF_OPT_KEYS.photos, v, setIncludePhotos))}
        {checkbox(t('profile.exportSheet.optBadges'), includeBadges,
          (v) => toggle(PDF_OPT_KEYS.badges, v, setIncludeBadges))}
      </div>
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

      <ExportSheetButton />

      <HeightSection />

      <GoalSection />

      <AvatarPicker />

      <BadgeSummaryTile />
    </section>
  );
}
