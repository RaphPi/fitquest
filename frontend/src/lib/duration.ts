import type { Program, WorkoutSession, SessionExercise } from '@/types';

const SECS_PER_REP = 3;

export function estimateExerciseSeconds(se: SessionExercise): number {
  const timePerSet =
    se.durationSeconds != null ? se.durationSeconds : (se.reps ?? 10) * SECS_PER_REP;
  const workTime = se.sets * timePerSet;
  const intraRest = (se.sets - 1) * se.restBetweenSetsSeconds;
  const transition = se.restAfterExerciseSeconds;
  return workTime + intraRest + transition;
}

export function estimateSessionMinutes(session: WorkoutSession): number {
  const secs = session.exercises.reduce((acc, se) => acc + estimateExerciseSeconds(se), 0);
  return Math.round(secs / 60);
}

export function estimateProgramMinutes(program: Program): number {
  if (program.sessions.length === 0) return 0;
  const total = program.sessions.reduce((acc, s) => acc + estimateSessionMinutes(s), 0);
  return Math.round(total / program.sessions.length);
}

export function countProgramSets(program: Program): number {
  return program.sessions.reduce(
    (acc, s) => acc + s.exercises.reduce((a, e) => a + e.sets, 0),
    0,
  );
}

export function countProgramExercises(program: Program): number {
  return program.sessions.reduce((acc, s) => acc + s.exercises.length, 0);
}
