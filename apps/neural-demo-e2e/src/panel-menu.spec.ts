import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('PanelMenu docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/panel-menu');
    await waitForHydration(page);
  });

  test('renders an inline tree and keeps root expansion exclusive', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', {
      name: 'Workspace navigation',
      exact: true,
    });
    await expect(tree).toBeVisible();
    const workspace = tree.getByRole('treeitem', {
      name: /Workspace/,
    });
    await expect(workspace.locator('.nt-folders')).toHaveCSS(
      '--nt-icon',
      /url\(/,
    );
    const cloud = tree.getByRole('treeitem', { name: 'Cloud' });
    await expect(workspace).toHaveAttribute('aria-expanded', 'true');

    await cloud.click();
    await expect(cloud).toHaveAttribute('aria-expanded', 'true');
    await expect(workspace).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Expanded: cloud')).toBeVisible();
  });

  test('selects leaves, reports state, and renders a toast', async ({ page }) => {
    const tree = page.getByRole('tree', { name: 'Workspace navigation', exact: true });
    await tree.getByRole('treeitem', { name: /Documents/ }).click();

    await expect(page.getByText('Last selection: documents')).toBeVisible();
    await expect(
      page.getByText('Documents selected from the inline hierarchy.', {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('navigates deep branches with tree keyboard behavior', async ({
    page,
  }) => {
    const tree = page.getByRole('tree', {
      name: 'Multiple workspace navigation',
    });
    const workspace = tree.getByRole('treeitem', { name: /Workspace/ });
    const documents = tree.getByRole('treeitem', { name: /Documents/ });
    const media = tree.getByRole('treeitem', { name: 'Media' });

    await workspace.focus();
    await page.keyboard.press('ArrowDown');
    await expect(documents).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(media).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(media).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tree.getByRole('treeitem', { name: /Images/ })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(media).toBeFocused();
  });

  test('supports projected items and consumer-owned unstyled slots', async ({
    page,
  }) => {
    const projected = page.getByRole('tree', { name: 'Account navigation' });
    await projected.getByRole('treeitem', { name: /Notifications/ }).click();
    await expect(page.getByText('Last selection: notifications')).toBeVisible();

    const headless = page.getByRole('tree', { name: 'Runtime navigation' });
    await expect(headless).toHaveClass(/docs-headless-panel-menu/);
    await expect(headless).not.toHaveClass(/neural-panel-menu-base/);
    const runtime = headless.getByRole('treeitem', { name: 'Runtime' });
    const runtimeGroup = headless.getByRole('group').first();
    await expect(runtime).toHaveClass(/docs-headless-panel-menu__item/);
    await expect(runtime).not.toHaveClass(/neural-panel-menu-item-base/);
    await expect(runtimeGroup).not.toHaveClass(
      /neural-panel-menu-group-base/,
    );
    await expect(runtimeGroup).toHaveCSS(
      'transition-property',
      /grid-template-rows/,
    );
  });
});
