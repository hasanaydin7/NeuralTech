import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Breadcrumb docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/breadcrumb');
    await waitForHydration(page);
  });

  test('renders semantic data and projected trails', async ({ page }) => {
    const dataTrail = page.getByRole('navigation', {
      name: 'Component documentation',
    });
    await expect(dataTrail.locator('ol')).toBeVisible();
    await expect(dataTrail.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    await expect(dataTrail.locator('[data-key="breadcrumb"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(dataTrail.locator('[data-key="components"]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    const projected = page.getByRole('navigation', {
      name: 'Projected page trail',
    });
    await expect(projected.locator('.breadcrumb-custom-separator')).toHaveCount(
      2,
    );
  });

  test('opens middle locations in Menu-backed overflow', async ({ page }) => {
    const trail = page.getByRole('navigation', {
      name: 'Collapsed page trail',
    });
    const trigger = trail.getByRole('button', { name: 'More locations' });
    await expect(trigger.locator('.nt-dots')).toHaveCSS('--nt-icon', /url\(/);
    await trigger.hover();
    await expect(page.getByRole('tooltip')).toHaveText('More locations');
    await trigger.click();

    const menu = page.getByRole('menu', { name: 'More locations' });
    await expect(page.getByRole('tooltip')).toBeHidden();
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('data-position', /bottom|top/);
    const triggerBox = await trigger.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(menuBox?.x).toBeGreaterThanOrEqual((triggerBox?.x ?? 0) - 1);
    expect(menuBox?.y).toBeGreaterThan(0);
    await expect(menu.getByRole('menuitem', { name: 'Documentation' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Components' })).toBeDisabled();
  });

  test('keeps structural hooks while removing visual classes', async ({
    page,
  }) => {
    const trail = page.getByRole('navigation', {
      name: 'Headless page trail',
    });
    await expect(trail).toHaveClass(/docs-headless-breadcrumb/);
    await expect(trail).not.toHaveClass(/neural-breadcrumb-base/);
    await expect(trail.locator('ol')).toHaveClass(
      /docs-headless-breadcrumb__list/,
    );
  });
});
