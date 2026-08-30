import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Popover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/popover');
    await waitForHydration(page);
  });

  test('opens the topbar theme panel in the top layer and dismisses it', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', {
      name: 'Open theme configurator',
    });
    const panel = page.getByRole('dialog', {
      name: 'Theme configurator',
    });

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    const triggerBox = await trigger.boundingBox();
    const panelBox = await panel.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(panelBox?.y ?? 0).toBeGreaterThanOrEqual(
      (triggerBox?.y ?? 0) + (triggerBox?.height ?? 0),
    );
    expect(
      Math.abs(
        (triggerBox?.x ?? 0) +
          (triggerBox?.width ?? 0) -
          ((panelBox?.x ?? 0) + (panelBox?.width ?? 0)),
      ),
    ).toBeLessThanOrEqual(2);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('keeps its anchored position throughout route-close animation', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Open theme configurator' }).click();
    const panel = page.getByRole('dialog', {
      name: 'Theme configurator',
    });
    await expect(panel).toBeVisible();

    await panel
      .getByRole('link', { name: 'Theming documentation' })
      .click({ noWaitAfter: true });

    const escapedToViewportOrigin = await page.evaluate(async () => {
      for (let frame = 0; frame < 12; frame += 1) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const element = document.querySelector<HTMLElement>(
          '.neural-popover-root',
        );
        if (!element) continue;
        const bounds = element.getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0 && bounds.left < 80) {
          return true;
        }
      }
      return false;
    });

    expect(escapedToViewportOrigin).toBe(false);
    await expect(page).toHaveURL(/\/docs\/getting-started\/theming$/);
  });

  test('supports explicit initial focus and close directives', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Edit profile' });
    await trigger.click();

    const panel = page.getByRole('dialog', { name: 'Edit profile' });
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole('textbox', { name: 'Display name' }),
    ).toBeFocused();

    await panel.getByRole('button', { name: 'Done' }).click();
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('keeps consumer classes in unstyled mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Open headless panel' }).click();

    const panel = page.locator('.bg-primary-950', {
      hasText: 'Consumer-owned visual layer.',
    });
    await expect(panel).toBeVisible();
    await expect(panel).toHaveClass(/bg-primary-950/);
    await expect(panel).not.toHaveClass(/neural-popover-base/);
    await expect(panel.locator('.p-4')).toContainText(
      'Consumer-owned visual layer.',
    );
  });
});
