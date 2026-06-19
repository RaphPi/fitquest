import { create } from 'zustand';
import { applyTheme } from '@/lib/theme';
import type { Lang, ThemeId } from '@/types';
import type { BossKey, WeaponKey } from '@/lib/pixelSprites';

export type WidgetId = 'streak' | 'xp_remaining' | 'last_workout' | 'body_weight' | 'badge_progress';

const BOSS_KEY = 'fq_boss';
const WEAPON_KEY = 'fq_weapon';
const SOUND_KEY = 'fq_sound';
const AUTO_REST_KEY = 'fq_autorest';
const WIDGETS_KEY = 'fq_widgets';

const DEFAULT_WIDGETS: WidgetId[] = ['streak', 'xp_remaining'];
const ALL_WIDGET_IDS: WidgetId[] = ['streak', 'xp_remaining', 'last_workout', 'body_weight', 'badge_progress'];

function readWidgets(): WidgetId[] {
  try {
    const v = localStorage.getItem(WIDGETS_KEY);
    if (!v) return DEFAULT_WIDGETS;
    const parsed: unknown = JSON.parse(v);
    if (!Array.isArray(parsed)) return DEFAULT_WIDGETS;
    const valid = parsed.filter((x): x is WidgetId => ALL_WIDGET_IDS.includes(x as WidgetId));
    return valid.length > 0 ? valid.slice(0, 4) : DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

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
  soundEnabled: boolean;
  autoAdvanceRest: boolean;
  sidebarWidgets: WidgetId[];
  setTheme: (theme: ThemeId) => void;
  setLang: (lang: Lang) => void;
  setBoss: (boss: BossKey) => void;
  setWeapon: (weapon: WeaponKey) => void;
  setSoundEnabled: (on: boolean) => void;
  setAutoAdvanceRest: (on: boolean) => void;
  setSidebarWidgets: (widgets: WidgetId[]) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'void_rpg',
  lang: 'fr',
  boss: readBoss(),
  weapon: readWeapon(),
  soundEnabled: readBool(SOUND_KEY, true),
  autoAdvanceRest: readBool(AUTO_REST_KEY, true),
  sidebarWidgets: readWidgets(),
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
  setSidebarWidgets: (widgets) => {
    const clamped = widgets.slice(0, 4);
    localStorage.setItem(WIDGETS_KEY, JSON.stringify(clamped));
    set({ sidebarWidgets: clamped });
  },
}));
