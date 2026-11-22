import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import { childPath, isContainer, previewValue, typeOf, type JsonType, type JsonValue } from './json';

export type Segs = (string | number)[];
export type Direction = 'LR' | 'TB';

export type Row = { key: string; type: JsonType; display: string; path: string; segs: Segs };

export type CardData = {
  kind: 'card';
  /** 'object' card, 'list' of primitive array items, or a lone primitive root. */
  variant: 'object' | 'list' | 'value';
  title: string;
  rows: Row[];
  nested: number;
  path: string;
  segs: Segs;
  width: number;
  height: number;
  dir: Direction;
  match?: boolean;
  active?: boolean;
};

export type KeyData = {
  kind: 'key';
  label: string;
  type: 'object' | 'array';
  count: number;
  path: string;
  segs: Segs;
  collapsed: boolean;
  width: number;
  height: number;
  dir: Direction;
  match?: boolean;
  active?: boolean;
};

export type CardNode = Node<CardData, 'card'>;
export type KeyNode = Node<KeyData, 'key'>;
export type GraphNode = CardNode | KeyNode;

export interface BuiltGraph {
  nodes: GraphNode[];
  edges: Edge[];
  truncated: boolean;
}

const CH = 7.3; // px per mono char at 12px
const ROW_H = 24;
const HEAD_H = 30;
const MAX_VALUE_CHARS = 38;
export const MAX_NODES = 2500;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function toRow(key: string, v: JsonValue, path: string, segs: Segs): Row {
  const type = typeOf(v);
  const display = isContainer(v) ? (type === 'array' ? '[ ]' : '{ }') : previewValue(v, MAX_VALUE_CHARS);
  return { key, type, display, path, segs };
}

export function buildGraph(root: JsonValue, collapsed: Set<string>, dir: Direction): BuiltGraph {
  const nodes: GraphNode[] = [];
  const edges: Edge[] = [];
  let truncated = false;

  const full = () => {
    if (nodes.length >= MAX_NODES) truncated = true;
    return truncated;
  };

  const link = (source: string, target: string) =>
    edges.push({ id: `${source}->${target}`, source, target, type: 'smoothstep', pathOptions: { borderRadius: 10 } } as Edge);

  const card = (variant: CardData['variant'], title: string, rows: Row[], nested: number, path: string, segs: Segs) => {
    const chars = Math.max(title.length + 8, ...rows.map((r) => r.key.length + r.display.length + 3));
    const width = clamp(Math.round(chars * CH + 40), 170, 380);
    const height = HEAD_H + (rows.length ? rows.length * ROW_H + 8 : 0);
    const id = `n:${path}`;
    nodes.push({ id, type: 'card', position: { x: 0, y: 0 }, data: { kind: 'card', variant, title, rows, nested, path, segs, width, height, dir } });
    return id;
  };

  const keyNode = (label: string, v: JsonValue[] | Record<string, JsonValue>, path: string, segs: Segs) => {
    const type = Array.isArray(v) ? 'array' : 'object';
    const count = Array.isArray(v) ? v.length : Object.keys(v).length;
    const id = `k:${path}`;
    const width = clamp(Math.round((label.length + String(count).length) * CH + 72), 96, 300);
    nodes.push({
      id,
      type: 'key',
      position: { x: 0, y: 0 },
      data: { kind: 'key', label, type, count, path, segs, collapsed: collapsed.has(path), width, height: 30, dir },
    });
    return id;
  };

  const hasChildren = (v: JsonValue) => isContainer(v) && Object.keys(v).length > 0;

  function objectCard(obj: Record<string, JsonValue>, title: string, path: string, segs: Segs, attach: string | null) {
    if (full()) return;
    const rows: Row[] = [];
    const branches: [string, JsonValue][] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (hasChildren(v)) branches.push([k, v]);
      else rows.push(toRow(k, v, childPath(path, k), [...segs, k]));
    }
    const id = card('object', title, rows, branches.length, path, segs);
    if (attach) link(attach, id);
    for (const [k, v] of branches) {
      if (full()) return;
      const p = childPath(path, k);
      const kid = keyNode(k, v as Record<string, JsonValue>, p, [...segs, k]);
      link(id, kid);
      if (!collapsed.has(p)) expand(v, k, p, [...segs, k], kid);
    }
  }

  function arrayItems(arr: JsonValue[], label: string, path: string, segs: Segs, attach: string) {
    const prim: Row[] = [];
    arr.forEach((v, i) => {
      if (!hasChildren(v)) prim.push(toRow(String(i), v, childPath(path, i), [...segs, i]));
    });
    if (prim.length) link(attach, card('list', label, prim, 0, path, segs));
    arr.forEach((v, i) => {
      if (!hasChildren(v) || full()) return;
      const p = childPath(path, i);
      if (Array.isArray(v)) {
        const kid = keyNode(`[${i}]`, v, p, [...segs, i]);
        link(attach, kid);
        if (!collapsed.has(p)) arrayItems(v, `[${i}]`, p, [...segs, i], kid);
      } else {
        objectCard(v as Record<string, JsonValue>, `${label}[${i}]`, p, [...segs, i], attach);
      }
    });
  }

  function expand(v: JsonValue, label: string, path: string, segs: Segs, attach: string) {
    if (Array.isArray(v)) arrayItems(v, label, path, segs, attach);
    else objectCard(v as Record<string, JsonValue>, label, path, segs, attach);
  }

  if (Array.isArray(root)) {
    const kid = keyNode('root', root, '$', []);
    if (!collapsed.has('$')) arrayItems(root, 'root', '$', [], kid);
  } else if (isContainer(root)) {
    objectCard(root, 'root', '$', [], null);
  } else {
    card('value', 'root', [toRow('value', root, '$', [])], 0, '$', []);
  }

  layout(nodes, edges, dir);
  return { nodes, edges, truncated };
}

function layout(nodes: GraphNode[], edges: Edge[], dir: Direction) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: dir, nodesep: dir === 'LR' ? 22 : 36, ranksep: dir === 'LR' ? 72 : 56, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: n.data.width, height: n.data.height });
  for (const e of edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  for (const n of nodes) {
    const p = g.node(n.id) as { x: number; y: number };
    n.position = { x: p.x - n.data.width / 2, y: p.y - n.data.height / 2 };
    n.width = n.data.width;
    n.height = n.data.height;
  }
}

export function nodeMatches(n: GraphNode, q: string): boolean {
  if (!q) return false;
  const d = n.data;
  if (d.kind === 'key') return d.label.toLowerCase().includes(q);
  return d.title.toLowerCase().includes(q) || d.rows.some((r) => r.key.toLowerCase().includes(q) || r.display.toLowerCase().includes(q));
}
