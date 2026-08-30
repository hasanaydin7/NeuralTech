import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Switch alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/switch');
    await waitForHydration(page);
  });

  test('activates its docs route and updates the boolean model', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Switch Alpha' }),
    ).toHaveAttribute('aria-current', 'page');

    const control = page.getByRole('switch', {
      name: 'Product notifications',
    });
    await expect(control).not.toBeChecked();
    await page.getByText('Product notifications', { exact: true }).click();
    await expect(control).toBeChecked();
    await expect(page.getByText(/State changed: false → true/)).toBeVisible();
  });

  test('binds Signal, Reactive, and template-driven Forms', async ({
    page,
  }) => {
    const controls = [
      page.getByRole('switch', { name: 'Signal notifications' }),
      page.getByRole('switch', { name: 'Reactive notifications' }),
      page.getByRole('switch', { name: 'Template notifications' }),
    ];

    for (const control of controls) {
      await expect(control).not.toBeChecked();
      await control.press('Space');
      await expect(control).toBeChecked();
    }

    await expect(page.getByText('forms: true · true · true')).toBeVisible();
  });

  test('preserves native keyboard and visible state labels', async ({
    page,
  }) => {
    const control = page.getByRole('switch', { name: 'Account status' });
    await expect(control).toBeChecked();
    await expect(page.getByText('On', { exact: true })).toBeVisible();
    await expect(page.getByText('Off', { exact: true })).toBeVisible();

    await control.focus();
    await control.press('Space');
    await expect(control).not.toBeChecked();
    await expect(page.getByText('active: false')).toBeVisible();
  });

  test('distinguishes disabled and readonly states', async ({ page }) => {
    const disabled = page.getByRole('switch', {
      name: 'Enabled and disabled',
    });
    const readonly = page.getByRole('switch', {
      name: 'Enabled and readonly',
    });

    await expect(disabled).toBeDisabled();
    await expect(readonly).not.toBeDisabled();
    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await readonly.focus();
    await expect(readonly).toBeFocused();
    await readonly.press('Space');
    await expect(readonly).toBeChecked();
  });

  test('inherits Field descriptions and readonly state', async ({ page }) => {
    const control = page.getByRole('switch', { name: 'Public profile' });

    await expect(control).toHaveAttribute('id', 'public-profile');
    await expect(control).toHaveAttribute('aria-required', 'true');
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(control).toHaveAttribute('aria-readonly', 'true');
    await expect(control).toHaveAttribute(
      'aria-describedby',
      'public-profile-hint public-profile-error',
    );
  });

  test('applies consumer-owned headless slot styles', async ({ page }) => {
    const control = page.getByRole('switch', {
      name: 'Custom visual ownership',
    });
    const track = page.locator('.docs-headless-switch-track');

    await expect(track).toHaveCSS('background-color', 'rgb(3, 105, 161)');
    await expect(track).toHaveCSS('border-radius', '999px');
    await page.getByText('Custom visual ownership', { exact: true }).click();
    await expect(control).not.toBeChecked();
    await expect(track).toHaveCSS('background-color', 'rgb(51, 65, 85)');
  });
});

test('renders Switch in the landing preview', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  const control = page.getByRole('switch', {
    name: 'Anonymous telemetry',
  });
  await expect(control).not.toBeChecked();
  await page.getByText('Anonymous telemetry', { exact: true }).click();
  await expect(control).toBeChecked();
  await expect(
    page.getByRole('link', { name: 'Switch Ready' }),
  ).toHaveAttribute('href', '/docs/components/switch');
});
