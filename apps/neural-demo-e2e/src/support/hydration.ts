import { expect, type Page } from '@playwright/test';

export async function waitForHydration(
  page: Page,
  rootSelector = 'app-root',
): Promise<void> {
  const root = page.locator(rootSelector);
  await expect(root).toBeAttached();
  await expect(root.locator('[jsaction]')).toHaveCount(0, {
    timeout: 15_000,
  });
}
