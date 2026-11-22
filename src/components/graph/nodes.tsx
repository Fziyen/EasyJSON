import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Braces, Brackets, ChevronRight, Plus } from 'lucide-react';
import type { CardNode as CardNodeT, Direction, KeyNode as KeyNodeT, Row } from '@/lib/graph';
import type { JsonType } from '@/lib/json';
import { cn } from '@/lib/utils';

const valueClass: Record<JsonType, string> = {
  string: 'text-j-string',
  number: 'text-j-number',
  boolean: 'text-j-bool',
  null: 'text-j-null italic',
  object: 'text-faint',
  array: 'text-faint',
};

function Handles({ dir }: { dir: Direction }) {
  return (
    <>
      <Handle type="target" position={dir === 'LR' ? Position.Left : Position.Top} isConnectable={false} />
      <Handle type="source" position={dir === 'LR' ? Position.Right : Position.Bottom} isConnectable={false} />
    </>
  );
}

const ring = (match?: boolean, active?: boolean, selected?: boolean) =>
  cn(
    'transition-[box-shadow,border-color] duration-150',
    selected ? 'border-primary ring-2 ring-primary/30' : active ? 'border-primary' : match ? 'border-warning ring-2 ring-warning/30' : 'border-border hover:border-border-strong',
  );

function RowView({ row }: { row: Row }) {
  return (
    <div className="flex h-6 items-center gap-2 px-3 font-mono text-[12px]" title={`${row.path}`}>
      <span className="shrink-0 text-j-key">
        {row.key}
        <span className="text-faint">:</span>
      </span>
      <span className={cn('ml-auto truncate text-right', valueClass[row.type])}>{row.display}</span>
    </div>
  );
}

export const CardNode = memo(function CardNode({ data, selected }: NodeProps<CardNodeT>) {
  const Icon = data.variant === 'list' ? Brackets : Braces;
  return (
    <div
      style={{ width: data.width, height: data.height }}
      className={cn('overflow-hidden rounded-md border bg-card shadow-node', ring(data.match, data.active, selected))}
    >
      <Handles dir={data.dir} />
      <div className="flex h-[30px] items-center gap-1.5 border-b border-border/70 bg-muted px-3 text-[11.5px]">
        <Icon size={12} className={data.variant === 'list' ? 'text-j-number' : 'text-primary'} />
        <span className="truncate font-medium text-muted-foreground">{data.title}</span>
        {data.nested > 0 && (
          <span className="ml-auto rounded-md bg-secondary px-1.5 py-px font-mono text-[10px] text-primary">+{data.nested}</span>
        )}
      </div>
      {data.rows.length > 0 && (
        <div className="py-1">
          {data.rows.map((r) => (
            <RowView key={r.path} row={r} />
          ))}
        </div>
      )}
    </div>
  );
});

export const KeyNode = memo(function KeyNode({ data, selected }: NodeProps<KeyNodeT>) {
  const isArr = data.type === 'array';
  return (
    <div
      style={{ width: data.width, height: data.height }}
      className={cn(
        'flex items-center gap-1.5 rounded-full border bg-card pl-2 pr-1 font-mono text-[12px] shadow-node',
        ring(data.match, data.active, selected),
      )}
      title={data.collapsed ? 'Click to expand' : 'Click to collapse'}
    >
      <Handles dir={data.dir} />
      <span data-toggle className={cn('grid h-4 w-4 place-items-center rounded-full hover:bg-primary/20', data.collapsed ? 'bg-primary text-primary-foreground' : 'text-faint')}>
        {data.collapsed ? <Plus size={10} strokeWidth={3} /> : <ChevronRight size={12} className={data.dir === 'TB' ? 'rotate-90' : ''} />}
      </span>
      <span className="truncate text-j-key">{data.label}</span>
      <span
        className={cn(
          'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10.5px]',
          'bg-secondary text-muted-foreground',
        )}
      >
        {isArr ? `[${data.count}]` : `{${data.count}}`}
      </span>
    </div>
  );
});

export const nodeTypes = { card: CardNode, key: KeyNode };
