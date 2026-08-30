import { expect, test } from '@playwright/test';

test('renders the five-package starter surface', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Neural Starter' }),
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Email notifications' }),
  ).toBeChecked();
  await expect(
    page.getByRole('textbox', { name: 'Starter document' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Test toast' }).click();
  await expect(
    page.getByText(
      'Core, Icons, Editor, Theme Compiler and MCP Server are connected.',
    ),
  ).toBeVisible();
});
