import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

const guides = [
  ['/docs/getting-started/configuration', 'Configuration'],
  ['/docs/guides/ai-first', 'AI-first workflow'],
  ['/docs/guides/headless', 'Headless mode'],
  ['/docs/guides/accessibility', 'Accessibility'],
  ['/docs/guides/ssr-hydration', 'SSR and hydration'],
  ['/docs/apis/color-mode', 'Color Mode'],
] as const;

for (const [route, title] of guides) {
  test(`hydrates the ${title} guide at its public route`, async ({ page }) => {
    await page.goto(route);
    await waitForHydration(page);

    await expect(
      page.getByRole('heading', { level: 1, name: title }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: `${title} Alpha` }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.guide-principle')).toHaveCount(4);
    await expect(page.locator('code-view')).toBeVisible();
  });
}
