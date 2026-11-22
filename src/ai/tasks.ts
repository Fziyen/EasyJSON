import { format, type JsonError, type JsonValue } from '@/lib/json';
import { jsonrepair } from 'jsonrepair';
import { AIError, type AIProvider, type ChatMessage, type ProviderSettings } from './types';

const FIX_SYSTEM = `You repair malformed JSON.
Rules:
- Output ONLY the corrected JSON document. No explanations, no markdown fences.
- Keep every key, value and the original order. Do not invent, drop or rename data.
- Fix syntax only: missing or extra commas, unquoted or single-quoted keys/strings, comments, trailing commas, unbalanced brackets, invalid literals (NaN, undefined → null), unescaped characters.`;

const EDIT_SYSTEM = `You edit and extend JSON data.
You receive a JSON document and an instruction. Apply the instruction and return the COMPLETE resulting JSON document.
Rules:
- Output ONLY valid JSON. No explanations, no markdown fences, no comments.
- Preserve existing data unless the instruction asks to change it.
- New data must follow the existing structure, key naming style and value types, and look realistic and varied.`;

const CREATE_SYSTEM = `You create realistic sample JSON data from a description.
Output ONLY a valid JSON document. No explanations, no markdown fences, no comments.`;

/** Pulls the JSON document out of a model reply (handles fences and chatter). */
export function extractJson(reply: string): JsonValue {
  let text = reply.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.search(/[[{]/);
  if (start > 0) text = text.slice(start);
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (end >= 0) text = text.slice(0, end + 1);
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    try {
      // Small local models often leave a trailing comma or similar; tidy it up deterministically.
      return JSON.parse(jsonrepair(text)) as JsonValue;
    } catch {
      throw new AIError('The model did not return valid JSON.', reply.slice(0, 2000));
    }
  }
}

interface RunOpts {
  provider: AIProvider;
  settings: ProviderSettings;
  signal?: AbortSignal;
  onToken?: (t: string) => void;
}

async function run(opts: RunOpts, messages: ChatMessage[], temperature: number) {
  if (!opts.settings.model) throw new AIError('Pick a model first.');
  const reply = await opts.provider.complete(opts.settings, {
    messages,
    temperature,
    jsonMode: true,
    signal: opts.signal,
    onToken: opts.onToken,
  });
  return extractJson(reply);
}

export function fixJson(opts: RunOpts, broken: string, error: JsonError | null) {
  const where = error ? `\nParser error: ${error.message} (line ${error.line}, column ${error.column}).` : '';
  return run(
    opts,
    [
      { role: 'system', content: FIX_SYSTEM },
      { role: 'user', content: `Repair this JSON.${where}\n\n${broken}` },
    ],
    0,
  );
}

export function editJson(opts: RunOpts, current: JsonValue | null, instruction: string, scopeLabel?: string) {
  if (current === null) {
    return run(
      opts,
      [
        { role: 'system', content: CREATE_SYSTEM },
        { role: 'user', content: instruction },
      ],
      0.7,
    );
  }
  const scope = scopeLabel ? ` (this is the value at ${scopeLabel} inside a larger document)` : '';
  return run(
    opts,
    [
      { role: 'system', content: EDIT_SYSTEM },
      { role: 'user', content: `Instruction: ${instruction}\n\nJSON${scope}:\n${format(current)}` },
    ],
    0.6,
  );
}
