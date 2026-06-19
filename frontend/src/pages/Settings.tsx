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
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'streak',
    label: 'Série',
    desc: 'Jours consécutifs',
    icon: <Flame className="h-5 w-5" />,
    color: 'rgba(249,115,22,1)',
  },
  {
    id: 'xp_remaining',
    label: 'XP restants',
    desc: 'Prochain niveau',
    icon: <Zap className="h-5 w-5" />,
    color: 'rgba(234,179,8,1)',
  },
  {
    id: 'last_workout',
    label: 'Dernière séance',
    desc: 'Jours depuis',
    icon: <Clock className="h-5 w-5" />,
    color: 'var(--text-secondary)',
  },
  {
    id: 'body_weight',
    label: 'Poids',
    desc: 'Dernière mesure',
    icon: <Activity className="h-5 w-5" />,
    color: 'rgba(34,211,238,1)',
  },
  {
    id: 'badge_progress',
    label: 'Badge',
    desc: 'Prochain trophée',
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
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-card-shield/30"
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
  return (
    <div
      className="flex cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-3 opacity-60"
      title="Packs téléchargeables — bientôt disponible"
    >
      <div className="grid h-20 place-items-center">
        <div className="relative">
          <Plus className="h-7 w-7 text-muted-foreground" />
          <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <span className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Ajouter un pack<br />(bientôt)
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
        <h1 className="font-display text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="mt-1 text-muted-foreground">Personnalise ton expérience de combat.</p>
      </div>

      {/* ── Apparence ─────────────────────────────────────────────────── */}
      <SectionCard
        id="apparence"
        title="Apparence"
        open={open === 'apparence'}
        onToggle={() => toggle('apparence')}
      >
        <SubLabel>Thème</SubLabel>
        <div className="flex flex-wrap gap-3">
          {THEME_LIST.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={cn(
                'rounded-lg border px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all',
                theme === th.id
                  ? 'border-primary text-primary shadow-glow'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {th.label}
            </button>
          ))}
        </div>

        <SubLabel className="mt-5">Langue</SubLabel>
        <div className="flex gap-3">
          {([{ id: 'fr', label: 'Français' }, { id: 'en', label: 'English' }] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleLang(id)}
              className={cn(
                'rounded-lg border px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all',
                i18n.language === id
                  ? 'border-primary text-primary shadow-glow'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <SubLabel className="mt-5">
          Widgets sidebar
          <span className="ml-1 normal-case font-normal text-muted-foreground/60">
            ({sidebarWidgets.length}/2)
          </span>
        </SubLabel>
        <p className="mb-3 text-xs text-muted-foreground">
          Informations affichées dans la barre latérale. Max 2.
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
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200',
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
                    {w.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{w.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Combat ───────────────────────────────────────────────────── */}
      <SectionCard
        id="combat"
        title="Combat"
        hint="Réglages du mode séance actif."
        open={open === 'combat'}
        onToggle={() => toggle('combat')}
      >
        {/* Adversaire */}
        <SubLabel>Adversaire</SubLabel>
        <p className="mb-3 text-xs text-muted-foreground">Le boss que tu affrontes pendant tes séances.</p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-lg sm:grid-cols-4">
          {BOSS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBoss(key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                boss === key
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <PixelCanvas className="h-20" render={(c) => renderBoss(c, key, 1, 5)} deps={[key]} />
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {BOSSES[key].name}
              </span>
            </button>
          ))}
          <AddPackTile />
        </div>

        {/* Arme */}
        <SubLabel className="mt-6">Arme</SubLabel>
        <p className="mb-3 text-xs text-muted-foreground">Ton arme de prédilection (le bouclier reste constant).</p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-lg sm:grid-cols-4">
          {WEAPON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setWeapon(key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                weapon === key
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <div className="grid h-20 place-items-center">
                <PixelCanvas render={(c) => drawSprite(c, WEAPONS[key].sprite, 6)} deps={[key]} />
              </div>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
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
                <div className="text-sm font-semibold text-foreground">Sons de l'application</div>
                <div className="text-xs text-muted-foreground">Fanfares de victoire, montée de niveau, reprise.</div>
              </div>
            </div>
            <Toggle on={soundEnabled} onChange={setSoundEnabled} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Enchaîner après le repos</div>
              <div className="text-xs text-muted-foreground">
                {autoAdvanceRest
                  ? 'La série suivante démarre automatiquement à la fin du repos.'
                  : 'Le repos attend que tu appuies sur « Reprendre ».'}
              </div>
            </div>
            <Toggle on={autoAdvanceRest} onChange={setAutoAdvanceRest} />
          </div>
        </div>
      </SectionCard>

      {/* ── Compte ───────────────────────────────────────────────────── */}
      <SectionCard
        id="compte"
        title="Compte"
        open={open === 'compte'}
        onToggle={() => toggle('compte')}
      >
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold text-foreground">Adresse e-mail</div>
              <div className="text-xs text-muted-foreground">{user?.email ?? '—'}</div>
            </div>
          </div>
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Lecture seule" />
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-2 text-sm font-semibold text-red-400 transition-colors hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </SectionCard>

      {/* ── Données ──────────────────────────────────────────────────── */}
      <SectionCard
        id="donnees"
        title="Données"
        hint="Import de contenu externe."
        open={open === 'donnees'}
        onToggle={() => toggle('donnees')}
      >
        <button
          type="button"
          onClick={() => navigate('/import')}
          className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-card-shield/40"
        >
          <FileJson className="h-5 w-5 shrink-0 text-primary-soft" />
          <div>
            <div className="text-sm font-semibold text-foreground">Import JSON</div>
            <div className="text-xs text-muted-foreground">
              Importe exercices &amp; programmes depuis un fichier lfy_import.json.
            </div>
          </div>
        </button>
      </SectionCard>
    </section>
  );
}
