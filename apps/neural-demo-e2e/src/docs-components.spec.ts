import { expect, test } from '@playwright/test';
import { waitForHydration } from './support/hydration';

const docsRoutes = [
  ['Accordion', '/docs/components/accordion'],
  ['Badge', '/docs/components/badge'],
  ['TriStateCheckbox', '/docs/components/tri-state-checkbox'],
  ['Input', '/docs/components/input'],
  ['Field', '/docs/components/field'],
  ['Card', '/docs/components/card'],
  ['Dialog', '/docs/components/dialog'],
  ['Divider', '/docs/components/divider'],
  ['LoadingOverlay', '/docs/components/loading-overlay'],
  ['Menu', '/docs/components/menu'],
  ['MeterGroup', '/docs/components/meter-group'],
  ['Breadcrumb', '/docs/components/breadcrumb'],
  ['Paginator', '/docs/components/paginator'],
  ['PanelMenu', '/docs/components/panel-menu'],
  ['ProgressBar', '/docs/components/progress-bar'],
  ['ProgressSpinner', '/docs/components/progress-spinner'],
  ['Skeleton', '/docs/components/skeleton'],
  ['Table', '/docs/components/table'],
  ['Tabs', '/docs/components/tabs'],
  ['Tag', '/docs/components/tag'],
  ['Avatar', '/docs/components/avatar'],
  ['Toast', '/docs/components/toast'],
  ['Tooltip', '/docs/components/tooltip'],
  ['Message API', '/docs/apis/message'],
] as const;

test('links every ready foundation from the public landing page', async ({
  page,
}) => {
  await page.goto('/');
  await waitForHydration(page);

  await expect(
    page.getByRole('heading', {
      name: 'Thirty-one foundations are ready to explore.',
    }),
  ).toBeVisible();

  for (const [label, route] of docsRoutes) {
    await expect(
      page.getByRole('link', { name: `${label} Ready`, exact: true }),
    ).toHaveAttribute('href', route);
  }

  await expect(
    page.getByRole('link', { name: 'InputNumber Ready' }),
  ).toHaveAttribute('href', '/docs/components/input-number');
});

test('exposes every completed demo as an active lazy docs route', async ({
  page,
}) => {
  test.setTimeout(120_000);

  for (const [label, route] of docsRoutes) {
    await page.goto(route);
    await waitForHydration(page);
    await expect(
      page.getByRole('heading', { name: label, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: `${label} Alpha`, exact: true }),
    ).toHaveAttribute('aria-current', 'page');
  }
});

test('runs the Input, Field, Card, and Paginator demos', async ({ page }) => {
  await page.goto('/docs/components/input');
  await waitForHydration(page);
  const search = page.getByRole('searchbox', { name: 'Search components' });
  await search.fill('Toast');
  await expect(page.getByText('Signal value: Toast')).toBeVisible();

  await page.goto('/docs/components/field');
  await waitForHydration(page);
  const email = page.getByRole('textbox', { name: 'Work email' });
  await email.fill('invalid');
  await email.blur();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(email).toHaveAttribute(
    'aria-describedby',
    'docs-work-email-hint docs-work-email-error',
  );

  await page.goto('/docs/components/card');
  await waitForHydration(page);
  await expect(
    page.getByRole('article', { name: 'Neural Commerce' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Usage summary' }),
  ).toBeVisible();

  await page.goto('/docs/components/paginator');
  await waitForHydration(page);
  await page.getByRole('button', { name: 'Next page' }).first().click();
  await expect(page.getByText('Neural product 6')).toBeVisible();
  await expect(page.getByText('Last event range: 5–10')).toBeVisible();
});

test('runs Tabs, Toast, and Message API interactions', async ({ page }) => {
  await page.goto('/docs/components/tabs');
  await waitForHydration(page);
  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Profile' })).toContainText(
    'Profile settings',
  );

  await page.goto('/docs/components/toast');
  await waitForHydration(page);
  await page.getByRole('button', { name: 'Success' }).click();
  await expect(
    page.getByText(
      'A success notification from the shared Message API.',
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await page.goto('/docs/apis/message');
  await waitForHydration(page);
  await page.getByRole('button', { name: 'Send persistent' }).click();
  await expect(page.getByText('Active in channel: 1')).toBeVisible();
  await expect(
    page.getByText('This message remains until it is dismissed.').first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear channel' }).click();
  await expect(page.getByText('Active in channel: 0')).toBeVisible();
});
