import { useMemo } from 'react';
import { diffLines } from 'diff';
import { cn } from '@/lib/utils';

type Line = { kind: 'add' | 'del' | 'same' | 'gap'; text: string; n?: number };
const CONTEXT = 3;

export function useDiff(before: string, after: string) {
  return useMemo(() => {
    const parts = diffLines(before, after);
    const raw: Line[] = [];
    let added = 0;
    let removed = 0;
    for (const p of parts) {
      const lines = p.value.replace(/\n$/, '').split('\n');
      const kind = p.added ? 'add' : p.removed ? 'del' : 'same';
      if (kind === 'add') added += lines.length;
      if (kind === 'del') removed += lines.length;
      for (const text of lines) raw.push({ kind, text });
    }
    // Collapse long unchanged stretches, keeping a little context around edits.
    const keep = raw.map((l, i) => l.kind !== 'same' || raw.slice(Math.max(0, i - CONTEXT), i + CONTEXT + 1).some((x) => x.kind !== 'same'));
    const lines: Line[] = [];
    for (let i = 0; i < raw.length; i++) {
      if (keep[i]) lines.push(raw[i]);
      else {
        let j = i;
        while (j < raw.length && !keep[j]) j++;
        lines.push({ kind: 'gap', text: '', n: j - i });
        i = j - 1;
      }
    }
    return { lines, added, removed };
  }, [before, after]);
}

export function DiffView({ lines }: { lines: Line[] }) {
  return (
    <div className="max-h-[50vh] overflow-auto rounded-lg border border-border bg-muted font-mono text-[11.5px] leading-[1.55]">
      {lines.map((l, i) =>
        l.kind === 'gap' ? (
          <div key={i} className="bg-muted px-3 py-0.5 text-[10.5px] text-faint">
            ⋯ {l.n} unchanged line{l.n === 1 ? '' : 's'}
          </div>
        ) : (
          <div
            key={i}
            className={cn(
              'flex whitespace-pre px-1',
              l.kind === 'add' && 'bg-success/10 text-foreground',
              l.kind === 'del' && 'bg-destructive/10 text-muted-foreground line-through decoration-destructive/40',
              l.kind === 'same' && 'text-muted-foreground',
            )}
          >
            <span className={cn('w-4 shrink-0 select-none text-center', l.kind === 'add' ? 'text-success' : l.kind === 'del' ? 'text-destructive' : 'text-transparent')}>
              {l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ' '}
            </span>
            <span>{l.text || ' '}</span>
          </div>
        ),
      )}
    </div>
  );
}
