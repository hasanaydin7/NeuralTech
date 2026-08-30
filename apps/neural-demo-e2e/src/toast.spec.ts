import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Toast documentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/toast');
    await waitForHydration(page);
  });

  test('activates the canonical route and renders a finite notification', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Toast Alpha', exact: true }),
    ).toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: 'Save changes' }).click();

    const outlet = page.locator('[data-channel="toast-docs"]');
    const message = outlet.getByRole('article');
    await expect(message).toContainText('Changes were persisted.');
    await expect(message.locator('.neural-toast-progress-value')).toBeVisible();
  });

  test('switches logical position and keeps persistent messages dismissible', async ({
    page,
  }) => {
    const outlet = page.locator('[data-channel="toast-docs"]');
    await page
      .getByRole('combobox', { name: 'Toast documentation position' })
      .selectOption('bottom-start');
    await expect(outlet).toHaveAttribute('data-position', 'bottom-start');

    await page.getByRole('button', { name: 'Warning', exact: true }).click();
    const warning = outlet.locator('[data-severity="warning"]');
    await expect(warning).toContainText('A warning notification');
    await expect(warning.locator('.neural-toast-progress')).toHaveCount(0);
    await warning.getByRole('button', { name: /Close notification/ }).click();
    await expect(warning).toHaveCount(0);
  });

  test('supports returned references, icon-free and unstyled outlets', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Create controlled' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: /Created neural-message-/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss controlled' }).click();
    await expect(page.getByText(/closed with api/)).toBeVisible();

    await page.getByRole('button', { name: 'No icon' }).click();
    const iconFree = page.locator('[data-channel="toast-no-icon"] article');
    await expect(iconFree).toBeVisible();
    await expect(iconFree.locator('.neural-toast-icon')).toHaveCount(0);

    await page.getByRole('button', { name: 'Unstyled channel' }).click();
    const headless = page.locator(
      '[data-channel="toast-headless"] .docs-headless-toast__message',
    );
    await expect(headless).toBeVisible();
    await expect(headless).not.toHaveClass(/neural-toast-message-base/);
  });
});
