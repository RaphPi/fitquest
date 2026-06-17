/// <reference types="vitest/globals" />
import { xpRequiredForLevel, levelProgressPct } from './xp';

describe('xpRequiredForLevel', () => {
  it('L1 = 100', () => {
    expect(xpRequiredForLevel(1)).toBe(100);
  });
  it('L10 = 1900', () => {
    expect(xpRequiredForLevel(10)).toBe(1900);
  });
  it('L50 = 29500', () => {
    expect(xpRequiredForLevel(50)).toBe(29500);
  });
});

describe('levelProgressPct', () => {
  it('0 XP → 0 %', () => {
    expect(levelProgressPct(0, 1)).toBe(0);
  });
  it('50 XP au niveau 1 → 50 %', () => {
    expect(levelProgressPct(50, 1)).toBe(50);
  });
  it('100 XP au niveau 1 → 100 %', () => {
    expect(levelProgressPct(100, 1)).toBe(100);
  });
  it('150 XP au niveau 1 → clippé à 100 %', () => {
    expect(levelProgressPct(150, 1)).toBe(100);
  });
});
