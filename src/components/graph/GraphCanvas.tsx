import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import {
  ArrowDownFromLine,
  ArrowRightFromLine,
  ChevronDown,
  ChevronUp,
  Fullscreen,
  ListCollapse,
  ListTree,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { buildGraph, MAX_NODES, nodeMatches, type Direction, type GraphNode, type Segs } from '@/lib/graph';
import { containerPaths, stats, type JsonValue } from '@/lib/json';
import { nodeTypes } from './nodes';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils';

interface Props {
  value: JsonValue;
  dark: boolean;
  selected: Segs | null;
  onSelect: (segs: Segs | null) => void;
}

export function GraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

function initialCollapsed(value: JsonValue) {
  // Very large documents start folded below depth 2 so the first render stays snappy.
  return stats(value).nodes > MAX_NODES * 0.6 ? new Set(containerPaths(value, 2)) : new Set<string>();
}

function Canvas({ value, dark, selected, onSelect }: Props) {
  const rf = useReactFlow();
  const [dir, setDir] = useState<Direction>('LR');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => initialCollapsed(value));
  const [query, setQuery] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset folding when the document shape changes a lot (e.g. a new file).
  const shapeKey = useMemo(() => (Array.isArray(value) ? 'a' : typeof value) + ':' + stats(value).depth, [value]);
  useEffect(() => setCollapsed(initialCollapsed(value)), [shapeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const graph = useMemo(() => buildGraph(value, collapsed, dir), [value, collapsed, dir]);

  const selectedId = useMemo(() => {
    if (!selected) return null;
    const key = JSON.stringify(selected);
    const hit = graph.nodes.find((n) => JSON.stringify(n.data.segs) === key);
    return hit?.id ?? null;
  }, [selected, graph]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => (q ? graph.nodes.filter((n) => nodeMatches(n, q)).map((n) => n.id) : []), [graph, q]);
  const activeMatch = matches.length ? matches[matchIdx % matches.length] : null;

  const nodes = useMemo<GraphNode[]>(
    () =>
      graph.nodes.map(
        (n) =>
          ({
            ...n,
            selected: n.id === selectedId,
            data: { ...n.data, match: matches.includes(n.id), active: n.id === activeMatch },
          }) as GraphNode,
      ),
    [graph, matches, activeMatch, selectedId],
  );

  const edges = useMemo<Edge[]>(
    () => graph.edges.map((e) => (selectedId && (e.source === selectedId || e.target === selectedId) ? { ...e, className: 'highlight' } : e)),
    [graph, selectedId],
  );

  // Fit when the graph structure or direction changes, not on every keystroke inside a value.
  const [ready, setReady] = useState(false);
  const focusRef = useRef<string | null>(null);
  const structureKey = `${dir}|${graph.nodes.length}`;
  useEffect(() => {
    if (!ready) return;
    const focus = focusRef.current;
    focusRef.current = null;
    const t = requestAnimationFrame(() => (focus ? focusBranch(focus) : fitReadable()));
    return () => cancelAnimationFrame(t);
  }, [structureKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-frame when the canvas is resized (split dragged, AI panel opened...).
  const wrapRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef(fitReadable);
  fitRef.current = fitReadable;
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !ready) return;
    let t: ReturnType<typeof setTimeout>;
    let lastW = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(el.clientWidth - lastW) < 40) return;
      lastW = el.clientWidth;
      clearTimeout(t);
      t = setTimeout(() => fitRef.current(200), 150);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [ready]);

  /**
   * After expanding/collapsing a branch: keep the user's zoom and bring that branch into view
   * (zooming out only if its direct children wouldn't fit), instead of re-framing the whole graph.
   */
  function focusBranch(path: string) {
    const el = wrapRef.current;
    const key = graph.nodes.find((n) => n.id === `k:${path}`);
    if (!key || !el) return;
    const ids = new Set([key.id, ...graph.edges.filter((e) => e.source === key.id).map((e) => e.target)]);
    const group = graph.nodes.filter((n) => ids.has(n.id));
    const x1 = Math.min(...group.map((n) => n.position.x));
    const y1 = Math.min(...group.map((n) => n.position.y));
    const x2 = Math.max(...group.map((n) => n.position.x + n.data.width));
    const y2 = Math.max(...group.map((n) => n.position.y + n.data.height));
    const current = rf.getZoom();
    const fitZoom = Math.min(el.clientWidth / (x2 - x1), el.clientHeight / (y2 - y1)) * 0.85;
    const zoom = Math.max(0.35, Math.min(current, fitZoom));
    rf.setCenter((x1 + x2) / 2, (y1 + y2) / 2, { zoom, duration: 300 });
  }

  /** Fit everything if it stays legible; otherwise frame the top few levels of the tree. */
  function fitReadable(duration = 250) {
    const { nodes: all, edges: es } = graph;
    const el = document.querySelector('.react-flow') as HTMLElement | null;
    if (!all.length || !el) return;
    const xs = all.map((n) => [n.position.x, n.position.y, n.position.x + n.data.width, n.position.y + n.data.height]);
    const w = Math.max(...xs.map((b) => b[2])) - Math.min(...xs.map((b) => b[0]));
    const h = Math.max(...xs.map((b) => b[3])) - Math.min(...xs.map((b) => b[1]));
    const zoom = Math.min(el.clientWidth / w, el.clientHeight / h) * 0.87;
    if (zoom >= 0.62) {
      rf.fitView({ padding: 0.12, duration, maxZoom: 1 });
      return;
    }
    const roots = all.filter((n) => !es.some((e) => e.target === n.id)).map((n) => n.id);
    const keep = new Set(roots);
    for (let depth = 0; depth < 3; depth++) for (const e of es) if (keep.has(e.source)) keep.add(e.target);
    rf.fitView({ nodes: [...keep].map((id) => ({ id })), padding: 0.12, duration, maxZoom: 1, minZoom: 0.62 });
  }

  useEffect(() => {
    if (!activeMatch) return;
    const n = graph.nodes.find((x) => x.id === activeMatch);
    if (n) rf.setCenter(n.position.x + n.data.width / 2, n.position.y + n.data.height / 2, { zoom: Math.max(rf.getZoom(), 0.9), duration: 300 });
  }, [activeMatch, graph, rf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && document.activeElement?.closest('.cm-editor') == null) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = useCallback((path: string) => {
    focusRef.current = path;
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const onNodeClick: NodeMouseHandler<GraphNode> = (e, node) => {
    if (node.data.kind === 'key' && (e.target as HTMLElement).closest('[data-toggle]')) {
      toggle(node.data.path);
      return;
    }
    onSelect(node.data.segs);
  };

  const onNodeDoubleClick: NodeMouseHandler<GraphNode> = (_e, node) => {
    if (node.data.kind === 'key') toggle(node.data.path);
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={dark ? 'dark' : 'light'}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onlyRenderVisibleElements={graph.nodes.length > 300}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onInit={() => setReady(true)}
        onPaneClick={() => onSelect(null)}
        minZoom={0.05}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color={dark ? '#3d444d' : '#c8d1da'} />
        <MiniMap
          pannable
          zoomable
          style={{ width: 150, height: 100 }}
          className="!hidden md:!block"
          nodeColor={dark ? '#3d444d' : '#d1d9e0'}
          nodeBorderRadius={6}
          maskColor={dark ? 'rgb(13 17 23 / .6)' : 'rgb(246 248 250 / .6)'}
        />
      </ReactFlow>

      {/* Floating toolbar */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start gap-2">
        <div className="pointer-events-auto flex h-10 items-center gap-1 rounded-md border border-border bg-card/95 pl-3 pr-1 shadow-node backdrop-blur">
          <Search size={14} className="text-faint" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMatchIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setMatchIdx((i) => i + (e.shiftKey ? -1 + matches.length : 1));
              if (e.key === 'Escape') setQuery('');
            }}
            placeholder="Search keys & values"
            className="w-36 bg-transparent text-[13px] text-foreground outline-none placeholder:text-faint sm:w-48"
          />
          {q && (
            <>
              <span className="px-1 font-mono text-[11px] text-faint">
                {matches.length ? `${(matchIdx % matches.length) + 1}/${matches.length}` : '0'}
              </span>
              <IconButton label="Previous match" className="h-7 w-7" onClick={() => setMatchIdx((i) => i - 1 + matches.length)} disabled={!matches.length}>
                <ChevronUp size={14} />
              </IconButton>
              <IconButton label="Next match" className="h-7 w-7" onClick={() => setMatchIdx((i) => i + 1)} disabled={!matches.length}>
                <ChevronDown size={14} />
              </IconButton>
              <IconButton label="Clear search" className="h-7 w-7" onClick={() => setQuery('')}>
                <X size={14} />
              </IconButton>
            </>
          )}
        </div>

        <div className="pointer-events-auto flex h-10 items-center gap-0.5 rounded-md border border-border bg-card/95 px-1 shadow-node backdrop-blur">
          <IconButton label="Left to right" active={dir === 'LR'} onClick={() => setDir('LR')}>
            <ArrowRightFromLine size={15} />
          </IconButton>
          <IconButton label="Top to bottom" active={dir === 'TB'} onClick={() => setDir('TB')}>
            <ArrowDownFromLine size={15} />
          </IconButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <IconButton label="Collapse all" onClick={() => setCollapsed(new Set(containerPaths(value)))}>
            <ListCollapse size={15} />
          </IconButton>
          <IconButton label="Expand all" onClick={() => setCollapsed(new Set())}>
            <ListTree size={15} />
          </IconButton>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex flex-col gap-0.5 rounded-md border border-border bg-card/95 p-1 shadow-node backdrop-blur">
        <IconButton label="Zoom in" onClick={() => rf.zoomIn({ duration: 150 })}>
          <Plus size={15} />
        </IconButton>
        <IconButton label="Zoom out" onClick={() => rf.zoomOut({ duration: 150 })}>
          <Minus size={15} />
        </IconButton>
        <IconButton label="Fit to screen" onClick={() => rf.fitView({ padding: 0.12, duration: 250 })}>
          <Fullscreen size={15} />
        </IconButton>
      </div>

      {graph.truncated && (
        <div className={cn('absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-warning/40 bg-card px-3 py-1.5 text-xs text-warning shadow-node')}>
          Showing the first {MAX_NODES.toLocaleString()} nodes. Collapse branches to explore the rest.
        </div>
      )}
    </div>
  );
}
