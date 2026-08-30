import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Dialog docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/dialog');
    await waitForHydration(page);
  });

  test('uses native modal focus and reports deterministic close reasons', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Edit profile' });
    await trigger.focus();
    await trigger.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Edit profile' });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel('Display name')).toBeFocused();

    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Last close: api')).toBeVisible();
    await expect(trigger).toBeFocused();

    await trigger.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Last close: escape')).toBeVisible();
  });

  test('keeps native structure in consumer-owned unstyled mode', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Open headless dialog' }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Consumer-owned canvas',
    });
    await expect(dialog).toHaveClass(/neural-dialog-root/);
    await expect(dialog).toHaveClass(/docs-headless-dialog/);
    await expect(dialog).not.toHaveClass(/neural-dialog-base/);
    await expect(dialog).toHaveCSS('position', 'fixed');

    const topBeforeScroll = (await dialog.boundingBox())?.y;
    await page.evaluate(() => window.scrollBy(0, 400));
    const topAfterScroll = (await dialog.boundingBox())?.y;
    expect(topAfterScroll).toBeCloseTo(topBeforeScroll ?? 0, 0);
  });

  test('stays in the viewport when the document scroll position changes', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Edit profile' });
    await trigger.scrollIntoViewIfNeeded();
    const pageScrollBeforeOpen = await page.evaluate(() => window.scrollY);

    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Edit profile' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS('position', 'fixed');
    await expect(dialog).toHaveCSS('transform', 'none');
    expect(await page.evaluate(() => window.scrollY)).toBe(
      pageScrollBeforeOpen,
    );

    const topBeforeScroll = (await dialog.boundingBox())?.y;
    await page.evaluate(() => window.scrollBy(0, 400));
    const topAfterScroll = (await dialog.boundingBox())?.y;

    expect(topBeforeScroll).toBeDefined();
    expect(topAfterScroll).toBeCloseTo(topBeforeScroll ?? 0, 0);
  });
});
