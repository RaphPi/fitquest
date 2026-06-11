// Architecture IA multi-provider — FitQuest_ProjectPlan.md §8
// Implémentations : ClaudeProvider | OllamaProvider | LMStudioProvider | NoAIProvider
// (Sprint 1 : seul NoAIProvider est implémenté.)

export interface AIProfile {
  level: string;
  goals: string[];
  daysPerWeek: number;
  equipment: string[];
}

export interface AIProvider {
  /** Génère un programme à partir d'un profil + objectifs. */
  generateProgram(profile: AIProfile, goals: string[]): Promise<unknown>;
  /** Génère une illustration d'exercice. */
  generateExerciseImage(name: string, style: string): Promise<Buffer>;
  /** Indique si le provider est joignable/configuré. */
  isAvailable(): Promise<boolean>;
}
