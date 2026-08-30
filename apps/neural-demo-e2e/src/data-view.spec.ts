import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('DataView alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/data-view');
    await waitForHydration(page);
  });

  test('switches typed grid and list layouts and sorts locally', async ({
    page,
  }) => {
    const catalog = page.getByRole('region', { name: 'Product catalog' });
    await expect(catalog).toHaveAttribute('data-layout', 'grid');
    const catalogItems = catalog.locator('.neural-data-view-item-root');
    await expect(catalogItems).toHaveCount(6);
    await expect(catalogItems.first()).toContainText('Agent Hub');

    await page.getByRole('button', { name: 'List layout' }).click();
    await expect(catalog).toHaveAttribute('data-layout', 'list');
    await page.getByLabel('Sort').selectOption('price:-1');
    await expect(catalogItems.first()).toContainText('Agent Hub');
  });

  test('emits serializable remote paging state without slicing supplied rows', async ({
    page,
  }) => {
    const remote = page.getByRole('region', { name: 'Remote products' });
    const remoteItems = remote.locator('.neural-data-view-item-root');
    await expect(remoteItems).toHaveCount(3);
    await remote.getByRole('button', { name: /page 2/i }).click();
    await expect(page.locator('output.demo-status')).toContainText(
      'Request page 2',
    );
    await expect(remoteItems).toHaveCount(3);
  });

  test('preserves semantics while removing NeuralNg visual classes', async ({
    page,
  }) => {
    const headless = page.getByRole('region', { name: 'Headless products' });
    await expect(headless).toHaveClass(/docs-data-view-headless/);
    await expect(headless).not.toHaveClass(/neural-data-view-base/);
    await expect(headless.locator('.neural-data-view-item-root')).toHaveCount(
      3,
    );
    await expect(
      page.getByRole('region', { name: 'Empty products' }),
    ).toContainText('No records found');
  });
});
