import { expect, test } from '@playwright/test';
import { prepareClipboard } from './support/clipboard';
import { waitForHydration } from './support/hydration';

test.describe('Neural Icons documentation', () => {
  test.beforeEach(async ({ browserName, context, page }) => {
    await prepareClipboard(context, page, browserName);
    await page.goto('/docs/getting-started/icons');
    await waitForHydration(page);
  });

  test('activates its sidebar link and renders the embedded catalog', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Neural Icons' }),
    ).toBeVisible();

    const navigationLink = page.getByRole('link', {
      name: 'Neural Icons Alpha',
    });
    await expect(navigationLink).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('6184 icons', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Copy nt nt-/ }),
    ).toHaveCount(48);
  });

  test('filters outline and filled icons without leaving the page', async ({
    page,
  }) => {
    const search = page.getByRole('searchbox', { name: 'Search' });
    await search.fill('user');
    await expect(
      page.getByText(/icons match the current filters/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Copy nt nt-user/ }).first(),
    ).toBeVisible();

    await page.getByRole('combobox', { name: 'Style' }).click();
    await page.getByRole('option', { name: 'Filled' }).click();
    await expect(
      page.getByRole('button', { name: /^Copy nt nt-filled-user/ }).first(),
    ).toBeVisible();
    await expect(page).toHaveURL('/docs/getting-started/icons');
  });

  test('shows all supported loader motion classes', async ({ page }) => {
    const motion = page.locator('#motion');
    await expect(motion.locator('.nt-spin')).toHaveCount(1);
    await expect(motion.locator('.nt-spin-reverse')).toHaveCount(1);
    await expect(motion.locator('.nt-spin-dual')).toHaveCount(1);
  });

  test('applies the class API mask, size, and color utilities inside CodeView', async ({
    page,
  }) => {
    const preview = page.locator('#usage .code-preview-surface');
    const small = preview.locator('.size-small');
    const heart = preview.locator('.size-medium.color-accent');
    const success = preview.locator('.size-large.color-success');

    await expect(small).toHaveCSS('font-size', '16px');
    await expect(heart).toHaveCSS('font-size', '32px');
    await expect(success).toHaveCSS('font-size', '48px');
    await expect(success).toHaveCSS('color', 'rgb(22, 163, 74)');
    await expect(heart).toBeVisible();
    await expect
      .poll(() =>
        heart.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.maskImage, style.webkitMaskImage].some(
            (value) => Boolean(value) && value !== 'none',
          );
        }),
      )
      .toBe(true);
  });

  test('shows temporary success feedback after copying from CodeView', async ({
    page,
  }) => {
    const copyButton = page
      .locator('#usage .code-preview-actions button')
      .nth(1);

    await copyButton.click();
    await expect
      .poll(() =>
        copyButton.evaluate((element) => ({
          label: element.getAttribute('aria-label'),
          success: element.classList.contains('is-success'),
          check: element.querySelector('.nt-check') !== null,
          color: getComputedStyle(element).color,
          background: getComputedStyle(element).backgroundColor,
        })),
      )
      .toEqual({
        label: 'Copied',
        success: true,
        check: true,
        color: expect.stringMatching(/^rgb\((21, 128, 61|134, 239, 172)\)$/),
        background: 'rgba(0, 0, 0, 0)',
      });

    await expect(copyButton).toHaveAttribute('aria-label', 'Copy', {
      timeout: 3_000,
    });
    await expect(copyButton.locator('.nt-copy')).toBeVisible();
  });
});
