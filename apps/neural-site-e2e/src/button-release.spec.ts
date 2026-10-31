import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const mode of ['light', 'dark']) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Button resilience: ${mode}/${direction} narrow reflow and reduced motion`, async ({
      page,
    }, testInfo) => {
      await page.addInitScript(
        ({ mode, direction }) => {
          localStorage.setItem('neural-site-mode', mode);
          localStorage.setItem('neural-site-direction', direction);
        },
        { mode, direction },
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto('/docs/components/button');
      await expect(page.locator('app-root [jsaction]')).toHaveCount(0, {
        timeout: 15000,
      });
      await expect(page.locator('html')).toHaveAttribute(
        'data-neural-mode',
        mode,
      );
      await expect(page.locator('html')).toHaveAttribute('dir', direction);
      const previews = page.locator(
        '#severity [preview-content], #variants [preview-content], #icons [preview-content], #button-group [preview-content]',
      );
      const narrow = await previews.evaluateAll((elements) =>
        elements.map((el) => ({
          left: el.getBoundingClientRect().left,
          right: el.getBoundingClientRect().right,
          overflow: el.scrollWidth - el.clientWidth,
        })),
      );
      expect(narrow.length).toBeGreaterThan(0);
      for (const rect of narrow) {
        expect(rect.left).toBeGreaterThanOrEqual(-1);
        expect(rect.right).toBeLessThanOrEqual(321);
        expect(rect.overflow).toBeLessThanOrEqual(1);
      }
      await page
        .locator('#icons [preview-content]')
        .first()
        .screenshot({ path: testInfo.outputPath('icons-320px.png') });
      await page
        .locator('#icons [preview-content]')
        .last()
        .screenshot({ path: testInfo.outputPath('sizes-320px.png') });
      const action = page
        .locator('#states neural-button')
        .last()
        .locator('button');
      await action.focus();
      await action.press('Enter');
      await expect(action).toHaveAttribute('aria-busy', 'true');
      await expect(action.locator('.neural-btn-spinner')).toHaveCSS(
        'animation-name',
        'none',
      );
      await expect(action.locator('.neural-btn-spinner')).toHaveCSS(
        'animation-duration',
        '0s',
      );
      expect(
        await action
          .locator('.neural-btn-spinner')
          .evaluate((el) =>
            ['::before', '::after'].map(
              (pseudo) => getComputedStyle(el, pseudo).animationName,
            ),
          ),
      ).toEqual(['none', 'none']);
      await expect(action).toBeFocused();
    });

    test(`Button acceptance: ${mode}/${direction} sizes, groups, disabled hover, keyboard and loading`, async ({
      page,
    }) => {
      await page.addInitScript(
        ({ mode, direction }) => {
          localStorage.setItem('neural-site-mode', mode);
          localStorage.setItem('neural-site-direction', direction);
        },
        { mode, direction },
      );
      await page.goto('/docs/components/button');
      await expect(page.locator('app-root [jsaction]')).toHaveCount(0, {
        timeout: 15000,
      });
      await expect(page.locator('html')).toHaveAttribute(
        'data-neural-mode',
        mode,
      );
      await expect(page.locator('html')).toHaveAttribute('dir', direction);

      // Keep sequential geometry checks independent of smooth-scroll settling
      // differences in WebKit; hover/focus transitions remain enabled.
      await page.addStyleTag({
        content: '* { scroll-behavior: auto !important; }',
      });
      const sizes = [];
      const sizePreview = page.locator('#icons code-view').last();
      await expect(sizePreview).toBeAttached();
      await sizePreview.scrollIntoViewIfNeeded();
      for (const name of ['Small', 'Default', 'Large']) {
        const button = page
          .locator('#icons')
          .getByRole('button', { name, exact: true });
        await expect(button).toBeAttached();
        await expect(button).toBeVisible();
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        if (!box) throw new Error(`${name}: no rendered size`);
        sizes.push(box.height);
      }
      expect(sizes[0]).toBeLessThan(sizes[1]);
      expect(sizes[1]).toBeLessThan(sizes[2]);
      const icon = page.getByRole('button', {
        name: 'Open settings',
        exact: true,
      });
      const box = await icon.boundingBox();
      if (!box) throw new Error('Icon-only action not rendered');
      expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
      const iconSizes = page.locator(
        '#icons neural-button[ariaLabel$="settings"] button',
      );
      await expect(iconSizes).toHaveCount(3);
      const idleIconBoxes = await iconSizes.evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
      for (const iconBox of idleIconBoxes) {
        expect(Math.abs(iconBox.width - iconBox.height)).toBeLessThanOrEqual(1);
      }

      const horizontal = page.getByRole('group', {
        name: 'Text alignment',
        exact: true,
      });
      const members = horizontal.getByRole('button');
      await expect(members).toHaveCount(3);
      const memberBoxes = [];
      for (const name of ['Align left', 'Align center', 'Align right']) {
        const member = horizontal.getByRole('button', { name, exact: true });
        await member.scrollIntoViewIfNeeded();
        const memberBox = await member.boundingBox();
        if (!memberBox) throw new Error(`${name}: group member not rendered`);
        expect(
          Math.abs(memberBox.width - memberBox.height),
        ).toBeLessThanOrEqual(1);
        memberBoxes.push(memberBox);
      }
      for (let i = 1; i < memberBoxes.length; i++) {
        expect(
          Math.abs(memberBoxes[i].y - memberBoxes[0].y),
        ).toBeLessThanOrEqual(1);
        expect(Math.sign(memberBoxes[i].x - memberBoxes[i - 1].x)).toBe(
          direction === 'rtl' ? -1 : 1,
        );
      }
      await members.nth(0).focus();
      await page.keyboard.press('Tab');
      await expect(members.nth(1)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(members.nth(2)).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(members.nth(1)).toBeFocused();

      const vertical = page.getByRole('group', {
        name: 'View mode',
        exact: true,
      });
      await expect(vertical).toHaveAttribute('data-orientation', 'vertical');
      const list = await vertical
        .getByRole('button', { name: 'List', exact: true })
        .boundingBox();
      const grid = await vertical
        .getByRole('button', { name: 'Grid', exact: true })
        .boundingBox();
      if (!list || !grid)
        throw new Error('Vertical group members not rendered');
      expect(grid.y).toBeGreaterThan(list.y);
      expect(Math.abs(grid.x - list.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(grid.width - list.width)).toBeLessThanOrEqual(1);

      const disabled = page
        .locator('#states')
        .getByRole('button', { name: 'Disabled', exact: true });
      await disabled.evaluate((button: HTMLButtonElement) => {
        button.style.setProperty(
          '--neural-button-background-hover',
          'rgb(255, 0, 255)',
        );
      });
      await page.mouse.move(0, 0);
      const background = await disabled.evaluate(
        (button) => getComputedStyle(button).backgroundColor,
      );
      await disabled.hover();
      await expect(disabled).toBeDisabled();
      await expect(disabled).toHaveCSS('background-color', background);

      const action = page.locator('#states neural-button').last();
      const announcer = page.locator('[data-button-announcer]');
      await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);
      await expect(page.locator('#basic output, #states output')).toHaveCount(
        2,
      );
      for (const output of await page
        .locator('#basic output, #states output')
        .all()) {
        await expect(output).toHaveAttribute('aria-live', 'off');
      }
      const native = action.locator('button');
      await action.evaluate((host) => {
        host.setAttribute('data-activations', '0');
        host.addEventListener('click', () =>
          host.setAttribute(
            'data-activations',
            String(Number(host.getAttribute('data-activations')) + 1),
          ),
        );
      });
      await native.focus();
      await expect(native).toBeFocused();
      await native.press('Enter');
      await expect(native).toHaveAttribute('aria-busy', 'true');
      await expect(native).toHaveAttribute('aria-disabled', 'true');
      await expect(announcer).toBeEmpty();
      const busyIconBoxes = await iconSizes.evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
      for (let i = 0; i < busyIconBoxes.length; i++) {
        expect(
          Math.abs(busyIconBoxes[i].width - busyIconBoxes[i].height),
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(busyIconBoxes[i].width - idleIconBoxes[i].width),
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(busyIconBoxes[i].height - idleIconBoxes[i].height),
        ).toBeLessThanOrEqual(1);
      }
      await expect(native).toBeFocused();
      await native.press('Space');
      await expect(action).toHaveAttribute('data-activations', '1');
      await expect(native).not.toHaveAttribute('aria-busy', 'true');
      await expect(announcer).toHaveText('Save completed');
      await expect(native).toBeFocused();
      const axe = await new AxeBuilder({ page })
        .include('[preview-content]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(axe.violations).toEqual([]);
    });
  }
}
