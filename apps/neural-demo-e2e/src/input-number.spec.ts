import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('InputNumber and localization alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/input-number');
    await waitForHydration(page);
  });

  test('binds Signal Forms and exposes spinbutton keyboard behavior', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'InputNumber Alpha' }),
    ).toHaveAttribute('aria-current', 'page');

    const quantity = page.getByRole('spinbutton', { name: 'Quantity' });
    await expect(quantity).toHaveValue('4');
    await quantity.pressSequentially('jj');
    await expect(quantity).toHaveValue('4');
    await quantity.press('ArrowUp');
    await expect(quantity).toHaveValue('5');
    await expect(
      page.getByText(/Model: 5 · Last commit: 5 via keyboard/),
    ).toBeVisible();
  });

  test('switches global locale while preserving numeric models', async ({
    page,
  }) => {
    const price = page.getByRole('spinbutton', { name: 'Price' });
    const localOverride = page.getByRole('spinbutton', {
      name: 'US discount',
    });

    await expect(price).toHaveValue(/1,299\.90/);
    await expect(localOverride).toHaveValue('12.5');
    await page.getByRole('button', { name: 'Switch to Türkçe' }).click();
    await expect(price).toHaveValue(/1\.299,90/);
    await expect(localOverride).toHaveValue('12.5');
    await expect(page.getByText(/tr-TR · price model: 1299.9/)).toBeVisible();
  });

  test('keeps behavior and consumer classes in headless mode', async ({
    page,
  }) => {
    const custom = page.getByRole('spinbutton', {
      name: 'Custom numeric control',
    });
    const root = custom.locator('xpath=..');

    await expect(root).toHaveClass(/docs-number-root/);
    await expect(root).not.toHaveClass(/neural-input-number-base/);
    await expect(root).toHaveCSS('border-radius', '999px');
    await custom.press('ArrowUp');
    await expect(custom).toHaveValue('43');
  });
});

test('switches the shared locale from the localization guide', async ({
  page,
}) => {
  await page.goto('/docs/guides/localization');
  await waitForHydration(page);

  await expect(
    page.getByRole('link', { name: 'Localization Alpha' }),
  ).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Türkçe' }).click();
  await expect(page.getByText(/Active locale: tr-TR/)).toBeVisible();
});
