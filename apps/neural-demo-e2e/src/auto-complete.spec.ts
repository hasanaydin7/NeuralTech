import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('AutoComplete alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/auto-complete');
    await waitForHydration(page);
  });

  test('filters local data and selects while retaining input focus', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'AutoComplete Alpha' }),
    ).toHaveAttribute('aria-current', 'page');
    const section = page
      .getByRole('heading', { name: 'Local suggestions' })
      .locator('..');
    const input = section.getByRole('combobox', { name: 'Destination' });
    await input.fill('ank');
    const panel = page.locator(
      '.neural-popover-root[data-open="true"]:visible',
    );
    const control = section.locator('.neural-auto-complete-input-group-root');
    await expect(control).toHaveCSS('overflow', 'hidden');
    const [controlBox, panelBox] = await Promise.all([
      control.boundingBox(),
      panel.boundingBox(),
    ]);
    expect(controlBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    const controlWidth = controlBox?.width ?? 0;
    const panelWidth = panelBox?.width ?? 0;
    const crossBrowserWidthTolerance = Math.max(controlWidth * 0.06, 1);
    expect(Math.abs(controlWidth - panelWidth)).toBeLessThanOrEqual(
      crossBrowserWidthTolerance,
    );
    await expect(input).toHaveCSS('outline-style', 'none');
    await expect(panel.getByRole('option')).toHaveCount(1);
    await expect(panel.getByRole('option')).toContainText('Ankara');
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(input).toHaveValue('Ankara');
    await expect(input).toBeFocused();
    await expect(section.getByText('Model: ank')).toBeVisible();
  });

  test('debounces remote requests and renders the latest response', async ({
    page,
  }) => {
    const section = page
      .getByRole('heading', { name: 'Remote and race-safe' })
      .locator('..');
    const input = section.getByRole('combobox', { name: 'Remote city search' });
    await input.fill('an');
    await expect(section.getByText(/Request 1 · loading/)).toBeVisible();
    await expect(
      page
        .locator('.neural-popover-root[data-open="true"]:visible')
        .getByRole('option'),
    ).toHaveCount(5);
    await expect(section.getByText(/Request 1 · 5 results/)).toBeVisible();
  });

  test('keeps structural semantics in unstyled mode', async ({ page }) => {
    const section = page
      .getByRole('heading', { name: 'Unstyled and typed class slots' })
      .locator('..');
    const root = section.locator('.neural-auto-complete-root');
    await expect(root).toHaveClass(/docs-autocomplete-headless/);
    await expect(root).not.toHaveClass(/neural-auto-complete-base/);
    await expect(
      section.locator('.docs-autocomplete-headless__control'),
    ).toHaveCSS('background-color', 'rgba(15, 23, 42, 0.92)');
    const input = section.getByRole('combobox', {
      name: 'Headless architecture',
    });
    await input.fill('sig');
    const option = page
      .locator('.neural-auto-complete-option-root:visible')
      .first();
    await expect(
      page.locator('.docs-autocomplete-headless__panel:visible'),
    ).toHaveCSS('background-color', 'rgba(15, 23, 42, 0.98)');
    await expect(option).toHaveClass(/docs-autocomplete-headless__option/);
    await expect(option).not.toHaveClass(/neural-auto-complete-option-base/);
  });

  test('binds every Forms adapter and protects readonly values', async ({
    page,
  }) => {
    const forms = page.locator('#forms');

    const signalExample = forms.locator('.autocomplete-forms-example').filter({
      hasText: 'Signal Forms',
    });
    const signal = signalExample.getByRole('combobox', {
      name: 'Signal form city',
    });
    await signal.fill('ank');
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'Ankara', exact: true })
      .click();
    await expect(signalExample.getByText('Value: Ankara')).toBeVisible();

    const reactiveExample = forms
      .locator('.autocomplete-forms-example')
      .filter({ hasText: 'Reactive Forms' });
    const reactive = reactiveExample.getByRole('combobox', {
      name: 'Reactive form city',
    });
    await reactive.fill('ams');
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'Amsterdam', exact: true })
      .click();
    await expect(reactiveExample.getByText('Value: Amsterdam')).toBeVisible();

    const templateExample = forms
      .locator('.autocomplete-forms-example')
      .filter({ hasText: 'Template-driven Forms' });
    const template = templateExample.getByRole('combobox', {
      name: 'Template form city',
    });
    await template.fill('ist');
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'Istanbul', exact: true })
      .click();
    await expect(templateExample.getByText('Value: Istanbul')).toBeVisible();

    const readonlyExample = forms
      .locator('.autocomplete-forms-example')
      .filter({ hasText: 'Readonly' });
    const readonly = readonlyExample.getByRole('combobox', {
      name: 'Readonly city',
    });
    await expect(readonly).toBeEnabled();
    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await expect(readonly).toHaveValue('Istanbul');
    await readonlyExample.getByRole('button').click();
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'Ankara', exact: true })
      .click();
    await expect(readonly).toHaveValue('Istanbul');
    await readonly.press('ArrowDown');
    await readonly.press('Enter');
    await expect(readonly).toHaveValue('Istanbul');
  });
});
