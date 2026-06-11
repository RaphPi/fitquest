import { create } from 'zustand';
import type { Lang, ThemeId } from '@/types';

interface SettingsState {
  theme: ThemeId;
  lang: Lang;
  setTheme: (theme: ThemeId) => void;
  setLang: (lang: Lang) => void;
}

// Applique le thème au <html data-theme="…">.
function applyTheme(theme: ThemeId): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
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
