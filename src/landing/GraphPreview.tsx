import { useEffect, useRef, useState } from 'react';
import { Braces, Brackets, ChevronRight, Code2, Columns2, Network, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';

/** A static, lightweight picture of the app for the hero. No graph library is loaded on the landing page. */
const W = 760;
const H = 400;

type Row = [string, string, 's' | 'n' | 'b' | 'z'];
const tone = { s: 'text-j-string', n: 'text-j-number', b: 'text-j-bool', z: 'text-j-null italic' };

function Card({ x, y, w, title, rows, list }: { x: number; y: number; w: number; title: string; rows: Row[]; list?: boolean }) {
  const Icon = list ? Brackets : Braces;
  return (
    <div className="absolute overflow-hidden rounded-md border bg-card shadow-node" style={{ left: x, top: y, width: w }}>
      <div className="flex h-6 items-center gap-1.5 border-b bg-muted px-2 text-[10px] text-muted-foreground">
        <Icon size={10} />
        {title}
      </div>
      <div className="py-0.5">
        {rows.map(([k, v, t]) => (
          <div key={k} className="flex h-[18px] items-center px-2 font-mono text-[10px]">
            <span className="text-j-key">
              {k}
              <span className="text-faint">:</span>
            </span>
            <span className={`ml-auto truncate pl-2 ${tone[t]}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pill({ x, y, label, count }: { x: number; y: number; label: string; count: string }) {
  return (
    <div className="absolute flex h-6 items-center gap-1 rounded-full border bg-card pl-1.5 pr-1 font-mono text-[10px] shadow-node" style={{ left: x, top: y }}>
      <ChevronRight size={10} className="text-faint" />
      <span className="text-j-key">{label}</span>
      <span className="ml-1 rounded-full bg-secondary px-1.5 text-[9px] text-muted-foreground">{count}</span>
    </div>
  );
}

const edge = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} H${mx - 6} Q${mx},${y1} ${mx},${y1 + Math.sign(y2 - y1) * 6} V${y2 - Math.sign(y2 - y1) * 6} Q${mx},${y2} ${mx + 6},${y2} H${x2}`;
};

export function GraphPreview() {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1.35, el.clientWidth / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-pop">
      {/* window chrome */}
      <div className="flex h-9 items-center gap-2 border-b bg-muted px-3">
        <Logo size={16} />
        <span className="text-xs font-semibold">EasyJSON</span>
        <span className="text-xs text-faint">/ store.json</span>
        <span className="ml-auto inline-flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground">
          <Sparkles size={11} /> Ask AI
        </span>
      </div>
      <div className="flex gap-3 border-b bg-muted px-3 text-xs text-muted-foreground">
        <span className="flex h-8 items-center gap-1.5"><Code2 size={12} /> Code</span>
        <span className="flex h-8 items-center gap-1.5 border-b-2 border-foreground font-semibold text-foreground"><Columns2 size={12} /> Split</span>
        <span className="flex h-8 items-center gap-1.5"><Network size={12} /> Graph</span>
      </div>
      <div ref={box} className="relative overflow-hidden" style={{ height: H * scale }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <div className="absolute inset-y-0 left-0 w-[210px] border-r bg-background p-3 font-mono text-[10.5px] leading-[1.7]">
            <div>{'{'}</div>
            <div className="pl-3"><span className="text-j-key">"store"</span>: <span className="text-j-string">"Northwind"</span>,</div>
            <div className="pl-3"><span className="text-j-key">"open"</span>: <span className="text-j-bool">true</span>,</div>
            <div className="pl-3"><span className="text-j-key">"rating"</span>: <span className="text-j-number">4.7</span>,</div>
            <div className="pl-3"><span className="text-j-key">"owner"</span>: {'{'}</div>
            <div className="pl-6"><span className="text-j-key">"name"</span>: <span className="text-j-string">"Mara"</span>,</div>
            <div className="pl-6"><span className="text-j-key">"site"</span>: <span className="italic text-j-null">null</span></div>
            <div className="pl-3">{'},'}</div>
            <div className="pl-3"><span className="text-j-key">"tags"</span>: [</div>
            <div className="pl-6"><span className="text-j-string">"indoor"</span>,</div>
            <div className="pl-6"><span className="text-j-string">"workshops"</span></div>
            <div className="pl-3">],</div>
            <div className="pl-3"><span className="text-j-key">"products"</span>: [ … ]</div>
            <div>{'}'}</div>
          </div>
          <div
            className="absolute inset-y-0 left-[210px] right-0 bg-canvas"
            style={{ backgroundImage: 'radial-gradient(hsl(var(--border-strong)/.7) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
          >
            <svg className="absolute inset-0 h-full w-full" fill="none">
              <g stroke="hsl(var(--border-strong))" strokeWidth="1.25">
                <path d={edge(150, 200, 196, 82)} />
                <path d={edge(150, 200, 196, 200)} />
                <path d={edge(150, 200, 196, 318)} />
                <path d={edge(282, 82, 318, 82)} />
                <path d={edge(276, 200, 318, 200)} />
                <path d={edge(298, 318, 318, 270)} />
                <path d={edge(298, 318, 318, 354)} />
              </g>
            </svg>
            <Card x={12} y={152} w={138} title="root" rows={[['store', '"Northwind"', 's'], ['open', 'true', 'b'], ['rating', '4.7', 'n']]} />
            <Pill x={196} y={70} label="owner" count="{2}" />
            <Pill x={196} y={188} label="tags" count="[2]" />
            <Pill x={196} y={306} label="products" count="[2]" />
            <Card x={318} y={50} w={176} title="owner" rows={[['name', '"Mara"', 's'], ['site', 'null', 'z']]} />
            <Card x={318} y={168} w={176} title="tags" list rows={[['0', '"indoor"', 's'], ['1', '"workshops"', 's']]} />
            <Card x={318} y={238} w={176} title="products[0]" rows={[['sku', '"NP-001"', 's'], ['price', '34.5', 'n']]} />
            <Card x={318} y={322} w={176} title="products[1]" rows={[['sku', '"NP-002"', 's'], ['price', '22', 'n']]} />
          </div>
        </div>
      </div>
    </div>
  );
}
