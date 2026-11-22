# EasyJSON

Turn JSON into an interactive graph, fix broken JSON, and grow your data with local AI models.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173  (landing page) and /app/ (editor)
npm run build    # production build in dist/
npm run preview  # serve the production build locally
npm run check    # typecheck + lint + build, same as CI
```

Requires Node 22 (see `.nvmrc`).

## Pages

| URL | Source | What |
| --- | --- | --- |
| `/` | `src/landing/` | Landing page (light bundle, no graph libraries) |
| `/app/` | `src/main.tsx`, `src/App.tsx` | The editor |

Both are emitted as static HTML (`dist/index.html`, `dist/app/index.html`), so any static host works without rewrites.

## Stack

- **Rsbuild** (Rspack) for dev server and builds (replaces Vite)
- **React 18 + TypeScript**, **Tailwind CSS 3**
- **shadcn/ui** components (Radix primitives) with a monochrome, GitHub-inspired theme. `components.json` is set up, so `npx shadcn@latest add <component>` works.
- **React Flow** + **dagre** for the graph, **CodeMirror 6** for the editor, **jsonrepair** for the offline quick fix

## Features

- Live graph view: object cards, array lists, collapsible key pills, left-to-right or top-to-bottom layout, search (⌘F), minimap, node inspector with path copy
- Code / Split / Graph layouts with a draggable splitter, light and dark themes
- Inline syntax errors with jump-to-error, **Quick fix** (offline) for common mistakes
- Open or drag-and-drop `.json` files, download (⌘S), format (⇧⌘F), minify
- **AI assistant (⌘K)**: fix invalid JSON, or describe a change ("add 5 more users") and review it as a diff before accepting. Select a node and choose **Edit with AI** to scope the change to that branch.

## Local AI setup

The app talks to the model server straight from the browser.

| Provider | Default URL | Notes |
| --- | --- | --- |
| Ollama | `http://localhost:11434` | `ollama serve`, then `ollama pull <model>`. Localhost origins are allowed by default; for other origins set `OLLAMA_ORIGINS`. |
| LM Studio | `http://localhost:1234/v1` | Developer tab → start server → enable **CORS**. |
| Other (OpenAI-compatible) | `http://localhost:8080/v1` | llama.cpp server, vLLM, LocalAI, Jan… must send CORS headers. |

Small coder/instruct models (Qwen 2.5/3 Coder, Llama 3.x, etc.) work well for these tasks.

## Adding providers (cloud later)

The AI layer is provider-agnostic. Each backend implements `AIProvider` in `src/ai/types.ts`
(`listModels` + streaming `complete`). To add one, create an adapter in `src/ai/providers/` and register it in
`src/ai/registry.ts`. OpenAI-style APIs can reuse `createOpenAICompatible` with `needsApiKey: true`, and the
settings panel shows an API key field automatically.

## Project layout

```
src/
  ai/            provider interface, adapters, prompts (fix / edit / create)
  components/
    ai/          AI panel and diff view
    editor/      CodeMirror JSON editor
    graph/       React Flow canvas, custom nodes, inspector
    ui/          shadcn/ui components
  lib/           JSON helpers, graph building + layout, storage
```

## Deploying

The build output in `dist/` is plain static files. There is no server to run and nothing to configure at runtime.

### Push to GitHub

```bash
git init
git add .
git commit -m "EasyJSON"
git branch -M main
git remote add origin git@github.com:<you>/easyjson.git
git push -u origin main
```

`.github/workflows/ci.yml` runs typecheck, lint and build on every push and pull request.

### Pick a host

| Host | Setup |
| --- | --- |
| **Netlify** | Import the repo. `netlify.toml` sets the build command, output folder and Node version. Headers come from `public/_headers`. |
| **Cloudflare Pages** | Import the repo, framework preset "None", build command `npm run build`, output `dist`, env `NODE_VERSION=22`. Headers come from `public/_headers`. |
| **Vercel** | Import the repo. `vercel.json` sets the build, output and headers. |
| **Anything else** (S3, nginx, GitHub Pages at a custom domain) | Run `npm run build` and upload `dist/`. Recreate the headers from `public/_headers` if your host supports custom headers. |

The site must be served from the root of a domain or subdomain (for example `easyjson.example.com`), since pages and the service worker use absolute paths.

### Production notes

- **Security headers**: a strict Content-Security-Policy allows scripts and styles only from the site itself, and network requests only to the site and to `localhost` / `127.0.0.1` on any port (the user's model server). If people run their model on another machine (e.g. `http://192.168.1.20:11434`), add that origin to `connect-src` in both `public/_headers` and `vercel.json`.
- **Offline**: `public/sw.js` precaches both pages and their assets on the first visit. Built assets are content-hashed and cached forever; pages are network-first so new deploys show up immediately. Bump `CACHE` in `sw.js` if you ever need to force-clear old caches.
- **Local AI from a hosted site**: browsers may ask the user for permission to connect to their local network the first time. Ollama only accepts requests from localhost origins by default, so users of the hosted site need to start it with `OLLAMA_ORIGINS="https://your-domain"`. The landing page shows that exact command with your domain filled in. LM Studio needs "Enable CORS".
- **Social previews**: `index.html` has title and description tags. Add an `og:image` (1200×630 PNG in `public/`, absolute URL) if you want rich link cards.
