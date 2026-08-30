import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('VirtualScroller alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/virtual-scroller');
    await waitForHydration(page);
  });

  test('windows 10,000 records and supports programmatic index scrolling', async ({
    page,
  }) => {
    const scroller = page.getByRole('region', { name: 'Agent task records' });
    const items = scroller.locator('.neural-virtual-scroller-item-root');
    await expect(items).toHaveCount(9);
    await expect(scroller).toHaveAttribute('data-first', '0');

    await page.getByRole('button', { name: /jump to 5,001/i }).click();
    await expect(scroller).toHaveAttribute('data-first', '5000');
    await expect(items.first()).toHaveAttribute('data-index', '4997');
    await expect(items).toHaveCount(12);
  });

  test('virtualizes the horizontal axis with the same range contract', async ({
    page,
  }) => {
    const scroller = page.getByRole('region', { name: 'Agent task cards' });
    const viewport = scroller.getByRole('list', { name: 'Agent task cards' });
    await viewport.evaluate((element) => {
      element.scrollLeft = 368;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(scroller).toHaveAttribute('data-first', '2');
    await expect(
      scroller.locator('.neural-virtual-scroller-item-root').first(),
    ).toHaveAttribute('data-index', '1');
  });

  test('emits lazy ranges and preserves unstyled structural semantics', async ({
    page,
  }) => {
    const lazy = page.getByRole('region', { name: 'Lazy agent records' });
    await lazy.getByRole('list').evaluate((element) => {
      element.scrollTop = 440;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(page.locator('output')).toContainText('visible [10, 15)');

    const headless = page.getByRole('region', {
      name: 'Headless agent records',
    });
    await expect(headless).toHaveClass(/docs-virtual-headless/);
    await expect(headless).not.toHaveClass(/neural-virtual-scroller-base/);
    await expect(headless.getByRole('listitem').first()).toHaveAttribute(
      'aria-setsize',
      '10000',
    );
  });
});
