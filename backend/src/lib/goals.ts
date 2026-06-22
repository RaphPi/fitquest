// Taxonomie des objectifs FitQuest — MÊME vocabulaire pour User.primaryGoal et Program.goals[].
// Source unique côté backend (réutilisée par auth.ts et programs.ts).
// Pas d'enum Prisma : validation applicative, cohérente avec `level` (String validé par Zod).
// Libellés i18n fr/en : côté frontend (étape 2 UI).
export const GOALS = [
  'prise_de_masse',
  'perte_de_gras',
  'force',
  'endurance',
  'forme_generale',
  'remise_en_forme',
] as const;

export type Goal = (typeof GOALS)[number];

export const isGoal = (v: unknown): v is Goal =>
  typeof v === 'string' && (GOALS as readonly string[]).includes(v);
