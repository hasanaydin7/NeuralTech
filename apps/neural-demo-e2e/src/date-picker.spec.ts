import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('DatePicker beta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/date-picker');
    await waitForHydration(page);
  });

  test('selects a date in the native top layer and restores input focus', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'DatePicker Alpha' }),
    ).toHaveAttribute('aria-current', 'page');

    const section = page
      .getByRole('heading', { name: 'Basic date selection' })
      .locator('..');
    const input = section.getByRole('combobox', { name: 'Delivery date' });
    await input.click();

    const panel = page.locator(
      '.neural-popover-root[data-open="true"]:visible',
    );
    await expect(panel).toHaveAttribute('popover', 'manual');
    await panel.locator('[data-date="2026-08-18"]').click();

    await expect(
      section.getByText('2026-08-18', { exact: true }),
    ).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });

  test('supports range preview, completion and multiple toggling', async ({
    page,
  }) => {
    const section = page
      .getByRole('heading', { name: 'Single, range, and multiple selection' })
      .locator('..');
    const range = section.getByRole('combobox', {
      name: 'Choose start and end',
    });
    await range.click();
    let panel = page.locator('.neural-popover-root[data-open="true"]:visible');
    await panel.locator('[data-date="2026-07-27"]').click();
    await panel.locator('[data-date="2026-07-29"]').hover();
    await expect(panel.locator('[data-date="2026-07-28"]')).toHaveClass(
      /neural-date-picker-day-range-preview-base/,
    );
    await panel.locator('[data-date="2026-07-29"]').click();
    await expect(section.getByText(/2026-07-27.*2026-07-29/)).toBeVisible();

    const multiple = section
      .locator('neural-date-picker')
      .nth(1)
      .getByRole('combobox');
    await multiple.click();
    panel = page.locator('.neural-popover-root[data-open="true"]:visible');
    await panel.locator('[data-date="2026-08-20"]').click();
    await expect(section.getByText(/2026-08-20/)).toBeVisible();
    await expect(multiple).toHaveAttribute('aria-expanded', 'true');
  });

  test('keeps repeated keyboard navigation in the grid and restores focus on Escape', async ({
    page,
  }) => {
    const section = page
      .getByRole('heading', { name: 'Basic date selection' })
      .locator('..');
    const input = section.getByRole('combobox', { name: 'Delivery date' });
    await input.focus();
    await input.press('ArrowDown');

    const panel = page.locator(
      '.neural-popover-root[data-open="true"]:visible',
    );
    const activeDay = panel.locator(
      '.neural-date-picker-day-root[tabindex="0"]',
    );
    await expect(activeDay).toBeFocused();
    await activeDay.press('PageDown');
    await page.keyboard.press('Home');
    await page.keyboard.press('End');
    await expect(
      panel.locator('.neural-date-picker-day-root[tabindex="0"]'),
    ).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });

  test('renders localized week starts and removes visual classes in headless mode', async ({
    page,
  }) => {
    const localeSection = page
      .getByRole('heading', { name: 'Locale and week start' })
      .locator('..');
    const turkish = localeSection.getByRole('combobox', {
      name: /Tarih seç|Tarihi değiştir/,
    });
    await turkish.click();
    const panel = page.locator(
      '.neural-popover-root[data-open="true"]:visible',
    );
    await expect(
      panel.locator('.neural-date-picker-weekday-root').first(),
    ).toContainText(/Pzt/i);
    await page.keyboard.press('Escape');

    const headlessSection = page
      .getByRole('heading', { name: 'Unstyled and typed class slots' })
      .locator('..');
    const headlessRoot = headlessSection.locator('.neural-date-picker-root');
    await expect(headlessRoot).toHaveClass(/headless-date-picker/);
    await expect(headlessRoot).not.toHaveClass(/neural-date-picker-base/);
    await headlessSection
      .getByRole('combobox', { name: 'Headless date' })
      .click();
    await expect(
      page.locator('.neural-date-picker-day-root:visible').first(),
    ).not.toHaveClass(/neural-date-picker-day-base/);
  });

  test('hydrates forms and exposes the documented quality contract', async ({
    page,
  }) => {
    const forms = page
      .getByRole('heading', { name: 'Forms and semantic events' })
      .locator('..');
    await expect(forms.getByRole('combobox')).toHaveCount(4);
    await expect(
      page.getByRole('heading', { name: 'Beta quality contract' }),
    ).toBeVisible();
    await expect(page.locator('.date-picker-quality-item')).toHaveCount(10);
  });
});
