import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Badge docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/badge');
    await waitForHydration(page);
  });

  test('renders semantic variants and preserves capped values accessibly', async ({
    page,
  }) => {
    const values = page.getByTestId('badge-values');
    await expect(values.locator('[aria-label="128"]')).toContainText('99+');
    await expect(values.getByText('0', { exact: true })).toBeVisible();
    await expect(values.getByText('-2', { exact: true })).toBeVisible();

    const severities = page.getByTestId('badge-severities');
    await expect(
      severities.locator('[data-severity="success"]'),
    ).toContainText('Success');
    await expect(severities.locator('[data-severity="error"]')).toContainText(
      'Error',
    );
  });

  test('supports labelled dots and projected content', async ({ page }) => {
    const variants = page.getByTestId('badge-variants');
    await expect(
      variants.locator('[aria-label="Service online"]'),
    ).toHaveAttribute('data-dot', 'true');
    await expect(variants.getByText('Verified')).toBeVisible();
  });

  test('updates a polite live counter and keeps the real count visible', async ({
    page,
  }) => {
    const button = page.getByRole('button', { name: 'Add notification' });
    await button.click();
    await button.click();
    await expect(page.getByText('Real count: 100')).toBeVisible();
    await expect(page.locator('[aria-label="100"]')).toContainText('99+');
  });

  test('attaches real Badges to arbitrary logical anchors', async ({
    page,
  }) => {
    const demo = page.getByTestId('badge-directive');
    const button = demo.getByRole('button', {
      name: 'Notifications, 8 unread',
    });
    const buttonBadge = button.locator(
      'neural-badge.neural-badge-anchor-badge-top-end',
    );
    await expect(buttonBadge.locator('.neural-badge-root')).toContainText('8');
    await expect(buttonBadge).toHaveCSS('position', 'absolute');

    const anchorBox = await button.boundingBox();
    const badgeBox = await buttonBadge.boundingBox();
    expect(anchorBox).not.toBeNull();
    expect(badgeBox).not.toBeNull();
    expect(badgeBox?.y).toBeLessThan(anchorBox?.y ?? 0);
    expect((badgeBox?.x ?? 0) + (badgeBox?.width ?? 0)).toBeGreaterThan(
      (anchorBox?.x ?? 0) + (anchorBox?.width ?? 0),
    );

    await expect(
      demo.locator('[aria-label="Online"][data-dot="true"]'),
    ).toBeVisible();
    await expect(demo.getByText('Messages').locator('neural-badge')).toContainText(
      '3',
    );
  });

  test('keeps structural hooks in unstyled mode', async ({ page }) => {
    const badge = page
      .getByTestId('badge-headless')
      .locator('.neural-badge-root');
    await expect(badge).toHaveClass(/docs-headless-badge/);
    await expect(badge).not.toHaveClass(/neural-badge-base/);
  });
});
