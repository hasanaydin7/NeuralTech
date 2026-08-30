import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForHydration } from './support/hydration';

test.beforeEach(async ({ page }) => {
  await page.goto('/docs/components/table');
  await waitForHydration(page);
});

test('has no automatically detectable accessibility violations', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const surfaces = [
    'table-interactive',
    'table-advanced-selection',
    'table-editing',
    'table-row-grouping',
    'table-enterprise-state',
    'table-loading-skeleton',
    'table-headless',
  ] as const;

  for (const testId of surfaces) {
    const results = await new AxeBuilder({ page })
      .include(`[data-testid="${testId}"]`)
      .analyze();
    expect(results.violations, `${testId} accessibility violations`).toEqual(
      [],
    );
  }
});

test('sorts, searches, selects, expands, and pages native table rows', async ({
  page,
}) => {
  const demo = page.getByTestId('table-interactive');
  const productSortIcon = demo.locator(
    'th[data-neural-column="name"] [data-neural-sort-direction]',
  );
  await expect(productSortIcon).toHaveAttribute(
    'data-neural-sort-direction',
    'none',
  );
  await expect(productSortIcon).toHaveClass(/nt-arrows-sort/);

  await demo.getByRole('button', { name: 'Sort Product ascending' }).click();
  await expect(productSortIcon).toHaveAttribute(
    'data-neural-sort-direction',
    'asc',
  );
  await expect(productSortIcon).toHaveClass(/nt-sort-ascending/);
  await expect(
    demo.locator('th[data-neural-column="name"][aria-sort]'),
  ).toHaveAttribute('aria-sort', 'ascending');
  await demo.getByRole('button', { name: 'Sort Product descending' }).click();
  await expect(productSortIcon).toHaveClass(/nt-sort-descending/);

  await page.getByRole('searchbox', { name: 'Search products' }).fill('lamp');
  await expect(demo.getByText('Hydration Lamp')).toBeVisible();
  await expect(demo.getByText('Signal Desk')).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Search products' }).fill('');
  await demo.getByRole('checkbox', { name: 'Select row 1' }).click();
  await expect(page.getByText('1 selected')).toBeVisible();

  await demo.getByRole('button', { name: 'Expand row 1' }).click();
  await expect(demo.locator('.product-expansion')).toBeVisible();
  await expect(
    demo.getByRole('button', { name: 'Collapse row 1' }),
  ).toBeVisible();
});

test('supports advanced row, range, keyboard, scoped, radio, and remote-key selection', async ({
  page,
}) => {
  const demo = page.getByTestId('table-advanced-selection');
  const table = demo.getByRole('table', {
    name: 'Advanced product selection',
  });
  const rows = table.locator('tbody tr[data-neural-row-index]');

  await expect(rows.nth(2)).toHaveAttribute('aria-disabled', 'true');
  await expect(rows.nth(2).locator('input')).toBeDisabled();

  await rows.nth(0).click();
  await rows.nth(1).click({ modifiers: ['Control'] });
  await expect(demo.getByText('2 selected', { exact: true })).toBeVisible();
  await expect(demo.getByText('Keys: 1, 2')).toBeVisible();

  await rows.nth(3).click({ modifiers: ['Shift'] });
  await expect(demo.getByText('Keys: 2, 4')).toBeVisible();
  await expect(rows.nth(2)).not.toHaveAttribute('data-neural-selected', 'true');

  await rows.nth(0).focus();
  await rows.nth(0).press('ArrowDown');
  await expect(rows.nth(1)).toBeFocused();
  await rows.nth(1).press('ArrowDown');
  await expect(rows.nth(3)).toBeFocused();
  await rows.nth(3).press('Space');
  await expect(demo.getByText('Keys: 4')).toBeVisible();

  await demo.getByRole('combobox', { name: 'Select all mode' }).selectOption(
    'all',
  );
  await table.getByRole('checkbox', { name: 'Select all rows' }).check();
  await expect(demo.getByText('6 selected', { exact: true })).toBeVisible();
  await expect(demo.getByText('Keys: 1, 2, 4, 5, 6, 7')).toBeVisible();

  const radioTable = demo.getByRole('table', {
    name: 'Single product selection',
  });
  const radios = radioTable.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await radios.nth(1).click();
  await expect(radios.nth(1)).toBeChecked();
  await expect(radios.nth(0)).not.toBeChecked();

  const remote = page.getByTestId('table-remote-selection');
  const remoteTable = remote.getByRole('table', {
    name: 'Remote key selection',
  });
  await remoteTable.locator('tbody tr[data-neural-row-index="0"]').click();
  await expect(remote.getByText('Selected keys: 1')).toBeVisible();
  await remoteTable
    .getByRole('checkbox', { name: 'Select all rows' })
    .check();
  await expect(remote.getByText('Selected keys: 1, 2, 3, 4, 5, 6, 7, 8')).toBeVisible();
});

test('exposes loading, error, remote, and headless contracts', async ({
  page,
}) => {
  const states = page.locator('#states');
  const stateTables = states.getByTestId('table-states');
  await states.getByRole('button', { name: 'Loading' }).click();
  await expect(
    stateTables.getByRole('cell', { name: 'Loading data' }),
  ).toBeVisible();
  await states.getByRole('button', { name: 'Error' }).click();
  await expect(
    states.getByText('Inventory service is temporarily unavailable.'),
  ).toBeVisible();

  const remote = page.getByTestId('table-remote');
  await remote.getByRole('button', { name: 'Sort Code ascending' }).click();
  await expect(remote.getByText('Last request: sort: code asc')).toBeVisible();
  await remote.getByRole('textbox', { name: 'Filter Product' }).fill('lamp');
  await expect(
    remote.getByText('Last request: filter: name lamp'),
  ).toBeVisible();
  await expect(remote.getByText('Hydration Lamp')).toBeVisible();
  await expect(remote.getByText('Signal Desk')).toHaveCount(0);

  await expect(
    page
      .getByTestId('table-headless')
      .locator('.neural-table-scroll-root'),
  ).not.toHaveClass(/neural-table-scroll-base/);
});

test('combines column filters and clears them as one state', async ({ page }) => {
  const demo = page.getByTestId('table-interactive');

  await demo.getByRole('textbox', { name: 'Filter Product' }).fill('lamp');
  await expect(demo.getByText('Hydration Lamp')).toBeVisible();
  await expect(demo.getByText('Signal Desk')).toHaveCount(0);

  const categoryFilter = demo.getByRole('combobox', {
    name: 'Filter Category',
  });
  await categoryFilter.click();
  await page.getByRole('option', { name: 'Lighting', exact: true }).click();
  await expect(demo.locator('tbody tr')).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(demo.getByText('Signal Desk')).toBeVisible();
  await expect(
    demo.getByRole('textbox', { name: 'Filter Product' }),
  ).toHaveValue('');
  await expect(categoryFilter).toContainText('All');
});

test('keeps inventory filters on one row without horizontal overflow', async ({
  page,
}) => {
  const demo = page.getByTestId('table-interactive');
  const scroll = demo.locator('.neural-table-scroll-root');

  await expect(
    demo.getByRole('spinbutton', { name: 'Filter Price' }),
  ).toHaveCount(1);
  await expect(
    demo.getByRole('spinbutton', { name: 'Filter Stock' }),
  ).toHaveCount(1);
  const dimensions = await scroll.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
});

test('paints every selected cell as one continuous surface', async ({
  page,
}) => {
  const demo = page.getByTestId('table-interactive');
  await demo
    .getByRole('checkbox', { name: 'Select all rows on this page' })
    .click();

  const rows = demo.locator('tbody tr[data-neural-selected="true"]');
  await expect(rows).toHaveCount(4);

  const backgrounds = await rows.locator('td').evaluateAll((cells) =>
    cells.map((cell) => getComputedStyle(cell).backgroundColor),
  );
  expect(backgrounds).toEqual(backgrounds.map(() => backgrounds[0]));
});

test('scrolls with sticky columns and manages column layout accessibly', async ({
  page,
}) => {
  const demo = page.getByTestId('table-layout');
  const scroll = demo.locator('.neural-table-scroll-root');
  await expect(scroll).toHaveCSS('max-height', '336px');
  await expect(demo.locator('thead')).toHaveCSS('position', 'sticky');

  const productHeader = demo.locator(
    'thead tr:first-child th[data-neural-column="name"]',
  );
  const statusHeader = demo.locator(
    'thead tr:first-child th[data-neural-column="status"]',
  );
  await expect(productHeader).toHaveCSS('position', 'sticky');
  await expect(productHeader).toHaveCSS('left', '100px');
  await expect(statusHeader).toHaveCSS('right', '0px');
  await expect(
    demo
      .locator('tbody tr:nth-child(even) td[data-neural-column="name"]')
      .first(),
  ).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  const resizeHandle = demo.getByRole('separator', {
    name: 'Resize Product',
  });
  const widthBefore = await productHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  await resizeHandle.focus();
  await resizeHandle.press('ArrowRight');
  await expect(resizeHandle).toHaveAttribute('aria-valuenow', '168');
  await expect(demo.getByText(/Product: \d+px → \d+px \(expand\)/)).toBeVisible();
  const widthAfter = await productHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  expect(widthAfter).toBeGreaterThan(widthBefore);

  await demo.getByRole('combobox', { name: 'Resize mode' }).selectOption('fit');
  const codeHeader = demo.locator(
    'thead tr:first-child th[data-neural-column="code"]',
  );
  const codeWidthBefore = await codeHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const productFitWidthBefore = await productHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const codeResizeHandle = demo.getByRole('separator', {
    name: 'Resize Code',
  });
  await codeResizeHandle.press('ArrowRight');
  await expect(codeResizeHandle).toHaveAttribute('aria-valuenow', '108');
  await expect(resizeHandle).toHaveAttribute('aria-valuenow', '160');
  const codeWidthAfter = await codeHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const productFitWidthAfter = await productHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  expect(codeWidthAfter).toBeGreaterThan(codeWidthBefore);
  expect(productFitWidthAfter).toBeLessThan(productFitWidthBefore);

  await demo
    .getByRole('combobox', { name: 'Resize mode' })
    .selectOption('expand');
  const categoryHeader = demo.locator(
    'thead tr:first-child th[data-neural-column="category"]',
  );
  const categoryWidthBefore = await categoryHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const categoryHandle = demo.getByRole('separator', {
    name: 'Resize Category',
  });
  const handleBox = await categoryHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await categoryHandle.hover();
  await page.mouse.down();
  await page.mouse.move(
    (handleBox?.x ?? 0) + (handleBox?.width ?? 0) / 2 + 30,
    (handleBox?.y ?? 0) + (handleBox?.height ?? 0) / 2,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(
    demo.getByText(/Category: \d+px → \d+px \(expand\)/),
  ).toBeVisible();
  const categoryAriaWidth = Number(
    await categoryHandle.getAttribute('aria-valuenow'),
  );
  expect(categoryAriaWidth).toBeGreaterThan(120);
  const categoryWidthAfter = await categoryHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  expect(categoryWidthAfter).toBeGreaterThan(categoryWidthBefore);

  const priceHeader = demo.locator(
    'thead tr:first-child th[data-neural-column="price"]',
  );
  const stockHeader = demo.locator(
    'thead tr:first-child th[data-neural-column="inventory"]',
  );
  const priceCell = demo.locator(
    'tbody tr:first-child td[data-neural-column="price"]',
  );
  const priceWidthBeforeStockResize = await priceHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const priceCellWidthBeforeStockResize = await priceCell.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const stockWidthBefore = await stockHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const stockHandle = demo.getByRole('separator', {
    name: 'Resize Stock',
  });
  const priceHandle = demo.getByRole('separator', {
    name: 'Resize Price',
  });
  await stockHandle.hover();
  let visibleStockBox = await stockHeader.boundingBox();
  expect(visibleStockBox).not.toBeNull();
  const priceAriaWidthBefore = await priceHandle.getAttribute('aria-valuenow');
  await page.mouse.move(
    (visibleStockBox?.x ?? 0) + 2,
    (visibleStockBox?.y ?? 0) + (visibleStockBox?.height ?? 0) / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    (visibleStockBox?.x ?? 0) + 24,
    (visibleStockBox?.y ?? 0) + (visibleStockBox?.height ?? 0) / 2,
  );
  await page.mouse.up();
  await expect(priceHandle).toHaveAttribute(
    'aria-valuenow',
    priceAriaWidthBefore ?? '',
  );

  await stockHandle.hover();
  const stockHandleBox = await stockHandle.boundingBox();
  visibleStockBox = await stockHeader.boundingBox();
  expect(stockHandleBox).not.toBeNull();
  expect(visibleStockBox).not.toBeNull();
  expect(
    (stockHandleBox?.x ?? 0) + (stockHandleBox?.width ?? 0),
  ).toBeCloseTo(
    (visibleStockBox?.x ?? 0) + (visibleStockBox?.width ?? 0),
    0,
  );
  const stockAriaWidthBefore = Number(
    await stockHandle.getAttribute('aria-valuenow'),
  );
  const priceGeometryBeforeStockResize = await priceCell.evaluate((cell) => {
    const range = document.createRange();
    range.selectNodeContents(cell);
    const cellRect = cell.getBoundingClientRect();
    const textRect = range.getBoundingClientRect();
    return {
      cellLeft: cellRect.left,
      textLeft: textRect.left,
      scrollLeft:
        cell.closest('.neural-table-scroll-root')?.scrollLeft ?? 0,
    };
  });
  await page.mouse.down();
  await page.mouse.move(
    (stockHandleBox?.x ?? 0) + (stockHandleBox?.width ?? 0) / 2 - 24,
    (stockHandleBox?.y ?? 0) + (stockHandleBox?.height ?? 0) / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect
    .poll(async () =>
      Number(await stockHandle.getAttribute('aria-valuenow')),
    )
    .toBeLessThan(stockAriaWidthBefore);
  const priceWidthAfterStockResize = await priceHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const priceCellWidthAfterStockResize = await priceCell.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const stockWidthAfter = await stockHeader.evaluate(
    (cell) => cell.getBoundingClientRect().width,
  );
  const priceGeometryAfterStockResize = await priceCell.evaluate((cell) => {
    const range = document.createRange();
    range.selectNodeContents(cell);
    const cellRect = cell.getBoundingClientRect();
    const textRect = range.getBoundingClientRect();
    return {
      cellLeft: cellRect.left,
      textLeft: textRect.left,
      scrollLeft:
        cell.closest('.neural-table-scroll-root')?.scrollLeft ?? 0,
    };
  });
  expect(priceWidthAfterStockResize).toBeCloseTo(
    priceWidthBeforeStockResize,
    1,
  );
  expect(priceCellWidthAfterStockResize).toBeCloseTo(
    priceCellWidthBeforeStockResize,
    1,
  );
  expect(priceGeometryAfterStockResize).toEqual(
    priceGeometryBeforeStockResize,
  );
  expect(stockWidthAfter).toBeLessThan(stockWidthBefore);

  await demo.getByRole('checkbox', { name: 'Category column' }).uncheck();
  await expect(
    demo.locator('thead th[data-neural-column="category"]'),
  ).toHaveCount(0);
  await demo.getByRole('checkbox', { name: 'Category column' }).check();
  await expect(
    demo.locator('thead tr:first-child th[data-neural-column="category"]'),
  ).toBeVisible();
});

test('reorders columns with keyboard and pointer while preserving controlled state', async ({
  page,
}) => {
  const demo = page.getByTestId('table-reorder');
  const codeHandle = demo.getByRole('button', { name: 'Reorder Code' });
  expect(
    await codeHandle.evaluate(
      (handle) => getComputedStyle(handle, '::before').backgroundImage,
    ),
  ).toContain('radial-gradient');
  await codeHandle.focus();
  await codeHandle.press('ArrowRight');
  await expect(demo.getByText('Code: 1 → 2.')).toBeVisible();
  expect(
    await demo
      .locator('thead tr:last-child th[data-neural-column]')
      .evaluateAll((cells) =>
        cells.map((cell) => cell.getAttribute('data-neural-column')),
      ),
  ).toEqual(['name', 'code', 'category', 'price', 'inventory', 'status']);

  await demo.getByRole('button', { name: 'Reset order' }).click();
  const categoryHandle = demo.getByRole('button', {
    name: 'Reorder Category',
  });
  const priceHeader = demo.locator(
    'thead tr:last-child th[data-neural-column="price"]',
  );
  const priceBox = await priceHeader.boundingBox();
  expect(priceBox).not.toBeNull();
  await categoryHandle.dragTo(priceHeader, {
    targetPosition: {
      x: (priceBox?.width ?? 0) * 0.75,
      y: (priceBox?.height ?? 0) / 2,
    },
  });
  await expect(categoryHandle).toBeFocused();
  await expect(demo.getByText('Category: 3 → 4.')).toBeVisible();
  expect(
    await demo
      .locator('thead tr:last-child th[data-neural-column]')
      .evaluateAll((cells) =>
        cells.map((cell) => cell.getAttribute('data-neural-column')),
      ),
  ).toEqual([
    'code',
    'name',
    'price',
    'category',
    'inventory',
    'status',
  ]);
});

test('updates grouped header colspans and renders typed summaries', async ({
  page,
}) => {
  const demo = page.getByTestId('table-grouped');
  const productGroup = demo.locator(
    'th[data-neural-header-group="product-information"]',
  );
  const identityGroup = demo.locator(
    'th[data-neural-header-group="identity"]',
  );
  const footerGroup = demo.locator(
    'th[data-neural-footer-group="visible-totals"]',
  );
  await expect(productGroup).toHaveAttribute('scope', 'colgroup');
  await expect(productGroup).toHaveAttribute('colspan', '3');
  await expect(identityGroup).toHaveAttribute('colspan', '2');
  await expect(footerGroup).toContainText('6 columns');
  await expect(demo.locator('tfoot')).toContainText('$2,145');
  await expect(demo.locator('tfoot')).toContainText('53 units');

  await demo
    .getByRole('checkbox', { name: 'Grouped Category column' })
    .uncheck();
  await expect(productGroup).toHaveAttribute('colspan', '2');
  await expect(
    demo.locator('th[data-neural-header-group="classification"]'),
  ).toHaveCount(0);
  await expect(footerGroup).toContainText('5 columns');
});

test('groups rows, toggles subheaders, aggregates, and renders native rowspan', async ({
  page,
}) => {
  const grouped = page.getByTestId('table-row-grouping');
  const officeToggle = grouped.getByRole('button', {
    name: /Office.*2 products/,
  });
  await expect(officeToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(grouped.locator('.docs-table-group-summary').first()).toContainText(
    '$1,448',
  );
  await expect(grouped.locator('tfoot')).toContainText('$2,787');
  await officeToggle.click();
  await expect(officeToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(
    grouped.locator('tbody tr[data-neural-row-index="0"]'),
  ).toBeHidden();

  const rowspan = page.getByTestId('table-rowspan');
  const regionCells = rowspan.locator(
    'tbody td[data-neural-column="region"][rowspan]',
  );
  await expect(regionCells).toHaveCount(3);
  await expect(regionCells.first()).toHaveAttribute('rowspan', '3');
});

test('persists versioned state, serializes URL state, rejects stale requests, and renders skeletons', async ({
  page,
}) => {
  const enterprise = page.getByTestId('table-enterprise-state');
  await enterprise
    .getByRole('button', { name: 'Sort Product ascending' })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const value = sessionStorage.getItem(
          'neural-demo-enterprise-table',
        );
        return value ? JSON.parse(value).sort?.[0]?.direction : null;
      }),
    )
    .toBe('asc');

  await expect(enterprise.locator('.table-query-output')).toContainText(
    '?table=',
  );
  const query = await enterprise.locator('.table-query-output').textContent();
  const serialized = new URLSearchParams((query ?? '').slice(1)).get('table');
  expect(serialized).not.toBeNull();
  expect(JSON.parse(serialized ?? '{}')).toMatchObject({
    version: 1,
    sort: [{ field: 'name', direction: 'asc' }],
  });

  const race = page.getByTestId('table-request-identity');
  await expect(race.getByRole('status')).toContainText(
    'Ignored stale request #1',
    { timeout: 2000 },
  );

  const skeleton = page.getByTestId('table-loading-skeleton');
  await expect(
    skeleton.locator('.neural-table-skeleton-row-root'),
  ).toHaveCount(5);
  await expect(
    skeleton.locator('.neural-table-skeleton-row-root').first(),
  ).toHaveAttribute('aria-hidden', 'true');
  await expect(
    skeleton.locator('.neural-table-skeleton-line-root').first(),
  ).toBeVisible();
});

test('edits cells and rows with Neural controls and async validation', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const cellDemo = page.getByTestId('table-cell-edit');
  const firstNameCell = cellDemo.locator(
    'tbody tr:first-child td[data-neural-column="name"]',
  );
  await firstNameCell.click();
  const nameEditor = cellDemo.getByRole('textbox', { name: 'Product name' });
  await expect(nameEditor).toBeVisible();
  await nameEditor.fill('x');
  await nameEditor.press('Enter');
  await expect(cellDemo.getByRole('alert')).toContainText(
    'at least 3 characters',
  );
  await expect(nameEditor).toBeVisible();

  await nameEditor.fill('Signal Workbench');
  await nameEditor.press('Enter');
  await expect(
    cellDemo.getByRole('cell', { name: 'Signal Workbench' }),
  ).toBeVisible();
  await expect(cellDemo.getByRole('status')).toContainText(
    'Product saved for Signal Workbench',
  );

  const categoryCell = cellDemo.locator(
    'tbody tr:first-child td[data-neural-column="category"]',
  );
  await categoryCell.click();
  const categorySelect = cellDemo.getByRole('combobox', {
    name: 'Product category',
  });
  await expect(categorySelect).toBeVisible();
  await categorySelect.click();
  const categoryPanel = cellDemo.locator(
    '.neural-select-panel-root[popover="manual"]',
  );
  await expect(categoryPanel).toBeVisible();
  await expect(categoryPanel).toHaveAttribute(
    'data-neural-append-to',
    'body',
  );
  await categoryPanel.getByRole('option', { name: 'Audio' }).click();
  await cellDemo.getByRole('button', { name: 'Save cell edit' }).click();
  await expect(cellDemo.getByRole('status')).toContainText(
    'Category saved',
  );

  const priceCell = cellDemo.locator(
    'tbody tr:first-child td[data-neural-column="price"]',
  );
  await priceCell.click();
  await expect(
    cellDemo.getByRole('spinbutton', { name: 'Product price' }),
  ).toBeVisible();

  const featuredCell = cellDemo.locator(
    'tbody tr:first-child td[data-neural-column="featured"]',
  );
  await featuredCell.click();
  await expect(
    cellDemo.getByRole('checkbox', { name: 'Featured product' }),
  ).toBeVisible();

  await expect(
    cellDemo.locator(
      'tbody tr:nth-child(3) td[data-neural-column="price"]',
    ),
  ).toHaveAttribute('data-neural-disabled', 'true');

  const rowDemo = page.getByTestId('table-row-edit');
  await rowDemo.getByRole('button', { name: 'Edit row' }).first().click();
  const rowName = rowDemo.getByRole('textbox', {
    name: 'Row product name',
  });
  await rowName.fill('Immutable Desk');
  await rowDemo.getByRole('button', { name: 'Save row edit' }).click();
  await expect(
    rowDemo.getByRole('cell', { name: 'Immutable Desk' }),
  ).toBeVisible();
  await expect(rowDemo.getByRole('status')).toContainText(
    'Immutable Desk saved',
  );

  await rowDemo.getByRole('button', { name: 'Edit row' }).nth(1).click();
  await rowDemo.getByRole('button', { name: 'Cancel row edit' }).click();
  await expect(rowDemo.getByRole('status')).toContainText(
    'row edit cancelled',
  );
});
