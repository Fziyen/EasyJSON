# EasyJSON

Turn JSON into an interactive graph, fix broken JSON, and grow your data with local AI models.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173  (landing page) and /app/ (editor)
npm run build    # production build in dist/
npm run preview  # serve the production build locally
npm run check    # typecheck + lint + build
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
| LM Studio | `http://localhost:1234/v1` | Developer tab → start server → enable **CORS**. |
| Ollama | `http://localhost:11434` | `ollama serve`, then `ollama pull <model>`. Localhost origins are allowed by default; for other origins set `OLLAMA_ORIGINS`. |
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
