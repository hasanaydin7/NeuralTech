import type { BrowserContext, Page } from '@playwright/test';

export async function prepareClipboard(
  context: BrowserContext,
  page: Page,
  browserName: 'chromium' | 'firefox' | 'webkit',
): Promise<void> {
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    return;
  }

  await page.addInitScript(() => {
    const clipboard = {
      readText: async (): Promise<string> => '',
      writeText: async (): Promise<void> => undefined,
    };

    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get: () => clipboard,
    });
  });
}
