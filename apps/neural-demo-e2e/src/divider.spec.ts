import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Divider docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/divider');
    await waitForHydration(page);
  });

  test('renders semantic horizontal and vertical separators', async ({
    page,
  }) => {
    const basic = page.getByTestId('divider-basic').getByRole('separator');
    await expect(basic).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(basic).toHaveAttribute('data-type', 'solid');

    const vertical = page
      .getByTestId('divider-vertical')
      .getByRole('separator');
    await expect(vertical).toHaveCount(2);
    await expect(vertical.first()).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
    await expect(vertical.first()).toHaveAccessibleName(
      'Primary and secondary actions',
    );
  });

  test('supports labels, projection, alignment, and line types', async ({
    page,
  }) => {
    const content = page.getByTestId('divider-content');
    await expect(content.getByText('CENTER')).toBeVisible();
    await expect(content.getByText('PROJECTED')).toBeVisible();
    await expect(content.locator('[data-align="start"]')).toHaveAttribute(
      'data-type',
      'dashed',
    );
    await expect(
      content
        .locator('[data-align="end"]')
        .locator('.neural-divider-before-root'),
    ).toHaveCSS('border-top-style', 'dotted');
  });

  test('preserves structural hooks and semantics in unstyled mode', async ({
    page,
  }) => {
    const divider = page.getByTestId('divider-headless').getByRole('separator');

    await expect(divider).toHaveClass(/docs-headless-divider/);
    await expect(divider).not.toHaveClass(/neural-divider-base/);
    await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(
      divider.locator('.docs-headless-divider__line').first(),
    ).not.toHaveClass(/neural-divider-line-base/);
    await expect(
      divider.locator('.docs-headless-divider__content'),
    ).not.toHaveClass(/neural-divider-content-base/);
  });
});
