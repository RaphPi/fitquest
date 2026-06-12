import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
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

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme, boss, weapon, setBoss, setWeapon } = useSettingsStore();

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="mt-1 text-muted-foreground">Thème, langue, IA & notifications — Sprint 9.</p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Thème
        </h2>
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
      </div>

      <div>
        <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Adversaire
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Le boss que tu affrontes pendant tes séances.
        </p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
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
              <PixelCanvas
                className="h-20"
                render={(c) => renderBoss(c, key, 1, 5)}
                deps={[key]}
              />
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {BOSSES[key].name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Arme
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Ton arme de prédilection (le bouclier reste constant).
        </p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
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
                <PixelCanvas
                  render={(c) => drawSprite(c, WEAPONS[key].sprite, 6)}
                  deps={[key]}
                />
              </div>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {WEAPONS[key].name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
