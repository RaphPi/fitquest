import { create } from 'zustand';
import type { Exercise, Category, Equipment, Level } from '@/types';

const API = '/api/v1/exercises';

export interface ExerciseFilters {
  categories: Category[];
  equipments: Equipment[];
  levels: Level[];
  search: string;
}

export type ExerciseFormData = Omit<Exercise, 'id' | 'imageUrl' | 'imageAiGen'>;

export interface ExercisePR {
  maxReps: number | null;
  maxWeightKg: number | null;
}

interface ExerciseState {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  prs: Record<string, ExercisePR>;
  filters: ExerciseFilters;
  isLoading: boolean;
  isDetailLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchExercises: () => Promise<void>;
  fetchPrs: () => Promise<void>;
  fetchExercise: (id: string) => Promise<void>;
  createExercise: (data: ExerciseFormData) => Promise<Exercise>;
  updateExercise: (id: string, data: Partial<ExerciseFormData>) => Promise<Exercise>;
  deleteExercise: (id: string) => Promise<void>;
  setFilter: <K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) => void;
  toggleFilterItem: <K extends 'categories' | 'equipments' | 'levels'>(
    key: K,
    value: ExerciseFilters[K][number],
  ) => void;
  clearFilters: () => void;
  clearSelected: () => void;
  filteredExercises: () => Exercise[];
}

const defaultFilters: ExerciseFilters = {
  categories: [],
  equipments: [],
  levels: [],
  search: '',
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  selectedExercise: null,
  prs: {},
  filters: { ...defaultFilters },
  isLoading: false,
  isDetailLoading: false,
  isSaving: false,
  error: null,

  fetchExercises: async () => {
    set({ isLoading: true, error: null });
    try {
      const { exercises } = await apiFetch<{ exercises: Exercise[] }>(API);
      set({ exercises, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  fetchPrs: async () => {
    try {
      const { prs } = await apiFetch<{ prs: Record<string, ExercisePR> }>(`${API}/prs`);
      set({ prs });
    } catch {
      // Les PR sont un enrichissement non-bloquant : on n'expose pas l'erreur.
    }
  },

  fetchExercise: async (id) => {
    set({ isDetailLoading: true, error: null });
    try {
      const { exercise } = await apiFetch<{ exercise: Exercise }>(`${API}/${id}`);
      set({ selectedExercise: exercise, isDetailLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isDetailLoading: false });
    }
  },

  createExercise: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const { exercise } = await apiFetch<{ exercise: Exercise }>(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      set((s) => ({ exercises: [...s.exercises, exercise].sort((a, b) => a.nameFr.localeCompare(b.nameFr)), isSaving: false }));
      return exercise;
    } catch (e) {
      set({ isSaving: false, error: (e as Error).message });
      throw e;
    }
  },

  updateExercise: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const { exercise } = await apiFetch<{ exercise: Exercise }>(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      set((s) => ({
        exercises: s.exercises.map((ex) => (ex.id === id ? exercise : ex)).sort((a, b) => a.nameFr.localeCompare(b.nameFr)),
        selectedExercise: s.selectedExercise?.id === id ? exercise : s.selectedExercise,
        isSaving: false,
      }));
      return exercise;
    } catch (e) {
      set({ isSaving: false, error: (e as Error).message });
      throw e;
    }
  },

  deleteExercise: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await apiFetch<undefined>(`${API}/${id}`, { method: 'DELETE' });
      set((s) => ({
        exercises: s.exercises.filter((ex) => ex.id !== id),
        selectedExercise: s.selectedExercise?.id === id ? null : s.selectedExercise,
        isSaving: false,
      }));
    } catch (e) {
      set({ isSaving: false, error: (e as Error).message });
      throw e;
    }
  },

  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),

  toggleFilterItem: (key, value) =>
    set((s) => {
      const current = s.filters[key] as string[];
      const next = current.includes(value as string)
        ? current.filter((v) => v !== value)
        : [...current, value as string];
      return { filters: { ...s.filters, [key]: next } };
    }),

  clearFilters: () => set({ filters: { ...defaultFilters } }),

  clearSelected: () => set({ selectedExercise: null }),

  filteredExercises: () => {
    const { exercises, filters } = get();
    return exercises.filter((ex) => {
      if (filters.categories.length && !filters.categories.includes(ex.category)) return false;
      if (filters.equipments.length && !filters.equipments.includes(ex.equipment)) return false;
      if (filters.levels.length && !filters.levels.includes(ex.level)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!ex.nameFr.toLowerCase().includes(q) && !ex.nameEn.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },
}));
