import { defineConfig } from 'vitest/config';

/** The two Node calls the version needs, typed here: the project doesn't load Node's types. */
interface NodeCalls {
  execFileSync(file: string, args: string[], options: { encoding: 'utf8'; stdio: string[] }): string;
}

/** Which build this is (`git describe`), for crash reports and save files; 'dev build' outside a git checkout. */
async function buildVersion(): Promise<string> {
  const node = (await import('node:child_process' as string)) as NodeCalls;
  try {
    return node.execFileSync('git', ['describe', '--tags', '--always', '--dirty'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || 'dev build';
  } catch {
    return 'dev build';
  }
}

export default defineConfig(async () => ({
  base: './',
  define: {
    __BUILD_VERSION__: JSON.stringify(await buildVersion()),
  },
  build: {
    target: 'es2022',
    // Source maps next to the chunks but not linked from them: players never download them, and a crash report's
    // stack can be read against dist/assets/*.map in DevTools.
    sourcemap: 'hidden' as const,
    rolldownOptions: {
      output: {
        // Three.js in a chunk of its own, so it caches across game updates and its size stays visible.
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] },
      },
    },
    // Three's WebGPU build is one ~800 kB chunk (~220 kB gzip); the warning is set just above it.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
