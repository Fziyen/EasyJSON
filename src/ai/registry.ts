import type { AIProvider } from './types';
import { ollama } from './providers/ollama';
import { lmStudio, openAICompatibleLocal } from './providers/openaiCompatible';

/** Add cloud adapters here later; nothing else in the app needs to change. */
export const providers: AIProvider[] = [lmStudio, ollama, openAICompatibleLocal];

export const getProvider = (id: string) => providers.find((p) => p.id === id) ?? providers[0];
