import { joinUrl, readLines, request } from '../http';
import type { AIProvider } from '../types';

export const ollama: AIProvider = {
  id: 'ollama',
  label: 'Ollama',
  kind: 'local',
  defaultBaseUrl: 'http://localhost:11434',
  needsApiKey: false,
  hint: `Run \`ollama serve\` and pull a model (e.g. \`ollama pull qwen2.5-coder:7b\`). If requests are blocked, restart it with OLLAMA_ORIGINS="${typeof location !== 'undefined' ? location.origin : '*'}" ollama serve.`,

  async listModels(s, signal) {
    const res = await request(joinUrl(s.baseUrl, '/api/tags'), { signal });
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map((m) => m.name).sort();
  },

  async complete(s, { messages, temperature = 0.2, jsonMode, signal, onToken }) {
    const res = await request(joinUrl(s.baseUrl, '/api/chat'), {
      method: 'POST',
      signal,
      body: JSON.stringify({
        model: s.model,
        messages,
        stream: true,
        ...(jsonMode ? { format: 'json' } : {}),
        // Reasoning models (qwen3, deepseek-r1...) are much slower with thinking on and it adds nothing to JSON edits.
        think: false,
        options: { temperature, num_ctx: 16384 },
      }),
    });
    let out = '';
    for await (const line of readLines(res)) {
      const chunk = JSON.parse(line) as { message?: { content?: string }; error?: string; done?: boolean };
      if (chunk.error) throw new Error(chunk.error);
      const t = chunk.message?.content ?? '';
      if (t) {
        out += t;
        onToken?.(t);
      }
      if (chunk.done) break;
    }
    return out;
  },
};
