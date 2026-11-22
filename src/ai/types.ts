/**
 * Provider-agnostic AI layer. Every backend (local today, cloud later) implements
 * `AIProvider`; the rest of the app only talks to this interface.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderSettings {
  baseUrl: string;
  model: string;
  /** Optional: local servers usually ignore it; cloud adapters will require it. */
  apiKey?: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  /** Ask the backend to constrain output to JSON when it supports it. */
  jsonMode?: boolean;
  signal?: AbortSignal;
  onToken?: (chunk: string) => void;
}

export interface AIProvider {
  id: string;
  label: string;
  kind: 'local' | 'cloud';
  defaultBaseUrl: string;
  /** Short setup hint shown in settings (e.g. CORS notes). */
  hint: string;
  needsApiKey: boolean;
  listModels(s: ProviderSettings, signal?: AbortSignal): Promise<string[]>;
  complete(s: ProviderSettings, req: CompletionRequest): Promise<string>;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'AIError';
  }
}
