// FitQuest 7E — Avatar évolutif.
// La CLASSE est choisie à l'inscription et stockée dans User.avatarStage (0..3).
// Le STADE d'évolution (1..5) est dérivé du niveau via les paliers de 7B
// (cf. lib/levelTier.ts) — aucun stockage dédié, jamais de désync.

import { getLevelTierIndex, getLevelTier, type LevelTier } from '@/lib/levelTier';

export type AvatarClassKey = 'warrior' | 'archer' | 'mage' | 'knight';

export const AVATAR_CLASSES: { id: number; key: AvatarClassKey; labelFr: string }[] = [
  { id: 0, key: 'warrior', labelFr: 'Guerrier' },
  { id: 1, key: 'archer', labelFr: 'Archer' },
  { id: 2, key: 'mage', labelFr: 'Mage' },
  { id: 3, key: 'knight', labelFr: 'Chevalier' },
];

/** Clé de classe à partir de la valeur stockée dans User.avatarStage. */
export function avatarClassFromStage(avatarStage: number): AvatarClassKey {
  return AVATAR_CLASSES[avatarStage]?.key ?? 'warrior';
}

export const AVATAR_STAGE_COUNT = 5;

// Noms RPG des stades d'évolution (alignés sur les paliers 7B).
export const AVATAR_STAGE_NAMES = [
  'Apprenti',   // Bronze
  'Aguerri',    // Argent
  'Vétéran',    // Or
  'Champion',   // Émeraude
  'Légende',    // Diamant
] as const;

/** Stade d'évolution (1..5) dérivé du niveau. */
export function getAvatarStage(level: number): number {
  return getLevelTierIndex(level) + 1;
}

/** Métadonnées du stade courant (nom RPG + palier/couleurs). */
export function getAvatarStageMeta(level: number): {
  stage: number;
  name: string;
  tier: LevelTier;
} {
  const idx = getLevelTierIndex(level);
  return {
    stage: idx + 1,
    name: AVATAR_STAGE_NAMES[idx],
    tier: getLevelTier(level),
  };
}
