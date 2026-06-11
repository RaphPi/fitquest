import { AIProvider } from './AIProvider';
import { NoAIProvider } from './NoAIProvider';

export type AIProviderKind = 'none' | 'claude' | 'ollama' | 'lmstudio';

/**
 * Fabrique le provider IA selon AI_PROVIDER.
 * Toujours vérifier AI_PROVIDER avant tout appel IA (cf. conventions du plan).
 * Sprint 1 : seul `none` est implémenté ; les autres retombent sur NoAIProvider
 * avec un avertissement (implémentés en Phase 2).
 */
export function getAIProvider(): AIProvider {
  const kind = (process.env.AI_PROVIDER ?? 'none') as AIProviderKind;

  switch (kind) {
    case 'none':
      return new NoAIProvider();
    case 'claude':
    case 'ollama':
    case 'lmstudio':
      console.warn(`[ai] AI_PROVIDER="${kind}" pas encore implémenté (Phase 2) — fallback NoAIProvider.`);
      return new NoAIProvider();
    default:
      console.warn(`[ai] AI_PROVIDER="${kind}" inconnu — fallback NoAIProvider.`);
      return new NoAIProvider();
  }
}

export * from './AIProvider';
