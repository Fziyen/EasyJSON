import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Cpu, Loader2, RefreshCw, Sparkles, Square, Wand2, X, Wrench, Target } from 'lucide-react';
import { getProvider, providers } from '@/ai/registry';
import { currentSettings, type AISettings } from '@/ai/settings';
import { editJson, fixJson } from '@/ai/tasks';
import { AIError } from '@/ai/types';
import { format, getAtPath, quickRepair, segsToPath, setAtPath, type JsonError, type JsonValue } from '@/lib/json';
import type { Segs } from '@/lib/graph';
import { Button, IconButton } from '@/components/ui/IconButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DiffView, useDiff } from './DiffView';
import { cn } from '@/lib/utils';

type Status = { state: 'idle' | 'checking' } | { state: 'ok'; count: number } | { state: 'error'; message: string };
type Proposal = { title: string; before: string; after: string };

interface Props {
  settings: AISettings;
  setSettings: (fn: (s: AISettings) => AISettings) => void;
  input: string;
  value: JsonValue | null;
  error: JsonError | null;
  scope: Segs | null;
  onClearScope: () => void;
  onApply: (text: string) => void;
  onClose: () => void;
}

const SUGGESTIONS = [
  'Add 5 more entries that match the existing ones',
  'Fill every null value with realistic data',
  'Add a realistic "email" field to each person',
  'Translate all string values to Spanish',
];
const CREATE_SUGGESTIONS = ['A product catalog with 6 items, prices and nested variants', 'A user profile with address, preferences and recent orders'];

export function AIPanel({ settings, setSettings, input, value, error, scope, onClearScope, onApply, onClose }: Props) {
  const provider = getProvider(settings.providerId);
  const ps = currentSettings(settings);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const [showConn, setShowConn] = useState(!ps.model);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<null | 'fix' | 'edit'>(null);
  const [stream, setStream] = useState('');
  const [failure, setFailure] = useState<{ message: string; detail?: string } | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const update = (patch: Partial<typeof ps>) =>
    setSettings((s) => ({ ...s, byProvider: { ...s.byProvider, [provider.id]: { ...currentSettings(s), ...patch } } }));

  const refresh = useCallback(async () => {
    setStatus({ state: 'checking' });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const list = await provider.listModels(ps, ctrl.signal);
      setModels(list);
      setStatus({ state: 'ok', count: list.length });
      if (list.length && !list.includes(ps.model)) update({ model: list[0] });
    } catch (e) {
      setModels([]);
      const msg = (e as Error).name === 'AbortError' ? `No answer from ${ps.baseUrl}. Is ${provider.label} running?` : (e as Error).message;
      setStatus({ state: 'error', message: msg });
    } finally {
      clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, ps.baseUrl, ps.apiKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const scopeValue = scope && value !== null ? getAtPath(value, scope) : undefined;
  const scopeLabel = scope && scopeValue !== undefined && scope.length ? segsToPath(scope) : null;

  async function go(kind: 'fix' | 'edit') {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(kind);
    setStream('');
    setFailure(null);
    setProposal(null);
    const opts = { provider, settings: ps, signal: ctrl.signal, onToken: (t: string) => setStream((s) => (s + t).slice(-4000)) };
    try {
      if (kind === 'fix') {
        const fixed = await fixJson(opts, input, error);
        setProposal({ title: 'AI fix', before: input, after: format(fixed) });
      } else {
        const target = scopeLabel ? (scopeValue as JsonValue) : value;
        const result = await editJson(opts, target, prompt.trim(), scopeLabel ?? undefined);
        const next = scopeLabel && value !== null ? setAtPath(value, scope!, result) : result;
        setProposal({ title: scopeLabel ? `Edit ${scopeLabel}` : value === null ? 'New data' : 'Edit', before: value === null ? input : format(value), after: format(next) });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setFailure({ message: (e as Error).message, detail: e instanceof AIError ? e.detail : undefined });
    } finally {
      setBusy(null);
    }
  }

  const quick = () => {
    const r = quickRepair(input);
    setFailure(null);
    if (r.ok) setProposal({ title: 'Quick fix', before: input, after: r.text });
    else setFailure({ message: `Quick fix couldn't repair this: ${r.message}`, detail: 'Try the AI fix instead.' });
  };

  const invalid = !!error;
  const empty = !input.trim();
  const ready = status.state === 'ok' && !!ps.model;

  return (
    <aside className="flex h-full w-full flex-col bg-card md:animate-drawer">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-sm font-semibold">AI assistant</h2>
        <Badge>Local models</Badge>
        <IconButton label="Close AI panel" className="ml-auto" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {/* Connection */}
        <section className="rounded-md border border-border bg-muted">
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left" onClick={() => setShowConn((v) => !v)}>
            <Cpu size={15} className="text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">{provider.label}</div>
              <div className="truncate text-[11.5px] text-faint">{ps.model || 'No model selected'}</div>
            </div>
            <StatusDot status={status} />
            <ChevronDown size={15} className={cn('text-faint transition-transform', showConn && 'rotate-180')} />
          </button>
          {showConn && (
            <div className="space-y-3 border-t border-border px-3 pb-3 pt-3">
              <Field label="Provider">
                <Select value={provider.id} onValueChange={(id) => setSettings((s) => ({ ...s, providerId: id }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Server URL">
                <Input className="font-mono" value={ps.baseUrl} spellCheck={false} onChange={(e) => update({ baseUrl: e.target.value })} />
              </Field>
              {provider.needsApiKey && (
                <Field label="API key">
                  <Input className="font-mono" type="password" value={ps.apiKey ?? ''} onChange={(e) => update({ apiKey: e.target.value })} />
                </Field>
              )}
              <Field label="Model">
                <div className="flex gap-1.5">
                  {models.length ? (
                    <Select value={ps.model} onValueChange={(model) => update({ model })}>
                      <SelectTrigger className="font-mono text-[13px]">
                        <SelectValue placeholder="Choose a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m} value={m} className="font-mono text-[13px]">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="font-mono" placeholder="model name" value={ps.model} onChange={(e) => update({ model: e.target.value })} />
                  )}
                  <IconButton label="Refresh models" variant="outline" className="shrink-0" onClick={refresh}>
                    <RefreshCw size={14} className={status.state === 'checking' ? 'animate-spin' : ''} />
                  </IconButton>
                </div>
              </Field>
              {status.state === 'error' && <p className="rounded-md bg-destructive/10 px-2.5 py-2 text-[12px] text-destructive">{status.message}</p>}
              {status.state === 'ok' && status.count === 0 && (
                <p className="rounded-md bg-warning/10 px-2.5 py-2 text-[12px] text-warning">Connected, but no models are installed yet.</p>
              )}
              <p className="text-[11.5px] leading-relaxed text-faint">{provider.hint}</p>
            </div>
          )}
        </section>

        {/* Fix */}
        {invalid && (
          <section className="space-y-2.5 rounded-md border border-destructive/30 bg-destructive/[.06] p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-destructive" />
              <div className="text-[12.5px]">
                <div className="font-medium text-foreground">Your JSON has a syntax error</div>
                <div className="text-muted-foreground">
                  {error!.message} · line {error!.line}, col {error!.column}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={quick} disabled={!!busy}>
                <Wrench size={14} /> Quick fix
              </Button>
              <Button variant="default" onClick={() => go('fix')} disabled={!ready || !!busy}>
                {busy === 'fix' ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Fix with AI
              </Button>
            </div>
            <p className="text-[11px] text-faint">Quick fix runs offline and handles common mistakes. The AI fix copes with messier input.</p>
          </section>
        )}

        {/* Generate / edit */}
        {!invalid && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-faint">{empty ? 'Create data' : 'Edit or extend'}</h3>
              {!empty && (
                <span className="flex min-w-0 items-center gap-1 rounded-md bg-secondary py-0.5 pl-1.5 pr-0.5 font-mono text-[11px] text-muted-foreground" title="What the AI will change">
                  <Target size={11} />
                  <span className="truncate">{scopeLabel ?? 'whole document'}</span>
                  {scopeLabel && (
                    <button onClick={onClearScope} className="rounded p-0.5 hover:bg-secondary" aria-label="Use whole document">
                      <X size={11} />
                    </button>
                  )}
                </span>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim() && ready && !busy) go('edit');
              }}
              rows={4}
              placeholder={empty ? 'Describe the JSON you want, e.g. "10 fake customers with orders"' : 'What should change? e.g. "Add 3 more users"'}
              className="min-h-[96px] resize-y leading-relaxed"
            />
            <div className="flex flex-wrap gap-1.5">
              {(empty ? CREATE_SUGGESTIONS : SUGGESTIONS).map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <Button variant="default" className="w-full" disabled={!ready || !prompt.trim() || !!busy} onClick={() => go('edit')}>
              {busy === 'edit' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {empty ? 'Generate' : 'Apply with AI'}
            </Button>
            {!ready && <p className="text-center text-[11.5px] text-faint">Connect a local model above to enable AI actions.</p>}
          </section>
        )}

        {/* Streaming */}
        {busy && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Loader2 size={13} className="animate-spin text-primary" />
              {stream ? 'Writing…' : `Waiting for ${ps.model}…`}
              <Button variant="ghost" className="ml-auto h-7 px-2 text-[12px]" onClick={() => abortRef.current?.abort()}>
                <Square size={11} className="fill-current" /> Stop
              </Button>
            </div>
            {stream && (
              <pre className="max-h-48 overflow-hidden whitespace-pre-wrap break-all rounded-md border border-border bg-muted p-2 font-mono text-[11px] leading-relaxed text-faint [mask-image:linear-gradient(to_bottom,transparent,black_30%)]">
                {stream.slice(-1200)}
              </pre>
            )}
          </section>
        )}

        {failure && (
          <section className="space-y-1.5 rounded-md border border-destructive/30 bg-destructive/[.06] p-3 text-[12.5px]">
            <div className="font-medium text-destructive">{failure.message}</div>
            {failure.detail && (
              <details className="text-muted-foreground">
                <summary className="cursor-pointer text-[11.5px]">Details</summary>
                <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{failure.detail}</pre>
              </details>
            )}
          </section>
        )}

        {proposal && (
          <ProposalView
            proposal={proposal}
            onAccept={() => {
              onApply(proposal.after);
              setProposal(null);
              setPrompt('');
            }}
            onDiscard={() => setProposal(null)}
          />
        )}
      </div>
    </aside>
  );
}

function ProposalView({ proposal, onAccept, onDiscard }: { proposal: Proposal; onAccept: () => void; onDiscard: () => void }) {
  const { lines, added, removed } = useDiff(proposal.before, proposal.after);
  const same = added === 0 && removed === 0;
  return (
    <section className="animate-in space-y-2">
      <div className="flex items-center gap-2 text-[12.5px]">
        <span className="font-medium">{proposal.title}</span>
        <span className="font-mono text-[11px] text-success">+{added}</span>
        <span className="font-mono text-[11px] text-destructive">−{removed}</span>
      </div>
      {same ? <p className="text-[12px] text-muted-foreground">No changes were suggested.</p> : <DiffView lines={lines} />}
      <div className="flex gap-2">
        <Button variant="default" className="flex-1" onClick={onAccept} disabled={same}>
          <Check size={14} /> Accept
        </Button>
        <Button variant="outline" className="flex-1" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </section>
  );
}

function StatusDot({ status }: { status: Status }) {
  const map = {
    idle: ['bg-faint', 'Not checked'],
    checking: ['bg-warning animate-pulse', 'Checking…'],
    ok: ['bg-success', 'Connected'],
    error: ['bg-destructive', 'Not reachable'],
  } as const;
  const [cls, label] = map[status.state];
  return <span className={cn('h-2 w-2 rounded-full', cls)} title={label} aria-label={label} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
