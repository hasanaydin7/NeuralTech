import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Accordion docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/accordion');
    await waitForHydration(page);
  });

  test('expands data panels and reports user changes', async ({ page }) => {
    const headless = page.getByRole('button', {
      name: 'Can every visual class be removed?',
    });
    const collapsedHeight = (await headless.boundingBox())?.height ?? Infinity;
    expect(collapsedHeight).toBeLessThan(48);

    await headless.click();
    await expect(headless).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('region', {
        name: 'Can every visual class be removed?',
      }),
    ).toContainText('application-wide unstyled modes');
    await expect(page.getByText('Last event: headless:open')).toBeVisible();
  });

  test('supports multiple panels and keyboard header navigation', async ({
    page,
  }) => {
    const architecture = page.getByRole('button', {
      name: 'Architecture',
    });
    const accessibility = page.getByRole('button', {
      name: 'Accessibility',
    });
    await architecture.focus();
    await page.keyboard.press('ArrowDown');
    await expect(accessibility).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(architecture).toHaveAttribute('aria-expanded', 'true');
    await expect(accessibility).toHaveAttribute('aria-expanded', 'true');
  });

  test('keeps headless structure without NeuralNg visual classes', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Semantic core' });
    await expect(trigger).toHaveClass(/neural-accordion-trigger-root/);
    await expect(trigger).toHaveClass(/docs-headless-accordion__trigger/);
    await expect(trigger).not.toHaveClass(/neural-accordion-trigger-base/);
  });
});
