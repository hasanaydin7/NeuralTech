import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Menu docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/menu');
    await waitForHydration(page);
  });

  test('runs inline commands and renders metadata with loaded icons', async ({
    page,
  }) => {
    const menu = page.getByRole('menu', { name: 'Workspace actions' });
    const profile = menu.getByRole('menuitem', { name: /Profile/ });
    await expect(profile.locator('.nt-user')).toHaveCSS('--nt-icon', /url\(/);
    await expect(menu.getByText('4', { exact: true })).toBeVisible();
    await expect(menu.getByRole('separator')).toBeVisible();

    await profile.click();
    await expect(page.getByText('Last command: profile')).toBeVisible();
    await expect(
      page.getByText('Profile selected by pointer.', { exact: true }),
    ).toBeVisible();
  });

  test('opens from the trigger, navigates, and restores focus on Escape', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Open account menu' });
    const popup = page.getByRole('menu', { name: 'Account commands' });

    await expect(trigger).toBeVisible();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popup).toBeVisible();
    await expect(popup.getByRole('menuitem', { name: /Profile/ })).toBeFocused();
    await expect(popup).toHaveAttribute('data-position', /bottom|top/);

    await page.keyboard.press('ArrowDown');
    await expect(
      popup.getByRole('menuitem', { name: /Notifications/ }),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens ArrowUp on the last enabled command and closes on selection', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Open account menu' });
    const popup = page.getByRole('menu', { name: 'Account commands' });

    await trigger.scrollIntoViewIfNeeded();
    await trigger.press('ArrowUp');
    await expect(
      popup.getByRole('menuitem', { name: /Documentation/ }),
    ).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(
      popup.getByRole('menuitem', { name: /Settings/ }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(popup).toBeHidden();
    await expect(page.getByText('Last command: settings')).toBeVisible();
  });

  test('closes a popup when its page context scrolls', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open account menu' });
    const popup = page.getByRole('menu', { name: 'Account commands' });

    const openedAt = await page.evaluate(() => performance.now());
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect
      .poll(() => page.evaluate((start) => performance.now() - start, openedAt))
      .toBeGreaterThan(250);
    const initialScrollY = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => {
      window.scrollTo(
        0,
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        ),
      );
    });
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(initialScrollY);
    await expect(popup).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('supports projected items and consumer-owned unstyled slots', async ({
    page,
  }) => {
    const projected = page.getByRole('menu', { name: 'Developer actions' });
    await expect(projected).toHaveCSS('z-index', 'auto');
    await projected.getByRole('menuitem', { name: 'Copy' }).click();
    await expect(page.getByText('Last command: copy')).toBeVisible();

    const headless = page.getByRole('menu', { name: 'Headless commands' });
    await expect(headless).toHaveClass(/docs-headless-menu/);
    await expect(headless).not.toHaveClass(/neural-menu-base/);
    const profile = headless.getByRole('menuitem', { name: /Profile/ });
    await expect(profile).toHaveClass(/docs-headless-menu__item/);
    await expect(profile).not.toHaveClass(/neural-menu-item-base/);
  });
});
