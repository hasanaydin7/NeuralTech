import { expect, test } from '@playwright/test';

test.describe('NeuralNg documentation site', () => {
  test('renders the landing page and navigates into lazy documentation', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/NeuralNg — Angular UI/);
    await expect(
      page.getByRole('heading', {
        name: 'UI infrastructure designed for developers and AI agents.',
      }),
    ).toBeVisible();
    await expect(page.getByText('NeuralNg Component Lab')).toHaveCount(0);

    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await expect(page).toHaveURL(/\/docs\/getting-started\/installation$/);
    await expect(page).toHaveTitle('Installation — NeuralNg');
    await expect(
      page.getByRole('heading', { name: 'Installation', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Documentation', exact: true }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Button Alpha', exact: true }).click();
    await expect(page).toHaveURL(/\/docs\/components\/button$/);
    await expect(page).toHaveTitle('Button — NeuralNg');
  });

  test('supports direct component deep links and live examples', async ({
    page,
  }) => {
    await page.goto('/docs/components/button');

    const basicDemo = page.locator('#basic');
    await basicDemo.getByRole('button', { name: 'Save changes' }).click();
    await expect(basicDemo.getByRole('status')).toContainText(
      'clicked emitted a native MouseEvent.',
    );
    await expect(
      page.getByRole('link', { name: 'Button Alpha', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('renders the NeuralNg brand and applies RTL from the configurator', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('.brand-name')).toHaveText('NEURALNG');
    await page.getByRole('button', { name: 'Open theme configurator' }).click();

    const configurator = page.getByRole('dialog', {
      name: 'Theme configurator',
    });
    const rtlSwitch = configurator.getByRole('switch', {
      name: 'Right-to-left direction',
    });

    await expect(rtlSwitch).not.toBeChecked();
    await rtlSwitch.press('Space');
    await expect(rtlSwitch).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute(
      'data-neural-direction',
      'rtl',
    );
    await expect(configurator).toBeInViewport();
  });

  test('switches the calm Mist preset from the topbar and back', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open theme configurator' }).click();
    const configurator = page.getByRole('dialog', {
      name: 'Theme configurator',
    });
    await configurator.getByRole('button', { name: 'mist', exact: true }).click();

    const shell = page.locator('.site-shell');
    await expect(shell).toHaveAttribute('data-neural-theme', 'mist');
    await expect(shell).toHaveAttribute('data-site-primary', 'teal');
    await expect(shell).toHaveAttribute('data-site-surface', 'slate-soft');
    await expect(shell).toHaveCSS(
      '--neural-card-backdrop-filter',
      'blur(24px) saturate(110%)',
    );

    await configurator
      .getByRole('button', { name: 'neutral', exact: true })
      .click();
    await expect(shell).toHaveAttribute('data-neural-theme', 'neutral');
    await expect(shell).toHaveAttribute('data-site-primary', 'blue');
    await expect(shell).toHaveAttribute('data-site-surface', 'slate');
  });

  test('keeps theme and color mode while navigating routes', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open theme configurator' }).click();
    let configurator = page.getByRole('dialog', {
      name: 'Theme configurator',
    });
    await configurator.getByRole('button', { name: 'glass' }).click();
    await configurator.getByRole('button', { name: 'dark' }).click();
    await configurator.getByRole('button', { name: 'Primary Emerald' }).click();
    await configurator
      .getByRole('button', { name: 'Surface Ocean Ink' })
      .click();
    await expect(page.locator('.site-shell')).toHaveAttribute(
      'data-neural-theme',
      'glass',
    );
    await expect(page.locator('.site-shell')).toHaveAttribute(
      'data-site-primary',
      'emerald',
    );
    await expect(page.locator('.site-shell')).toHaveAttribute(
      'data-site-surface',
      'ocean-ink',
    );
    await expect(page.locator('.site-shell')).toHaveCSS(
      '--neural-color-surface-500',
      '#5b707a',
    );
    await expect(page.locator('html')).toHaveAttribute(
      'data-neural-mode',
      'dark',
    );

    const glassTokens = await page
      .locator('.site-shell')
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          badgeRadius: styles.getPropertyValue('--neural-badge-radius').trim(),
          tagRadius: styles.getPropertyValue('--neural-tag-radius').trim(),
          breadcrumbRadius: styles
            .getPropertyValue('--neural-breadcrumb-radius')
            .trim(),
          checkboxRadius: styles
            .getPropertyValue('--neural-checkbox-radius')
            .trim(),
          dialogRadius: styles
            .getPropertyValue('--neural-dialog-radius')
            .trim(),
          menuRadius: styles.getPropertyValue('--neural-menu-radius').trim(),
          panelMenuRadius: styles
            .getPropertyValue('--neural-panel-menu-radius')
            .trim(),
          selectPanelRadius: styles
            .getPropertyValue('--neural-select-panel-radius')
            .trim(),
        };
      });
    expect(glassTokens).toEqual({
      badgeRadius: '0.75rem',
      tagRadius: '0.75rem',
      breadcrumbRadius: '1rem',
      checkboxRadius: '0.5rem',
      dialogRadius: '1.25rem',
      menuRadius: '1rem',
      panelMenuRadius: '1rem',
      selectPanelRadius: '1rem',
    });

    await page.getByRole('link', { name: 'Components', exact: true }).click();
    await expect(page.locator('.site-shell')).toHaveAttribute(
      'data-neural-theme',
      'glass',
    );
    await expect(page.locator('html')).toHaveAttribute(
      'data-neural-mode',
      'dark',
    );

    await page.getByRole('button', { name: 'Open theme configurator' }).click();
    configurator = page.getByRole('dialog', {
      name: 'Theme configurator',
    });
    await configurator.getByRole('button', { name: 'futuristic' }).click();
    await expect(page.locator('.site-shell')).toHaveAttribute(
      'data-neural-theme',
      'futuristic',
    );
    const futuristicTokens = await page
      .locator('.site-shell')
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          badgeRadius: styles.getPropertyValue('--neural-badge-radius').trim(),
          tagRadius: styles.getPropertyValue('--neural-tag-radius').trim(),
          breadcrumbRadius: styles
            .getPropertyValue('--neural-breadcrumb-radius')
            .trim(),
          checkboxRadius: styles
            .getPropertyValue('--neural-checkbox-radius')
            .trim(),
          dialogRadius: styles
            .getPropertyValue('--neural-dialog-radius')
            .trim(),
          menuRadius: styles.getPropertyValue('--neural-menu-radius').trim(),
          panelMenuRadius: styles
            .getPropertyValue('--neural-panel-menu-radius')
            .trim(),
          selectPanelRadius: styles
            .getPropertyValue('--neural-select-panel-radius')
            .trim(),
        };
      });
    expect(futuristicTokens).toEqual({
      badgeRadius: '0.125rem',
      tagRadius: '0.125rem',
      breadcrumbRadius: '0.125rem',
      checkboxRadius: '0.125rem',
      dialogRadius: '0.125rem',
      menuRadius: '0.125rem',
      panelMenuRadius: '0.125rem',
      selectPanelRadius: '0.125rem',
    });
  });

  test('provides responsive primary and documentation navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const primaryToggle = page.getByRole('button', {
      name: 'Toggle navigation',
    });
    await expect(primaryToggle).toBeVisible();
    await primaryToggle.click();
    await expect(
      page.getByRole('navigation', { name: 'Mobile navigation' }),
    ).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Get Started' })
      .click();

    const docsToggle = page.getByRole('button', {
      name: 'Documentation menu',
    });
    await expect(docsToggle).toBeVisible();
    await docsToggle.click();
    await expect(
      page.getByRole('navigation', { name: 'Documentation', exact: true }),
    ).toBeVisible();
  });

  test('keeps the original component lab as a lazy playground route', async ({
    page,
  }) => {
    await page.goto('/playground');

    await expect(page).toHaveTitle('Component Playground — NeuralNg');
    await expect(
      page.getByRole('heading', { name: 'NeuralNg Component Lab' }),
    ).toBeVisible();
    await expect(page.locator('input[neuralInput]')).toHaveCount(9);
  });

  test('renders an accessible not-found route inside the site shell', async ({
    page,
  }) => {
    await page.goto('/route-that-does-not-exist');

    await expect(page).toHaveTitle('Page not found — NeuralNg');
    await expect(
      page.getByRole('heading', {
        name: 'This route has not been generated yet.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });
});
