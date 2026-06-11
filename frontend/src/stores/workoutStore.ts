import { create } from 'zustand';
import type { WorkoutSession } from '@/types';

interface WorkoutState {
  activeSession: WorkoutSession | null;
  currentExerciseIndex: number;
  startSession: (session: WorkoutSession) => void;
  endSession: () => void;
}

// Mode séance guidée/libre ajouté au Sprint 6.
export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: null,
  currentExerciseIndex: 0,
  startSession: (session) => set({ activeSession: session, currentExerciseIndex: 0 }),
  endSession: () => set({ activeSession: null, currentExerciseIndex: 0 }),
}));
