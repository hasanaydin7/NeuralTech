import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Tooltip docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tooltip');
    await waitForHydration(page);
  });

  test('opens on hover, preserves descriptions, and closes with Escape', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Account settings' });
    await trigger.hover();
    const tooltip = page.getByRole('tooltip', {
      name: 'Account preferences and security',
    });
    await expect(tooltip).toBeVisible();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'tooltip-static-note account-settings-tooltip',
    );

    await trigger.focus();
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'tooltip-static-note',
    );
  });

  test('supports every placement and consumer-owned unstyled classes', async ({
    page,
  }) => {
    const topStartTrigger = page.getByRole('button', {
      name: 'top-start',
      exact: true,
    });
    await topStartTrigger.hover();
    const topStartTooltip = page.getByRole('tooltip', {
      name: 'Position: top-start',
    });
    await expect(topStartTooltip).toBeVisible();
    const topStartTriggerBox = await topStartTrigger.boundingBox();
    const topStartTooltipBox = await topStartTooltip.boundingBox();
    expect(topStartTriggerBox).not.toBeNull();
    expect(topStartTooltipBox).not.toBeNull();
    expect(
      Math.abs(
        (topStartTriggerBox?.x ?? 0) - (topStartTooltipBox?.x ?? 0),
      ),
    ).toBeLessThanOrEqual(2);
    const topStartArrowBox = await topStartTooltip
      .locator('.neural-tooltip-arrow-root')
      .boundingBox();
    expect(topStartArrowBox).not.toBeNull();
    expect(
      (topStartArrowBox?.x ?? 0) +
        (topStartArrowBox?.width ?? 0) / 2 -
        (topStartTooltipBox?.x ?? 0),
    ).toBeLessThanOrEqual(24);

    const topEndTrigger = page.getByRole('button', {
      name: 'top-end',
      exact: true,
    });
    await topEndTrigger.hover();
    const topEndTooltip = page.getByRole('tooltip', {
      name: 'Position: top-end',
    });
    await expect(topEndTooltip).toBeVisible();
    const topEndTriggerBox = await topEndTrigger.boundingBox();
    const topEndTooltipBox = await topEndTooltip.boundingBox();
    expect(topEndTriggerBox).not.toBeNull();
    expect(topEndTooltipBox).not.toBeNull();
    expect(
      Math.abs(
        (topEndTriggerBox?.x ?? 0) +
          (topEndTriggerBox?.width ?? 0) -
          ((topEndTooltipBox?.x ?? 0) + (topEndTooltipBox?.width ?? 0)),
      ),
    ).toBeLessThanOrEqual(2);
    const topEndArrowBox = await topEndTooltip
      .locator('.neural-tooltip-arrow-root')
      .boundingBox();
    expect(topEndArrowBox).not.toBeNull();
    expect(
      (topEndTooltipBox?.x ?? 0) +
        (topEndTooltipBox?.width ?? 0) -
        ((topEndArrowBox?.x ?? 0) + (topEndArrowBox?.width ?? 0) / 2),
    ).toBeLessThanOrEqual(24);

    const bottomStartTrigger = page.getByRole('button', {
      name: 'bottom-start',
      exact: true,
    });
    await bottomStartTrigger.hover();
    const bottomStartTooltip = page.getByRole('tooltip', {
      name: 'Position: bottom-start',
    });
    await expect(bottomStartTooltip).toBeVisible();
    const bottomStartTriggerBox = await bottomStartTrigger.boundingBox();
    const bottomStartTooltipBox = await bottomStartTooltip.boundingBox();
    expect(bottomStartTriggerBox).not.toBeNull();
    expect(bottomStartTooltipBox).not.toBeNull();
    expect(
      Math.abs(
        (bottomStartTriggerBox?.x ?? 0) -
          (bottomStartTooltipBox?.x ?? 0),
      ),
    ).toBeLessThanOrEqual(2);
    expect(bottomStartTooltipBox?.y ?? 0).toBeGreaterThanOrEqual(
      (bottomStartTriggerBox?.y ?? 0) +
        (bottomStartTriggerBox?.height ?? 0),
    );
    const bottomStartArrowBox = await bottomStartTooltip
      .locator('.neural-tooltip-arrow-root')
      .boundingBox();
    expect(bottomStartArrowBox).not.toBeNull();
    expect(
      (bottomStartArrowBox?.x ?? 0) +
        (bottomStartArrowBox?.width ?? 0) / 2 -
        (bottomStartTooltipBox?.x ?? 0),
    ).toBeLessThanOrEqual(24);

    const bottomEndTrigger = page.getByRole('button', {
      name: 'bottom-end',
      exact: true,
    });
    await bottomEndTrigger.hover();
    const bottomEndTooltip = page.getByRole('tooltip', {
      name: 'Position: bottom-end',
    });
    await expect(bottomEndTooltip).toBeVisible();
    const bottomEndTriggerBox = await bottomEndTrigger.boundingBox();
    const bottomEndTooltipBox = await bottomEndTooltip.boundingBox();
    expect(bottomEndTriggerBox).not.toBeNull();
    expect(bottomEndTooltipBox).not.toBeNull();
    expect(
      Math.abs(
        (bottomEndTriggerBox?.x ?? 0) +
          (bottomEndTriggerBox?.width ?? 0) -
          ((bottomEndTooltipBox?.x ?? 0) + (bottomEndTooltipBox?.width ?? 0)),
      ),
    ).toBeLessThanOrEqual(2);
    expect(bottomEndTooltipBox?.y ?? 0).toBeGreaterThanOrEqual(
      (bottomEndTriggerBox?.y ?? 0) + (bottomEndTriggerBox?.height ?? 0),
    );
    const bottomEndArrowBox = await bottomEndTooltip
      .locator('.neural-tooltip-arrow-root')
      .boundingBox();
    expect(bottomEndArrowBox).not.toBeNull();
    expect(
      (bottomEndTooltipBox?.x ?? 0) +
        (bottomEndTooltipBox?.width ?? 0) -
        ((bottomEndArrowBox?.x ?? 0) + (bottomEndArrowBox?.width ?? 0) / 2),
    ).toBeLessThanOrEqual(24);

    const right = page.getByRole('button', { name: 'right', exact: true });
    await right.hover();
    const positioned = page.getByRole('tooltip', { name: 'Position: right' });
    await expect(positioned).toBeVisible();
    await expect(positioned).toHaveAttribute('data-position', 'right');

    const headless = page.getByRole('button', {
      name: 'Headless tooltip',
    });
    await headless.hover();
    const tooltip = page.getByRole('tooltip', {
      name: 'Consumer-owned visual layer',
    });
    await expect(tooltip).toHaveClass(/docs-headless-tooltip/);
    await expect(tooltip).not.toHaveClass(/neural-tooltip-base/);
  });

  test('does not render a disabled tooltip', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Tooltip disabled' });
    await trigger.hover();
    await expect(
      page.getByRole('tooltip', { name: 'This content never opens' }),
    ).toHaveCount(0);
  });

  test('keeps leaving tooltips anchored during rapid trigger changes', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'top-end', exact: true }).hover();
    await expect(
      page.getByRole('tooltip', { name: 'Position: top-end' }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'bottom-start', exact: true })
      .hover();

    const escapedToViewportOrigin = await page.evaluate(async () => {
      for (let frame = 0; frame < 12; frame += 1) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const escaped = [
          ...document.querySelectorAll('neural-tooltip-renderer'),
        ].some((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.width > 0 && bounds.left < 100 && bounds.top < 100;
        });
        if (escaped) return true;
      }
      return false;
    });

    expect(escapedToViewportOrigin).toBe(false);
    await expect(
      page.getByRole('tooltip', { name: 'Position: bottom-start' }),
    ).toBeVisible();
  });
});
