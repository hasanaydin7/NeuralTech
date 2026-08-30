import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Button Badge docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/button');
    await waitForHydration(page);
  });

  test('composes capped and zero Badge values at logical positions', async ({
    page,
  }) => {
    const surface = page.getByTestId('button-badges');
    const inbox = surface.getByRole('button', { name: '128 Inbox' });
    const notifications = surface.getByRole('button', {
      name: 'Notifications 12',
    });
    const completed = surface.getByRole('button', { name: 'Completed 0' });

    await expect(
      inbox.locator('neural-badge.neural-btn-badge-start'),
    ).toContainText('99+');
    await expect(inbox.locator('[aria-label="128"]')).toBeVisible();
    await expect(
      notifications.locator('neural-badge.neural-btn-badge-end'),
    ).toContainText('12');
    await expect(completed.locator('.neural-badge-root')).toContainText('0');
  });

  test('keeps the composed Badge inside the native button', async ({ page }) => {
    const surface = page.getByTestId('button-badges');
    const buttons = surface.getByRole('button');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.first().locator('neural-badge')).toHaveCount(1);
  });

  test('floats notification Badges over all logical corners', async ({
    page,
  }) => {
    const surface = page.getByTestId('button-corner-badges');
    const cases = [
      ['Top start: 3 notifications', 'top-start'],
      ['Top end: 8 notifications', 'top-end'],
      ['Bottom start: 2 notifications', 'bottom-start'],
      ['Bottom end: 5 notifications', 'bottom-end'],
    ] as const;

    for (const [name, position] of cases) {
      const button = surface.getByRole('button', { name });
      const badge = button.locator(`.neural-btn-badge-${position}`);
      await expect(badge).toHaveCSS('position', 'absolute');
      await expect(badge).toBeVisible();
    }

    const topStart = surface.getByRole('button', {
      name: 'Top start: 3 notifications',
    });
    const topStartButtonBox = await topStart.boundingBox();
    const topStartBadgeBox = await topStart
      .locator('.neural-btn-badge-top-start')
      .boundingBox();
    expect(topStartButtonBox).not.toBeNull();
    expect(topStartBadgeBox).not.toBeNull();
    expect(topStartBadgeBox?.x).toBeLessThan(topStartButtonBox?.x ?? 0);
    expect(topStartBadgeBox?.y).toBeLessThan(topStartButtonBox?.y ?? 0);

    const bottomEnd = surface.getByRole('button', {
      name: 'Bottom end: 5 notifications',
    });
    const bottomEndButtonBox = await bottomEnd.boundingBox();
    const bottomEndBadgeBox = await bottomEnd
      .locator('.neural-btn-badge-bottom-end')
      .boundingBox();
    expect(bottomEndButtonBox).not.toBeNull();
    expect(bottomEndBadgeBox).not.toBeNull();
    expect(
      (bottomEndBadgeBox?.x ?? 0) + (bottomEndBadgeBox?.width ?? 0),
    ).toBeGreaterThan(
      (bottomEndButtonBox?.x ?? 0) + (bottomEndButtonBox?.width ?? 0),
    );
    expect(
      (bottomEndBadgeBox?.y ?? 0) + (bottomEndBadgeBox?.height ?? 0),
    ).toBeGreaterThan(
      (bottomEndButtonBox?.y ?? 0) + (bottomEndButtonBox?.height ?? 0),
    );
  });
});
