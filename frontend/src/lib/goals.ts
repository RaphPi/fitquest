export const GOALS = [
  'prise_de_masse',
  'perte_de_gras',
  'force',
  'endurance',
  'forme_generale',
  'remise_en_forme',
] as const;

export type Goal = (typeof GOALS)[number];
