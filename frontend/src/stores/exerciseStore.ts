import { create } from 'zustand';
import type { Exercise, Category, Equipment, Level } from '@/types';

const API = '/api/v1/exercises';

export interface ExerciseFilters {
  categories: Category[];
  equipments: Equipment[];
  levels: Level[];
  search: string;
}

interface ExerciseState {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  filters: ExerciseFilters;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  fetchExercises: () => Promise<void>;
  fetchExercise: (id: string) => Promise<void>;
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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  selectedExercise: null,
  filters: { ...defaultFilters },
  isLoading: false,
  isDetailLoading: false,
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

  fetchExercise: async (id) => {
    set({ isDetailLoading: true, error: null });
    try {
      const { exercise } = await apiFetch<{ exercise: Exercise }>(`${API}/${id}`);
      set({ selectedExercise: exercise, isDetailLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isDetailLoading: false });
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
