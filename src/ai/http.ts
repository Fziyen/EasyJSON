import { AIError } from './types';

const trimSlash = (u: string) => u.replace(/\/+$/, '');
export const joinUrl = (base: string, path: string) => `${trimSlash(base)}${path}`;

export async function request(url: string, init: RequestInit & { apiKey?: string } = {}): Promise<Response> {
  const { apiKey, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...headers,
      },
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new AIError(
      `Couldn't reach ${new URL(url).origin}.`,
      'Check that the server is running and that it allows requests from this page (CORS).',
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error?.message ?? j.error ?? j.message ?? body;
    } catch {
      /* plain text */
    }
    throw new AIError(`Server responded ${res.status}${msg ? `: ${String(msg).slice(0, 300)}` : ''}`);
  }
  return res;
}

/** Reads a streamed body line by line (NDJSON or SSE). */
export async function* readLines(res: Response): AsyncGenerator<string> {
  if (!res.body) {
    yield* (await res.text()).split('\n');
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) yield line;
    }
  }
  if (buf.trim()) yield buf.trim();
}
