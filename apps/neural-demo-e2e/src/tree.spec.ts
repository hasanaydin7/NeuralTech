import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Tree alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tree');
    await waitForHydration(page);
  });

  test('exposes hierarchy metadata and controlled expansion', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', { name: 'Workspace files' });
    const app = tree.locator('[role="treeitem"][data-key="app"]');
    await expect(app).toHaveAttribute('aria-level', '2');
    await expect(app).toHaveAttribute('aria-expanded', 'false');
    await app.getByRole('button', { name: 'Expand app' }).click();
    await expect(app).toHaveAttribute('aria-expanded', 'true');
    await expect(app.locator('[role="group"]')).toBeVisible();
    await expect(tree.locator('[data-key="app-ts"]')).toBeVisible();
    await page.getByRole('button', { name: 'Collapse all' }).click();
    await expect(tree.locator('[data-key="app"]')).toBeHidden();
    await page.getByRole('button', { name: 'Expand all' }).click();
    await expect(tree.locator('[data-key="app-ts"]')).toBeVisible();
  });

  test('loads a declared lazy branch once and replaces data immutably', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', { name: 'Workspace files' });
    const remote = tree.locator('[data-key="remote"]');
    await remote.getByRole('button', { name: 'Expand Remote agents' }).click();
    await expect(page.getByText('remote · loading children')).toBeVisible();
    await expect(tree.locator('[data-key="agent-eu"]')).toBeVisible();
    await expect(page.getByText('remote · children loaded')).toBeVisible();
    await expect(remote.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Collapse Remote agents',
    );
  });

  test('retains structural semantics and consumer visuals when unstyled', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', { name: 'Headless workspace' });
    const root = tree.locator('..');
    await expect(root).toHaveClass(/docs-headless-tree/);
    await expect(root).not.toHaveClass(/neural-tree-root-base/);
    await expect(root).toHaveCSS('background-color', 'rgb(7, 17, 31)');
    await expect(tree.locator('[role="treeitem"]').first()).toHaveAttribute(
      'aria-level',
      '1',
    );
  });

  test('supports single, range, and propagated checkbox selection', async ({
    page,
  }) => {
    const single = page.getByRole('tree', { name: 'Single selection tree' });
    await single
      .locator('[data-key="src"] > .neural-tree-node-content-root')
      .click();
    await expect(single.locator('[data-key="src"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await single
      .locator('[data-key="libs"] > .neural-tree-node-content-root')
      .click();
    await expect(single.locator('[data-key="src"]')).toHaveAttribute(
      'aria-selected',
      'false',
    );

    const multiple = page.getByRole('tree', {
      name: 'Multiple selection tree',
    });
    await multiple
      .locator('[data-key="app-ts"] > .neural-tree-node-content-root')
      .click();
    await multiple
      .locator('[data-key="libs"] > .neural-tree-node-content-root')
      .click({ modifiers: ['Shift'] });
    await expect(multiple.locator('[data-key="styles"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const checkbox = page.getByRole('tree', {
      name: 'Checkbox selection tree',
    });
    await checkbox
      .locator('[data-key="app-ts"] > .neural-tree-node-content-root')
      .click();
    await expect(checkbox.locator('[data-key="app"]')).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
    await checkbox
      .locator('[data-key="app-html"] > .neural-tree-node-content-root')
      .click();
    await expect(checkbox.locator('[data-key="app"]')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('uses roving focus, tree arrows, typeahead, and RTL navigation', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', { name: 'Single selection tree' });
    const src = tree.locator('[data-key="src"]');
    await src.focus();
    await expect(src).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('ArrowRight');
    await expect(tree.locator('[data-key="app"]')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tree.locator('[data-key="app-ts"]')).toBeFocused();
    await page.keyboard.press('End');
    await expect(tree.locator('[data-key="icons"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(src).toBeFocused();
    await page.keyboard.press('l');
    await expect(tree.locator('[data-key="libs"]')).toBeFocused();

    await tree.evaluate((element) => element.setAttribute('dir', 'rtl'));
    await tree.locator('[data-key="src"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(src).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowLeft');
    await expect(src).toHaveAttribute('aria-expanded', 'true');
  });

  test('filters nested immutable data and renders typed templates', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', { name: 'Filtered custom tree' });
    await page.getByLabel('Filter workspace').fill('neural');
    await expect(tree.locator('[data-key="libs"]')).toBeVisible();
    await expect(tree.locator('[data-key="core"]')).toHaveAttribute(
      'data-match',
      'true',
    );
    await expect(tree.locator('[data-key="src"]')).toBeHidden();
    await expect(tree.locator('.tree-custom-node').first()).toBeVisible();
    await expect(tree.locator('.tree-custom-icon').first()).toBeVisible();
  });

  test('retries lazy error state with a fresh request', async ({ page }) => {
    const tree = page.getByRole('tree', { name: 'Lazy error example' });
    await expect(tree.getByRole('alert')).toContainText('Gateway unavailable');
    await tree.getByRole('button', { name: 'Retry' }).click();
    await expect(
      page.getByText('Retryable lazy error · attempts: 1'),
    ).toBeVisible();
  });
});
