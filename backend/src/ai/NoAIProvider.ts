import { AIProvider, AIProfile } from './AIProvider';

/** Provider par défaut : aucune IA. Toujours indisponible. */
export class NoAIProvider implements AIProvider {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async generateProgram(_profile: AIProfile, _goals: string[]): Promise<unknown> {
    throw new Error('AI_PROVIDER=none : génération de programme indisponible.');
  }

  async generateExerciseImage(_name: string, _style: string): Promise<Buffer> {
    throw new Error('AI_PROVIDER=none : génération d’image indisponible.');
  }
}
