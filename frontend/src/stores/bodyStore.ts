import { create } from 'zustand';
import type { BadgeDef, BodyMetric, BodyPhoto, MetricPayload } from '@/types';
import { useBadgeStore } from '@/stores/badgeStore';

const API = '/api/v1/body';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

interface BodyState {
  metrics: BodyMetric[];
  isLoading: boolean;
  error: string | null;

  photos: BodyPhoto[];
  photosLoading: boolean;

  fetchMetrics: () => Promise<void>;
  addMetric: (payload: MetricPayload) => Promise<void>;
  updateMetric: (id: string, payload: MetricPayload) => Promise<void>;
  deleteMetric: (id: string) => Promise<void>;

  fetchPhotos: () => Promise<void>;
  addPhoto: (file: File, type: string, note: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

export const useBodyStore = create<BodyState>((set) => ({
  metrics: [],
  isLoading: false,
  error: null,

  photos: [],
  photosLoading: false,

  fetchMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const { metrics } = await apiFetch<{ metrics: BodyMetric[] }>(`${API}/metrics`);
      set({ metrics, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  addMetric: async (payload) => {
    const { metric, newBadges } = await apiFetch<{ metric: BodyMetric; newBadges: BadgeDef[] }>(
      `${API}/metrics`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    set((s) => ({ metrics: [metric, ...s.metrics] }));
    if (newBadges?.length) useBadgeStore.getState().enqueueUnlocks(newBadges);
  },

  updateMetric: async (id, payload) => {
    const { metric } = await apiFetch<{ metric: BodyMetric }>(
      `${API}/metrics/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    set((s) => ({ metrics: s.metrics.map((m) => (m.id === id ? metric : m)) }));
  },

  deleteMetric: async (id) => {
    await apiFetch<void>(`${API}/metrics/${id}`, { method: 'DELETE' });
    set((s) => ({ metrics: s.metrics.filter((m) => m.id !== id) }));
  },

  fetchPhotos: async () => {
    set({ photosLoading: true });
    try {
      const { photos } = await apiFetch<{ photos: BodyPhoto[] }>(`${API}/photos`);
      set({ photos, photosLoading: false });
    } catch {
      set({ photosLoading: false });
    }
  },

  addPhoto: async (file, type, note) => {
    const form = new FormData();
    form.append('photo', file);
    form.append('type', type);
    if (note.trim()) form.append('note', note.trim());
    const { photo, newBadges } = await apiFetch<{ photo: BodyPhoto; newBadges: BadgeDef[] }>(
      `${API}/photos`,
      { method: 'POST', body: form },
    );
    set((s) => ({ photos: [photo, ...s.photos] }));
    if (newBadges?.length) useBadgeStore.getState().enqueueUnlocks(newBadges);
  },

  deletePhoto: async (id) => {
    await apiFetch<void>(`${API}/photos/${id}`, { method: 'DELETE' });
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
  },
}));
