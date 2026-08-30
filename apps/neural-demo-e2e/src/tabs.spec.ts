import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('NeuralNg Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground');
    await waitForHydration(page, 'app-playground-page');
  });

  test('connects tabs and panels and supports both icon APIs', async ({
    page,
  }) => {
    const list = page.getByRole('tablist', { name: 'Account sections' });
    const overview = list.getByRole('tab', { name: 'Overview' });
    const profile = list.getByRole('tab', { name: 'Profile' });
    const disabled = list.getByRole('tab', { name: 'Disabled' });

    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(overview).toHaveAttribute(
      'aria-controls',
      'demo-account-tabs-panel-0',
    );
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(overview.locator('.neural-tab-icon')).toHaveClass(
      /\bnt-home\b/,
    );
    await expect(profile.locator('i.nt-user')).toHaveCount(1);
    await expect(profile.locator('.neural-tab-icon')).toHaveCount(0);

    await profile.click();
    await expect(profile).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Profile' })).toBeVisible();
    await expect(page.getByText('The selected Signal value is')).toContainText(
      'profile',
    );
  });

  test('uses roving focus, wraps, and skips disabled tabs automatically', async ({
    page,
  }) => {
    const list = page.getByRole('tablist', { name: 'Account sections' });
    const overview = list.getByRole('tab', { name: 'Overview' });
    const profile = list.getByRole('tab', { name: 'Profile' });
    const billing = list.getByRole('tab', { name: 'Billing' });

    await overview.focus();
    await page.keyboard.press('ArrowRight');
    await expect(profile).toBeFocused();
    await expect(profile).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('End');
    await expect(billing).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(overview).toBeFocused();
    await expect(overview).toHaveAttribute('tabindex', '0');
  });

  test('keeps focus and selection separate in vertical manual mode', async ({
    page,
  }) => {
    const list = page.getByRole('tablist', { name: 'Project sections' });
    const activity = list.getByRole('tab', { name: 'Activity' });
    const team = list.getByRole('tab', { name: 'Team' });

    await expect(list).toHaveAttribute('aria-orientation', 'vertical');
    await activity.focus();
    await page.keyboard.press('ArrowDown');
    await expect(team).toBeFocused();
    await expect(activity).toHaveAttribute('aria-selected', 'true');
    await expect(team).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Space');
    await expect(team).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Team' })).toBeVisible();
  });

  test('reverses horizontal arrow direction in RTL', async ({ page }) => {
    const list = page.getByRole('tablist', { name: 'Account sections' });
    const overview = list.getByRole('tab', { name: 'Overview' });
    const billing = list.getByRole('tab', { name: 'Billing' });

    await list.evaluate((element) => element.setAttribute('dir', 'rtl'));
    await overview.focus();
    await page.keyboard.press('ArrowRight');

    await expect(billing).toBeFocused();
    await expect(billing).toHaveAttribute('aria-selected', 'true');
  });

  test('provides responsive overflow and motion-safe visual feedback', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const list = page.getByRole('tablist', { name: 'Account sections' });
    const overview = list.getByRole('tab', { name: 'Overview' });
    const panel = page.getByRole('tabpanel', { name: 'Overview' });

    const overflow = await list.evaluate((element) => ({
      clientWidth: element.clientWidth,
      overflowX: getComputedStyle(element).overflowX,
      scrollWidth: element.scrollWidth,
    }));
    expect(overflow.overflowX).toBe('auto');
    expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
    expect(
      await overview.evaluate(
        (element) => getComputedStyle(element, '::after').transform,
      ),
    ).not.toBe('none');
    await expect(panel).toHaveCSS('animation-name', 'neural-tab-panel-enter');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(panel).toHaveCSS('animation-name', 'none');
  });

  test('retains structure and ARIA while removing visual base classes', async ({
    page,
  }) => {
    const list = page.getByRole('tablist', { name: 'Headless example' });
    const markup = list.getByRole('tab', { name: 'Markup' });

    await expect(list).toHaveClass(/demo-headless-tab-list/);
    await expect(list).toHaveClass(/neural-tab-list-root/);
    await expect(list).not.toHaveClass(/neural-tab-list-base/);
    await expect(markup).toHaveClass(/demo-headless-tab-active/);
    await expect(markup).not.toHaveClass(/neural-tab-base/);
    await expect(page.getByRole('tabpanel', { name: 'Markup' })).toBeVisible();
  });
});
