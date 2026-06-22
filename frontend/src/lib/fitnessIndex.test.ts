/// <reference types="vitest/globals" />
import { computeFitnessIndex } from './fitnessIndex';

describe('computeFitnessIndex — mode full', () => {
  it('80 kg, 180 cm, 15 % MG', () => {
    const r = computeFitnessIndex(80, 180, 15);
    expect(r.mode).toBe('full');
    expect(r.leanMass).toBe(68); // 80×0.85
    expect(r.fatMass).toBe(12); // 80×0.15
    expect(r.imc).toBe(24.7); // 80/1.8²
    expect(r.ffmi).toBe(21); // 68/3.24
    // taille = 1,80 m → la normalisation ne change rien.
    expect(r.ffmiNorm).toBe(21);
    expect(r.whtr).toBeNull();
  });

  it('normalisation FFMI quand taille ≠ 1,80 m', () => {
    const r = computeFitnessIndex(70, 170, 12);
    expect(r.mode).toBe('full');
    expect(r.ffmi).toBe(21.3); // 61.6/2.89
    // 21.314 + 6.1×(1.8−1.7) = 21.924
    expect(r.ffmiNorm).toBe(21.9);
  });
});

describe('computeFitnessIndex — mode imc', () => {
  it('poids + taille, sans %MG', () => {
    const r = computeFitnessIndex(80, 180, null);
    expect(r.mode).toBe('imc');
    expect(r.imc).toBe(24.7);
    expect(r.ffmi).toBeNull();
    expect(r.ffmiNorm).toBeNull();
    expect(r.leanMass).toBeNull();
    expect(r.fatMass).toBeNull();
  });
});

describe('computeFitnessIndex — mode weight', () => {
  it('poids seul (taille null)', () => {
    const r = computeFitnessIndex(80, null, 15);
    expect(r.mode).toBe('weight');
    expect(r.imc).toBeNull();
    expect(r.ffmi).toBeNull();
    expect(r.leanMass).toBeNull();
    expect(r.fatMass).toBeNull();
    expect(r.whtr).toBeNull();
  });
});

describe('computeFitnessIndex — cas null', () => {
  it('tout null → mode null, tous champs null', () => {
    const r = computeFitnessIndex(null, null, null);
    expect(r.mode).toBeNull();
    expect(r.ffmi).toBeNull();
    expect(r.ffmiNorm).toBeNull();
    expect(r.leanMass).toBeNull();
    expect(r.fatMass).toBeNull();
    expect(r.imc).toBeNull();
    expect(r.whtr).toBeNull();
  });
});

describe('computeFitnessIndex — WHtR', () => {
  it('présent quand tour de taille + taille', () => {
    const r = computeFitnessIndex(80, 180, 15, 85);
    expect(r.whtr).toBe(0.47); // 85/180
    expect(r.mode).toBe('full'); // WHtR n'altère pas le mode
  });

  it('absent sans taille même avec tour de taille', () => {
    const r = computeFitnessIndex(80, null, null, 85);
    expect(r.whtr).toBeNull();
    expect(r.mode).toBe('weight');
  });

  it('disponible aussi en mode imc', () => {
    const r = computeFitnessIndex(80, 180, null, 90);
    expect(r.mode).toBe('imc');
    expect(r.whtr).toBe(0.5); // 90/180
  });
});
