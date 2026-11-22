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
