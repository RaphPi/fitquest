import { create } from 'zustand';

interface GamificationState {
  level: number;
  totalXP: number;
  currentXP: number;
  xpBalance: number;
  streak: number;
  setStats: (stats: Partial<Omit<GamificationState, 'setStats'>>) => void;
}

// XP, niveaux, badges ajoutés au Sprint 7.
// Courbe (7A) : xpRequired = 10·level² + 90·level (cf. lib/xp.ts).
export const useGamificationStore = create<GamificationState>((set) => ({
  level: 1,
  totalXP: 0,
  currentXP: 0,
  xpBalance: 0,
  streak: 0,
  setStats: (stats) => set(stats),
}));
