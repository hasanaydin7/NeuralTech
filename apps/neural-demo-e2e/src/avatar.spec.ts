import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Avatar docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/avatar');
    await waitForHydration(page);
  });

  test('renders responsive images and deterministic fallback priority', async ({
    page,
  }) => {
    const fallbacks = page.getByTestId('avatar-fallbacks');
    const image = fallbacks.getByRole('img', { name: 'Ada Lovelace' });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('loading', 'eager');
    await expect(image).toHaveAttribute('fetchpriority', 'high');
    await expect(
      fallbacks.getByRole('img', { name: 'Grace Hopper' }),
    ).toContainText('GH');
    await expect(
      fallbacks.getByRole('img', { name: 'Margaret Hamilton' }),
    ).toContainText('MH');
    await expect(fallbacks.locator('.nt-user')).toBeVisible();
    await expect(fallbacks.locator('.nt-sparkles')).toBeVisible();
  });

  test('recovers from a native image error without a broken image', async ({
    page,
  }) => {
    const demo = page.getByTestId('avatar-error');
    await expect(
      demo.getByText('imageError emitted; initials fallback is active'),
    ).toBeVisible();
    await expect(demo.locator('img')).toHaveCount(0);
    await expect(
      demo.getByRole('img', { name: 'Radia Perlman' }),
    ).toContainText('RP');
  });

  test('composes shared status and notification Badge directives', async ({
    page,
  }) => {
    const demo = page.getByTestId('avatar-badges');
    const online = demo.locator(
      '[aria-label="Online"][data-dot="true"]',
    );
    const notifications = demo.locator(
      '[aria-label="5 unread notifications"]',
    );

    await expect(online).toBeVisible();
    await expect(notifications).toContainText('5');
    await expect(
      online.locator('xpath=ancestor::neural-badge[1]'),
    ).toHaveCSS('position', 'absolute');
  });

  test('limits groups and exposes localized overflow', async ({ page }) => {
    const demo = page.getByTestId('avatar-group');
    const avatars = demo.locator('neural-avatar');
    await expect(avatars).toHaveCount(6);
    await expect(demo.locator('neural-avatar:visible')).toHaveCount(3);
    const ringOwner = await avatars.first().evaluate((host) => {
      const root = host.querySelector('.neural-avatar-root');
      return {
        host: getComputedStyle(host).boxShadow,
        root: root ? getComputedStyle(root).boxShadow : 'none',
      };
    });
    expect(ringOwner.host).toBe('none');
    expect(ringOwner.root).not.toBe('none');
    const overflow = demo.locator('.neural-avatar-group-overflow-root');
    await expect(overflow).toContainText('+3');
    await expect(overflow).toHaveAttribute(
      'aria-label',
      '3 more teammates',
    );
  });

  test('preserves typed hooks in unstyled Avatar and AvatarGroup', async ({
    page,
  }) => {
    const demo = page.getByTestId('avatar-headless');
    const avatar = demo.locator('.docs-headless-avatar');
    const group = demo.locator('.docs-headless-avatar-group');
    const overflow = demo.locator('.docs-headless-avatar-group__overflow');

    await expect(avatar).toBeVisible();
    await expect(avatar).not.toHaveClass(/neural-avatar-base/);
    await expect(group).not.toHaveClass(/neural-avatar-group-base/);
    await expect(overflow).not.toHaveClass(
      /neural-avatar-group-overflow-base/,
    );
  });
});
