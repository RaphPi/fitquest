import { create } from 'zustand';
import type { Program, WorkoutSession } from '@/types';

const API = '/api/v1/programs';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export type ProgramFormData = {
  nameFr: string;
  nameEn: string;
  descFr?: string;
  descEn?: string;
  level: string;
  daysPerWeek: number;
  durationWeeks?: number | null;
  equipment: string[];
};

export type SessionExerciseInput = {
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number | null;
  durationSeconds?: number | null;
  restBetweenSetsSeconds: number;
  restAfterExerciseSeconds: number;
};

export type SessionFormData = {
  nameFr: string;
  nameEn: string;
  order: number;
  exercises: SessionExerciseInput[];
};

interface ProgramState {
  programs: Program[];
  selectedProgram: Program | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchPrograms: () => Promise<void>;
  fetchProgram: (id: string) => Promise<void>;
  createProgram: (data: ProgramFormData) => Promise<Program>;
  updateProgram: (id: string, data: Partial<ProgramFormData>) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;
  createSession: (programId: string, data: SessionFormData) => Promise<WorkoutSession>;
  updateSession: (programId: string, sessionId: string, data: Partial<SessionFormData>) => Promise<WorkoutSession>;
  deleteSession: (programId: string, sessionId: string) => Promise<void>;
  clearSelected: () => void;
  setError: (msg: string | null) => void;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  selectedProgram: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchPrograms: async () => {
    set({ isLoading: true, error: null });
    try {
      const { programs } = await apiFetch<{ programs: Program[] }>(API);
      set({ programs, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  fetchProgram: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { program } = await apiFetch<{ program: Program }>(`${API}/${id}`);
      set({ selectedProgram: program, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  createProgram: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const { program } = await apiFetch<{ program: Program }>(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      set((s) => ({ programs: [...s.programs, program], isSaving: false }));
      return program;
    } catch (e) {
      set({ isSaving: false, error: (e as Error).message });
      throw e;
    }
  },

  updateProgram: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const { program } = await apiFetch<{ program: Program }>(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      set((s) => ({
        programs: s.programs.map((p) => (p.id === id ? program : p)),
        selectedProgram: s.selectedProgram?.id === id ? program : s.selectedProgram,
        isSaving: false,
      }));
      return program;
    } catch (e) {
      set({ isSaving: false, error: (e as Error).message });
      throw e;
    }
  },

  deleteProgram: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await apiFetch<undefined>(`${API}/${id}`, { method: 'DELETE' });
      set((s) => ({
        programs: s.programs.filter((p) => p.id !== id),
        selectedProgram: s.selectedProgram?.id === id ? null : s.selectedProgram,
        isSaving: false,
      }));
    } catch (e) {
      set({ isSaving: false, error: (e as Error).message });
      throw e;
    }
  },

  createSession: async (programId, data) => {
    const { session } = await apiFetch<{ session: WorkoutSession }>(`${API}/${programId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // Refresh selectedProgram if it matches
    const sel = get().selectedProgram;
    if (sel?.id === programId) {
      set((s) => ({
        selectedProgram: s.selectedProgram
          ? { ...s.selectedProgram, sessions: [...s.selectedProgram.sessions, session] }
          : null,
      }));
    }
    return session;
  },

  updateSession: async (programId, sessionId, data) => {
    const { session } = await apiFetch<{ session: WorkoutSession }>(
      `${API}/${programId}/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    const sel = get().selectedProgram;
    if (sel?.id === programId) {
      set((s) => ({
        selectedProgram: s.selectedProgram
          ? {
              ...s.selectedProgram,
              sessions: s.selectedProgram.sessions.map((ses) => (ses.id === sessionId ? session : ses)),
            }
          : null,
      }));
    }
    return session;
  },

  deleteSession: async (programId, sessionId) => {
    await apiFetch<undefined>(`${API}/${programId}/sessions/${sessionId}`, { method: 'DELETE' });
    const sel = get().selectedProgram;
    if (sel?.id === programId) {
      set((s) => ({
        selectedProgram: s.selectedProgram
          ? {
              ...s.selectedProgram,
              sessions: s.selectedProgram.sessions.filter((ses) => ses.id !== sessionId),
            }
          : null,
      }));
    }
  },

  clearSelected: () => set({ selectedProgram: null }),
  setError: (msg) => set({ error: msg }),
}));
