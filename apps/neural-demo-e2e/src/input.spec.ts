import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('NeuralNg Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground');
    await waitForHydration(page, 'app-playground-page');
  });

  test('enhances native inputs without wrappers or lost attributes', async ({
    page,
  }) => {
    const email = page.getByLabel('Work email');

    await expect(email).toHaveJSProperty('tagName', 'INPUT');
    await expect(email).toHaveAttribute('type', 'email');
    await expect(email).toHaveAttribute('autocomplete', 'email');
    await expect(email).toHaveClass(/neural-input-root/);
    await expect(email).toHaveClass(/neural-input-base/);
    await expect(email).toHaveClass(/neural-input-fluid-base/);
    await expect(email).toHaveAttribute(
      'aria-describedby',
      'signal-email-hint',
    );
  });

  test('binds value and accessible validation through Signal Forms', async ({
    page,
  }) => {
    const email = page.getByLabel('Work email');
    const value = page.getByText('Signal value:', { exact: false });

    await email.fill('hello@neural.ng');
    await expect(value).toContainText('hello@neural.ng');

    await email.fill('not-an-email');
    await email.blur();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute(
      'aria-describedby',
      'signal-email-hint signal-email-error',
    );
    await expect(page.locator('#signal-email-error')).toContainText(
      'Enter a valid email address.',
    );

    await email.fill('valid@neural.ng');
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#signal-email-error')).toHaveCount(0);
  });

  test('exposes native invalid, readonly, and disabled states', async ({
    page,
  }) => {
    const invalid = page.getByLabel('Invalid');
    const readonly = page.getByLabel('Readonly value');
    const disabled = page.getByLabel('Disabled value');

    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAttribute(
      'aria-describedby',
      'input-invalid-error',
    );
    await expect(readonly).toHaveAttribute('readonly', '');
    await expect(readonly).toBeEditable({ editable: false });
    await expect(disabled).toBeDisabled();
  });

  test('supports native class ownership in unstyled mode', async ({ page }) => {
    const headless = page.getByLabel('Custom terminal input');

    await expect(headless).toHaveClass(/neural-input-root/);
    await expect(headless).toHaveClass(/demo-headless-input/);
    await expect(headless).not.toHaveClass(/neural-input-base/);
    await expect(headless).toHaveCSS('background-color', 'rgb(8, 47, 73)');
  });

  test('switches theme tokens and respects reduced motion', async ({
    page,
  }) => {
    const search = page.getByRole('searchbox', {
      name: 'Search',
      exact: true,
    });

    await page.getByRole('button', { name: 'light', exact: true }).click();
    await expect(search).toHaveCSS('border-radius', '8px');

    await page.getByRole('button', { name: 'Glass Theme' }).click();
    await expect(search).toHaveCSS('border-radius', '12px');

    await page.getByRole('button', { name: 'Futuristic Theme' }).click();
    await expect(search).toHaveCSS('border-radius', '2px');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitionDurations = await search.evaluate((element) =>
      getComputedStyle(element)
        .transitionDuration.split(',')
        .map((duration) => Number.parseFloat(duration)),
    );
    expect(transitionDurations.every((duration) => duration <= 0.001)).toBe(
      true,
    );
  });
});
