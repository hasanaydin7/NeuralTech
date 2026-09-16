import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@neural-ng/theme/browser': fileURLToPath(
        new URL('../../neural-theme/src/browser.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['libs/neural-mcp/evals/**/*.spec.ts'],
    environment: 'node',
    watch: false,
  },
});
