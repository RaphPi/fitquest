import { create } from 'zustand';
import type { BadgeDef, BadgeState as Badge } from '@/types';

const API = '/api/v1/badges';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

interface BadgeStoreState {
  badges: Badge[];
  isLoading: boolean;
  error: string | null;
  /** File des badges fraîchement débloqués hors séance (ex. création de programme),
   *  consommée par l'overlay global monté dans AppLayout. */
  unlockQueue: BadgeDef[];

  fetchBadges: () => Promise<void>;
  /** Empile des déblocages à animer (déclenché par les `newBadges` d'une API hors séance). */
  enqueueUnlocks: (badges: BadgeDef[]) => void;
  clearQueue: () => void;
}

export const useBadgeStore = create<BadgeStoreState>((set) => ({
  badges: [],
  isLoading: false,
  error: null,
  unlockQueue: [],

  fetchBadges: async () => {
    set({ isLoading: true, error: null });
    try {
      const { badges } = await apiFetch<{ badges: Badge[] }>(API);
      set({ badges, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  enqueueUnlocks: (badges) => {
    if (badges.length === 0) return;
    set((s) => ({ unlockQueue: [...s.unlockQueue, ...badges] }));
  },

  clearQueue: () => set({ unlockQueue: [] }),
}));
