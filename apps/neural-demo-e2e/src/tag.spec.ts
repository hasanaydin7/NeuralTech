import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Tag docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tag');
    await waitForHydration(page);
  });

  test('renders textual severities, icons, sizes, and projected content', async ({
    page,
  }) => {
    const severities = page.getByTestId('tag-severities');
    await expect(severities.locator('[data-severity="success"]')).toContainText(
      'Approved',
    );
    await expect(severities.locator('[data-severity="warning"]')).toContainText(
      'In progress',
    );

    const variants = page.getByTestId('tag-variants');
    await expect(variants.locator('.nt-brand-angular')).toBeVisible();
    await expect(variants.locator('[data-size="large"]')).toContainText(
      'Enterprise',
    );
    await expect(variants.getByText('Projected AI')).toBeVisible();
  });

  test('removes controlled filters through accessible native buttons', async ({
    page,
  }) => {
    const surface = page.getByTestId('tag-removable');
    await surface.getByRole('button', { name: 'Remove Signals' }).click();

    await expect(surface.getByText('Signals', { exact: true })).toHaveCount(0);
    await expect(surface.getByText('Last removed: Signals')).toBeVisible();
    await expect(
      surface.getByRole('button', { name: 'Remove Locked' }),
    ).toBeDisabled();
  });

  test('keeps keyboard removal accessible', async ({ page }) => {
    const remove = page.getByRole('button', { name: 'Remove Angular' });
    await remove.focus();
    await expect(remove).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Last removed: Angular')).toBeVisible();
  });

  test('keeps structural hooks in unstyled mode', async ({ page }) => {
    const surface = page.getByTestId('tag-headless');
    const tag = surface.locator('.neural-tag-root');
    const remove = surface.locator('.neural-tag-remove-root');

    await expect(tag).toHaveClass(/docs-headless-tag/);
    await expect(tag).not.toHaveClass(/neural-tag-base/);
    await expect(remove).toHaveClass(/docs-headless-tag__remove/);
    await expect(remove).not.toHaveClass(/neural-tag-remove-base/);
  });
});
