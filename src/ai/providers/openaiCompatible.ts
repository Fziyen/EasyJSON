import { joinUrl, readLines, request } from '../http';
import type { AIProvider } from '../types';

/**
 * Works with any server exposing the OpenAI Chat Completions API:
 * LM Studio, llama.cpp server, vLLM, LocalAI, Jan... and later hosted APIs.
 */
export function createOpenAICompatible(opts: Pick<AIProvider, 'id' | 'label' | 'kind' | 'defaultBaseUrl' | 'hint' | 'needsApiKey'>): AIProvider {
  return {
    ...opts,
    async listModels(s, signal) {
      const res = await request(joinUrl(s.baseUrl, '/models'), { signal, apiKey: s.apiKey });
      const data = (await res.json()) as { data?: { id: string }[] };
      return (data.data ?? []).map((m) => m.id).sort();
    },

    async complete(s, { messages, temperature = 0.2, signal, onToken }) {
      const res = await request(joinUrl(s.baseUrl, '/chat/completions'), {
        method: 'POST',
        signal,
        apiKey: s.apiKey,
        body: JSON.stringify({ model: s.model, messages, temperature, stream: true }),
      });
      let out = '';
      for await (const line of readLines(res)) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') break;
        const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[]; error?: { message: string } };
        if (chunk.error) throw new Error(chunk.error.message);
        const t = chunk.choices?.[0]?.delta?.content ?? '';
        if (t) {
          out += t;
          onToken?.(t);
        }
      }
      return out;
    },
  };
}

export const lmStudio = createOpenAICompatible({
  id: 'lmstudio',
  label: 'LM Studio',
  kind: 'local',
  defaultBaseUrl: 'http://localhost:1234/v1',
  needsApiKey: false,
  hint: 'In LM Studio, open the Developer tab, load a model, start the server and turn on "Enable CORS".',
});

export const openAICompatibleLocal = createOpenAICompatible({
  id: 'openai-compatible',
  label: 'Other (OpenAI-compatible)',
  kind: 'local',
  defaultBaseUrl: 'http://localhost:8080/v1',
  needsApiKey: false,
  hint: 'Any local server with an OpenAI-style /v1/chat/completions endpoint (llama.cpp, vLLM, LocalAI, Jan…). Make sure it sends CORS headers.',
});
