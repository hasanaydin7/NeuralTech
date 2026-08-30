# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: menu.spec.ts >> Menu docs >> opens from the trigger, navigates, and restores focus on Escape
- Location: ..\..\Github\NeuralTech\apps\neural-demo-e2e\src\menu.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Open account menu' })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Open account menu' })
    13 × locator resolved to <button type="button" aria-haspopup="menu" aria-expanded="false" class="menu-demo-trigger" menuposition="bottom-start" aria-controls="docs-account-menu"> Open account menu </button>
       - unexpected value "inactive"

```

```yaml
- button "Open account menu"
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { waitForHydration } from './support/hydration';
  3   | 
  4   | test.describe('Menu docs', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/docs/components/menu');
  7   |     await waitForHydration(page);
  8   |   });
  9   | 
  10  |   test('runs inline commands and renders metadata with loaded icons', async ({
  11  |     page,
  12  |   }) => {
  13  |     const menu = page.getByRole('menu', { name: 'Workspace actions' });
  14  |     const profile = menu.getByRole('menuitem', { name: /Profile/ });
  15  |     await expect(profile.locator('.nt-user')).toHaveCSS('--nt-icon', /url\(/);
  16  |     await expect(menu.getByText('4', { exact: true })).toBeVisible();
  17  |     await expect(menu.getByRole('separator')).toBeVisible();
  18  | 
  19  |     await profile.click();
  20  |     await expect(page.getByText('Last command: profile')).toBeVisible();
  21  |     await expect(
  22  |       page.getByText('Profile selected by pointer.', { exact: true }),
  23  |     ).toBeVisible();
  24  |   });
  25  | 
  26  |   test('opens from the trigger, navigates, and restores focus on Escape', async ({
  27  |     page,
  28  |   }) => {
  29  |     const trigger = page.getByRole('button', { name: 'Open account menu' });
  30  |     const popup = page.getByRole('menu', { name: 'Account commands' });
  31  | 
  32  |     await expect(trigger).toBeVisible();
  33  |     await trigger.focus();
  34  |     await trigger.press('ArrowDown');
  35  |     await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  36  |     await expect(popup).toBeVisible();
  37  |     await expect(popup.getByRole('menuitem', { name: /Profile/ })).toBeFocused();
  38  |     await expect(popup).toHaveAttribute('data-position', /bottom|top/);
  39  | 
  40  |     await page.keyboard.press('ArrowDown');
  41  |     await expect(
  42  |       popup.getByRole('menuitem', { name: /Notifications/ }),
  43  |     ).toBeFocused();
  44  |     await page.keyboard.press('Escape');
  45  |     await expect(popup).toBeHidden();
> 46  |     await expect(trigger).toBeFocused();
      |                           ^ Error: expect(locator).toBeFocused() failed
  47  |     await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  48  |   });
  49  | 
  50  |   test('opens ArrowUp on the last enabled command and closes on selection', async ({
  51  |     page,
  52  |   }) => {
  53  |     const trigger = page.getByRole('button', { name: 'Open account menu' });
  54  |     const popup = page.getByRole('menu', { name: 'Account commands' });
  55  | 
  56  |     await trigger.press('ArrowUp');
  57  |     await expect(
  58  |       popup.getByRole('menuitem', { name: /Documentation/ }),
  59  |     ).toBeFocused();
  60  |     await page.keyboard.press('ArrowUp');
  61  |     await expect(
  62  |       popup.getByRole('menuitem', { name: /Settings/ }),
  63  |     ).toBeFocused();
  64  |     await page.keyboard.press('Enter');
  65  |     await expect(popup).toBeHidden();
  66  |     await expect(page.getByText('Last command: settings')).toBeVisible();
  67  |   });
  68  | 
  69  |   test('closes a popup when its page context scrolls', async ({ page }) => {
  70  |     const trigger = page.getByRole('button', { name: 'Open account menu' });
  71  |     const popup = page.getByRole('menu', { name: 'Account commands' });
  72  | 
  73  |     const openedAt = await page.evaluate(() => performance.now());
  74  |     await trigger.click();
  75  |     await expect(popup).toBeVisible();
  76  |     await expect
  77  |       .poll(() => page.evaluate((start) => performance.now() - start, openedAt))
  78  |       .toBeGreaterThan(250);
  79  |     const initialScrollY = await page.evaluate(() => window.scrollY);
  80  |     await page.evaluate(() => {
  81  |       window.scrollTo(
  82  |         0,
  83  |         Math.max(
  84  |           document.body.scrollHeight,
  85  |           document.documentElement.scrollHeight,
  86  |         ),
  87  |       );
  88  |     });
  89  |     await expect
  90  |       .poll(() => page.evaluate(() => window.scrollY))
  91  |       .toBeGreaterThan(initialScrollY);
  92  |     await expect(popup).toBeHidden();
  93  |     await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  94  |   });
  95  | 
  96  |   test('supports projected items and consumer-owned unstyled slots', async ({
  97  |     page,
  98  |   }) => {
  99  |     const projected = page.getByRole('menu', { name: 'Developer actions' });
  100 |     await expect(projected).toHaveCSS('z-index', 'auto');
  101 |     await projected.getByRole('menuitem', { name: 'Copy' }).click();
  102 |     await expect(page.getByText('Last command: copy')).toBeVisible();
  103 | 
  104 |     const headless = page.getByRole('menu', { name: 'Headless commands' });
  105 |     await expect(headless).toHaveClass(/docs-headless-menu/);
  106 |     await expect(headless).not.toHaveClass(/neural-menu-base/);
  107 |     const profile = headless.getByRole('menuitem', { name: /Profile/ });
  108 |     await expect(profile).toHaveClass(/docs-headless-menu__item/);
  109 |     await expect(profile).not.toHaveClass(/neural-menu-item-base/);
  110 |   });
  111 | });
  112 | 
```