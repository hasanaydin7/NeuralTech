import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  ['/', 'The Angular UI library for AI coding agents.'],
  ['/docs/installation', 'Installation'],
  ['/docs/components/button', 'Button'],
  ['/docs/components/panel-menu', 'PanelMenu'],
  ['/docs/components/sidebar', 'Sidebar'],
] as const;

for (const [route, heading] of routes) {
  test(`${route} renders without WCAG A/AA violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();
    expect(errors).toEqual([]);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('publishes route-specific SEO metadata', async ({ page, request }) => {
  const serverResponse = await request.get('/docs/components/button');
  expect(serverResponse.ok()).toBe(true);
  expect(await serverResponse.text()).toMatch(
    /<link rel="canonical" href="[^"]*\/docs\/components\/button">/,
  );

  await page.goto('/docs/components/button');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/docs\/components\/button$/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Button — NeuralNg',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Button.*NeuralNg/,
  );
});

test('publishes machine-readable discovery for AI coding agents', async ({
  page,
  request,
}) => {
  const llmsResponse = await request.get('/llms.txt');
  expect(llmsResponse.ok()).toBe(true);
  const llms = await llmsResponse.text();
  expect(llms).toContain('@neural-ng/core');
  expect(llms).toContain('@neural-ng/mcp-server');
  expect(llms).toContain('/docs/components');

  await page.goto('/');
  await expect(page).toHaveTitle(
    'NeuralNg — Angular UI Library for AI Coding Agents',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Angular UI library.*AI coding agents.*llms\.txt.*MCP/i,
  );
  await expect(
    page.locator('link[rel="alternate"][href="/llms.txt"]'),
  ).toHaveCount(1);

  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '{}',
  ) as { '@graph'?: Array<{ '@type'?: string; name?: string }> };
  expect(structuredData['@graph']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        '@type': 'SoftwareSourceCode',
        name: 'NeuralNg',
      }),
    ]),
  );
});

test('keeps On this page sticky while document content scrolls', async ({
  page,
}) => {
  await page.goto('/docs/components/panel-menu');
  const navigation = page.getByRole('complementary', { name: 'On this page' });
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect
    .poll(async () => (await navigation.boundingBox())?.y)
    .toBeGreaterThan(90);
  const stickyPosition = await navigation.boundingBox();
  await page.evaluate(() => window.scrollTo(0, 2200));
  await expect
    .poll(async () => (await navigation.boundingBox())?.y)
    .toBeGreaterThan(90);
  const after = await navigation.boundingBox();
  expect(Math.abs((after?.y ?? 0) - (stickyPosition?.y ?? 0))).toBeLessThan(8);
});

test('keeps Menu and PanelMenu aligned in one collapsible Sidebar', async ({
  page,
}) => {
  await page.goto('/docs/components/sidebar');
  const example = page.locator('#composition');
  const sidebar = example.locator('#docs-mixed-navigation');
  const menu = sidebar.locator('.neural-menu-root:not([data-popup="true"])');
  const panelMenu = sidebar.locator('.neural-panel-menu-root');
  const menuLabel = menu.locator(
    '[data-key="overview"] .neural-menu-label-root',
  );
  const panelLabel = panelMenu.locator(
    '[data-key="workspace"] .neural-panel-menu-label-root',
  );
  const toggle = example.getByRole('button', {
    name: 'Collapse navigation',
  });

  await expect(menuLabel).toBeVisible();
  await expect(panelLabel).toBeVisible();
  await expect
    .poll(() =>
      panelMenu.evaluate((element) =>
        getComputedStyle(element).marginBlockStart.trim(),
      ),
    )
    .toBe('8px');
  await toggle.click();
  await expect(sidebar).toHaveAttribute('data-open', 'false');
  await expect(menuLabel).toBeHidden();
  await expect(panelLabel).toBeHidden();

  const menuIcon = await menu
    .locator('[data-key="overview"] .neural-menu-icon-root')
    .boundingBox();
  const panelIcon = await panelMenu
    .locator('[data-key="workspace"] .neural-panel-menu-icon-root')
    .boundingBox();
  expect(menuIcon).not.toBeNull();
  expect(panelIcon).not.toBeNull();
  expect(
    Math.abs(
      (menuIcon?.x ?? 0) +
        (menuIcon?.width ?? 0) / 2 -
        ((panelIcon?.x ?? 0) + (panelIcon?.width ?? 0) / 2),
    ),
  ).toBeLessThan(1);

  await example.getByRole('button', { name: 'Expand navigation' }).click();
  await expect(sidebar).toHaveAttribute('data-open', 'true');
  await expect(menuLabel).toBeVisible();
  await expect(panelLabel).toBeVisible();
});

test('serves the optimized hero and a dedicated not-found experience', async ({
  page,
}) => {
  const heroResponse = page.waitForResponse((response) =>
    response.url().endsWith('-landing.webp'),
  );
  await page.goto('/');
  expect((await heroResponse).ok()).toBe(true);

  await page.goto('/route-that-does-not-exist');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'This page is outside the graph.',
    }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
});
