import { defineConfig, devices } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';

const baseURL = process.env['BASE_URL'] || 'https://127.0.0.1:5714';

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  outputDir: `${process.cwd()}/apps/neural-site-e2e/test-output`,
  workers: 2,
  use: {
    baseURL,
    ignoreHTTPSErrors: !process.env['BASE_URL'],
    trace: 'on-first-retry',
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        command:
          'npx nx run neural-site:serve --host=127.0.0.1 --port=5714 --ssl --hmr=false',
        url: baseURL,
        ignoreHTTPSErrors: true,
        reuseExistingServer: false,
        timeout: 240_000,
        cwd: workspaceRoot,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: ['**/button-release.spec.ts'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: ['**/button-release.spec.ts'],
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
