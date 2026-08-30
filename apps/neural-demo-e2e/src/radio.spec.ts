import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Radio alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/radio');
    await waitForHydration(page);
  });

  test('activates its docs route and selects data options', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Radio Alpha' }),
    ).toHaveAttribute('aria-current', 'page');

    const dataOptions = page.locator('#data-options');
    const starter = dataOptions.getByRole('radio', { name: 'Starter' });
    const team = dataOptions.getByRole('radio', { name: 'Team', exact: true });
    await expect(starter).toBeChecked();
    await dataOptions.getByText('Team', { exact: true }).click();
    await expect(team).toBeChecked();
    await expect(page.getByText(/starter → team via pointer/)).toBeVisible();
    await expect(
      dataOptions.getByRole('radio', { name: /Enterprise/ }),
    ).toBeDisabled();
  });

  test('binds every Angular Forms adapter through one nullable value model', async ({
    page,
  }) => {
    const signalGroup = page.getByRole('radiogroup', {
      name: 'Signal form plan',
    });
    const reactiveGroup = page.getByRole('radiogroup', {
      name: 'Reactive form plan',
    });
    const templateGroup = page.getByRole('radiogroup', {
      name: 'Template form plan',
    });

    await signalGroup.getByText('Team', { exact: true }).click();
    await reactiveGroup.getByText('Team', { exact: true }).click();
    await templateGroup.getByText('Team', { exact: true }).click();

    await expect(signalGroup.getByRole('radio', { name: 'Team' })).toBeChecked();
    await expect(
      reactiveGroup.getByRole('radio', { name: 'Team' }),
    ).toBeChecked();
    await expect(
      templateGroup.getByRole('radio', { name: 'Team' }),
    ).toBeChecked();
    await expect(page.getByText('forms: team · team · team')).toBeVisible();
  });

  test('keeps readonly groups focusable without changing value', async ({
    page,
  }) => {
    const group = page.getByRole('radiogroup', { name: 'Readonly plan' });
    const starter = group.getByRole('radio', { name: 'Starter' });
    const team = group.getByRole('radio', { name: 'Team' });

    await expect(group).toHaveAttribute('aria-readonly', 'true');
    await expect(starter).toBeEnabled();
    await starter.focus();
    await expect(starter).toBeFocused();
    await starter.press('ArrowRight');
    await expect(starter).toBeChecked();
    await expect(team).not.toBeChecked();
    await group.getByText('Team', { exact: true }).click();
    await expect(starter).toBeChecked();
    await expect(team).not.toBeChecked();
  });

  test('supports rich projected choices', async ({ page }) => {
    const standard = page.getByRole('radio', {
      name: /Standard delivery/,
    });
    const pickup = page.getByRole('radio', { name: /Store pickup/ });

    await expect(standard).toBeChecked();
    await page.getByText('Store pickup', { exact: true }).click();
    await expect(pickup).toBeChecked();
    await expect(page.getByText('delivery: pickup')).toBeVisible();
  });

  test('uses one tab stop and skips disabled options with arrow keys', async ({
    page,
  }) => {
    const dataOptions = page.locator('#data-options');
    const starter = dataOptions.getByRole('radio', { name: 'Starter' });
    const enterprise = dataOptions.getByRole('radio', { name: /Enterprise/ });
    const team = dataOptions.getByRole('radio', {
      name: 'Team',
      exact: true,
    });

    await expect(starter).toHaveAttribute('tabindex', '0');
    await expect(team).toHaveAttribute('tabindex', '-1');
    await starter.focus();
    await starter.press('ArrowUp');

    await expect(team).toBeChecked();
    await expect(team).toBeFocused();
    await expect(enterprise).not.toBeChecked();
    await expect(page.getByText(/starter → team via keyboard/)).toBeVisible();
  });

  test('inherits required and invalid state from Field', async ({ page }) => {
    const group = page.getByRole('radiogroup').filter({
      has: page.getByRole('radio', { name: 'Email' }),
    });
    const email = page.getByRole('radio', { name: 'Email' });

    await expect(group).toHaveAttribute('id', 'contact-method');
    await expect(group).toHaveAttribute('aria-required', 'true');
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAttribute(
      'aria-describedby',
      'contact-method-hint contact-method-error',
    );
    await expect(email).toHaveAttribute('required', '');
  });

  test('applies consumer-owned headless slot styles', async ({ page }) => {
    const headless = page.locator('#headless');
    const signals = headless.getByRole('radio', { name: 'signals' });
    const option = signals.locator('..');

    await expect(option).toHaveCSS('background-color', 'rgb(8, 47, 73)');
    await expect(option).toHaveCSS('border-radius', '999px');
    await headless.getByText('standalone', { exact: true }).click();
    await expect(
      headless.getByRole('radio', { name: 'standalone' }),
    ).toBeChecked();
  });
});

test('renders RadioGroup in the landing preview', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  const browser = page.getByRole('radio', { name: 'Browser' });
  const ssr = page.getByRole('radio', { name: 'SSR', exact: true });
  await expect(browser).toBeChecked();
  await page.getByText('SSR', { exact: true }).click();
  await expect(ssr).toBeChecked();
  await expect(page.getByRole('link', { name: 'Radio Ready' })).toHaveAttribute(
    'href',
    '/docs/components/radio',
  );
});
