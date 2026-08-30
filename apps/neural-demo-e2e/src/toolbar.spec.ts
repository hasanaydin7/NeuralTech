import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Toolbar alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/toolbar');
    await waitForHydration(page);
  });

  test('uses one tab stop and moves through horizontal actions', async ({
    page,
  }) => {
    const toolbar = page.getByRole('toolbar', { name: 'Document actions' });
    const create = toolbar.getByRole('button', { name: 'Create document' });
    const save = toolbar.getByRole('button', { name: 'Save document' });
    await expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(create).toHaveAttribute('tabindex', '0');
    await expect(save).toHaveAttribute('tabindex', '-1');
    await create.focus();
    await page.keyboard.press('ArrowRight');
    await expect(save).toBeFocused();
    await page.keyboard.press('End');
    await expect(
      toolbar.getByRole('button', { name: 'Publish' }),
    ).toBeFocused();
    await page.keyboard.press('Home');
    await expect(create).toBeFocused();
  });

  test('skips disabled controls in vertical orientation', async ({ page }) => {
    const toolbar = page.getByRole('toolbar', { name: 'Formatting actions' });
    const bold = toolbar.getByRole('button', { name: 'Bold' });
    await expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    await bold.focus();
    await page.keyboard.press('ArrowDown');
    await expect(toolbar.getByRole('button', { name: 'Italic' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(toolbar.getByRole('button', { name: 'Clear' })).toBeFocused();
  });

  test('retains semantics and consumer visuals in unstyled mode', async ({
    page,
  }) => {
    const toolbar = page.getByRole('toolbar', { name: 'Agent actions' });
    await expect(toolbar).toHaveClass(/docs-headless-toolbar/);
    await expect(toolbar).not.toHaveClass(/neural-toolbar-base/);
    await expect(toolbar).toHaveCSS('background-color', 'rgb(7, 17, 31)');
    await expect(toolbar.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });
});
