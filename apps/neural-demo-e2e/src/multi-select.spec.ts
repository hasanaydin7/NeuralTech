import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('MultiSelect alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/multi-select');
    await waitForHydration(page);
  });

  test('filters, selects, removes chips, and matches the trigger width', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'MultiSelect Alpha' }),
    ).toHaveAttribute('aria-current', 'page');
    const section = page
      .getByRole('heading', { name: 'Grouped chips' })
      .locator('..');
    const trigger = section.getByRole('combobox', { name: 'Technology stack' });
    await trigger.click();
    const listbox = page.getByRole('listbox', { name: 'Technology stack' });
    const panel = page.locator('.neural-popover-root').filter({ has: listbox });
    await expect(panel).toBeVisible();
    const [triggerBox, panelBox] = await Promise.all([
      trigger.boundingBox(),
      panel.boundingBox(),
    ]);
    const triggerWidth = triggerBox?.width ?? 0;
    const panelWidth = panelBox?.width ?? 0;
    const crossBrowserWidthTolerance = Math.max(triggerWidth * 0.06, 1);
    expect(Math.abs(triggerWidth - panelWidth)).toBeLessThanOrEqual(
      crossBrowserWidthTolerance,
    );
    await panel.getByRole('combobox', { name: 'Search options' }).fill('react');
    await expect(panel.getByRole('option')).toHaveCount(1);
    await panel.getByRole('option').click();
    await expect(section.getByText('3 selected')).toBeVisible();
    await section.getByRole('button', { name: 'Remove React' }).click();
    await expect(section.getByText('2 selected')).toBeVisible();
  });

  test('keeps consumer visuals and structural semantics in unstyled mode', async ({
    page,
  }) => {
    const section = page
      .getByRole('heading', { name: 'Unstyled and typed class slots' })
      .locator('..');
    const root = section.locator('.neural-multi-select-root');
    await expect(root).not.toHaveClass(/neural-multi-select-base/);
    const trigger = section.getByRole('combobox', {
      name: 'Headless capabilities',
    });
    await expect(trigger).toHaveCSS(
      'background-color',
      'rgba(15, 23, 42, 0.92)',
    );
    await trigger.click();
    await expect(
      page.locator('.docs-multi-select-headless__panel:visible'),
    ).toHaveCSS('background-color', 'rgba(7, 17, 31, 0.98)');
  });

  test('windows 1,000 options and preserves absolute listbox metadata', async ({
    page,
  }) => {
    const section = page
      .getByRole('heading', { name: 'Virtual scrolling' })
      .locator('..');
    await section
      .getByRole('combobox', { name: 'Virtual capabilities' })
      .click();
    const panel = page.locator(
      '.neural-popover-root[data-open="true"]:visible',
    );
    const listbox = panel.getByRole('listbox');
    const options = listbox.getByRole('option');
    await expect(options.first()).toContainText('Capability 0001');
    expect(await options.count()).toBeLessThan(20);
    await expect(options.first()).toHaveAttribute('aria-setsize', '1000');

    await listbox.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(listbox.getByText('Capability 1000')).toBeVisible();
  });

  test('binds every Forms adapter and blocks readonly mutations', async ({
    page,
  }) => {
    const forms = page.locator('#forms');

    const signalExample = forms.locator('.multi-select-forms-example').filter({
      hasText: 'Signal Forms',
    });
    const signal = signalExample.getByRole('combobox', {
      name: 'Signal form capabilities',
    });
    await signal.click();
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'React', exact: true })
      .click();
    await expect(
      signalExample.getByText('Value: Angular, React'),
    ).toBeVisible();
    await signal.press('Escape');

    const reactiveExample = forms
      .locator('.multi-select-forms-example')
      .filter({ hasText: 'Reactive Forms' });
    const reactive = reactiveExample.getByRole('combobox', {
      name: 'Reactive form capabilities',
    });
    await reactive.click();
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'Vue', exact: true })
      .click();
    await expect(reactiveExample.getByText('Value: React, Vue')).toBeVisible();
    await reactive.press('Escape');

    const templateExample = forms
      .locator('.multi-select-forms-example')
      .filter({ hasText: 'Template-driven Forms' });
    const template = templateExample.getByRole('combobox', {
      name: 'Template form capabilities',
    });
    await template.click();
    await page
      .locator('.neural-popover-root[data-open="true"]:visible')
      .getByRole('option', { name: 'Angular', exact: true })
      .click();
    await expect(
      templateExample.getByText('Value: Vue, Angular'),
    ).toBeVisible();
    await template.press('Escape');

    const readonlyExample = forms
      .locator('.multi-select-forms-example')
      .filter({ hasText: 'Readonly' });
    const readonly = readonlyExample.getByRole('combobox', {
      name: 'Readonly capabilities',
    });
    await expect(readonly).toHaveAttribute('aria-readonly', 'true');
    await expect(readonlyExample.getByText('Value: Angular')).toBeVisible();
    await readonly.click();
    const panel = page.locator(
      '.neural-popover-root[data-open="true"]:visible',
    );
    const readonlyOption = panel.getByRole('option', {
      name: 'React',
      exact: true,
    });
    await expect(readonlyOption).toHaveAttribute('aria-disabled', 'true');
    await readonlyOption.dispatchEvent('click');
    await expect(readonlyExample.getByText('Value: Angular')).toBeVisible();
    await expect(
      panel.getByRole('button', { name: 'Select all' }),
    ).toBeDisabled();
    await readonly.press('ArrowDown');
    await readonly.press('Enter');
    await expect(readonlyExample.getByText('Value: Angular')).toBeVisible();
  });
});
