import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('LoadingOverlay docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/loading-overlay');
    await waitForHydration(page);
  });

  test('blocks only container content and exposes busy state', async ({
    page,
  }) => {
    const host = page.getByTestId('loading-container');
    const content = host.locator('.neural-loading-overlay-content-root');

    await page.getByRole('button', { name: 'Load products' }).click();
    await expect(content).toHaveAttribute('aria-busy', 'true');
    await expect(content).toHaveAttribute('inert', '');
    await expect(
      host.getByRole('progressbar', { name: 'Loading products' }),
    ).toBeVisible();
    await expect(
      host.getByText('Loading products', { exact: true }),
    ).toBeVisible();

    await expect(content).not.toHaveAttribute('aria-busy', {
      timeout: 2500,
    });
    await expect(
      host.locator('.neural-loading-overlay-layer-root'),
    ).toHaveCount(0);
    await expect(host.getByText('Last rendered event: hidden')).toBeVisible();
  });

  test('uses top-layer viewport blocking, resists Escape, and restores focus', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Save in viewport' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('.neural-loading-overlay-viewport-root');

    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('open', '');
    await expect(dialog).toHaveAttribute('aria-label', 'Saving changes');
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    expect((await dialog.boundingBox())?.y).toBe(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    await expect(dialog).toHaveCount(0, { timeout: 2500 });
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await expect(trigger).toBeFocused();
  });

  test('projects a custom polite status without a second spinner', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Ask Neural AI' }).click();
    const host = page.getByTestId('loading-custom');
    const panel = host.locator('.neural-loading-overlay-panel-root');

    await expect(panel).toHaveAttribute('role', 'status');
    await expect(panel).toHaveAttribute('aria-live', 'polite');
    await expect(panel).toHaveAttribute('aria-label', 'AI is thinking');
    await expect(panel.locator('.docs-ai-loader')).toBeVisible();
    await expect(panel.locator('neural-progress-spinner')).toHaveCount(0);
  });

  test('keeps background work interactive while retaining busy semantics', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Refresh preview' }).click();
    const host = page.getByTestId('loading-background');
    const content = host.locator('.neural-loading-overlay-content-root');

    await expect(content).toHaveAttribute('aria-busy', 'true');
    await expect(content).not.toHaveAttribute('inert');
    await expect(
      host.locator('.neural-loading-overlay-layer-root'),
    ).toHaveAttribute('data-block-interaction', 'false');
    await expect(
      host.getByRole('button', { name: 'This action stays available' }),
    ).toBeEnabled();
  });

  test('preserves blocking structure in unstyled reduced-motion mode', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const host = page.getByTestId('loading-headless');
    const root = host.locator('.docs-headless-loader');
    const panel = host.locator('.docs-headless-loader__panel');

    await expect(root).toBeVisible();
    await expect(root).not.toHaveClass(/neural-loading-overlay-base/);
    await expect(panel).not.toHaveClass(/neural-loading-overlay-panel-base/);
    await expect(host.locator('.docs-headless-loader__pulse')).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(
      host.locator('.neural-loading-overlay-content-root'),
    ).toHaveAttribute('inert', '');
  });
});
