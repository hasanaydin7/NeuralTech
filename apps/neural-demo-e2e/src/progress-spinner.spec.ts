import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('ProgressSpinner docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/progress-spinner');
    await waitForHydration(page);
  });

  test('renders localized indeterminate semantics with SVG circles', async ({
    page,
  }) => {
    const demo = page.getByTestId('spinner-basic');
    const spinner = demo.getByRole('progressbar', {
      name: 'Loading',
      exact: true,
    });

    await expect(spinner).toBeVisible();
    await expect(spinner).not.toHaveAttribute('aria-valuemin');
    await expect(spinner).not.toHaveAttribute('aria-valuemax');
    await expect(spinner).not.toHaveAttribute('aria-valuenow');
    await expect(spinner.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(spinner.locator('circle')).toHaveCount(2);
    await expect(
      demo.getByRole('progressbar', { name: 'Loading search results' }),
    ).toBeVisible();
  });

  test('renders sizes, semantic severities, and task labels', async ({
    page,
  }) => {
    const sizes = page.getByTestId('spinner-sizes');
    await expect(
      sizes.locator('.neural-progress-spinner-small-base'),
    ).toHaveCount(1);
    await expect(
      sizes.locator('.neural-progress-spinner-large-base'),
    ).toHaveCount(1);
    await expect(
      page
        .getByTestId('spinner-severities')
        .locator('.neural-progress-spinner-error-base'),
    ).toHaveCount(1);

    const labelled = page
      .getByTestId('spinner-label')
      .getByRole('progressbar', { name: 'Uploading...' });
    await expect(labelled).toContainText('Uploading...');
    await expect(labelled).toHaveAttribute(
      'aria-valuetext',
      'Preparing file 3 of 8',
    );
  });

  test('applies bounded SVG stroke and configurable duration', async ({
    page,
  }) => {
    const spinners = page
      .getByTestId('spinner-motion')
      .getByRole('progressbar');
    const fast = spinners.nth(0);
    const slow = spinners.nth(1);

    await expect(fast.locator('circle').first()).toHaveAttribute(
      'stroke-width',
      '2',
    );
    await expect(slow.locator('circle').last()).toHaveAttribute(
      'stroke-width',
      '6',
    );
    await expect(
      fast.locator('.neural-progress-spinner-indicator-root'),
    ).toHaveCSS('animation-duration', '0.6s');
    await expect(
      slow.locator('.neural-progress-spinner-indicator-root'),
    ).toHaveCSS('animation-duration', '1.2s');
  });

  test('honors reduced motion and preserves headless slots', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const indicator = page
      .getByTestId('spinner-motion')
      .locator('.neural-progress-spinner-indicator-root')
      .first();
    await expect(indicator).toHaveCSS('animation-name', 'none');

    const headless = page
      .getByTestId('spinner-headless')
      .locator('.docs-headless-spinner');
    await expect(headless).toBeVisible();
    await expect(headless).not.toHaveClass(/neural-progress-spinner-base/);
    await expect(
      headless.locator('.docs-headless-spinner__svg'),
    ).not.toHaveClass(/neural-progress-spinner-svg-base/);
    await expect(
      headless.locator('.docs-headless-spinner__indicator'),
    ).not.toHaveClass(/neural-progress-spinner-indicator-base/);
  });
});
