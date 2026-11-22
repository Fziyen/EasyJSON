import { useState } from 'react';
import { Check, Copy, Sparkles, X } from 'lucide-react';
import { format, getAtPath, segsToPath, typeOf, isContainer, type JsonValue } from '@/lib/json';
import type { Segs } from '@/lib/graph';
import { IconButton } from '@/components/ui/IconButton';

interface Props {
  root: JsonValue;
  segs: Segs;
  onClose: () => void;
  onAskAI: (segs: Segs) => void;
}

const MAX_PREVIEW = 6000;

export function Inspector({ root, segs, onClose, onAskAI }: Props) {
  const value = getAtPath(root, segs);
  const [copied, setCopied] = useState<'path' | 'value' | null>(null);
  if (value === undefined) return null;

  const path = segsToPath(segs);
  const text = format(value);
  const type = typeOf(value);
  const size = isContainer(value) ? (Array.isArray(value) ? `${value.length} items` : `${Object.keys(value).length} keys`) : null;

  const copy = async (what: 'path' | 'value') => {
    await navigator.clipboard.writeText(what === 'path' ? path : text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <aside className="absolute right-3 top-16 z-10 flex max-h-[calc(100%-5rem)] w-[min(360px,calc(100%-1.5rem))] animate-in flex-col overflow-hidden rounded-md border border-border bg-card shadow-pop">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-primary">{type}</span>
        {size && <span className="text-[11px] text-faint">{size}</span>}
        <IconButton label="Close inspector" className="ml-auto h-7 w-7" onClick={onClose}>
          <X size={14} />
        </IconButton>
      </header>
      <button
        onClick={() => copy('path')}
        className="group flex items-center gap-2 border-b border-border px-3 py-2 text-left font-mono text-[11.5px] text-muted-foreground hover:bg-muted"
        title="Copy path"
      >
        <span className="truncate">{path}</span>
        {copied === 'path' ? <Check size={13} className="ml-auto shrink-0 text-success" /> : <Copy size={13} className="ml-auto shrink-0 opacity-0 group-hover:opacity-60" />}
      </button>
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-all bg-muted px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground">
        {text.length > MAX_PREVIEW ? text.slice(0, MAX_PREVIEW) + '\n…' : text}
      </pre>
      <footer className="flex items-center gap-1 border-t border-border p-1.5">
        <button onClick={() => copy('value')} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground">
          {copied === 'value' ? <Check size={14} className="text-success" /> : <Copy size={14} />} Copy value
        </button>
        {isContainer(value) && (
          <button
            onClick={() => onAskAI(segs)}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-primary hover:bg-primary/10"
          >
            <Sparkles size={14} /> Edit with AI
          </button>
        )}
      </footer>
    </aside>
  );
}
