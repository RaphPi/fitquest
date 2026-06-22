/**
 * Indice de Forme FitQuest — moteur de calcul pur (zéro dépendance React).
 *
 * Dégradation gracieuse : on calcule selon les données disponibles, on ne
 * fabrique jamais de donnée manquante (un champ non calculable reste `null`).
 *   - poids + taille + %MG → mode 'full'   (FFMI, masse maigre/grasse)
 *   - poids + taille       → mode 'imc'    (IMC + WHtR si tour de taille)
 *   - poids seul           → mode 'weight' (évolution du poids)
 *   - aucun poids          → mode null
 *
 * L'indice n'est JAMAIS stocké : on recalcule à l'affichage à partir des
 * ingrédients historisés (poids + %MG sur BodyMetric, taille sur User).
 */

export type FitnessMode = 'full' | 'imc' | 'weight' | null;

export interface FitnessIndexResult {
  mode: FitnessMode;
  /** FFMI brut = masse maigre / taille² (poids + taille + %MG requis). */
  ffmi: number | null;
  /** FFMI normalisé à 1,80 m = FFMI + 6,1×(1,8 − taille_m). */
  ffmiNorm: number | null;
  /** Masse maigre en kg = poids×(1−%MG/100). */
  leanMass: number | null;
  /** Masse grasse en kg = poids×(%MG/100). */
  fatMass: number | null;
  /** IMC = poids / taille² (poids + taille requis). */
  imc: number | null;
  /** Waist-to-Height Ratio = tour de taille / taille (mêmes unités). */
  whtr: number | null;
}

/** Arrondi à `decimals` décimales, en préservant `null`. */
function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function computeFitnessIndex(
  weight: number | null,
  heightCm: number | null,
  bodyFatPct: number | null,
  waistCm?: number | null,
): FitnessIndexResult {
  const empty: FitnessIndexResult = {
    mode: null,
    ffmi: null,
    ffmiNorm: null,
    leanMass: null,
    fatMass: null,
    imc: null,
    whtr: null,
  };

  // Sans poids, rien à calculer.
  if (weight == null) return empty;

  const result: FitnessIndexResult = { ...empty };

  const hasHeight = heightCm != null && heightCm > 0;
  const heightM = hasHeight ? heightCm! / 100 : null;

  // WHtR : indépendant du mode, dispo dès qu'on a tour de taille + taille.
  if (waistCm != null && hasHeight) {
    result.whtr = round(waistCm / heightCm!, 2);
  }

  // Poids seul : pas de taille → on s'arrête au mode 'weight'.
  if (!hasHeight || heightM == null) {
    result.mode = 'weight';
    return result;
  }

  // À partir d'ici la taille est connue → IMC calculable.
  result.imc = round(weight / (heightM * heightM), 1);

  // %MG absent → mode 'imc'.
  if (bodyFatPct == null) {
    result.mode = 'imc';
    return result;
  }

  // Données complètes → mode 'full' (composition corporelle + FFMI).
  const leanMass = weight * (1 - bodyFatPct / 100);
  const fatMass = weight * (bodyFatPct / 100);
  const ffmi = leanMass / (heightM * heightM);
  const ffmiNorm = ffmi + 6.1 * (1.8 - heightM);

  result.mode = 'full';
  result.leanMass = round(leanMass, 1);
  result.fatMass = round(fatMass, 1);
  result.ffmi = round(ffmi, 1);
  result.ffmiNorm = round(ffmiNorm, 1);
  return result;
}
