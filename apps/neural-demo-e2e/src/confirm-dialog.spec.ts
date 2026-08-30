import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('ConfirmDialog alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/confirm-dialog');
    await waitForHydration(page);
  });

  test('accepts a service request and restores focus', async ({ page }) => {
    const trigger = page
      .getByRole('button', { name: 'Delete workspace' })
      .first();
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', {
      name: 'Delete Neural workspace?',
    });
    const accept = page
      .getByRole('button', { name: 'Delete workspace' })
      .last();
    await expect(dialog).toBeVisible();
    await expect(accept).toBeFocused();
    await accept.click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('Last result: accepted · accept'),
    ).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('keeps an async confirmation open when its guard returns false', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Publish release' }).click();
    const dialog = page.getByRole('dialog', { name: 'Publish release?' });
    const accept = page.getByRole('button', {
      name: 'Validate and publish',
    });
    await expect(dialog).toBeVisible();
    await accept.click();
    await expect(
      page.getByText('Validation failed · try once more'),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    await accept.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Release published')).toBeVisible();
  });

  test('retains consumer visuals in unstyled mode', async ({ page }) => {
    await page
      .getByRole('button', { name: 'Open headless confirmation' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Agent authorization' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/docs-headless-confirm/);
    await expect(dialog).not.toHaveClass(/neural-dialog-base/);
    await expect(dialog).toHaveCSS('background-color', 'rgb(7, 17, 31)');
  });
});
