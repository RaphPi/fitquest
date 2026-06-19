import { create } from 'zustand';
import type { UserProfile, RegisterPayload, LoginPayload } from '@/types';

const API = '/api/v1/auth';

interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { avatarStage?: number }) => Promise<void>;
  setUser: (user: UserProfile) => void;
  clearError: () => void;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: 'include', ...init });
  } catch {
    throw new Error('Impossible de contacter le serveur');
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Erreur serveur (${res.status})`);
  }
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const { user } = await apiFetch<{ user: UserProfile }>(`${API}/me`);
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await apiFetch<{ user: UserProfile }>(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      throw e;
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await apiFetch<{ user: UserProfile }>(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await apiFetch(`${API}/logout`, { method: 'POST' }).catch(() => null);
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const { user } = await apiFetch<{ user: UserProfile }>(`${API}/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    set({ user });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearError: () => set({ error: null }),
}));
