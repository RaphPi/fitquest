import { create } from 'zustand';
import { applyTheme } from '@/lib/theme';
import type { Lang, ThemeId } from '@/types';
import type { BossKey, WeaponKey } from '@/lib/pixelSprites';

const BOSS_KEY = 'fq_boss';
const WEAPON_KEY = 'fq_weapon';
const SOUND_KEY = 'fq_sound';
const AUTO_REST_KEY = 'fq_autorest';

function readBoss(): BossKey {
  const v = localStorage.getItem(BOSS_KEY);
  return v === 'golem' || v === 'demon' || v === 'spectre' ? v : 'golem';
}

function readWeapon(): WeaponKey {
  const v = localStorage.getItem(WEAPON_KEY);
  return v === 'epee' || v === 'hache' || v === 'lance' ? v : 'epee';
}

/** Lit un booléen persisté ; absent → valeur par défaut. */
function readBool(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key);
  return v === null ? fallback : v === '1';
}

interface SettingsState {
  theme: ThemeId;
  lang: Lang;
  boss: BossKey;
  weapon: WeaponKey;
  /** Sons de l'app (fanfares de combat) activés. */
  soundEnabled: boolean;
  /** Le repos enchaîne automatiquement sur la série suivante à la fin du décompte. */
  autoAdvanceRest: boolean;
  setTheme: (theme: ThemeId) => void;
  setLang: (lang: Lang) => void;
  setBoss: (boss: BossKey) => void;
  setWeapon: (weapon: WeaponKey) => void;
  setSoundEnabled: (on: boolean) => void;
  setAutoAdvanceRest: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'void_rpg',
  lang: 'fr',
  boss: readBoss(),
  weapon: readWeapon(),
  soundEnabled: readBool(SOUND_KEY, true),
  autoAdvanceRest: readBool(AUTO_REST_KEY, true),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  setLang: (lang) => set({ lang }),
  setBoss: (boss) => {
    localStorage.setItem(BOSS_KEY, boss);
    set({ boss });
  },
  setWeapon: (weapon) => {
    localStorage.setItem(WEAPON_KEY, weapon);
    set({ weapon });
  },
  setSoundEnabled: (on) => {
    localStorage.setItem(SOUND_KEY, on ? '1' : '0');
    set({ soundEnabled: on });
  },
  setAutoAdvanceRest: (on) => {
    localStorage.setItem(AUTO_REST_KEY, on ? '1' : '0');
    set({ autoAdvanceRest: on });
  },
}));
