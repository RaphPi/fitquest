import type { ThemeId } from '@/types';

export interface ThemeTokens {
  bgMain: string;
  bgCard: string;
  bgShield: string;
  border: string;
  accent: string;
  accentSoft: string;
  xp: string;
  success: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  void_rpg: {
    bgMain: '#0a0a0f',
    bgCard: '#0f1117',
    bgShield: '#0d0b1e',
    border: '#1e2030',
    accent: '#6366f1',
    accentSoft: '#a78bfa',
    xp: '#f59e0b',
    success: '#22c55e',
    danger: '#ef4444',
    textPrimary: '#f1f5f9',
    textSecondary: '#64748b',
  },
  forest_warrior: {
    bgMain: '#0d1f0f',
    bgCard: '#10260f',
    bgShield: '#0a1a0a',
    border: '#1a3020',
    accent: '#22c55e',
    accentSoft: '#4ade80',
    xp: '#f59e0b',
    success: '#22c55e',
    danger: '#ef4444',
    textPrimary: '#f1f5f9',
    textSecondary: '#64748b',
  },
  solar_blaze: {
    bgMain: '#1a0f00',
    bgCard: '#241608',
    bgShield: '#140b00',
    border: '#2e1f00',
    accent: '#f59e0b',
    accentSoft: '#fbbf24',
    xp: '#f59e0b',
    success: '#22c55e',
    danger: '#ef4444',
    textPrimary: '#f1f5f9',
    textSecondary: '#64748b',
  },
};

export function applyTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = themeId;
  const tokens = THEMES[themeId];
  const root = document.documentElement.style;
  root.setProperty('--bg-main', tokens.bgMain);
  root.setProperty('--bg-card', tokens.bgCard);
  root.setProperty('--bg-shield', tokens.bgShield);
  root.setProperty('--border', tokens.border);
  root.setProperty('--accent', tokens.accent);
  root.setProperty('--accent-soft', tokens.accentSoft);
  root.setProperty('--xp', tokens.xp);
  root.setProperty('--success', tokens.success);
  root.setProperty('--danger', tokens.danger);
  root.setProperty('--text-primary', tokens.textPrimary);
  root.setProperty('--text-secondary', tokens.textSecondary);
}
