import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Skeleton docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/skeleton');
    await waitForHydration(page);
  });

  test('renders decorative defaults and CSS dimensions', async ({ page }) => {
    const basic = page.getByTestId('skeleton-basic');
    const skeletons = basic.locator('.neural-skeleton-root');

    await expect(skeletons).toHaveCount(3);
    await expect(skeletons.first()).toHaveAttribute('aria-hidden', 'true');
    await expect(skeletons.first()).not.toHaveAttribute('role');
    await expect(skeletons.first()).toHaveAttribute('style', /width: 100%/);
    await expect(skeletons.nth(1)).toHaveAttribute('style', /width: 72%/);
  });

  test('renders circle, rounded, and rectangle shapes', async ({ page }) => {
    const shapes = page.getByTestId('skeleton-shapes');

    await expect(shapes.locator('[data-shape="circle"]')).toHaveCSS(
      'width',
      '48px',
    );
    await expect(shapes.locator('[data-shape="circle"]')).toHaveCSS(
      'height',
      '48px',
    );
    await expect(shapes.locator('[data-shape="rounded"]')).toHaveCount(1);
    await expect(shapes.locator('[data-shape="rectangle"]')).toHaveCSS(
      'border-radius',
      '0px',
    );
  });

  test('supports pulse, wave, none, and reduced motion', async ({ page }) => {
    const animation = page.getByTestId('skeleton-animation');
    const pulse = animation.locator('[data-animation="pulse"]');
    const wave = animation.locator('[data-animation="wave"]');
    const none = animation.locator('[data-animation="none"]');

    await expect(pulse).toHaveCSS('animation-name', 'neural-skeleton-pulse');
    await expect(wave.locator('.neural-skeleton-wave-effect-root')).toHaveCSS(
      'animation-name',
      'neural-skeleton-wave',
    );
    await expect(none).toHaveCSS('animation-name', 'none');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(pulse).toHaveCSS('animation-name', 'none');
    await expect(wave.locator('.neural-skeleton-wave-effect-root')).toHaveCSS(
      'animation-name',
      'none',
    );
  });

  test('keeps loading semantics on the region and visual ownership headless', async ({
    page,
  }) => {
    const card = page.getByRole('article', { name: 'Loading card' });
    await expect(card).toHaveAttribute('aria-busy', 'true');
    await expect(card.locator('[aria-hidden="true"]')).toHaveCount(6);

    const headless = page
      .getByTestId('skeleton-headless')
      .locator('.docs-headless-skeleton');
    await expect(headless).toBeVisible();
    await expect(headless).not.toHaveClass(/neural-skeleton-base/);
    await expect(
      headless.locator('.docs-headless-skeleton__effect'),
    ).not.toHaveClass(/neural-skeleton-effect-base/);
  });
});
