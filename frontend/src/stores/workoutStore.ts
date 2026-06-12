import { create } from 'zustand';
import type {
  ActiveExercise,
  CompletedSetRecord,
  WorkoutLog,
  WorkoutResult,
} from '@/types';
import { bossMaxHp, bossTitle, effortPoints } from '@/lib/bossFight';
import { useUserStore } from '@/stores/userStore';

const API = '/api/v1/workouts';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export type FightPhase = 'fight' | 'rest' | 'pause' | 'done';
export type RestKind = 'transition' | 'repos';

export interface ActiveSessionData {
  programId: string;
  sessionId: string;
  sessionName: string;
  exercises: ActiveExercise[];
  bossTitle: string;
}

interface WorkoutState {
  session: ActiveSessionData | null;
  phase: FightPhase;
  restKind: RestKind;
  exerciseIndex: number;
  setIndex: number;
  bossMaxHp: number;
  bossHp: number;
  completed: CompletedSetRecord[];
  startedAt: number;
  pausedMs: number;
  pauseStartedAt: number | null;
  result: WorkoutResult | null;
  isSubmitting: boolean;
  error: string | null;

  history: WorkoutLog[];
  isLoadingHistory: boolean;

  start: (data: ActiveSessionData) => void;
  /** Enregistre une série réalisée (reps réalisées ou secondes tenues). */
  recordSet: (value: number) => { damage: number; done: boolean };
  /** Passe l'exercice courant (séries restantes non réalisées = 0 dégât). */
  skipExercise: () => void;
  resumeFromRest: () => void;
  pause: () => void;
  resume: () => void;
  /** Termine la séance en cours (abandon) → phase 'done' (boss survit si PV > 0). */
  abandon: () => void;
  quit: () => void;
  submit: () => Promise<WorkoutResult | null>;
  elapsedSecs: () => number;
  fetchHistory: () => Promise<void>;
}

const initialFight = {
  phase: 'fight' as FightPhase,
  restKind: 'transition' as RestKind,
  exerciseIndex: 0,
  setIndex: 0,
  completed: [] as CompletedSetRecord[],
  pausedMs: 0,
  pauseStartedAt: null as number | null,
  result: null as WorkoutResult | null,
  error: null as string | null,
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  ...initialFight,
  bossMaxHp: 0,
  bossHp: 0,
  startedAt: 0,
  isSubmitting: false,
  history: [],
  isLoadingHistory: false,

  start: (data) => {
    const max = bossMaxHp(data.exercises);
    set({
      session: { ...data, bossTitle: data.bossTitle || bossTitle(data.exercises) },
      ...initialFight,
      bossMaxHp: max,
      bossHp: max,
      startedAt: Date.now(),
    });
  },

  recordSet: (value) => {
    const { session, exerciseIndex, setIndex, bossHp } = get();
    if (!session) return { damage: 0, done: false };
    const ex = session.exercises[exerciseIndex];
    const damage = effortPoints(ex.type, value);
    const record: CompletedSetRecord = {
      exerciseId: ex.exerciseId,
      exerciseName: ex.name,
      setNumber: setIndex + 1,
      reps: ex.type === 'reps' ? Math.round(value) : null,
      durationSecs: ex.type === 'duration' ? Math.round(value) : null,
    };
    const newHp = Math.max(0, bossHp - damage);

    const isLastSet = setIndex + 1 >= ex.sets;
    const isLastExercise = exerciseIndex + 1 >= session.exercises.length;
    const done = isLastSet && isLastExercise;

    if (done) {
      set((s) => ({ completed: [...s.completed, record], bossHp: newHp, phase: 'done' }));
    } else if (isLastSet) {
      set((s) => ({
        completed: [...s.completed, record],
        bossHp: newHp,
        exerciseIndex: s.exerciseIndex + 1,
        setIndex: 0,
        restKind: 'repos',
        phase: 'rest',
      }));
    } else {
      set((s) => ({
        completed: [...s.completed, record],
        bossHp: newHp,
        setIndex: s.setIndex + 1,
        restKind: 'transition',
        phase: 'rest',
      }));
    }
    return { damage, done };
  },

  skipExercise: () => {
    const { session, exerciseIndex } = get();
    if (!session) return;
    const isLastExercise = exerciseIndex + 1 >= session.exercises.length;
    if (isLastExercise) {
      set({ phase: 'done' });
    } else {
      set((s) => ({
        exerciseIndex: s.exerciseIndex + 1,
        setIndex: 0,
        restKind: 'repos',
        phase: 'rest',
      }));
    }
  },

  resumeFromRest: () => set({ phase: 'fight' }),

  pause: () => {
    if (get().phase === 'pause') return;
    set({ phase: 'pause', pauseStartedAt: Date.now() });
  },

  resume: () => {
    const { pauseStartedAt, pausedMs } = get();
    set({
      phase: 'fight',
      pausedMs: pausedMs + (pauseStartedAt ? Date.now() - pauseStartedAt : 0),
      pauseStartedAt: null,
    });
  },

  abandon: () => {
    const { pauseStartedAt, pausedMs } = get();
    set({
      phase: 'done',
      pausedMs: pausedMs + (pauseStartedAt ? Date.now() - pauseStartedAt : 0),
      pauseStartedAt: null,
    });
  },

  quit: () => set({ session: null, bossMaxHp: 0, bossHp: 0, startedAt: 0, ...initialFight }),

  elapsedSecs: () => {
    const { startedAt, pausedMs, pauseStartedAt, phase } = get();
    if (!startedAt) return 0;
    const ref = phase === 'pause' && pauseStartedAt ? pauseStartedAt : Date.now();
    return Math.max(0, Math.floor((ref - startedAt - pausedMs) / 1000));
  },

  submit: async () => {
    const { session, completed, isSubmitting } = get();
    if (!session || isSubmitting) return null;
    set({ isSubmitting: true, error: null });
    try {
      const durationSecs = get().elapsedSecs();
      const result = await apiFetch<WorkoutResult>(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          sessionName: session.sessionName,
          durationSecs,
          completedSets: completed,
        }),
      });
      useUserStore.getState().setUser(result.user);
      set((s) => ({ result, isSubmitting: false, history: [result.log, ...s.history] }));
      return result;
    } catch (e) {
      set({ isSubmitting: false, error: (e as Error).message });
      return null;
    }
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const { logs } = await apiFetch<{ logs: WorkoutLog[] }>(API);
      set({ history: logs, isLoadingHistory: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoadingHistory: false });
    }
  },
}));
