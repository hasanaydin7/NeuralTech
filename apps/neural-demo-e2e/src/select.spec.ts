import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Select alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/select');
    await waitForHydration(page);
  });

  test('activates the Select docs route and maps data options', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Select Alpha', exact: true }),
    ).toHaveAttribute('aria-current', 'page');

    const city = page.getByRole('combobox', { name: 'City', exact: true });
    await city.click();
    await expect(page.getByRole('listbox', { name: 'City' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Bursa' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await page.getByRole('option', { name: 'Istanbul' }).click();
    await expect(city).toContainText('Istanbul');
    await expect(page.getByText(/Istanbul selected by pointer/)).toBeVisible();
  });

  test('binds Signal, Reactive, and template-driven Forms adapters', async ({
    page,
  }) => {
    const forms = page.locator('#forms');
    const signalExample = forms.locator('.forms-example').filter({
      hasText: 'Signal Forms',
    });
    const signal = signalExample.getByRole('combobox', {
      name: 'Signal form city',
    });
    await signal.click();
    await page.getByRole('option', { name: 'Ankara', exact: true }).click();
    await expect(signal).toContainText('Ankara');
    await expect(signalExample.getByText('Value: Ankara')).toBeVisible();

    const reactiveExample = forms.locator('.forms-example').filter({
      hasText: 'Reactive Forms',
    });
    const reactive = reactiveExample.getByRole('combobox', {
      name: 'Reactive form city',
    });
    await reactive.click();
    await page.getByRole('option', { name: 'Izmir', exact: true }).click();
    await expect(reactive).toContainText('Izmir');
    await expect(reactiveExample.getByText('Value: Izmir')).toBeVisible();

    const templateExample = forms.locator('.forms-example').filter({
      hasText: 'Template-driven Forms',
    });
    const template = templateExample.getByRole('combobox', {
      name: 'Template form city',
    });
    await template.click();
    await page.getByRole('option', { name: 'Istanbul', exact: true }).click();
    await expect(template).toContainText('Istanbul');
    await expect(templateExample.getByText('Value: Istanbul')).toBeVisible();
  });

  test('keeps readonly Select focusable and blocks pointer and keyboard mutation', async ({
    page,
  }) => {
    const readonly = page.getByRole('combobox', { name: 'Readonly city' });

    await expect(readonly).toBeEnabled();
    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await expect(readonly).toContainText('Istanbul');
    await expect(
      readonly.locator('xpath=..').getByRole('button', {
        name: 'Clear selection',
      }),
    ).toHaveCount(0);

    await readonly.click();
    await expect(readonly).toBeFocused();
    await page.getByRole('option', { name: 'Ankara', exact: true }).click();
    await expect(readonly).toContainText('Istanbul');

    await readonly.press('Escape');
    await readonly.press('ArrowDown');
    await readonly.press('ArrowDown');
    await readonly.press('Enter');
    await expect(readonly).toContainText('Istanbul');
  });

  test('supports projected content and clear events', async ({ page }) => {
    const status = page.getByRole('combobox', { name: 'Release status' });
    await status.click();
    const ready = page.getByRole('option', { name: /Ready to ship/ });
    await expect(ready.getByText('All checks passed')).toBeVisible();
    await ready.click();
    await expect(status).toContainText('Ready');

    await status
      .locator('xpath=..')
      .getByRole('button', { name: 'Clear selection' })
      .click();
    await expect(status).toContainText('Select status');
  });

  test('updates a chained district Select from the province model', async ({
    page,
  }) => {
    const province = page.getByRole('combobox', { name: 'Province' });
    const district = page.getByRole('combobox', { name: 'District' });
    await expect(district).toBeDisabled();

    await province.click();
    await page.getByRole('option', { name: 'Ankara' }).last().click();
    await expect(district).toBeEnabled();

    await district.click();
    await expect(page.getByRole('option', { name: 'Çankaya' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Kadıköy' })).toHaveCount(0);
  });

  test('supports keyboard navigation with aria-activedescendant', async ({
    page,
  }) => {
    const city = page.getByRole('combobox', { name: 'City', exact: true });
    await city.focus();
    await city.press('ArrowDown');
    await expect(city).toHaveAttribute('aria-expanded', 'true');
    await expect(city).toHaveAttribute(
      'aria-activedescendant',
      /listbox-option-0$/,
    );
    await city.press('ArrowDown');
    await city.press('Enter');
    await expect(city).toContainText('Ankara');
    await expect(page.getByText(/selected by keyboard/)).toBeVisible();
  });

  test('renders the loading icon mask and consumer-owned headless styles', async ({
    page,
  }) => {
    const loadingIcon = page.locator('#states .nt-loader-3');
    await expect(loadingIcon).toBeVisible();
    await expect
      .poll(() =>
        loadingIcon.evaluate(
          (element) =>
            getComputedStyle(element).maskImage ||
            getComputedStyle(element).webkitMaskImage,
        ),
      )
      .not.toBe('none');

    const headless = page.getByRole('combobox', { name: 'Architecture' });
    await expect(headless).toHaveCSS('background-color', 'rgb(8, 47, 73)');
    await expect(headless).toHaveCSS('color', 'rgb(224, 242, 254)');
    await headless.click();
    await expect(page.locator('.docs-headless-select-panel')).toHaveCSS(
      'background-color',
      'rgb(8, 47, 73)',
    );
  });
});

test('renders a working Select in the landing preview', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  const architecture = page.getByRole('combobox', {
    name: 'Architecture focus',
  });
  await expect(architecture).toContainText('Signals');
  await architecture.click();
  await page.getByRole('option', { name: 'SSR + hydration' }).click();
  await expect(architecture).toContainText('SSR + hydration');
  await expect(
    page.getByRole('link', { name: 'Select Ready' }),
  ).toHaveAttribute('href', '/docs/components/select');
});
