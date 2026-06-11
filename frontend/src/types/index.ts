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
  restSeconds: number;
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
