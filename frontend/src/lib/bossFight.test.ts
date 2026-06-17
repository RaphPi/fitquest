/// <reference types="vitest/globals" />
import { effortPoints, bossMaxHp, bossTitle } from './bossFight';
import type { ActiveExercise } from '@/types';

function ex(
  category: ActiveExercise['category'],
  type: ActiveExercise['type'],
  sets: number,
  target: number,
): ActiveExercise {
  return {
    sessionExerciseId: '1',
    exerciseId: 'ex1',
    name: 'Test',
    category,
    type,
    sets,
    target,
    restBetweenSetsSeconds: 60,
    restAfterExerciseSeconds: 90,
  };
}

describe('effortPoints', () => {
  it('reps : valeur = points', () => {
    expect(effortPoints('reps', 10)).toBe(10);
  });
  it('duration : 45s / SECONDS_PER_POINT(3) → 15 pts', () => {
    expect(effortPoints('duration', 45)).toBe(15);
  });
  it('reps zéro → 0', () => {
    expect(effortPoints('reps', 0)).toBe(0);
  });
  it('duration zéro → minimum 1', () => {
    expect(effortPoints('duration', 0)).toBe(1);
  });
});

describe('bossMaxHp', () => {
  it('séance vide → 0', () => {
    expect(bossMaxHp([])).toBe(0);
  });
  it('séance mixte reps + durée → somme correcte', () => {
    // 3 séries × 10 reps = 30 pts  +  2 séries × 15 pts (45s/3) = 30 pts  → 60
    const exercises: ActiveExercise[] = [
      ex('push', 'reps', 3, 10),
      ex('core', 'duration', 2, 45),
    ];
    expect(bossMaxHp(exercises)).toBe(60);
  });
});

describe('bossTitle', () => {
  it('catégorie push dominante → Colosse du Push', () => {
    const exercises: ActiveExercise[] = [
      ex('push', 'reps', 3, 10),
      ex('push', 'reps', 3, 8),
      ex('legs', 'reps', 3, 12),
    ];
    expect(bossTitle(exercises)).toBe('Colosse du Push');
  });
  it('catégorie legs dominante → Béhémoth des Jambes', () => {
    const exercises: ActiveExercise[] = [
      ex('legs', 'reps', 4, 12),
      ex('legs', 'reps', 3, 10),
      ex('core', 'duration', 2, 30),
    ];
    expect(bossTitle(exercises)).toBe('Béhémoth des Jambes');
  });
});
