import { defineConfig, devices } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';

const baseURL = process.env['BASE_URL'] || 'http://127.0.0.1:5710';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  outputDir: `${process.cwd()}/apps/neural-site-e2e/test-output`,
  workers: process.env['CI'] ? 2 : 3,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        command: 'npx nx run neural-site:serve --host=127.0.0.1 --port=5710',
        url: 'http://127.0.0.1:5710',
        reuseExistingServer: true,
        timeout: 240_000,
        cwd: workspaceRoot,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
