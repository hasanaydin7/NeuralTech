import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('ProgressBar docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/progress-bar');
    await waitForHydration(page);
  });

  test('keeps interactive visual and accessible values synchronized', async ({
    page,
  }) => {
    const demo = page.getByTestId('progress-interactive');
    const progress = demo.getByRole('progressbar', {
      name: 'Upload progress',
    });

    await expect(progress).toHaveAttribute('aria-valuenow', '36');
    await expect(progress).toHaveAttribute('aria-valuetext', '36%');
    await expect(progress).toContainText('36%');

    await demo.getByRole('button', { name: 'Increase' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '46');
    await expect(progress).toContainText('46%');

    await demo.getByRole('button', { name: 'Reset' }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
  });

  test('renders buffer, semantic variants, and sizes', async ({ page }) => {
    const bufferDemo = page.getByTestId('progress-buffer');
    await expect(
      bufferDemo.locator('.neural-progress-bar-value-root'),
    ).toHaveAttribute('style', /35%/);
    await expect(
      bufferDemo.locator('.neural-progress-bar-buffer-root'),
    ).toHaveAttribute('style', /68%/);
    const sizes = page.getByTestId('progress-sizes');
    await expect(sizes.locator('.neural-progress-bar-small-base')).toHaveCount(
      1,
    );
    await expect(sizes.locator('.neural-progress-bar-large-base')).toHaveCount(
      1,
    );
    await expect(
      page
        .getByTestId('progress-severities')
        .locator('.neural-progress-bar-success-base'),
    ).toHaveCount(1);
  });

  test('uses indeterminate semantics and honors reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const progress = page
      .getByTestId('progress-indeterminate')
      .getByRole('progressbar', { name: 'Loading search results' });
    await expect(progress).not.toHaveAttribute('aria-valuenow');
    await expect(progress).not.toHaveAttribute('aria-valuemin');
    await expect(progress).not.toHaveAttribute('aria-valuemax');
    await expect(progress).toContainText('Loading');
    await expect(progress.locator('.neural-progress-bar-value-root')).toHaveCSS(
      'animation-name',
      'none',
    );
  });

  test('supports localized value text and headless slots', async ({ page }) => {
    const localized = page
      .getByTestId('progress-localized')
      .getByRole('progressbar', { name: 'Dosya yükleme ilerlemesi' });
    await expect(localized).toHaveAttribute('aria-valuenow', '7');
    await expect(localized).toHaveAttribute(
      'aria-valuetext',
      '10 dosyanın 7 tanesi tamamlandı',
    );
    await expect(localized).toContainText('7 / 10 dosya');

    const headless = page
      .getByTestId('progress-headless')
      .locator('.docs-headless-progress');
    await expect(headless).toBeVisible();
    await expect(headless).not.toHaveClass(/neural-progress-bar-base/);
    await expect(
      headless.locator('.docs-headless-progress__track'),
    ).not.toHaveClass(/neural-progress-bar-track-base/);
    await expect(
      headless.locator('.docs-headless-progress__value'),
    ).not.toHaveClass(/neural-progress-bar-value-base/);
  });
});
