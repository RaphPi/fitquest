import { create } from 'zustand';
import { applyTheme } from '@/lib/theme';
import type { Lang, ThemeId } from '@/types';
import type { BossKey, WeaponKey } from '@/lib/pixelSprites';

const BOSS_KEY = 'fq_boss';
const WEAPON_KEY = 'fq_weapon';

function readBoss(): BossKey {
  const v = localStorage.getItem(BOSS_KEY);
  return v === 'golem' || v === 'demon' || v === 'spectre' ? v : 'golem';
}

function readWeapon(): WeaponKey {
  const v = localStorage.getItem(WEAPON_KEY);
  return v === 'epee' || v === 'hache' || v === 'lance' ? v : 'epee';
}

interface SettingsState {
  theme: ThemeId;
  lang: Lang;
  boss: BossKey;
  weapon: WeaponKey;
  setTheme: (theme: ThemeId) => void;
  setLang: (lang: Lang) => void;
  setBoss: (boss: BossKey) => void;
  setWeapon: (weapon: WeaponKey) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'void_rpg',
  lang: 'fr',
  boss: readBoss(),
  weapon: readWeapon(),
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
}));
