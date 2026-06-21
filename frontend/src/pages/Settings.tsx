import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Plus, Lock, LogOut, Mail, ChevronDown, FileJson, Flame, Zap, Clock, Activity, Trophy, Check } from 'lucide-react';
import { useSettingsStore, type WidgetId } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { ThemeId } from '@/types';
import PixelCanvas from '@/components/workout/active/PixelCanvas';
import {
  BOSSES,
  WEAPONS,
  renderBoss,
  drawSprite,
  type BossKey,
  type WeaponKey,
} from '@/lib/pixelSprites';

const WIDGET_OPTIONS: {
  id: WidgetId;
  labelKey: string;
  descKey: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'streak',
    labelKey: 'settings.widgetLabels.streak',
    descKey: 'settings.widgetDescs.streak',
    icon: <Flame className="h-5 w-5" />,
    color: 'rgba(249,115,22,1)',
  },
  {
    id: 'xp_remaining',
    labelKey: 'settings.widgetLabels.xp_remaining',
    descKey: 'settings.widgetDescs.xp_remaining',
    icon: <Zap className="h-5 w-5" />,
    color: 'rgba(234,179,8,1)',
  },
  {
    id: 'last_workout',
    labelKey: 'settings.widgetLabels.last_workout',
    descKey: 'settings.widgetDescs.last_workout',
    icon: <Clock className="h-5 w-5" />,
    color: 'var(--text-secondary)',
  },
  {
    id: 'body_weight',
    labelKey: 'settings.widgetLabels.body_weight',
    descKey: 'settings.widgetDescs.body_weight',
    icon: <Activity className="h-5 w-5" />,
    color: 'rgba(34,211,238,1)',
  },
  {
    id: 'badge_progress',
    labelKey: 'settings.widgetLabels.badge_progress',
    descKey: 'settings.widgetDescs.badge_progress',
    icon: <Trophy className="h-5 w-5" />,
    color: 'rgba(99,102,241,1)',
  },
];

const THEME_LIST: { id: ThemeId; label: string }[] = [
  { id: 'void_rpg', label: 'Void RPG' },
  { id: 'forest_warrior', label: 'Forest Warrior' },
  { id: 'solar_blaze', label: 'Solar Blaze' },
];

const BOSS_KEYS = Object.keys(BOSSES) as BossKey[];
const WEAPON_KEYS = Object.keys(WEAPONS) as WeaponKey[];

type SectionId = 'apparence' | 'combat' | 'compte' | 'donnees';

/** Interrupteur on/off. */
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

/** Section accordéon — une seule ouverte à la fois. */
function SectionCard({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`section-${id}`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-card-shield/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
      >
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div id={`section-${id}`} className="border-t border-border p-5">
          {children}
        </div>
      )}
    </div>
  );
}

/** Sous-label à l'intérieur d'une section. */
function SubLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground', className)}>
      {children}
    </p>
  );
}

/** Tuile « ajouter un pack » (extension future : packs téléchargeables). */
function AddPackTile() {
  const { t } = useTranslation();
  return (
    <div
      className="flex cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-3 opacity-60"
      title={t('settings.appearance.addPackTitle')}
    >
      <div className="grid h-20 place-items-center">
        <div className="relative">
          <Plus className="h-7 w-7 text-muted-foreground" />
          <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <span className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t('settings.appearance.addPack')}<br />{t('settings.appearance.addPackSoon')}
      </span>
    </div>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState<SectionId | null>(null);

  const {
    theme, setTheme, boss, weapon, setBoss, setWeapon,
    soundEnabled, setSoundEnabled, autoAdvanceRest, setAutoAdvanceRest,
    sidebarWidgets, setSidebarWidgets,
  } = useSettingsStore();

  function toggleWidget(id: WidgetId) {
    if (sidebarWidgets.includes(id)) {
      setSidebarWidgets(sidebarWidgets.filter((w) => w !== id));
    } else if (sidebarWidgets.length < 2) {
      setSidebarWidgets([...sidebarWidgets, id]);
    }
  }
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const toggle = (id: SectionId) => setOpen((prev) => (prev === id ? null : id));

  const handleLang = (lang: string) => {
    void i18n.changeLanguage(lang);
    localStorage.setItem('fq_lang', lang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <section className="space-y-3">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold">{t('settings.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      {/* ── Apparence ─────────────────────────────────────────────────── */}
      <SectionCard
        id="apparence"
        title={t('settings.sections.appearance')}
        open={open === 'apparence'}
        onToggle={() => toggle('apparence')}
      >
        <SubLabel>{t('settings.appearance.theme')}</SubLabel>
        <div className="flex flex-wrap gap-3">
          {THEME_LIST.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={cn(
                'rounded-lg border px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                theme === th.id
                  ? 'border-primary text-primary shadow-glow'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {th.label}
            </button>
          ))}
        </div>

        <SubLabel className="mt-5">{t('settings.appearance.language')}</SubLabel>
        <div className="flex gap-3">
          {(['fr', 'en'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleLang(id)}
              className={cn(
                'rounded-lg border px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                i18n.language === id
                  ? 'border-primary text-primary shadow-glow'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {t(id === 'fr' ? 'settings.appearance.languageFr' : 'settings.appearance.languageEn')}
            </button>
          ))}
        </div>

        <SubLabel className="mt-5">
          {t('settings.appearance.widgets')}
          <span className="ml-1 normal-case font-normal text-muted-foreground/60">
            ({sidebarWidgets.length}/2)
          </span>
        </SubLabel>
        <p className="mb-3 text-xs text-muted-foreground">
          {t('settings.appearance.widgetsHint')}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {WIDGET_OPTIONS.map((w) => {
            const active = sidebarWidgets.includes(w.id);
            const maxed = !active && sidebarWidgets.length >= 2;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleWidget(w.id)}
                disabled={maxed}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                  active
                    ? 'border-primary bg-primary/10 shadow-glow'
                    : maxed
                      ? 'cursor-not-allowed border-border opacity-40'
                      : 'border-border hover:border-primary/40',
                )}
              >
                <div className="relative">
                  <span style={{ color: active ? w.color : 'var(--text-secondary)' }}>
                    {w.icon}
                  </span>
                  {active && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: active ? w.color : 'var(--text-secondary)' }}
                  >
                    {t(w.labelKey)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{t(w.descKey)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Combat ───────────────────────────────────────────────────── */}
      <SectionCard
        id="combat"
        title={t('settings.sections.combat')}
        hint={t('settings.sections.combatHint')}
        open={open === 'combat'}
        onToggle={() => toggle('combat')}
      >
        {/* Adversaire */}
        <SubLabel>{t('settings.combat.boss')}</SubLabel>
        <p className="mb-3 text-xs text-muted-foreground">{t('settings.combat.bossHint')}</p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-lg sm:grid-cols-4">
          {BOSS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBoss(key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                boss === key
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <PixelCanvas className="h-20" render={(c) => renderBoss(c, key, 1, 5)} deps={[key]} />
              <span className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {BOSSES[key].name}
              </span>
            </button>
          ))}
          <AddPackTile />
        </div>

        {/* Arme */}
        <SubLabel className="mt-6">{t('settings.combat.weapon')}</SubLabel>
        <p className="mb-3 text-xs text-muted-foreground">{t('settings.combat.weaponHint')}</p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-lg sm:grid-cols-4">
          {WEAPON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setWeapon(key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                weapon === key
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <div className="grid h-20 place-items-center">
                <PixelCanvas render={(c) => drawSprite(c, WEAPONS[key].sprite, 6)} deps={[key]} />
              </div>
              <span className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {WEAPONS[key].name}
              </span>
            </button>
          ))}
          <AddPackTile />
        </div>

        {/* Toggles */}
        <div className="mt-6 divide-y divide-border rounded-lg border border-border">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              {soundEnabled
                ? <Volume2 className="h-5 w-5 text-primary-soft" />
                : <VolumeX className="h-5 w-5 text-muted-foreground" />}
              <div>
                <div className="text-sm font-semibold text-foreground">{t('settings.combat.sound')}</div>
                <div className="text-xs text-muted-foreground">{t('settings.combat.soundHint')}</div>
              </div>
            </div>
            <Toggle on={soundEnabled} onChange={setSoundEnabled} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-semibold text-foreground">{t('settings.combat.autoAdvance')}</div>
              <div className="text-xs text-muted-foreground">
                {autoAdvanceRest
                  ? t('settings.combat.autoAdvanceOn')
                  : t('settings.combat.autoAdvanceOff')}
              </div>
            </div>
            <Toggle on={autoAdvanceRest} onChange={setAutoAdvanceRest} />
          </div>
        </div>
      </SectionCard>

      {/* ── Compte ───────────────────────────────────────────────────── */}
      <SectionCard
        id="compte"
        title={t('settings.sections.account')}
        open={open === 'compte'}
        onToggle={() => toggle('compte')}
      >
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold text-foreground">{t('settings.account.email')}</div>
              <div className="text-xs text-muted-foreground">{user?.email ?? '—'}</div>
            </div>
          </div>
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-label={t('settings.account.emailReadOnly')} />
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-2 text-sm font-semibold text-red-400 transition-colors hover:text-red-300 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
          >
            <LogOut className="h-4 w-4" />
            {t('settings.account.logout')}
          </button>
        </div>
      </SectionCard>

      {/* ── Données ──────────────────────────────────────────────────── */}
      <SectionCard
        id="donnees"
        title={t('settings.sections.data')}
        hint={t('settings.sections.dataHint')}
        open={open === 'donnees'}
        onToggle={() => toggle('donnees')}
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/import')}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-card-shield/40"
          >
            <FileJson className="h-5 w-5 shrink-0 text-primary-soft" />
            <div>
              <div className="text-sm font-semibold text-foreground">{t('settings.data.importJson')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.data.importJsonHint')}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/export')}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-card-shield/40"
          >
            <FileJson className="h-5 w-5 shrink-0 text-primary-soft" />
            <div>
              <div className="text-sm font-semibold text-foreground">{t('settings.data.exportJson')}</div>
              <div className="text-xs text-muted-foreground">{t('settings.data.exportJsonHint')}</div>
            </div>
          </button>
        </div>
      </SectionCard>
    </section>
  );
}
