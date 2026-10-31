import { expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function assertButtonVisualContract(page, artifacts) {
  await mkdir(artifacts, { recursive: true });
  const matrix = page.locator('#button-matrix');
  await expect(matrix.locator('[data-case]')).toHaveCount(49);
  await expect(matrix.getByRole('button')).toHaveCount(147);
  const samples = [];
  const violations = [];
  const measure = async (button, state, mode, direction) => {
    const sample = await button.evaluate((el) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const p = ctx.getImageData(0, 0, 1, 1).data;
        return [p[0], p[1], p[2], p[3] / 255];
      };
      const over = (top, bottom) =>
        top.slice(0, 3).map((c, i) => c * top[3] + bottom[i] * (1 - top[3]));
      const backgrounds = [];
      for (let n = el; n; n = n.parentElement) {
        const style = getComputedStyle(n);
        if (style.backgroundImage !== 'none')
          throw new Error('Unsupported contrast background image');
        backgrounds.push(rgba(style.backgroundColor));
      }
      let background = [255, 255, 255];
      for (const bg of backgrounds.reverse()) background = over(bg, background);
      const style = getComputedStyle(el);
      const foreground = over(rgba(style.color), background);
      const luminance = (rgb) =>
        rgb
          .map((c) => c / 255)
          .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
          .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      const a = luminance(foreground),
        b = luminance(background);
      return {
        case: el.closest('[data-case]').getAttribute('data-case'),
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        foreground,
        background,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        opacity: style.opacity,
      };
    });
    samples.push({ ...sample, state, mode, direction });
    // Small, enabled text, including hover/focus/pressed; disabled is exempt.
    if (sample.ratio < 4.5)
      violations.push({ ...sample, state, mode, direction });
    if (state === 'focus') {
      expect(sample.outlineStyle).not.toBe('none');
      expect(parseFloat(sample.outlineWidth)).toBeGreaterThanOrEqual(2);
    }
  };
  try {
    for (const mode of ['light', 'dark'])
      for (const direction of ['ltr', 'rtl']) {
        await matrix.evaluate(
          (el, { mode, direction }) => {
            el.setAttribute('data-neural-mode', mode);
            el.setAttribute('data-neural-theme', 'neutral');
            el.dir = direction;
          },
          { mode, direction },
        );
        await expect(matrix).toHaveCSS('color-scheme', mode);
        for (const row of await matrix.locator('[data-case]').all()) {
          const button = row.locator('.matrix-normal');
          await button.scrollIntoViewIfNeeded();
          await page.mouse.move(0, 0);
          await button.evaluate((el) => el.blur());
          await measure(button, 'idle', mode, direction);
          await button.hover();
          // Wait for the declared transition, not a guessed fixed sleep.
          await button.evaluate((el) =>
            Promise.all(el.getAnimations().map((a) => a.finished)),
          );
          await measure(button, 'hover', mode, direction);
          await page.mouse.move(0, 0);
          await button.focus();
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          await measure(button, 'focus', mode, direction);
          await button.hover();
          await page.mouse.down();
          try {
            await button.evaluate((el) =>
              Promise.all(el.getAnimations().map((a) => a.finished)),
            );
            await measure(button, 'pressed', mode, direction);
          } finally {
            await page.mouse.up();
          }
          await measure(
            row.getByRole('button', { name: 'Working', exact: true }),
            'loading',
            mode,
            direction,
          );
          await expect(
            row.getByRole('button', { name: 'Disabled', exact: true }),
          ).toBeDisabled();
        }
        await matrix.screenshot({
          path: join(artifacts, `matrix-${mode}-${direction}.png`),
          animations: 'disabled',
        });
      }
    await page.emulateMedia({ forcedColors: 'active' });
    expect(
      await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
    ).toBe(true);
    const button = matrix.locator('.matrix-normal').first();
    await button.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(button).toBeFocused();
    expect(
      await button.evaluate((el) => getComputedStyle(el).forcedColorAdjust),
    ).toBe('auto');
    expect(
      await button.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe('none');
    await matrix.screenshot({
      path: join(artifacts, 'matrix-forced-colors.png'),
      animations: 'disabled',
    });
    expect(violations, 'Enabled text contrast below 4.5:1').toEqual([]);
    console.log(
      `Button visual contract: ${samples.length} state contrast samples, 49 severity/variant cases, four mode/direction screenshots and forced-colors focus passed.`,
    );
  } finally {
    await page.emulateMedia({ forcedColors: 'none' });
    await writeFile(
      join(artifacts, 'contrast-samples.json'),
      JSON.stringify(samples, null, 2),
    );
  }
}
