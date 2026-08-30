import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Drawer alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/drawer');
    await waitForHydration(page);
  });

  test('opens in the native top layer, focuses content, closes with Escape, and restores focus', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Drawer Alpha' }),
    ).toHaveAttribute('aria-current', 'page');
    const trigger = page.getByRole('button', { name: 'Open settings' }).first();
    await trigger.focus();
    await trigger.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Settings' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-position', 'end');
    await expect(page.getByLabel('Workspace name')).toBeFocused();
    const viewport = page.viewportSize();
    const firstFrame = await drawer.evaluate(
      (element) =>
        new Promise<{ x: number; width: number }>((resolve) => {
          requestAnimationFrame(() => {
            const bounds = element.getBoundingClientRect();
            resolve({ x: bounds.x, width: bounds.width });
          });
        }),
    );
    expect(firstFrame.x).toBeGreaterThanOrEqual(
      (viewport?.width ?? 0) - firstFrame.width - 2,
    );
    await expect
      .poll(async () => {
        const box = await drawer.boundingBox();
        return Math.abs(
          (box?.x ?? 0) + (box?.width ?? 0) - (viewport?.width ?? 0),
        );
      })
      .toBeLessThan(2);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.getByText('Last close: escape')).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('places logical start and physical bottom drawers on viewport edges', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'start', exact: true }).click();
    const start = page.getByRole('dialog', { name: 'start drawer' });
    await expect(start).toBeVisible();
    await expect
      .poll(
        async () => (await start.boundingBox())?.x ?? Number.POSITIVE_INFINITY,
      )
      .toBeLessThan(2);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'bottom', exact: true }).click();
    const bottom = page.getByRole('dialog', { name: 'bottom drawer' });
    await expect(bottom).toBeVisible();
    const viewport = page.viewportSize();
    await expect
      .poll(async () => {
        const box = await bottom.boundingBox();
        return Math.abs(
          (box?.y ?? 0) + (box?.height ?? 0) - (viewport?.height ?? 0),
        );
      })
      .toBeLessThan(2);
  });

  test('keeps native semantics and consumer visuals in unstyled mode', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Open headless drawer' }).click();
    const drawer = page.getByRole('dialog', { name: 'Agent console' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/neural-drawer-root/);
    await expect(drawer).not.toHaveClass(/neural-drawer-base/);
    await expect(drawer).toHaveCSS('background-color', 'rgb(7, 17, 31)');
    await expect(
      page.getByRole('button', { name: 'Run focused action' }),
    ).toBeFocused();
  });
});
