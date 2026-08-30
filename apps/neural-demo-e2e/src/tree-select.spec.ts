import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('TreeSelect alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tree-select');
    await waitForHydration(page);
  });

  test('filters, expands, selects, and restores focus', async ({ page }) => {
    const trigger = page.getByRole('combobox', { name: 'Workspace location' });
    await expect(trigger).toContainText('Design system');
    await trigger.click();
    const panelId = await trigger.getAttribute('aria-controls');
    await page
      .locator(`#${panelId}`)
      .getByPlaceholder('Filter nodes')
      .fill('analytics');
    const tree = page.getByRole('tree', { name: 'Workspace location' });
    await tree.locator('[data-key="analytics"]').click();
    await expect(trigger).toContainText('Analytics');
    await expect(trigger).toBeFocused();
  });

  test('keeps checkbox selection open and renders chips', async ({ page }) => {
    const trigger = page.getByRole('combobox', { name: 'Deployment scopes' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const tree = page.getByRole('tree', { name: 'Deployment scopes' });
    await tree.locator('[data-key="product"] button').click();
    await tree.locator('[data-key="discovery"]').click();
    await expect(tree).toBeVisible();
    await expect(trigger).toContainText('Discovery');
  });

  test('synchronizes Signal, Reactive, and template-driven Forms', async ({
    page,
  }) => {
    const forms = page.locator('#forms');
    const cases = [
      {
        heading: 'Signal Forms',
        name: 'Signal form location',
        key: 'product',
        label: 'Product',
        value: 'product',
      },
      {
        heading: 'Reactive Forms',
        name: 'Reactive form location',
        key: 'engineering',
        label: 'Engineering',
        value: 'engineering',
      },
      {
        heading: 'Template-driven Forms',
        name: 'Template form location',
        key: 'operations',
        label: 'Operations',
        value: 'operations',
      },
    ] as const;

    for (const item of cases) {
      const example = forms.locator('.tree-select-forms-example').filter({
        hasText: item.heading,
      });
      const trigger = example.getByRole('combobox', { name: item.name });
      await trigger.click();
      const tree = page.getByRole('tree', { name: item.name });
      await tree.locator(`[data-key="${item.key}"]`).click();
      await expect(trigger).toContainText(item.label);
      await expect(example.getByText(`Value: ${item.value}`)).toBeVisible();
    }
  });

  test('keeps readonly focusable and blocks pointer and keyboard selection', async ({
    page,
  }) => {
    const readonlyExample = page
      .locator('.tree-select-forms-example')
      .filter({ hasText: 'Readonly inspection' });
    const trigger = readonlyExample.getByRole('combobox', {
      name: 'Readonly location',
    });
    await expect(trigger).toHaveAttribute('aria-readonly', 'true');
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await trigger.click();
    const tree = page.getByRole('tree', { name: 'Readonly location' });
    await expect(tree).toBeVisible();

    await tree.locator('[data-key="product"] button').click();
    await tree.locator('[data-key="analytics"]').click();
    await expect(trigger).toContainText('Design system');

    await tree.locator('[data-key="analytics"]').focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toContainText('Design system');
    await expect(
      readonlyExample.getByText('Value: design-system'),
    ).toBeVisible();
  });

  test('removes visual base classes in unstyled mode', async ({ page }) => {
    const trigger = page.getByRole('combobox', { name: 'Headless location' });
    await expect(trigger).toHaveClass(/docs-tree-select-headless__trigger/);
    await expect(trigger).not.toHaveClass(/neural-tree-select-trigger-base/);
  });
});
