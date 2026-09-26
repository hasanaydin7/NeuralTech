import { expect, test } from '@playwright/test';

test('MCP guide documents ecosystem contracts and native argument examples', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/docs/mcp-server', { waitUntil: 'networkidle' });
  await expect(page.locator('#versioning')).toContainText('1.0.0-rc.4');
  await expect(page.locator('#agent-intelligence')).toContainText(
    '@neural-ng/editor',
  );
  await expect(page.locator('#agent-intelligence')).toContainText('NNP011');
  await expect(page.locator('#agent-intelligence')).toContainText(
    'does not replace Angular compilation',
  );
  await expect(page.locator('#results')).toContainText('outputSchema');
  await expect(page.locator('#theme-tools')).toContainText('"options": {');
  await expect(page.locator('#theme-tools')).not.toContainText(
    '"options_json"',
  );
  expect(errors).toEqual([]);
});
