import { providers } from './registry';
import type { ProviderSettings } from './types';

export interface AISettings {
  providerId: string;
  byProvider: Record<string, ProviderSettings>;
}

export const defaultAISettings: AISettings = {
  providerId: providers[0].id,
  byProvider: Object.fromEntries(providers.map((p) => [p.id, { baseUrl: p.defaultBaseUrl, model: '' }])),
};

export function currentSettings(s: AISettings): ProviderSettings {
  const p = providers.find((x) => x.id === s.providerId) ?? providers[0];
  return s.byProvider[p.id] ?? { baseUrl: p.defaultBaseUrl, model: '' };
}

export const AI_SETTINGS_KEY = 'easyjson.ai.v2';

/**
 * Initial settings: LM Studio selected, but keep any server URLs/models saved by an
 * earlier version (which defaulted to Ollama) so nothing has to be re-entered.
 */
export function initialAISettings(): AISettings {
  try {
    const old = JSON.parse(localStorage.getItem('easyjson.ai') ?? 'null') as Partial<AISettings> | null;
    if (old?.byProvider) return { ...defaultAISettings, byProvider: { ...defaultAISettings.byProvider, ...old.byProvider } };
  } catch {
    /* ignore */
  }
  return defaultAISettings;
}
