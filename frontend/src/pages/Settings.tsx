import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Plus, Lock, LogOut, Mail } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
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

const THEME_LIST: { id: ThemeId; label: string }[] = [
  { id: 'void_rpg', label: 'Void RPG' },
  { id: 'forest_warrior', label: 'Forest Warrior' },
  { id: 'solar_blaze', label: 'Solar Blaze' },
];

const BOSS_KEYS = Object.keys(BOSSES) as BossKey[];
const WEAPON_KEYS = Object.keys(WEAPONS) as WeaponKey[];

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

/** Carte de section avec titre en en-tête. */
function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Sous-label à l'intérieur d'une SectionCard. */
function SubLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground',
        className,
      )}
    >
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    theme, setTheme, boss, weapon, setBoss, setWeapon,
    soundEnabled, setSoundEnabled, autoAdvanceRest, setAutoAdvanceRest,
  } = useSettingsStore();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="mt-1 text-muted-foreground">Personnalise ton expérience de combat.</p>
      </div>

      {/* ── Apparence ─────────────────────────────────────────────────── */}
      <SectionCard title="Apparence">
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
      </SectionCard>

      {/* ── Combat ───────────────────────────────────────────────────── */}
      <SectionCard title="Combat" hint="Réglages du mode séance actif.">
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

        {/* Toggles son + enchaînement */}
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
      <SectionCard title="Compte">
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
    </section>
  );
}
