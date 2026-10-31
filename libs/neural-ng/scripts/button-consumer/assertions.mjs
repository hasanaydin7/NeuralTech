import { expect } from '@playwright/test';

export async function assertButtonIntegration(page) {
  const save = page.getByRole('button', { name: 'Save settings' });
  await save.focus();
  await save.press('Enter');
  await expect(page.locator('#saves-value')).toHaveText('1');
  const group = page.getByRole('group', {
    name: 'Consumer actions',
    exact: true,
  });
  const firstAction = group.getByRole('button', {
    name: 'First action',
    exact: true,
  });
  const lastAction = group.getByRole('button', {
    name: 'Last action',
    exact: true,
  });
  await firstAction.focus();
  await page.keyboard.press('Tab');
  await expect(lastAction).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(firstAction).toBeFocused();
  for (const direction of ['ltr', 'rtl']) {
    await page
      .locator('html')
      .evaluate((el, direction) => (el.dir = direction), direction);
    const firstBox = await firstAction.boundingBox();
    const lastBox = await lastAction.boundingBox();
    expect(firstBox && lastBox).toBeTruthy();
    expect(Math.sign(lastBox.x - firstBox.x)).toBe(
      direction === 'rtl' ? -1 : 1,
    );
    const logicalCorners = (el) => {
      const s = getComputedStyle(el);
      return [
        s.borderStartStartRadius,
        s.borderStartEndRadius,
        s.borderEndStartRadius,
        s.borderEndEndRadius,
      ].map(parseFloat);
    };
    const firstCorners = await firstAction.evaluate(logicalCorners);
    const lastCorners = await lastAction.evaluate(logicalCorners);
    expect(firstCorners[0]).toBeGreaterThan(0);
    expect(firstCorners[2]).toBeGreaterThan(0);
    expect(firstCorners[1]).toBe(0);
    expect(firstCorners[3]).toBe(0);
    expect(lastCorners[0]).toBe(0);
    expect(lastCorners[2]).toBe(0);
    expect(lastCorners[1]).toBeGreaterThan(0);
    expect(lastCorners[3]).toBeGreaterThan(0);
    const vertical = page.getByRole('group', {
      name: 'Vertical consumer actions',
      exact: true,
    });
    const top = await vertical
      .getByRole('button', { name: 'Top action' })
      .boundingBox();
    const bottom = await vertical
      .getByRole('button', { name: 'Bottom action' })
      .boundingBox();
    expect(bottom.y).toBeGreaterThan(top.y);
    expect(Math.abs(bottom.x - top.x)).toBeLessThanOrEqual(1);
    const unstyled = page.getByRole('group', {
      name: 'Unstyled consumer group',
      exact: true,
    });
    for (const member of await unstyled.getByRole('button').all()) {
      const corners = await member.evaluate(logicalCorners);
      expect(corners.every((radius) => radius > 0)).toBe(true);
    }
  }
  await page.locator('html').evaluate((el) => (el.dir = 'ltr'));
  const trigger = page.locator('#consumer-menu-trigger button');
  const popup = page.getByRole('menu', { name: 'Consumer popup', exact: true });
  await expect(trigger).toHaveAttribute(
    'aria-controls',
    'consumer-actions-menu',
  );
  await page
    .getByRole('button', { name: 'Toggle menu loading', exact: true })
    .click();
  await trigger.focus();
  for (const key of ['ArrowDown', 'ArrowUp', 'Enter', 'Space']) {
    await trigger.press(key);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(trigger).not.toBeFocused();
  await page
    .locator('#consumer-action-form neural-button[type="submit"] button')
    .press('Enter');
  await expect(page.locator('#action-submits')).toHaveText('0');
  await page
    .getByRole('button', { name: 'Toggle menu loading', exact: true })
    .click();
  await trigger.focus();
  await trigger.press('ArrowDown');
  await expect(popup).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Inspect details', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page
    .getByRole('button', { name: 'No submit', exact: true })
    .press('Enter');
  await expect(page.locator('#action-submits')).toHaveText('0');
  await page
    .getByRole('button', { name: 'Submit action', exact: true })
    .press('Enter');
  await expect(page.locator('#action-submits')).toHaveText('1');
  await page.getByLabel('Action title', { exact: true }).fill('Edited');
  await page
    .getByRole('button', { name: 'Reset action', exact: true })
    .press('Space');
  await expect(page.getByLabel('Action title', { exact: true })).toHaveValue(
    'Initial',
  );
  await expect(page.locator('#action-resets')).toHaveText('1');
  console.log(
    'Packed Button/ButtonGroup/menu: hydration identity, disabled Tab skip, RTL order, busy menu suppression/recovery, Escape focus return and native form defaults passed.',
  );
}
