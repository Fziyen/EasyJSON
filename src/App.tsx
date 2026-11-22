import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  AlignLeft,
  CheckCircle2,
  Code2,
  Columns2,
  Copy,
  Download,
  FolderOpen,
  Minimize2,
  Moon,
  Network,
  Sparkles,
  Sun,
  Trash2,
  Wrench,
} from 'lucide-react';
import { JsonEditor, type JsonEditorHandle } from '@/components/editor/JsonEditor';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { Inspector } from '@/components/graph/Inspector';
import { AIPanel } from '@/components/ai/AIPanel';
import { Logo } from '@/components/Logo';
import { Button, IconButton } from '@/components/ui/IconButton';
import { AI_SETTINGS_KEY, currentSettings, initialAISettings, type AISettings } from '@/ai/settings';
import { getProvider } from '@/ai/registry';
import { format, minify, parseJson, quickRepair, stats } from '@/lib/json';
import type { Segs } from '@/lib/graph';
import { usePersistent } from '@/lib/storage';
import { SAMPLE } from '@/sample';
import { cn } from '@/lib/utils';

type View = 'editor' | 'split' | 'graph';

const DOC_KEY = 'easyjson.document';

function readDoc() {
  try {
    return localStorage.getItem(DOC_KEY) ?? SAMPLE;
  } catch {
    return SAMPLE;
  }
}

export default function App() {
  const [input, setInput] = useState(readDoc);
  const [fileName, setFileName] = useState('untitled.json');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [view, setView] = useState<View>(() => (window.innerWidth < 768 ? 'graph' : 'split'));
  const [split, setSplit] = useState(38);
  const [aiOpen, setAiOpen] = useState(false);
  const [initialAi] = useState(initialAISettings);
  const [aiSettings, setAiSettings] = usePersistent<AISettings>(AI_SETTINGS_KEY, initialAi);
  const [selected, setSelected] = useState<Segs | null>(null);
  const [aiScope, setAiScope] = useState<Segs | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const editorRef = useRef<JsonEditorHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Parsing is cheap for typical files; defer slightly for big ones so typing stays smooth.
  const [parsedInput, setParsedInput] = useState(input);
  useEffect(() => {
    if (input.length < 200_000) return setParsedInput(input);
    const t = setTimeout(() => setParsedInput(input), 300);
    return () => clearTimeout(t);
  }, [input]);
  const parsed = useMemo(() => parseJson(parsedInput), [parsedInput]);
  const info = useMemo(() => (parsed.ok ? stats(parsed.value) : null), [parsed]);

  // Keep the last good graph on screen while the user is mid-edit.
  const lastGood = useRef(parsed.ok ? parsed.value : null);
  if (parsed.ok) lastGood.current = parsed.value;
  const graphValue = lastGood.current;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('easyjson.theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (input.length < 2_000_000) localStorage.setItem(DOC_KEY, input);
      } catch {
        /* quota */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 1800);
  }, []);

  const loadText = (text: string, name?: string) => {
    setInput(text);
    setSelected(null);
    setAiScope(null);
    setFileName(name ?? 'untitled.json');
    if (name) flash(`Opened ${name}`);
  };

  const openFile = async (file: File) => loadText(await file.text(), file.name);

  const download = () => {
    const blob = new Blob([input], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
    a.click();
    URL.revokeObjectURL(url);
  };

  const doFormat = () => parsed.ok && setInput(format(parsed.value));
  const doMinify = () => parsed.ok && setInput(minify(parsed.value));
  const doQuickFix = () => {
    const r = quickRepair(input);
    if (r.ok) {
      setInput(r.text);
      flash('Repaired');
    } else flash("Couldn't repair automatically. Try the AI fix.");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        doFormat();
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAiOpen((v) => !v);
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        download();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Draggable splitter
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = mainRef.current;
    if (!el) return;
    const vertical = window.innerWidth < 768;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const pct = vertical ? ((ev.clientY - r.top) / r.height) * 100 : ((ev.clientX - r.left) / r.width) * 100;
      setSplit(Math.min(75, Math.max(18, pct)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.userSelect = '';
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const showEditor = view !== 'graph';
  const showGraph = view !== 'editor';
  const provider = getProvider(aiSettings.providerId);
  const model = currentSettings(aiSettings).model;

  return (
    <div
      className="flex h-full flex-col"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) openFile(f);
      }}
    >
      {/* Top bar, GitHub-style: brand + breadcrumb, actions, then underline tabs */}
      <header className="shrink-0 border-b border-border bg-muted">
        <div className="flex h-12 items-center gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <a href="/" className="flex items-center gap-2 rounded-md hover:opacity-80" title="EasyJSON home">
              <Logo />
              <span className="text-sm font-semibold">EasyJSON</span>
            </a>
            <span className="text-faint">/</span>
            <span className="truncate text-sm text-muted-foreground" title={fileName}>
              {fileName}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={(e) => e.target.files?.[0] && openFile(e.target.files[0])} />
            <Button variant="outline" size="sm" className="h-7" onClick={() => fileRef.current?.click()}>
              <FolderOpen size={14} /> <span className="hidden sm:inline">Open</span>
            </Button>
            <IconButton label="Download" shortcut="⌘S" variant="outline" size="icon-sm" onClick={download} className="hidden sm:inline-flex">
              <Download size={14} />
            </IconButton>
            <IconButton label={dark ? 'Light theme' : 'Dark theme'} variant="outline" size="icon-sm" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </IconButton>
            <Button variant={aiOpen ? 'outline' : 'default'} size="sm" className="h-7" onClick={() => setAiOpen((v) => !v)}>
              <Sparkles size={14} /> <span className="hidden sm:inline">Ask AI</span>
              <kbd className="ml-0.5 hidden rounded border border-current/30 px-1 font-mono text-[10px] opacity-60 md:inline">⌘K</kbd>
            </Button>
          </div>
        </div>
        <nav className="-mb-px flex gap-1 overflow-x-auto px-2 sm:px-3" aria-label="Layout">
          <Tab active={view === 'editor'} onClick={() => setView('editor')} icon={<Code2 size={15} />} label="Code" />
          <Tab active={view === 'split'} onClick={() => setView('split')} icon={<Columns2 size={15} />} label="Split" className="hidden sm:flex" />
          <Tab active={view === 'graph'} onClick={() => setView('graph')} icon={<Network size={15} />} label="Graph" count={info?.nodes} />
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
        <main ref={mainRef} className="flex min-w-0 flex-1 flex-col md:flex-row">
          {showEditor && (
            <section
              className="flex min-h-0 min-w-0 flex-col border-border bg-background md:border-r"
              style={view === 'split' ? { flexBasis: `${split}%`, flexGrow: 0, flexShrink: 0 } : { flex: 1 }}
            >
              <div className="flex h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-muted px-2 [&>*]:shrink-0">
                <Button variant="outline" size="sm" onClick={doFormat} disabled={!parsed.ok} title="Format (⇧⌘F)">
                  <AlignLeft size={13} /> Format
                </Button>
                <Button variant="outline" size="sm" onClick={doMinify} disabled={!parsed.ok}>
                  <Minimize2 size={13} /> Minify
                </Button>
                {parsed.error && (
                  <Button variant="outline" size="sm" className="text-warning hover:text-warning" onClick={doQuickFix} title="Repair common syntax mistakes offline">
                    <Wrench size={13} /> Quick fix
                  </Button>
                )}
                <div className="ml-auto flex items-center">
                  <IconButton
                    label="Copy all"
                    size="icon-sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(input);
                      flash('Copied');
                    }}
                  >
                    <Copy size={13} />
                  </IconButton>
                  <IconButton label="Clear" size="icon-sm" onClick={() => loadText('')}>
                    <Trash2 size={13} />
                  </IconButton>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <JsonEditor ref={editorRef} value={input} onChange={setInput} error={parsed.error} />
              </div>
            </section>
          )}

          {view === 'split' && (
            <div
              onPointerDown={startDrag}
              className="group relative z-10 h-1.5 shrink-0 cursor-row-resize bg-border/60 md:h-auto md:w-1.5 md:cursor-col-resize md:bg-transparent"
              role="separator"
              aria-orientation="vertical"
            >
              <span className="absolute inset-0 m-auto h-1 w-10 rounded-full bg-border-strong opacity-0 transition-opacity group-hover:opacity-100 md:h-10 md:w-1" />
            </div>
          )}

          {showGraph && (
            <section className="relative min-h-0 min-w-0 flex-1 bg-canvas">
              {graphValue !== null ? (
                <>
                  <GraphCanvas value={graphValue} dark={dark} selected={selected} onSelect={setSelected} />
                  {selected && (
                    <Inspector
                      root={graphValue}
                      segs={selected}
                      onClose={() => setSelected(null)}
                      onAskAI={(s) => {
                        setAiScope(s);
                        setAiOpen(true);
                      }}
                    />
                  )}
                  {!parsed.ok && parsed.error && (
                    <div className="absolute bottom-3 right-3 max-w-xs rounded-lg border border-destructive/30 bg-card px-3 py-2 text-[12px] text-muted-foreground shadow-node">
                      Showing the last valid version while you fix the error.
                    </div>
                  )}
                </>
              ) : (
                <EmptyGraph hasError={!!parsed.error} onSample={() => loadText(SAMPLE)} onAI={() => setAiOpen(true)} />
              )}
            </section>
          )}
        </main>

        {aiOpen && (
          <div className="fixed inset-0 z-30 md:static md:z-auto md:w-[380px] md:shrink-0 md:border-l md:border-border">
            <AIPanel
              settings={aiSettings}
              setSettings={setAiSettings}
              input={input}
              value={parsed.ok ? parsed.value : null}
              error={parsed.error}
              scope={aiScope}
              onClearScope={() => setAiScope(null)}
              onApply={(text) => {
                setInput(text);
                flash('Changes applied');
              }}
              onClose={() => setAiOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-border bg-muted px-3 text-[11.5px] text-faint">
        {parsed.ok ? (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 size={12} /> Valid JSON
          </span>
        ) : parsed.error ? (
          <button className="flex min-w-0 items-center gap-1 text-destructive hover:underline" onClick={() => editorRef.current?.goTo(parsed.error!.offset)}>
            <AlertCircle size={12} className="shrink-0" />
            <span className="truncate">
              Line {parsed.error.line}, col {parsed.error.column}: {parsed.error.message}
            </span>
          </button>
        ) : (
          <span>Empty</span>
        )}
        {info && (
          <span className="hidden sm:inline">
            {info.nodes.toLocaleString()} values · depth {info.depth}
          </span>
        )}
        <span className="hidden sm:inline">{formatBytes(new Blob([input]).size)}</span>
        <button className="ml-auto flex items-center gap-1.5 hover:text-foreground" onClick={() => setAiOpen(true)}>
          <Sparkles size={11} />
          {provider.label}
          {model ? ` · ${model}` : ''}
        </button>
      </footer>

      {dragging && (
        <div className="pointer-events-none fixed inset-3 z-50 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/10 text-sm font-medium text-primary backdrop-blur-sm">
          Drop a JSON file to open it
        </div>
      )}
      {toast && (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 animate-in rounded-lg bg-foreground px-3 py-1.5 text-[12.5px] text-canvas shadow-pop">{toast}</div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
  count,
  className,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex h-10 items-center gap-2 px-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
        'after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full',
        active ? 'font-semibold text-foreground after:bg-foreground' : 'after:bg-transparent',
        className,
      )}
    >
      <span className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent">
        {icon}
        {label}
        {count !== undefined && <span className="rounded-full bg-secondary px-1.5 text-xs font-medium text-muted-foreground">{count.toLocaleString()}</span>}
      </span>
    </button>
  );
}

function EmptyGraph({ hasError, onSample, onAI }: { hasError: boolean; onSample: () => void; onAI: () => void }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card shadow-node">
          <Network size={24} className="text-primary" />
        </div>
        <h2 className="text-[15px] font-semibold">{hasError ? 'Fix the JSON to see its graph' : 'Nothing to visualize yet'}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {hasError
            ? 'Use Quick fix in the editor, or let a local AI model repair it for you.'
            : 'Paste JSON in the editor, drop a file here, or ask a local model to generate some data.'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {!hasError && (
            <Button variant="outline" onClick={onSample}>
              Load sample
            </Button>
          )}
          <Button variant="default" onClick={onAI}>
            <Sparkles size={14} /> {hasError ? 'Fix with AI' : 'Generate with AI'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
