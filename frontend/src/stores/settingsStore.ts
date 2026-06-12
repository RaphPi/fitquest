import { create } from 'zustand';
import { applyTheme } from '@/lib/theme';
import type { Lang, ThemeId } from '@/types';

interface SettingsState {
  theme: ThemeId;
  lang: Lang;
  setTheme: (theme: ThemeId) => void;
  setLang: (lang: Lang) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'void_rpg',
  lang: 'fr',
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  setLang: (lang) => set({ lang }),
}));
