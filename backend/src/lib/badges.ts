// FitQuest — catalogue de badges + moteur de détection (Sprint 7C).
//
// SOURCE DE VÉRITÉ du catalogue : la const BADGES ci-dessous.
// Le seed (prisma/seed.ts) peuple la table Badge à partir d'elle ; la détection
// évalue les conditions à partir d'elle. Pas de duplication ailleurs.

import { prisma } from './prisma';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BadgeConditionType =
  | 'session_count' // ≥ threshold séances valides (xpEarned > 0)
  | 'streak' // streak ≥ threshold jours consécutifs
  | 'perfect_week' // ≥ 5 séances valides sur les 7 derniers jours glissants
  | 'level' // niveau ≥ threshold
  | 'first_custom_program'; // ≥ 1 programme custom créé

export type BadgeCategory = 'sessions' | 'streak' | 'level' | 'program';

export interface BadgeDef {
  id: string;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  rarity: BadgeRarity;
  iconType: string;
  category: BadgeCategory;
  conditionType: BadgeConditionType;
  threshold: number | null;
  order: number;
}

/** Catalogue figé du Sprint 7C — 11 badges. */
export const BADGES: BadgeDef[] = [
  {
    id: 'first_step',
    nameFr: 'Premier pas',
    nameEn: 'First Step',
    descFr: 'Termine ta toute première séance.',
    descEn: 'Complete your very first workout.',
    rarity: 'common',
    iconType: 'boots',
    category: 'sessions',
    conditionType: 'session_count',
    threshold: 1,
    order: 10,
  },
  {
    id: 'regular_10',
    nameFr: 'Habitué',
    nameEn: 'Regular',
    descFr: 'Termine 10 séances.',
    descEn: 'Complete 10 workouts.',
    rarity: 'common',
    iconType: 'medal',
    category: 'sessions',
    conditionType: 'session_count',
    threshold: 10,
    order: 20,
  },
  {
    id: 'veteran_50',
    nameFr: 'Vétéran',
    nameEn: 'Veteran',
    descFr: 'Termine 50 séances.',
    descEn: 'Complete 50 workouts.',
    rarity: 'rare',
    iconType: 'medal',
    category: 'sessions',
    conditionType: 'session_count',
    threshold: 50,
    order: 30,
  },
  {
    id: 'centurion_100',
    nameFr: 'Centurion',
    nameEn: 'Centurion',
    descFr: 'Termine 100 séances.',
    descEn: 'Complete 100 workouts.',
    rarity: 'epic',
    iconType: 'crown',
    category: 'sessions',
    conditionType: 'session_count',
    threshold: 100,
    order: 40,
  },
  {
    id: 'streak_7',
    nameFr: 'Régularité',
    nameEn: 'Consistency',
    descFr: "Atteins une série de 7 jours d'entraînement consécutifs.",
    descEn: 'Reach a 7-day training streak.',
    rarity: 'rare',
    iconType: 'flame',
    category: 'streak',
    conditionType: 'streak',
    threshold: 7,
    order: 50,
  },
  {
    id: 'streak_30',
    nameFr: 'Inarrêtable',
    nameEn: 'Unstoppable',
    descFr: 'Atteins une série de 30 jours consécutifs.',
    descEn: 'Reach a 30-day streak.',
    rarity: 'epic',
    iconType: 'flame',
    category: 'streak',
    conditionType: 'streak',
    threshold: 30,
    order: 60,
  },
  {
    id: 'perfect_week',
    nameFr: 'Semaine parfaite',
    nameEn: 'Perfect Week',
    descFr: 'Termine 5 séances en 7 jours.',
    descEn: 'Complete 5 workouts within 7 days.',
    rarity: 'rare',
    iconType: 'calendar',
    category: 'sessions',
    conditionType: 'perfect_week',
    threshold: 5,
    order: 70,
  },
  {
    id: 'level_10',
    nameFr: 'Montée en puissance',
    nameEn: 'Rising Power',
    descFr: 'Atteins le niveau 10 (palier Argent).',
    descEn: 'Reach level 10 (Silver tier).',
    rarity: 'rare',
    iconType: 'star',
    category: 'level',
    conditionType: 'level',
    threshold: 10,
    order: 80,
  },
  {
    id: 'level_20',
    nameFr: "Maître d'armes",
    nameEn: 'Weapon Master',
    descFr: 'Atteins le niveau 20 (palier Or).',
    descEn: 'Reach level 20 (Gold tier).',
    rarity: 'epic',
    iconType: 'helm',
    category: 'level',
    conditionType: 'level',
    threshold: 20,
    order: 90,
  },
  {
    id: 'level_50',
    nameFr: 'Légende',
    nameEn: 'Legend',
    descFr: 'Atteins le niveau 50 (palier Diamant).',
    descEn: 'Reach level 50 (Diamond tier).',
    rarity: 'legendary',
    iconType: 'crystal',
    category: 'level',
    conditionType: 'level',
    threshold: 50,
    order: 100,
  },
  {
    id: 'architect',
    nameFr: 'Architecte',
    nameEn: 'Architect',
    descFr: 'Crée ton premier programme personnalisé.',
    descEn: 'Create your first custom program.',
    rarity: 'rare',
    iconType: 'scroll',
    category: 'program',
    conditionType: 'first_custom_program',
    threshold: 1,
    order: 110,
  },
];

/** Stats utilisateur servant à évaluer toutes les conditions de badge. */
export interface BadgeContext {
  sessionCount: number; // séances valides (xpEarned > 0)
  streak: number;
  level: number;
  sessionsLast7Days: number; // séances valides sur 7 jours glissants
  customProgramCount: number;
}

/** Une condition de badge est-elle satisfaite par le contexte courant ? */
export function isUnlocked(badge: BadgeDef, ctx: BadgeContext): boolean {
  switch (badge.conditionType) {
    case 'session_count':
      return ctx.sessionCount >= (badge.threshold ?? Infinity);
    case 'streak':
      return ctx.streak >= (badge.threshold ?? Infinity);
    case 'level':
      return ctx.level >= (badge.threshold ?? Infinity);
    case 'perfect_week':
      return ctx.sessionsLast7Days >= (badge.threshold ?? 5);
    case 'first_custom_program':
      return ctx.customProgramCount >= (badge.threshold ?? 1);
    default:
      return false;
  }
}

/** Valeur de progression courante d'un badge (pour la vitrine 7D). null si non quantifiable. */
export function badgeProgress(
  badge: BadgeDef,
  ctx: BadgeContext,
): { current: number; target: number } | null {
  if (badge.threshold == null) return null;
  let current: number;
  switch (badge.conditionType) {
    case 'session_count':
      current = ctx.sessionCount;
      break;
    case 'streak':
      current = ctx.streak;
      break;
    case 'level':
      current = ctx.level;
      break;
    case 'perfect_week':
      current = ctx.sessionsLast7Days;
      break;
    case 'first_custom_program':
      current = Math.min(ctx.customProgramCount, badge.threshold);
      break;
    default:
      return null;
  }
  return { current: Math.min(current, badge.threshold), target: badge.threshold };
}

/**
 * Construit le contexte de badges d'un utilisateur depuis la base.
 * `level`/`streak` sont passés explicitement car ils peuvent venir d'une mise à jour
 * en cours (transaction séance) plus fraîche que la ligne User en base.
 */
export async function buildBadgeContext(
  userId: string,
  level: number,
  streak: number,
): Promise<BadgeContext> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const [sessionCount, sessionsLast7Days, customProgramCount] = await Promise.all([
    prisma.workoutLog.count({ where: { userId, xpEarned: { gt: 0 } } }),
    prisma.workoutLog.count({ where: { userId, xpEarned: { gt: 0 }, date: { gte: sevenDaysAgo } } }),
    prisma.program.count({ where: { createdBy: userId, isCustom: true } }),
  ]);
  return { sessionCount, sessionsLast7Days, customProgramCount, level, streak };
}

/**
 * Évalue les conditions, crée les UserBadge manquants et renvoie les badges
 * nouvellement débloqués (pour l'animation de fin de séance, 7D).
 */
export async function detectBadges(
  userId: string,
  level: number,
  streak: number,
): Promise<BadgeDef[]> {
  const ctx = await buildBadgeContext(userId, level, streak);
  const earnedIds = BADGES.filter((b) => isUnlocked(b, ctx)).map((b) => b.id);
  if (earnedIds.length === 0) return [];

  const existing = await prisma.userBadge.findMany({
    where: { userId, badgeId: { in: earnedIds } },
    select: { badgeId: true },
  });
  const have = new Set(existing.map((e) => e.badgeId));
  const toAward = earnedIds.filter((id) => !have.has(id));
  if (toAward.length === 0) return [];

  await prisma.userBadge.createMany({
    data: toAward.map((badgeId) => ({ userId, badgeId })),
    skipDuplicates: true,
  });

  // Ordre stable pour l'affichage des déblocages
  return BADGES.filter((b) => toAward.includes(b.id)).sort((a, b) => a.order - b.order);
}
