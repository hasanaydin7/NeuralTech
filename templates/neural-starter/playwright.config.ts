import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:4301',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start -- --port 4301',
    url: 'http://127.0.0.1:4301',
    reuseExistingServer: !process.env['CI'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
