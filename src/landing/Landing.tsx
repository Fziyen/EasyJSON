import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Braces,
  Check,
  Cloud,
  Copy,
  Cpu,
  EyeOff,
  GitCompare,
  HardDrive,
  Keyboard,
  Laptop,
  ChevronRight,
  Moon,
  Network,
  Search,
  ServerOff,
  Sparkles,
  Sun,
  Target,
  UserX,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GraphPreview } from './GraphPreview';

const APP = '/app/';

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('easyjson.theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);
  return [dark, setDark] as const;
}

export default function Landing() {
  const [dark, setDark] = useTheme();
  return (
    <div className="min-h-full bg-background">
      <Nav dark={dark} onTheme={() => setDark((d) => !d)} />
      <main>
        <Hero />
        <Features />
        <Privacy />
        <HowItWorks />
        <LocalAI />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>;
}

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</div>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {children && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{children}</p>}
    </div>
  );
}

function Nav({ dark, onTheme }: { dark: boolean; onTheme: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-muted/90 backdrop-blur">
      <Container className="flex h-14 items-center gap-6">
        <a href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold">EasyJSON</span>
        </a>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#privacy" className="hover:text-foreground">Privacy</a>
          <a href="#local-ai" className="hover:text-foreground">Local AI</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={onTheme} aria-label={dark ? 'Light theme' : 'Dark theme'}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </Button>
          <Button asChild size="sm" className="h-7">
            <a href={APP}>
              Open editor <ArrowRight size={14} />
            </a>
          </Button>
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1fr_1.15fr] lg:py-24">
        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge className="gap-1"><WifiOff size={12} /> Works offline</Badge>
            <Badge className="gap-1"><EyeOff size={12} /> No tracking</Badge>
            <Badge className="gap-1"><UserX size={12} /> No account</Badge>
          </div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            See your JSON.
            <br />
            Fix it. Grow it.
            <br />
            <span className="text-muted-foreground">On your machine.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
            EasyJSON turns any JSON into an interactive graph you can explore, repairs broken files, and writes new data with AI models
            that run on your own computer. Your data never leaves it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={APP}>
                Open the editor <ArrowRight size={16} />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#local-ai">
                <Cpu size={16} /> Set up local AI
              </a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-faint">Free, no sign-up. Open it and paste your JSON.</p>
        </div>
        <GraphPreview />
      </Container>
    </section>
  );
}

const FEATURES = [
  { icon: Network, title: 'Interactive graph', body: 'Objects become cards, arrays become lists, nested data branches out. Pan, zoom, collapse branches and switch between horizontal and vertical layouts.' },
  { icon: Wrench, title: 'Instant validation', body: 'Errors are underlined as you type with the exact line and column. One click on Quick fix repairs trailing commas, comments, quotes and missing brackets offline.' },
  { icon: Sparkles, title: 'AI fix', body: 'For messier input, a local model repairs the syntax while keeping every key and value exactly as you wrote them.' },
  { icon: Braces, title: 'Generate and extend data', body: '“Add 5 more users”, “fill the nulls with realistic values”, “create a product catalog”. Describe it and the model writes it, in your existing structure.' },
  { icon: GitCompare, title: 'Review every change', body: 'AI output is shown as a line-by-line diff. Nothing touches your document until you press Accept.' },
  { icon: Target, title: 'Scoped edits', body: 'Select a node in the graph and choose Edit with AI to change just that branch, which keeps large documents fast even on small models.' },
  { icon: Search, title: 'Search and inspect', body: 'Find any key or value with ⌘F, jump between matches, and open a node to copy its path or value.' },
  { icon: Keyboard, title: 'Made for the keyboard', body: '⌘K for AI, ⇧⌘F to format, ⌘S to download. Drag a .json file anywhere to open it. Light and dark themes.' },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-14 border-b bg-muted/50 py-20">
      <Container>
        <SectionHead eyebrow="Features" title="Everything you need to understand a JSON file">
          Built for API responses, config files, exports and fixtures, whether they are ten lines long or ten thousand.
        </SectionHead>
        <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-background p-5">
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-md border bg-muted">
                <Icon size={16} />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

const GUARANTEES = [
  { icon: ServerOff, title: 'No backend', body: 'EasyJSON is a set of static files. There is no EasyJSON server to receive your data. Parsing, graphing and diffing all happen in your browser tab.' },
  { icon: HardDrive, title: 'Stored on your device', body: 'Your current document and settings are kept in your browser’s local storage so they are there when you come back. You can wipe it at any time from your browser settings.' },
  { icon: Cpu, title: 'AI on your hardware', body: 'AI requests go only to the model server you choose, by default Ollama or LM Studio on localhost. No API keys, no per-token bills.' },
  { icon: EyeOff, title: 'No tracking', body: 'No analytics, no cookies, no third-party scripts or fonts. The page makes no requests except for its own files and your local model.' },
  { icon: WifiOff, title: 'Works offline', body: 'After your first visit the app is cached on your device. Open it on a plane, on a locked-down network, or with Wi-Fi off.' },
  { icon: UserX, title: 'No account', body: 'Nothing to sign up for and nothing to log in to. Open the page and start working.' },
];

function Privacy() {
  return (
    <section id="privacy" className="scroll-mt-14 border-b py-20">
      <Container>
        <SectionHead eyebrow="Private by design" title="Your data stays on your computer. Full stop.">
          Pasting a production payload or customer export into a random website is a risk. EasyJSON is built so it never leaves your machine.
        </SectionHead>

        <LocalDiagram />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GUARANTEES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function LocalDiagram() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative rounded-lg border-2 border-dashed border-border-strong p-5 pt-8 sm:p-8 sm:pt-10">
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-background px-2 text-xs font-semibold">
          <Laptop size={14} /> Your computer
        </div>
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-md border bg-muted p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Logo size={18} /> EasyJSON in your browser
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Editor, validator, graph</li>
              <li>Document saved in local storage</li>
              <li>Cached for offline use</li>
            </ul>
          </div>
          <div className="flex flex-row items-center justify-center gap-2 text-xs text-muted-foreground sm:flex-col">
            <span className="font-mono">localhost</span>
            <ArrowRight size={16} className="rotate-90 sm:rotate-0" />
          </div>
          <div className="rounded-md border bg-muted p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Cpu size={16} /> Local model server
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Ollama, LM Studio, llama.cpp…</li>
              <li>Runs on your CPU or GPU</li>
              <li>Optional: only needed for AI</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="relative">
          <Cloud size={16} />
          <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-destructive" />
        </span>
        Nothing is sent to the cloud.
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Bring your JSON', body: 'Paste it, drop a file, or open one from disk. It is validated and drawn as a graph instantly.' },
    { title: 'Explore and fix', body: 'Walk the graph, search, collapse what you don’t need. Broken? Use Quick fix or let your local model repair it.' },
    { title: 'Grow it with AI', body: 'Describe what to add or change, review the diff, accept. Download the result or keep editing.' },
  ];
  return (
    <section className="border-b bg-muted/50 py-20">
      <Container>
        <SectionHead eyebrow="How it works" title="From messy JSON to a clear picture in seconds" />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-lg border bg-background p-5">
              <div className="mb-3 grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</div>
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function CodeLine({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-[13px]">
      <span className="select-none text-faint">$</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{children}</code>
      <button
        className="shrink-0 rounded p-1 text-muted-foreground opacity-60 hover:bg-accent hover:opacity-100"
        aria-label="Copy command"
        onClick={async () => {
          await navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function LocalAI() {
  const [tab, setTab] = useState<'ollama' | 'lmstudio' | 'other'>('ollama');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
  return (
    <section id="local-ai" className="scroll-mt-14 border-b py-20">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Local AI</div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bring your own model. Keep your own data.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            The graph, validator and Quick fix work with no setup. For AI features, run a model server on your computer. EasyJSON detects it,
            lists your installed models and talks to it directly from the browser.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              'Small coder or instruct models (Qwen, Llama, Mistral, Gemma) work well.',
              'With Ollama, reasoning ("thinking") is switched off for JSON tasks, so answers come back in seconds.',
              'Any OpenAI-compatible server works too, and cloud providers are on the roadmap.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border">
          <div className="flex border-b bg-muted px-2" role="tablist">
            {(
              [
                ['ollama', 'Ollama'],
                ['lmstudio', 'LM Studio'],
                ['other', 'Other servers'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'relative h-10 px-3 text-sm text-muted-foreground hover:text-foreground',
                  tab === id && 'font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-4 p-5 text-sm">
            {tab === 'ollama' && (
              <>
                <Step n={1} text="Install Ollama from ollama.com, then download a model:">
                  <CodeLine>ollama pull qwen2.5-coder:7b</CodeLine>
                </Step>
                {isLocal ? (
                  <Step n={2} text="Make sure the server is running (the desktop app starts it for you):">
                    <CodeLine>ollama serve</CodeLine>
                  </Step>
                ) : (
                  <Step n={2} text="Start the server and allow this site to talk to it:">
                    <CodeLine>{`OLLAMA_ORIGINS="${origin}" ollama serve`}</CodeLine>
                  </Step>
                )}
                <Step n={3} text="Open the editor, press ⌘K, pick Ollama and your model. That’s it." />
              </>
            )}
            {tab === 'lmstudio' && (
              <>
                <Step n={1} text="Install LM Studio from lmstudio.ai and download a model from its search tab." />
                <Step n={2} text="Open the Developer tab, load the model, start the server and turn on “Enable CORS”." />
                <Step n={3} text="In EasyJSON press ⌘K, choose LM Studio. The default address is:">
                  <CodeLine>http://localhost:1234/v1</CodeLine>
                </Step>
              </>
            )}
            {tab === 'other' && (
              <>
                <Step n={1} text="Run any server with an OpenAI-style /v1/chat/completions endpoint, for example llama.cpp:">
                  <CodeLine>llama-server -m model.gguf --port 8080</CodeLine>
                </Step>
                <Step n={2} text="Make sure it sends CORS headers for this site." />
                <Step n={3} text="In EasyJSON press ⌘K, choose “Other (OpenAI-compatible)” and enter its URL." />
              </>
            )}
            <p className="border-t pt-4 text-xs leading-relaxed text-faint">
              Some browsers ask for permission the first time a website connects to a server on your own computer or network. Allow it so
              EasyJSON can reach your model.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Step({ n, text, children }: { n: number; text: string; children?: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold">{n}</span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-muted-foreground">{text}</p>
        {children}
      </div>
    </div>
  );
}

const FAQS: [string, string][] = [
  ['Is my JSON uploaded anywhere?', 'No. EasyJSON has no server-side component. Your document is parsed and displayed in your browser and saved only in your browser’s local storage. The only network requests the editor makes are to the AI server address you configure, which is your own computer by default.'],
  ['Do I need an internet connection?', 'Only for your very first visit, to download the app. After that it is cached on your device and opens offline, and local AI keeps working because it runs on your machine.'],
  ['Do I need AI to use EasyJSON?', 'No. The graph view, validation, search, formatting and Quick fix all work without a model. AI is there when you want to repair something messy or generate data.'],
  ['Which models work best?', 'Instruction-tuned models in the 3B to 14B range are a good balance of speed and quality, for example Qwen 2.5 Coder, Llama 3.x or Mistral. Larger models handle bigger documents and more complex instructions better.'],
  ['How big can my files be?', 'The editor and graph handle multi-megabyte files. Very large graphs start partly folded so they stay responsive. For AI edits on big documents, select a branch and use Edit with AI so the model only sees that part.'],
  ['Will you support cloud models?', 'Yes, as an opt-in. The AI layer is provider-agnostic, so hosted models can be added later. Local models will stay the default.'],
];

function FAQ() {
  return (
    <section id="faq" className="scroll-mt-14 border-b bg-muted/50 py-20">
      <Container className="max-w-3xl">
        <SectionHead eyebrow="FAQ" title="Questions, answered" />
        <div className="divide-y rounded-lg border bg-background">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                {q}
                <ChevronRight size={14} className="shrink-0 text-faint transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-20">
      <Container className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Open a file. See the shape of your data.</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">No sign-up, no upload, no waiting. It runs right here in your browser.</p>
        <Button asChild size="lg" className="mt-7">
          <a href={APP}>
            Open the editor <ArrowRight size={16} />
          </a>
        </Button>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-muted">
      <Container className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={18} />
          <span>EasyJSON</span>
          <span className="text-faint">· Private, local, offline</span>
        </div>
        <div className="flex gap-4">
          <a href={APP} className="hover:text-foreground">Editor</a>
          <a href="#privacy" className="hover:text-foreground">Privacy</a>
          <a href="#local-ai" className="hover:text-foreground">Local AI</a>
        </div>
      </Container>
    </footer>
  );
}
