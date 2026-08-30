import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('MeterGroup docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/meter-group');
    await waitForHydration(page);
  });

  test('links every meter to its visible label and bounded range', async ({
    page,
  }) => {
    const demo = page.getByTestId('meter-group-basic');
    const meters = demo.getByRole('meter');
    const labels = demo.locator('.neural-meter-group-label-root');

    await expect(meters).toHaveCount(3);
    await expect(labels).toHaveCount(3);
    await expect(meters.first()).toHaveAttribute('aria-valuemin', '0');
    await expect(meters.first()).toHaveAttribute('aria-valuemax', '100');
    await expect(meters.first()).toHaveAttribute('aria-valuenow', '24');
    await expect(meters.first()).toHaveAttribute(
      'aria-labelledby',
      await labels.first().getAttribute('id'),
    );
    await expect(demo.getByText('24 GB')).toBeVisible();
  });

  test('updates Signal-driven values and visual allocation', async ({
    page,
  }) => {
    const demo = page.getByTestId('meter-group-basic');
    const media = demo.getByRole('meter').nth(1);

    await expect(media).toHaveAttribute('aria-valuenow', '36');
    await page.getByRole('button', { name: 'Add media usage' }).click();
    await expect(media).toHaveAttribute('aria-valuenow', '40');
    await expect(demo.getByText('40 GB')).toBeVisible();
  });

  test('supports vertical layout, explicit colors, and custom ranges', async ({
    page,
  }) => {
    const vertical = page
      .getByTestId('meter-group-vertical')
      .locator('.neural-meter-group-root');
    await expect(vertical).toHaveAttribute('data-orientation', 'vertical');
    await expect(vertical.getByRole('meter').first()).toHaveAttribute(
      'style',
      /block-size: 38%/,
    );

    const colored = page
      .getByTestId('meter-group-colors')
      .getByRole('meter')
      .first();
    await expect(colored).toHaveCSS('background-color', 'rgb(37, 99, 235)');

    const ranged = page
      .getByTestId('meter-group-range')
      .getByRole('meter')
      .first();
    await expect(ranged).toHaveAttribute('aria-valuemax', '200');
    await expect(ranged).toHaveAttribute('style', /inline-size: 21%/);
  });

  test('preserves meter semantics and structural slots when unstyled', async ({
    page,
  }) => {
    const group = page
      .getByTestId('meter-group-headless')
      .getByRole('group', { name: 'Headless channels' });
    const meter = group.getByRole('meter').first();

    await expect(group).toHaveClass(/docs-headless-meter-group/);
    await expect(group).not.toHaveClass(/neural-meter-group-base/);
    await expect(meter).toHaveClass(/docs-headless-meter-group__meter/);
    await expect(meter).not.toHaveClass(/neural-meter-group-meter-base/);
    await expect(meter).toHaveAttribute('aria-valuenow', '42');
  });
});
