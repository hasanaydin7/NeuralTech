import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

test.describe('Textarea alpha', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/textarea');
    await waitForHydration(page);
  });

  test('activates its docs route and binds Signal Forms', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Textarea Alpha' }),
    ).toHaveAttribute('aria-current', 'page');

    const textarea = page.getByRole('textbox', { name: 'Biography' });
    await textarea.fill('Native textarea with a Signal model');
    await expect(page.getByText('Model length: 35')).toBeVisible();
    await expect(textarea).toHaveAttribute('maxlength', '500');
  });

  test('uses native field-sizing when supported without inline measurement', async ({
    page,
  }) => {
    const textarea = page.getByRole('textbox', { name: 'Growing message' });
    const supportsFieldSizing = await textarea.evaluate(() =>
      CSS.supports('field-sizing', 'content'),
    );
    const initialBox = await textarea.boundingBox();

    await textarea.fill(
      Array.from({ length: 9 }, (_, index) => `Line ${index + 1}`).join('\n'),
    );
    const grownBox = await textarea.boundingBox();

    expect(initialBox).not.toBeNull();
    expect(grownBox).not.toBeNull();
    await expect(textarea).toHaveAttribute('data-auto-resize', 'true');
    await expect(textarea).not.toHaveAttribute('style', /height/);

    if (supportsFieldSizing) {
      await expect(textarea).toHaveCSS('field-sizing', 'content');
      expect(grownBox!.height).toBeGreaterThan(initialBox!.height);
    }
  });

  test('exposes manual resize modes on native textareas', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Vertical' })).toHaveCSS(
      'resize',
      'vertical',
    );
    await expect(page.getByRole('textbox', { name: 'Horizontal' })).toHaveCSS(
      'resize',
      'horizontal',
    );
    await expect(page.getByRole('textbox', { name: 'Both' })).toHaveCSS(
      'resize',
      'both',
    );
    await expect(page.getByRole('textbox', { name: 'None' })).toHaveCSS(
      'resize',
      'none',
    );
  });

  test('inherits Field state and preserves native readonly', async ({
    page,
  }) => {
    const required = page.getByRole('textbox', {
      name: 'Required summary',
    });
    const readonly = page.getByRole('textbox', { name: 'Readonly' });

    await expect(required).toHaveAttribute('id', 'required-summary');
    await expect(required).toHaveAttribute('aria-required', 'true');
    await expect(required).toHaveAttribute('aria-invalid', 'true');
    await expect(required).toHaveAttribute(
      'aria-describedby',
      'required-summary-hint required-summary-error',
    );
    await expect(readonly).toHaveAttribute('readonly', '');
  });

  test('keeps consumer-owned classes in headless mode', async ({ page }) => {
    const textarea = page.getByRole('textbox', {
      name: 'Custom visual ownership',
    });

    await expect(textarea).toHaveClass(/docs-headless-textarea/);
    await expect(textarea).toHaveClass(/neural-textarea-root/);
    await expect(textarea).not.toHaveClass(/neural-textarea-base/);
    await expect(textarea).toHaveCSS('background-color', 'rgb(8, 47, 73)');
    await expect(textarea).toHaveCSS('border-radius', '12.8px');
  });
});

test('renders a native Textarea in the landing preview', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  const textarea = page.getByRole('textbox', { name: 'Prototype note' });
  await textarea.fill('Landing textarea is interactive.');
  await expect(textarea).toHaveValue('Landing textarea is interactive.');
  await expect(
    page.getByRole('link', { name: 'Textarea Ready' }),
  ).toHaveAttribute('href', '/docs/components/textarea');
});
