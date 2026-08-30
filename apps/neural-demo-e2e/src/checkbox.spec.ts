import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Checkbox Forms Foundation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/checkbox');
    await waitForHydration(page);
  });

  test('activates its docs route and updates the binary model', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Checkbox Alpha', exact: true }),
    ).toHaveAttribute('aria-current', 'page');

    const checkbox = page.getByRole('checkbox', {
      name: 'I accept the terms and privacy policy',
    });
    await expect(checkbox).not.toBeChecked();
    await page
      .getByText('I accept the terms and privacy policy', { exact: true })
      .click();
    await expect(checkbox).toBeChecked();
    await expect(page.getByText(/State changed: false → true/)).toBeVisible();
  });

  test('preserves disabled and Field-provided accessible state', async ({
    page,
  }) => {
    await expect(
      page.getByRole('checkbox', {
        name: 'Checked and disabled',
        exact: true,
      }),
    ).toBeDisabled();
    const readonly = page.getByRole('checkbox', {
      name: 'Readonly but focusable',
    });
    await expect(readonly).toBeEnabled();
    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await readonly.focus();
    await expect(readonly).toBeFocused();
    await readonly.press('Space');
    await expect(readonly).not.toBeChecked();

    const required = page.getByRole('checkbox', {
      name: 'Required consent',
    });
    await expect(required).toHaveAttribute('aria-required', 'true');
    await expect(required).toHaveAttribute('aria-invalid', 'true');
    await expect(required).toHaveAttribute(
      'aria-describedby',
      'required-consent-hint required-consent-error',
    );
  });

  test('applies consumer-owned headless slot styles', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', {
      name: 'Custom visual ownership',
    });
    const control = page.locator('.docs-headless-checkbox-control');

    await expect(control).toHaveCSS('background-color', 'rgb(8, 47, 73)');
    await expect(control).toHaveCSS('border-radius', '999px');
    await page.getByText('Custom visual ownership', { exact: true }).click();
    await expect(checkbox).not.toBeChecked();
  });
});

test('renders a native Checkbox in the landing preview', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  const checkbox = page.getByRole('checkbox', { name: 'Send release notes' });
  await expect(checkbox).toBeChecked();
  await page.getByText('Send release notes', { exact: true }).click();
  await expect(checkbox).not.toBeChecked();
  await expect(
    page.getByRole('link', { name: 'Checkbox Ready', exact: true }),
  ).toHaveAttribute('href', '/docs/components/checkbox');
});
