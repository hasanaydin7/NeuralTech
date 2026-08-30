import { expect, test } from '@playwright/test';
import { prepareClipboard } from './support/clipboard';
import { waitForHydration } from './support/hydration';

test.describe('NeuralNg Button', () => {
  test.beforeEach(async ({ browserName, context, page }) => {
    await prepareClipboard(context, page, browserName);
    await page.goto('/playground');
    await waitForHydration(page, 'app-playground-page');
  });

  test('renders every public demo state', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'NeuralNg Component Lab' }),
    ).toBeVisible();
    await expect(page.locator('neural-button')).toHaveCount(21);
    await expect(
      page.getByRole('button', { name: 'Disabled', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Close dialog' }),
    ).toBeEnabled();
  });

  test('renders styled and headless Card composition', async ({ page }) => {
    const cards = page.locator('neural-card article');
    await expect(cards).toHaveCount(3);
    await expect(
      page.getByRole('article', { name: 'Native sections' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Component progress' }),
    ).toBeVisible();

    const headless = page.locator('.demo-headless-card');
    await expect(headless).toHaveClass(/neural-card-root/);
    await expect(headless).not.toHaveClass(/neural-card-base/);
    await expect(headless.locator('header')).toHaveClass(
      /demo-headless-card-header/,
    );
  });

  test('searches, filters and copies from the Neural Icons catalog', async ({
    page,
  }) => {
    await expect(page.getByText('6184 embedded SVG files')).toBeVisible();
    await page.getByLabel('Search icons').fill('user');

    const userResult = page.getByRole('button', {
      name: 'Copy nt nt-user',
      exact: true,
    });
    const userIcon = userResult.locator('.nt-user');

    await expect(userResult).toBeVisible();
    await expect(userIcon).not.toHaveCSS('mask-image', 'none');
    await expect(userIcon).toHaveCSS('width', '28px');
    await userResult.click();
    await expect(page.getByText('Copied: nt nt-user')).toBeVisible();

    await page.locator('.icon-controls select').first().selectOption('filled');
    const filledUser = page.getByRole('button', {
      name: 'Copy nt nt-filled-user',
      exact: true,
    });
    await expect(filledUser).toBeVisible();
    const filledUserIcon = filledUser.locator('.nt-filled-user');
    await expect
      .poll(() =>
        filledUserIcon.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.maskImage, style.webkitMaskImage].some(
            (value) => Boolean(value) && value !== 'none',
          );
        }),
      )
      .toBe(true);

    const spinner = page.locator('.icon-size-demo .nt-spinner');
    await expect(spinner).toHaveCSS('animation-name', 'nt-spin');

    const dualLoader = page.locator('.nt-loader-3.nt-spin-dual');
    await expect(dualLoader).toHaveCSS('animation-name', 'none');
    const dualMotion = await dualLoader.evaluate((element) => ({
      outerName: getComputedStyle(element, '::before').animationName,
      outerDirection: getComputedStyle(element, '::before').animationDirection,
      innerName: getComputedStyle(element, '::after').animationName,
      innerDirection: getComputedStyle(element, '::after').animationDirection,
    }));
    expect(dualMotion).toEqual({
      outerName: 'nt-spin',
      outerDirection: 'normal',
      innerName: 'nt-spin',
      innerDirection: 'reverse',
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(spinner).toHaveCSS('animation-name', 'none');
    const reducedDualMotion = await dualLoader.evaluate((element) => ({
      outer: getComputedStyle(element, '::before').animationName,
      inner: getComputedStyle(element, '::after').animationName,
    }));
    expect(reducedDualMotion).toEqual({ outer: 'none', inner: 'none' });
  });

  test('paginates the complete icon catalog with a live report', async ({
    page,
  }) => {
    const report = page.locator(
      '.icon-paginator .neural-paginator-report-root',
    );
    await expect(report).toContainText('5130 ikondan 1–48 arası gösteriliyor');

    await page.getByRole('button', { name: 'Sonraki ikon sayfası' }).click();
    await expect(report).toContainText('5130 ikondan 49–96 arası gösteriliyor');
    await expect(
      page.getByRole('button', { name: 'İkon sayfası 2' }),
    ).toHaveAttribute('aria-current', 'page');

    await page.getByLabel('Sayfa başına ikon').click();
    await page.getByRole('option', { name: '96', exact: true }).click();
    await expect(report).toContainText('5130 ikondan 1–96 arası gösteriliyor');
    await expect(page.locator('.icon-grid .nt')).toHaveCount(96);
  });

  test('supports unstyled class slots and a disabled paginator', async ({
    page,
  }) => {
    const headless = page.locator('nav[aria-label="Headless demo pages"]');
    await expect(headless).toHaveClass(/demo-headless-paginator/);
    await expect(headless).not.toHaveClass(/neural-paginator-base/);
    await expect(
      headless.getByRole('button', { name: 'Headless page 1' }),
    ).toHaveClass(/demo-headless-paginator-active/);
    await expect(headless.getByText('Custom range:')).toContainText('1–5 / 42');

    const disabled = page.locator('.demo-disabled-paginator');
    const disabledButtons = disabled.getByRole('button');
    await expect(disabledButtons).toHaveCount(7);
    for (let index = 0; index < 7; index += 1) {
      await expect(disabledButtons.nth(index)).toBeDisabled();
    }
  });

  test('switches between stable and experimental token themes', async ({
    page,
  }) => {
    const showcase = page.locator('.demo-container');
    const standardButton = page.getByRole('button', { name: 'Neural Button' });

    await page.getByRole('button', { name: 'light', exact: true }).click();
    await expect(showcase).toHaveAttribute('data-neural-theme', 'neutral');
    await expect(standardButton).toHaveCSS('background-color', 'rgb(2, 6, 23)');

    await page.getByRole('button', { name: 'Glass Theme' }).click();
    await expect(showcase).toHaveAttribute('data-neural-theme', 'glass');
    await expect(standardButton).toHaveCSS('background-color', 'rgb(2, 6, 23)');

    await page.getByRole('button', { name: 'Mist Theme' }).click();
    await expect(showcase).toHaveAttribute('data-neural-theme', 'mist');
    await expect(standardButton).toHaveCSS('background-color', 'rgb(2, 6, 23)');

    await page.getByRole('button', { name: 'Futuristic Theme' }).click();
    await expect(showcase).toHaveAttribute('data-neural-theme', 'futuristic');
    await expect(standardButton).toHaveCSS(
      'background-color',
      'rgb(8, 51, 68)',
    );
  });

  test('switches and persists resolved light and dark color modes', async ({
    page,
  }) => {
    const root = page.locator('html');
    const standardButton = page.getByRole('button', { name: 'Neural Button' });

    await page.getByRole('button', { name: 'dark', exact: true }).click();
    await expect(root).toHaveAttribute('data-neural-mode', 'dark');
    await expect(standardButton).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem('neural-color-mode')),
      )
      .toBe('dark');

    await page.reload();
    await expect(root).toHaveAttribute('data-neural-mode', 'dark');

    await page.getByRole('button', { name: 'light', exact: true }).click();
    await expect(root).toHaveAttribute('data-neural-mode', 'light');
    await expect(standardButton).toHaveCSS('background-color', 'rgb(2, 6, 23)');
  });

  test('supports native Tab, Enter and Space keyboard behavior', async ({
    page,
  }) => {
    const action = page.getByText('Last action:', { exact: false });

    const neutralTheme = page.getByRole('button', {
      name: 'Neutral Theme',
    });
    await neutralTheme.focus();
    await expect(neutralTheme).toBeFocused();

    for (const themeName of [
      'Glass Theme',
      'Mist Theme',
      'Futuristic Theme',
      'light',
      'dark',
      'system',
    ]) {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: themeName })).toBeFocused();
    }

    const standardButton = page.getByRole('button', { name: 'Neural Button' });
    await standardButton.focus();
    await expect(standardButton).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(action).toContainText('Standard clicked');

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Submit Form' }),
    ).toBeFocused();

    await page.keyboard.press('Space');
    await expect(action).toContainText('Native form submitted');

    await page.keyboard.press('Tab');
    const saveButton = page.getByRole('button', { name: 'Save Changes' });
    await expect(saveButton).toBeFocused();

    await page.keyboard.press('Enter');
    const loadingButton = page.getByRole('button', { name: 'Kaydediliyor' });
    await expect(loadingButton).toBeFocused();
    await expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    await expect(loadingButton).toHaveAttribute('aria-disabled', 'true');
    await expect(action).toContainText('Loading started');

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Close dialog' }),
    ).toBeFocused();

    await page.keyboard.press('Space');
    await expect(action).toContainText('Icon button clicked');
  });

  test('renders messages triggered by NeuralNg buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Success', exact: true }).click();

    const successToast = page.locator(
      '.neural-toast-message-root[data-severity="success"]',
    );
    const successIcon = successToast.locator('.neural-toast-icon');
    await expect(successIcon).toHaveClass(/nt-circle-check/);
    await expect(successIcon).not.toHaveCSS('mask-image', 'none');
    await expect(successToast).toContainText('İşlem başarıyla tamamlandı.');
    await expect(page.locator('[data-channel="global"]')).toHaveAttribute(
      'data-position',
      'top-end',
    );

    await successToast
      .getByRole('button', { name: /Close notification/ })
      .click();
    await expect(successToast).toHaveCount(0);

    await page.getByRole('button', { name: 'Send 4 / Keep 3' }).click();
    const queueToasts = page.locator(
      '.neural-toast-message-root:has-text("Aynı kanalda yalnızca son üç mesaj tutulur.")',
    );
    const firstQueueTitle = page.locator('.neural-toast-title', {
      hasText: 'Kuyruk mesajı 1',
    });
    await expect(firstQueueTitle).toBeVisible();
    await expect(queueToasts).toHaveCount(3);
    await expect(queueToasts.first().locator('.neural-toast-icon')).toHaveClass(
      /nt-bell/,
    );
    await expect(firstQueueTitle).toHaveCount(0);
    await expect(
      page.locator('.neural-toast-title', { hasText: 'Kuyruk mesajı 4' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Clear Queue Channel' }).focus();
    await page.keyboard.press('Enter');
    await expect(queueToasts).toHaveCount(0);
  });

  test('supports middle positions and an unstyled custom channel', async ({
    page,
  }) => {
    await page.getByLabel('Toast position').selectOption('middle-center');
    await page.getByRole('button', { name: 'Info', exact: true }).click();

    await expect(page.locator('[data-channel="global"]')).toHaveClass(
      /neural-toast-position-middle-center/,
    );

    await page.getByRole('button', { name: 'Unstyled Channel' }).click();
    const unstyledMessage = page.locator(
      '[data-channel="unstyled-demo"] .demo-headless-message',
    );

    await expect(unstyledMessage).toBeVisible();
    await expect(unstyledMessage).not.toHaveClass(/neural-toast-message-base/);
    await expect(unstyledMessage.locator('.neural-toast-icon')).toHaveCount(0);
    await expect(unstyledMessage).toContainText('Unstyled channel');
  });

  test('renders progress, a custom template, and touch swipe dismissal', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Info', exact: true }).click();
    const info = page.locator(
      '[data-channel="global"] .neural-toast-message-info',
    );
    await expect(info.locator('.neural-toast-progress')).toBeVisible();

    for (const [type, clientX] of [
      ['pointerdown', 0],
      ['pointermove', 100],
      ['pointerup', 100],
    ] as const) {
      await info.dispatchEvent(type, {
        pointerId: 7,
        pointerType: 'touch',
        button: 0,
        clientX,
        clientY: 0,
      });
    }
    await expect(info).toHaveCount(0);

    await page.getByRole('button', { name: 'Custom Template' }).click();
    const templateToast = page.locator(
      '[data-channel="template-demo"] .demo-template-toast',
    );
    await expect(templateToast).toContainText('Custom template');
    await expect(templateToast).toContainText('Timer çalışıyor');
    await templateToast
      .getByRole('button', { name: 'Template içinden kapat' })
      .click();
    await expect(templateToast).toHaveCount(0);
  });
});
