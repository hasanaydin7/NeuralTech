import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('NeuralNg Field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground');
    await waitForHydration(page, 'app-playground-page');
  });

  test('connects the label, input, hint, and conditional error', async ({
    page,
  }) => {
    const email = page.getByLabel('Work email');
    const field = page.locator('neural-field').filter({
      has: email,
    });

    await expect(email).toHaveAttribute('id', 'signal-email');
    await expect(email).toHaveAttribute(
      'aria-describedby',
      'signal-email-hint',
    );
    await page.getByText('Work email', { exact: true }).click();
    await expect(email).toBeFocused();

    await email.fill('not-an-email');
    await email.blur();
    await expect(field).toHaveAttribute('data-invalid', 'true');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute(
      'aria-describedby',
      'signal-email-hint signal-email-error',
    );
    await expect(page.locator('#signal-email-error')).toHaveAttribute(
      'aria-live',
      'polite',
    );

    await email.fill('valid@neural.ng');
    await expect(field).not.toHaveAttribute('data-invalid', 'true');
    await expect(page.locator('#signal-email-error')).toHaveCount(0);
    await expect(email).toHaveAttribute(
      'aria-describedby',
      'signal-email-hint',
    );
  });

  test('propagates pending, readonly, disabled, required, and fluid state', async ({
    page,
  }) => {
    const email = page.getByLabel('Work email');
    const pending = page.getByLabel('Workspace slug');
    const readonly = page.getByLabel('Account ID');
    const disabled = page.getByLabel('Legacy region');

    await expect(email).toHaveAttribute('required', '');
    await expect(email).toHaveClass(/neural-input-fluid-base/);
    await expect(pending).toHaveAttribute('aria-busy', 'true');
    await expect(readonly).toHaveAttribute('readonly', '');
    await expect(readonly).not.toBeEditable();
    await expect(disabled).toBeDisabled();
  });

  test('keeps accessibility while consumer classes own unstyled visuals', async ({
    page,
  }) => {
    const textarea = page.getByLabel('Deployment note');
    const field = page.locator('.demo-headless-field');

    await expect(field).toHaveClass(/neural-field-root/);
    await expect(field).not.toHaveClass(/neural-field-base/);
    await expect(textarea).toHaveAttribute('id', 'field-headless');
    await expect(textarea).toHaveAttribute(
      'aria-describedby',
      'field-headless-hint',
    );
    await expect(textarea).toHaveClass(/demo-headless-textarea/);
    await expect(textarea).toHaveCSS('background-color', 'rgb(20, 83, 45)');
  });

  test('uses theme tokens without changing the structural contract', async ({
    page,
  }) => {
    const field = page.locator('neural-field').filter({
      has: page.getByLabel('Workspace slug'),
    });

    await page.getByRole('button', { name: 'light', exact: true }).click();
    await expect(field).toHaveCSS('gap', '6px');

    await page.getByRole('button', { name: 'Glass Theme' }).click();
    await expect(field).toHaveCSS('gap', '8px');

    await page.getByRole('button', { name: 'Futuristic Theme' }).click();
    await expect(field).toHaveCSS('gap', '8px');
    await expect(field).toHaveAttribute('data-pending', 'true');
  });
});
