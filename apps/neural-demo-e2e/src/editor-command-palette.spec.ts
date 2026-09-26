import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { waitForHydration } from './support/hydration';

test('Editor palette honors hidden without an application CSS reset', async ({
  page,
}) => {
  const source = readFileSync(
    'libs/neural-editor/editor-suggestion-menus.component.ts',
    'utf8',
  );
  const styles = source.match(/styles:\s*`([\s\S]*?)`/)?.[1];
  expect(styles).toBeTruthy();
  await page.setContent(
    '<div class="neural-editor-command-palette-root" hidden><section role="dialog">Commands</section></div>',
  );
  if (!styles) throw new Error('Editor structural CSS was not found.');
  await page.addStyleTag({ content: styles });
  const palette = page.locator('.neural-editor-command-palette-root');
  await expect(palette).toHaveCSS('display', 'none');
  await palette.evaluate((element) => {
    (element as HTMLElement).hidden = false;
  });
  await expect(palette).toHaveCSS('display', 'grid');
  await expect(palette).toBeVisible();
  await palette.evaluate((element) => {
    (element as HTMLElement).hidden = true;
  });
  await expect(palette).toHaveCSS('display', 'none');
  await expect(palette).toBeHidden();
});

test('Editor command palette is visually closed initially and after every dismiss path', async ({
  page,
}) => {
  await page.goto('/docs/components/editor');
  await waitForHydration(page);
  const palettes = page.locator('.neural-editor-command-palette-root');
  await expect(palettes.first()).toBeAttached();
  const visible = page.locator(
    '.neural-editor-command-palette-root:not([hidden])',
  );
  const assertClosed = async () => {
    await expect(visible).toHaveCount(0);
    expect(
      await palettes.evaluateAll((elements) =>
        elements.every(
          (element) =>
            getComputedStyle(element).display === 'none' &&
            element.getClientRects().length === 0,
        ),
      ),
    ).toBe(true);
  };
  await assertClosed();
  const open = page.getByRole('button', {
    name: 'Open command palette',
    exact: true,
  });
  const editor = page
    .locator('.editor-demo')
    .filter({ has: open })
    .locator('[contenteditable="true"]')
    .first();
  await editor.click();
  await editor.press('ControlOrMeta+k');
  await expect(visible).toHaveCount(1);
  await expect(visible.getByRole('dialog')).toBeVisible();
  await visible.locator('input[type="search"]').press('Escape');
  await assertClosed();
  await expect(editor).toBeFocused();
  await open.click();
  await expect(visible).toHaveCount(1);
  await visible
    .locator('.neural-editor-command-palette-backdrop-root')
    .click({ position: { x: 4, y: 4 } });
  await assertClosed();
  await open.click();
  await expect(visible).toHaveCount(1);
  await visible.locator('[role="option"]:not(:disabled)').first().click();
  await assertClosed();
});
