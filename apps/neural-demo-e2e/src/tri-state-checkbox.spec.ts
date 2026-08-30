import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('TriStateCheckbox docs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/tri-state-checkbox');
    await waitForHydration(page);
  });

  test('activates its route and cycles false, true, null, and false', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'TriStateCheckbox Alpha', exact: true }),
    ).toHaveAttribute('aria-current', 'page');

    const basic = page.getByTestId('tri-state-basic');
    const checkbox = basic.getByRole('checkbox', {
      name: 'Inherit permission from parent',
    });
    const label = basic.getByText('Inherit permission from parent', {
      exact: true,
    });

    await expect(checkbox).toHaveAttribute('aria-checked', 'false');

    const root = checkbox.locator('..');
    const host = root.locator('..');
    const initialRootOffset = await root.evaluate((element) => {
      const hostElement = element.parentElement;
      if (!hostElement) return Number.NaN;

      return (
        element.getBoundingClientRect().top -
        hostElement.getBoundingClientRect().top
      );
    });

    await label.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await expect(basic.getByText(/value: true/)).toBeVisible();

    await label.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    await expect(basic.getByText(/value: null \(mixed\)/)).toBeVisible();
    expect(
      await checkbox.evaluate((input: HTMLInputElement) => input.indeterminate),
    ).toBe(true);

    await label.click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await expect(basic.getByText(/value: false/)).toBeVisible();

    const finalRootOffset = await root.evaluate((element) => {
      const hostElement = element.parentElement;
      if (!hostElement) return Number.NaN;

      return (
        element.getBoundingClientRect().top -
        hostElement.getBoundingClientRect().top
      );
    });
    expect(Number.isFinite(initialRootOffset)).toBe(true);
    expect(Math.abs(finalRootOffset - initialRootOffset)).toBeLessThan(0.5);
    await expect(host).toHaveCSS('align-items', 'flex-start');
  });

  test('writes user changes through every Angular Forms adapter', async ({
    page,
  }) => {
    const forms = page.getByTestId('tri-state-forms');

    for (const label of [
      'Signal permission',
      'Reactive permission',
      'Template permission',
    ]) {
      await forms.getByText(label, { exact: true }).click();
    }

    await expect(forms.getByText('forms: true · true · true')).toBeVisible();

    for (const label of [
      'Signal permission',
      'Reactive permission',
      'Template permission',
    ]) {
      await forms.getByText(label, { exact: true }).click();
    }

    await expect(
      forms.getByText('forms: null (mixed) · null (mixed) · null (mixed)'),
    ).toBeVisible();
  });

  test('preserves mixed, readonly, disabled, and Field state', async ({
    page,
  }) => {
    const disabled = page.getByRole('checkbox', {
      name: 'Mixed and disabled',
    });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute('aria-checked', 'mixed');

    const readonly = page.getByRole('checkbox', {
      name: 'Mixed and readonly',
    });
    await expect(readonly).toBeEnabled();
    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await readonly.focus();
    await expect(readonly).toBeFocused();
    await readonly.press('Space');
    await expect(readonly).toHaveAttribute('aria-checked', 'mixed');

    const fieldControl = page.getByRole('checkbox', {
      name: 'Inherited access',
    });
    await expect(fieldControl).toHaveAttribute('aria-required', 'true');
    await expect(fieldControl).toHaveAttribute('aria-invalid', 'true');
    await expect(fieldControl).toHaveAttribute(
      'aria-describedby',
      'inherited-access-hint inherited-access-error',
    );
  });

  test('exposes the consumer-owned mixed class in unstyled mode', async ({
    page,
  }) => {
    const checkbox = page.getByRole('checkbox', {
      name: 'Custom visual ownership',
    });
    const control = page.locator('.docs-headless-tri-state-checkbox-control');

    await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    await expect(control).toHaveClass(/docs-headless-tri-state-checkbox-mixed/);
    await expect(control).toHaveCSS('background-color', 'rgb(23, 37, 84)');

    await page
      .getByTestId('tri-state-headless')
      .getByText('Custom visual ownership', { exact: true })
      .click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });
});
