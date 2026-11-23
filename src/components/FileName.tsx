import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Keeps names safe to download: no path separators or reserved characters, always a .json extension. */
export function cleanFileName(raw: string, fallback = 'untitled.json') {
  // eslint-disable-next-line no-control-regex
  let name = raw.replace(/[\\/:]+/g, '-').replace(/[*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim();
  if (!name || name === '.json') return fallback;
  if (!/\.[a-z0-9]+$/i.test(name)) name += '.json';
  return name.slice(0, 120);
}

/** GitHub-style breadcrumb file name that turns into an input on click. Enter or blur saves, Escape cancels. */
export function FileName({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = input.current;
    if (!el) return;
    el.focus();
    // Select the base name only, like a file manager does.
    const dot = value.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 ? dot : value.length);
  }, [editing, value]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    onChange(cleanFileName(draft, value));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        aria-label="File name"
        spellCheck={false}
        className="h-7 min-w-0 max-w-[50vw] rounded-md border border-ring bg-background px-2 text-sm text-foreground outline-none ring-1 ring-ring"
        style={{ width: `${Math.min(Math.max(draft.length + 2, 12), 40)}ch` }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title="Rename file"
      aria-label={`File name: ${value}. Click to rename`}
      className={cn(
        'group flex h-7 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-sm text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
      )}
    >
      <span className="truncate">{value}</span>
      <Pencil size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
    </button>
  );
}
