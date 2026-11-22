import { jsonrepair } from 'jsonrepair';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface JsonError {
  message: string;
  line: number;
  column: number;
  /** Character offset into the source, when known. */
  offset: number;
}

export type ParseResult =
  | { ok: true; value: JsonValue; error: null }
  | { ok: false; value: null; error: JsonError | null }; // error null = empty input

export function parseJson(input: string): ParseResult {
  if (!input.trim()) return { ok: false, value: null, error: null };
  try {
    return { ok: true, value: JSON.parse(input) as JsonValue, error: null };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { ok: false, value: null, error: describeError(input, raw) };
  }
}

function describeError(input: string, raw: string): JsonError {
  let offset = input.length;
  const pos = raw.match(/position\s+(\d+)/i);
  const lc = raw.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (pos) offset = Number(pos[1]);
  else if (lc) offset = lineColToOffset(input, Number(lc[1]), Number(lc[2]));
  const { line, column } = offsetToLineCol(input, offset);
  // Engines append "(line x column y)" or "at position n"; strip it for a cleaner message.
  const message = raw
    .replace(/\s*\(line \d+ column \d+\)/i, '')
    .replace(/\s*(at|in JSON at) position \d+.*$/i, '')
    .replace(/^JSON\.parse:\s*/i, '');
  return { message: message || 'Invalid JSON', line, column, offset: Math.min(offset, input.length) };
}

export function offsetToLineCol(input: string, offset: number) {
  let line = 1;
  let last = -1;
  for (let i = 0; i < offset && i < input.length; i++) {
    if (input.charCodeAt(i) === 10) {
      line++;
      last = i;
    }
  }
  return { line, column: offset - last };
}

function lineColToOffset(input: string, line: number, column: number) {
  let off = 0;
  for (let l = 1; l < line; l++) {
    const nl = input.indexOf('\n', off);
    if (nl === -1) return input.length;
    off = nl + 1;
  }
  return off + column - 1;
}

export const typeOf = (v: JsonValue): JsonType =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : (typeof v as JsonType);

export const isContainer = (v: JsonValue): v is JsonValue[] | { [k: string]: JsonValue } =>
  v !== null && typeof v === 'object';

export const format = (v: JsonValue, indent = 2) => JSON.stringify(v, null, indent);
export const minify = (v: JsonValue) => JSON.stringify(v);

/** Deterministic, offline repair (trailing commas, quotes, comments, missing brackets...). */
export function quickRepair(input: string): { ok: true; text: string } | { ok: false; message: string } {
  try {
    const repaired = jsonrepair(input);
    return { ok: true, text: format(JSON.parse(repaired) as JsonValue) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export function stats(v: JsonValue) {
  let nodes = 0;
  let depth = 0;
  const walk = (x: JsonValue, d: number) => {
    nodes++;
    depth = Math.max(depth, d);
    if (Array.isArray(x)) x.forEach((c) => walk(c, d + 1));
    else if (isContainer(x)) for (const k in x) walk(x[k], d + 1);
  };
  walk(v, 0);
  return { nodes, depth };
}

const IDENT = /^[A-Za-z_$][\w$]*$/;
export const childPath = (parent: string, key: string | number) =>
  typeof key === 'number' ? `${parent}[${key}]` : IDENT.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;

export function getAtPath(root: JsonValue, segments: (string | number)[]): JsonValue | undefined {
  let cur: JsonValue | undefined = root;
  for (const s of segments) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, JsonValue>)[s as string];
  }
  return cur;
}

export function previewValue(v: JsonValue, max = 60): string {
  if (typeof v === 'string') return v.length > max ? `"${v.slice(0, max)}…"` : `"${v}"`;
  if (Array.isArray(v)) return `[${v.length}]`;
  if (isContainer(v)) return `{${Object.keys(v).length}}`;
  return String(v);
}

/** Returns a new document with the value at `segments` replaced (root when empty). */
export function setAtPath(root: JsonValue, segments: (string | number)[], next: JsonValue): JsonValue {
  if (!segments.length) return next;
  const [head, ...rest] = segments;
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[head as number] = setAtPath(copy[head as number], rest, next);
    return copy;
  }
  if (isContainer(root)) return { ...root, [head]: setAtPath(root[head as string], rest, next) };
  return root;
}

/** Every non-empty container path below the root, for "collapse all". */
export function containerPaths(root: JsonValue, minDepth = 1): string[] {
  const out: string[] = [];
  const walk = (v: JsonValue, path: string, d: number) => {
    if (!isContainer(v)) return;
    const entries = Array.isArray(v) ? v.map((x, i) => [i, x] as const) : Object.entries(v);
    if (!entries.length) return;
    if (d >= minDepth) out.push(path);
    for (const [k, x] of entries) walk(x, childPath(path, k), d + 1);
  };
  walk(root, '$', 0);
  return out;
}

export function segsToPath(segs: (string | number)[]) {
  return segs.reduce<string>((p, s) => childPath(p, s), '$');
}
