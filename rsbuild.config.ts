import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

/**
 * Two pages, one static build:
 *   /       → landing page (src/landing)
 *   /app/   → the EasyJSON app (src/main.tsx)
 * The output is plain static files in dist/, deployable to any static host.
 */
const titles: Record<string, string> = {
  index: 'EasyJSON · Visualize, fix and grow JSON, privately',
  'app/index': 'EasyJSON · Editor',
};

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/landing/main.tsx',
      // The slash makes Rsbuild emit dist/app/index.html, so /app/ works on every static host.
      'app/index': './src/main.tsx',
    },
  },
  html: {
    template: './index.html',
    title: ({ entryName }) => titles[entryName] ?? 'EasyJSON',
  },
  server: {
    port: 5173,
  },
  performance: {
    chunkSplit: { strategy: 'split-by-experience' },
  },
});
