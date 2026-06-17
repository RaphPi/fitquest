// Types partagés FitQuest — alignés sur le modèle Prisma & exercises_seed.json.

export type Category = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'back';
export type Equipment = 'none' | 'dumbbells' | 'barbell' | 'pull_bar' | 'other';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'reps' | 'duration';
export type ThemeId = 'void_rpg' | 'forest_warrior' | 'solar_blaze';
export type Lang = 'fr' | 'en';

export interface Exercise {
  id: string;
  nameFr: string;
  nameEn: string;
  category: Category;
  musclesPrimary: string[];
  musclesSecondary: string[];
  equipment: Equipment;
  level: Level;
  type: ExerciseType;
  instructionsFr: string;
  instructionsEn: string;
  tipsFr?: string | null;
  tipsEn?: string | null;
  imageUrl?: string | null;
  imageAiGen?: boolean;
  variations: string[];
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number | null;
  durationSeconds?: number | null;
  restBetweenSetsSeconds: number;
  restAfterExerciseSeconds: number;
}

export interface WorkoutSession {
  id: string;
  nameFr: string;
  nameEn: string;
  order: number;
  exercises: SessionExercise[];
}

export interface Program {
  id: string;
  nameFr: string;
  nameEn: string;
  descFr?: string | null;
  descEn?: string | null;
  level: Level;
  daysPerWeek: number;
  durationWeeks?: number | null;
  equipment: Equipment[];
  isCustom: boolean;
  isAiGen: boolean;
  sessions: WorkoutSession[];
}

// ─── Séance active (Sprint 6) ──────────────────────────────
// Exercice résolu pour le mode séance : fusion SessionExercise + métadonnées Exercise.
export interface ActiveExercise {
  sessionExerciseId: string;
  exerciseId: string;
  name: string;
  category: Category;
  type: ExerciseType;
  sets: number;
  /** reps cibles (type reps) ou secondes cibles (type duration), par série */
  target: number;
  restBetweenSetsSeconds: number;
  restAfterExerciseSeconds: number;
}

export interface CompletedSetRecord {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number | null;
  durationSecs?: number | null;
  weightKg?: number | null;
}

export interface WorkoutLogSet extends CompletedSetRecord {
  id: string;
}

export interface WorkoutLog {
  id: string;
  sessionId?: string | null;
  sessionName: string;
  date: string;
  durationSecs: number;
  xpEarned: number;
  completedSets: WorkoutLogSet[];
}

// ─── Badges (Sprint 7C/7D) — miroir de backend/src/lib/badges.ts ──
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BadgeConditionType =
  | 'session_count'
  | 'streak'
  | 'perfect_week'
  | 'level'
  | 'first_custom_program'
  | 'body_metric_count';

export type BadgeCategory = 'sessions' | 'streak' | 'level' | 'program' | 'body';

/** Définition catalogue d'un badge (telle que renvoyée dans `newBadges`). */
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

/** État d'un badge pour l'utilisateur (vitrine), renvoyé par GET /api/v1/badges. */
export interface BadgeState extends BadgeDef {
  obtained: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number } | null;
}

export interface WorkoutResult {
  log: WorkoutLog;
  user: UserProfile;
  xpEarned: number;
  leveledUp: boolean;
  levelsGained: number;
  newBadges: BadgeDef[];
}

export type DigestFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NONE';

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  emailDigest?: DigestFrequency;
  avatarStage?: number;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string | null;
  avatarStage: number;
  themeId: ThemeId;
  level: number;
  totalXP: number;
  currentXP: number;
  xpBalance: number;
  streak: number;
  lastWorkout?: string | null;
}
