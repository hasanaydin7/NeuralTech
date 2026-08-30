import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  aggregateNeuralTableRows,
  aggregateNeuralTableValues,
  compareNeuralTableValues,
  filterNeuralTableRows,
  paginateNeuralTableRows,
  sortNeuralTableRows,
} from './table-data-engine';
import {
  parseNeuralTableState,
  serializeNeuralTableState,
} from './table-state';
import { TableComponent } from './table.component';
import {
  NeuralTableCellDirective,
  NeuralTableEmptyDirective,
  NeuralTableEditorDirective,
  NeuralTableExpansionDirective,
  NeuralTableGroupFooterDirective,
  NeuralTableGroupHeaderDirective,
  NeuralTableFooterDirective,
  NeuralTableHeaderGroupDirective,
} from './table-templates';
import type {
  NeuralTableColumn,
  NeuralTableFilter,
  NeuralTableHeaderGroup,
  NeuralTableEditMode,
  NeuralTableEditEvent,
  NeuralTableEditValidator,
  NeuralTableRowEditEvent,
  NeuralTableState,
} from './table.types';

interface Product {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly price: number;
}

const products: readonly Product[] = [
  { id: 1, name: 'Neural Desk', category: 'Office', price: 320 },
  { id: 2, name: 'Signal Lamp', category: 'Home', price: 80 },
  { id: 3, name: 'Angular Chair', category: 'Office', price: 180 },
];

const selectionProducts: readonly Product[] = [
  ...products,
  { id: 4, name: 'Hydration Shelf', category: 'Storage', price: 240 },
  { id: 5, name: 'Signal Clock', category: 'Home', price: 120 },
];

const columns: readonly NeuralTableColumn<Product>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    sortable: true,
    filterable: true,
  },
  {
    id: 'category',
    header: 'Category',
    field: 'category',
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Office', value: 'Office' },
      { label: 'Home', value: 'Home' },
    ],
  },
  {
    id: 'price',
    header: 'Price',
    field: 'price',
    sortable: true,
    filterable: true,
    filterType: 'number',
    filterMatchMode: 'between',
  },
];

@Component({
  imports: [
    TableComponent,
    NeuralTableCellDirective,
    NeuralTableEmptyDirective,
    NeuralTableExpansionDirective,
  ],
  template: `
    <neural-table
      [value]="rows()"
      [columns]="columns"
      rowKey="id"
      selectionMode="multiple"
      [(selection)]="selection"
      [(filters)]="filters"
      [filterDelay]="0"
      [unstyled]="unstyled()"
      [classes]="{ cell: 'consumer-cell' }"
      caption="Products"
    >
      <ng-template neuralTableCell="price" let-value>
        <strong class="price-template">{{ value }} USD</strong>
      </ng-template>
      <ng-template neuralTableEmpty let-message="message">
        <tr>
          <td class="custom-empty" colspan="4">{{ message }}</td>
        </tr>
      </ng-template>
      <ng-template neuralTableExpansion let-row>
        <span class="details">{{ $any(row).name }} details</span>
      </ng-template>
    </neural-table>
  `,
})
class TableHost {
  readonly rows = signal(products);
  readonly selection = signal<readonly Product[]>([]);
  readonly filters = signal<readonly NeuralTableFilter[]>([]);
  readonly unstyled = signal(false);
  readonly columns = columns;
}

@Component({
  imports: [
    TableComponent,
    NeuralTableFooterDirective,
    NeuralTableHeaderGroupDirective,
  ],
  template: `
    <neural-table
      [value]="rows"
      [columns]="columns"
      [headerGroups]="headerGroups"
      [(hiddenColumnIds)]="hiddenColumnIds"
    >
      <ng-template neuralTableHeaderGroup="identity" let-group>
        <span class="identity-group">{{ group.header }}</span>
      </ng-template>
      <ng-template neuralTableFooter="price" let-rows="rows">
        <span class="price-summary">{{ rows.length }} products</span>
      </ng-template>
    </neural-table>
  `,
})
class AdvancedTableHost {
  readonly rows = products;
  readonly columns: readonly NeuralTableColumn<Product>[] = columns.map(
    (column) => ({
      ...column,
      footer: column.id === 'name' ? 'Summary' : undefined,
    }),
  );
  readonly headerGroups: readonly NeuralTableHeaderGroup[] = [
    {
      id: 'identity',
      header: 'Identity',
      children: ['name', 'category'],
    },
    {
      id: 'commercial',
      header: 'Commercial',
      children: ['price'],
    },
  ];
  readonly hiddenColumnIds = signal<readonly string[]>([]);
}

@Component({
  imports: [TableComponent, NeuralTableEditorDirective],
  template: `
    <neural-table
      [value]="rows"
      [columns]="editColumns"
      rowKey="id"
      [editMode]="mode()"
      [editValidator]="validator"
      [unstyled]="unstyled()"
      (cellEditStart)="cellStarts.push($event)"
      (cellEditComplete)="cellCompletes.push($event)"
      (cellEditCancel)="cellCancels.push($event)"
      (rowEditStart)="rowStarts.push($event)"
      (rowEditSave)="rowSaves.push($event)"
      (rowEditCancel)="rowCancels.push($event)"
    >
      <ng-template neuralTableEditor="name" let-value let-setValue="setValue">
        <input
          class="name-editor"
          [value]="value"
          (input)="setValue($any($event.target).value)"
        />
      </ng-template>
      <ng-template neuralTableEditor="price" let-value let-setValue="setValue">
        <input
          class="price-editor"
          type="number"
          [value]="value"
          (input)="setValue(+$any($event.target).value)"
        />
      </ng-template>
    </neural-table>
  `,
})
class EditingTableHost {
  readonly table = viewChild.required(TableComponent<Product>);
  readonly rows = products;
  readonly mode = signal<NeuralTableEditMode>('cell');
  readonly validation = signal<true | string>(true);
  readonly validatorOverride = signal<NeuralTableEditValidator<Product> | null>(
    null,
  );
  readonly unstyled = signal(false);
  readonly editColumns: readonly NeuralTableColumn<Product>[] = [
    { ...columns[0], editable: true },
    { ...columns[1], editable: true, readOnly: true },
    { ...columns[2], editable: true, disabled: (row) => row.id === 3 },
  ];
  readonly validator: NeuralTableEditValidator<Product> = async (event) =>
    this.validatorOverride()?.(event) ?? this.validation();
  readonly cellStarts: NeuralTableEditEvent<Product>[] = [];
  readonly cellCompletes: NeuralTableEditEvent<Product>[] = [];
  readonly cellCancels: NeuralTableEditEvent<Product>[] = [];
  readonly rowStarts: NeuralTableRowEditEvent<Product>[] = [];
  readonly rowSaves: NeuralTableRowEditEvent<Product>[] = [];
  readonly rowCancels: NeuralTableRowEditEvent<Product>[] = [];
}

@Component({
  imports: [
    TableComponent,
    NeuralTableGroupFooterDirective,
    NeuralTableGroupHeaderDirective,
  ],
  template: `
    <neural-table
      [value]="rows"
      [columns]="columns"
      groupRowsBy="category"
      expandableRowGroups
      [(expandedRowGroupKeys)]="expanded"
    >
      <ng-template
        neuralTableGroupHeader
        let-group
        let-rows="rows"
        let-toggle="toggle"
      >
        <button class="group-toggle" (click)="toggle($event)">
          {{ group }} ({{ rows.length }})
        </button>
      </ng-template>
      <ng-template neuralTableGroupFooter let-aggregate="aggregate">
        <span class="group-total">{{ aggregate('price', 'sum') }}</span>
      </ng-template>
    </neural-table>
  `,
})
class GroupedTableHost {
  readonly rows = products;
  readonly columns = columns;
  readonly expanded = signal<readonly (string | number)[]>(['Office', 'Home']);
}

describe('Table data engine', () => {
  it('filters nested fields and global values without mutating input', () => {
    const result = filterNeuralTableRows(
      products,
      columns,
      [{ field: 'category', value: 'office', matchMode: 'equals' }],
      'angular',
    );
    expect(result.map((row) => row.id)).toEqual([3]);
    expect(products.map((row) => row.id)).toEqual([1, 2, 3]);
  });

  it('uses stable multi-sort and deterministic pagination', () => {
    const sorted = sortNeuralTableRows(products, columns, [
      { field: 'category', direction: 'asc' },
      { field: 'price', direction: 'desc' },
    ]);
    expect(sorted.map((row) => row.id)).toEqual([2, 1, 3]);
    expect(paginateNeuralTableRows(sorted, 1, 2).map((row) => row.id)).toEqual([
      3,
    ]);
  });

  it('compares Date values with native date-filter strings', () => {
    expect(
      compareNeuralTableValues(new Date('2026-07-26'), '2026-07-25'),
    ).toBeGreaterThan(0);
  });

  it('aggregates finite values with sum, average, min, and max', () => {
    expect(aggregateNeuralTableValues([10, '20', null], 'sum')).toBe(30);
    expect(aggregateNeuralTableRows(products, 'price', 'average')).toBeCloseTo(
      193.333,
      3,
    );
    expect(aggregateNeuralTableRows(products, 'price', 'min')).toBe(80);
    expect(aggregateNeuralTableRows(products, 'price', 'max')).toBe(320);
  });

  it('round-trips a versioned URL-safe table state and rejects invalid input', () => {
    const state: NeuralTableState = {
      version: 1,
      pageIndex: 2,
      pageSize: 25,
      sort: [{ field: 'price', direction: 'desc' }],
      filters: [{ field: 'category', value: 'Office' }],
      globalFilter: 'desk',
      columnOrder: ['category', 'name', 'price'],
      columnWidths: { name: 220 },
      hiddenColumnIds: ['price'],
      selectionKeys: [1],
      expandedRowKeys: [2],
      expandedRowGroupKeys: ['Office'],
    };
    const serialized = serializeNeuralTableState(state);
    expect(parseNeuralTableState(serialized)).toEqual(state);
    expect(parseNeuralTableState('not-json')).toBeNull();
    expect(parseNeuralTableState({ ...state, version: 2 })).toBeNull();
    expect(
      parseNeuralTableState({
        ...state,
        sort: [{ field: 'price', direction: 'sideways' }],
      }),
    ).toBeNull();
    expect(
      parseNeuralTableState({
        ...state,
        selectionKeys: [{ id: 1 }],
      }),
    ).toBeNull();
  });
});

describe('TableComponent', () => {
  it('captures, serializes, sanitizes, and restores the complete table state', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.detectChanges();

    const restored: NeuralTableState = {
      version: 1,
      pageIndex: 3,
      pageSize: 20,
      sort: [
        { field: 'price', direction: 'desc' },
        { field: 'missing', direction: 'asc' },
      ],
      filters: [{ field: 'category', value: 'Office' }],
      globalFilter: 'neural',
      columnOrder: ['price', 'missing', 'name'],
      columnWidths: { price: 140, missing: 999 },
      hiddenColumnIds: ['category', 'missing'],
      selectionKeys: [1],
      expandedRowKeys: [2],
      expandedRowGroupKeys: ['Office'],
    };
    expect(fixture.componentInstance.restoreState(restored)).toBe(true);
    expect(fixture.componentInstance.pageIndex()).toBe(3);
    expect(fixture.componentInstance.sort()).toEqual([
      { field: 'price', direction: 'desc' },
    ]);
    expect(fixture.componentInstance.columnOrder()).toEqual(['price', 'name']);
    expect(fixture.componentInstance.columnWidths()).toEqual({ price: 140 });
    expect(fixture.componentInstance.hiddenColumnIds()).toEqual(['category']);
    expect(fixture.componentInstance.selection()).toEqual([products[0]]);
    expect(
      parseNeuralTableState(fixture.componentInstance.serializeState()),
    ).toEqual(fixture.componentInstance.captureState());
  });

  it('issues monotonic request identities and detects stale responses', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    const requestIds: number[] = [];
    fixture.componentInstance.stateChange.subscribe((event) =>
      requestIds.push(event.requestId),
    );
    fixture.detectChanges();

    fixture.componentInstance.setPage(1, 20);
    fixture.componentInstance.setPage(2, 20);
    expect(requestIds).toEqual([1, 2]);
    expect(fixture.componentInstance.isLatestRequest(1)).toBe(false);
    expect(fixture.componentInstance.isLatestRequest(2)).toBe(true);
  });

  it('uses linear keyed membership for large client selections', () => {
    const rows = Array.from({ length: 2_000 }, (_, index) => ({
      id: index,
      name: `Product ${index}`,
      category: 'Load',
      price: index,
    }));
    let keyReads = 0;
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', []);
    fixture.componentRef.setInput('rowKey', (row: Product) => {
      keyReads += 1;
      return row.id;
    });
    fixture.detectChanges();
    fixture.componentInstance.selection.set(rows);
    keyReads = 0;

    expect(rows.every((row) => fixture.componentInstance.isSelected(row))).toBe(
      true,
    );
    expect(keyReads).toBeLessThanOrEqual(rows.length * 3);
  });

  it('renders configurable loading skeleton rows with headless hooks', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('loadingMode', 'skeleton');
    fixture.componentRef.setInput('loadingRows', 3);
    fixture.componentRef.setInput('unstyled', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.neural-table-skeleton-row-root'),
    ).toHaveLength(3);
    expect(
      fixture.nativeElement.querySelector('.neural-table-skeleton-line-root'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.neural-table-skeleton-line-base'),
    ).toBeNull();

    fixture.componentRef.setInput('loadingRows', Number.POSITIVE_INFINITY);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.neural-table-skeleton-row-root'),
    ).toHaveLength(5);
  });

  it('restores and persists through an async custom adapter after render', async () => {
    const stored: NeuralTableState = {
      version: 1,
      pageIndex: 2,
      pageSize: 15,
      sort: [{ field: 'name', direction: 'asc' }],
      filters: [],
      globalFilter: null,
      columnOrder: ['name', 'category', 'price'],
      columnWidths: { name: 180 },
      hiddenColumnIds: [],
      selectionKeys: [2],
      expandedRowKeys: [],
      expandedRowGroupKeys: [],
    };
    const saves: NeuralTableState[] = [];
    let markRestored!: () => void;
    const restored = new Promise<void>((resolve) => {
      markRestored = resolve;
    });
    let markPageThreeSaved!: () => void;
    const pageThreeSaved = new Promise<void>((resolve) => {
      markPageThreeSaved = resolve;
    });
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.componentRef.setInput('stateKey', 'products');
    fixture.componentRef.setInput('stateStorage', 'none');
    fixture.componentRef.setInput('stateAdapter', {
      load: async () => serializeNeuralTableState(stored),
      save: async (_key: string, state: NeuralTableState) => {
        saves.push(state);
        if (state.pageIndex === 3) markPageThreeSaved();
      },
    });
    fixture.componentInstance.stateRestore.subscribe(() => markRestored());
    fixture.detectChanges();
    await restored;
    fixture.detectChanges();

    expect(fixture.componentInstance.pageIndex()).toBe(2);
    expect(fixture.componentInstance.selection()).toEqual([products[1]]);
    fixture.componentInstance.setPage(3, 15);
    fixture.detectChanges();
    await pageThreeSaved;
    expect(saves[saves.length - 1]?.pageIndex).toBe(3);
  });

  it('serializes adapter writes and clears after pending saves', async () => {
    let resolvePageOne!: () => void;
    let resolvePageThree!: () => void;
    let markPageOneStarted!: () => void;
    let markPageThreeStarted!: () => void;
    let markPageTwoSaved!: () => void;
    const pageOne = new Promise<void>((resolve) => {
      resolvePageOne = resolve;
    });
    const pageThree = new Promise<void>((resolve) => {
      resolvePageThree = resolve;
    });
    const pageOneStarted = new Promise<void>((resolve) => {
      markPageOneStarted = resolve;
    });
    const pageThreeStarted = new Promise<void>((resolve) => {
      markPageThreeStarted = resolve;
    });
    const pageTwoSaved = new Promise<void>((resolve) => {
      markPageTwoSaved = resolve;
    });
    const operations: string[] = [];
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('stateKey', 'ordered-writes');
    fixture.componentRef.setInput('stateStorage', 'none');
    fixture.componentRef.setInput('stateAdapter', {
      load: () => null,
      save: async (_key: string, state: NeuralTableState) => {
        if (state.pageIndex === 1) {
          markPageOneStarted();
          await pageOne;
        }
        if (state.pageIndex === 3) {
          markPageThreeStarted();
          await pageThree;
        }
        operations.push(`save:${state.pageIndex}`);
        if (state.pageIndex === 2) markPageTwoSaved();
      },
      remove: () => {
        operations.push('remove');
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.setPage(1);
    fixture.detectChanges();
    await pageOneStarted;
    fixture.componentInstance.setPage(2);
    fixture.detectChanges();
    await Promise.resolve();
    expect(operations).not.toContain('save:2');

    resolvePageOne();
    await pageTwoSaved;
    expect(operations.slice(-2)).toEqual(['save:1', 'save:2']);

    fixture.componentInstance.setPage(3);
    fixture.detectChanges();
    await pageThreeStarted;
    const clear = fixture.componentInstance.clearStoredState();
    await Promise.resolve();
    expect(operations[operations.length - 1]).not.toBe('remove');

    resolvePageThree();
    await clear;
    expect(operations.slice(-2)).toEqual(['save:3', 'remove']);

    fixture.componentInstance.setPage(4);
    const sameTurnClear = fixture.componentInstance.clearStoredState();
    fixture.detectChanges();
    await sameTurnClear;
    await Promise.resolve();
    expect(operations).not.toContain('save:4');
    expect(operations[operations.length - 1]).toBe('remove');
  });

  it('ignores a late adapter load after the table is destroyed', async () => {
    let resolveLoad!: (state: NeuralTableState) => void;
    let markLoadStarted!: () => void;
    const loadStarted = new Promise<void>((resolve) => {
      markLoadStarted = resolve;
    });
    const load = new Promise<NeuralTableState>((resolve) => {
      resolveLoad = resolve;
    });
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('stateKey', 'late-load');
    fixture.componentRef.setInput('stateStorage', 'none');
    fixture.componentRef.setInput('stateAdapter', {
      load: () => {
        markLoadStarted();
        return load;
      },
      save: () => undefined,
    });
    let restores = 0;
    fixture.componentInstance.stateRestore.subscribe(() => {
      restores += 1;
    });
    fixture.detectChanges();
    await loadStarted;
    fixture.destroy();

    resolveLoad({
      version: 1,
      pageIndex: 9,
      pageSize: 10,
      sort: [],
      filters: [],
      globalFilter: null,
      columnOrder: [],
      columnWidths: {},
      hiddenColumnIds: [],
      selectionKeys: [],
      expandedRowKeys: [],
      expandedRowGroupKeys: [],
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(restores).toBe(0);
  });

  it('locks edit identity during async validation and releases on destroy', async () => {
    let resolveValidation!: (value: boolean) => void;
    const validation = new Promise<boolean>((resolve) => {
      resolveValidation = resolve;
    });
    const fixture = TestBed.createComponent(EditingTableHost);
    fixture.componentInstance.validatorOverride.set(() => validation);
    fixture.detectChanges();
    const table = fixture.componentInstance.table();
    const editableColumns = fixture.componentInstance.editColumns;

    table.startCellEdit(products[0], 0, editableColumns[0]);
    const save = table.saveEdit();
    table.startCellEdit(products[1], 1, editableColumns[0]);
    expect(fixture.componentInstance.cellStarts).toHaveLength(1);
    expect(table.isCellEditing(editableColumns[0], products[0], 0)).toBe(true);

    fixture.destroy();
    await expect(save).resolves.toBe(false);
    resolveValidation(true);
  });

  it('renders expandable subheader groups and typed aggregate footers', () => {
    const fixture = TestBed.createComponent(GroupedTableHost);
    fixture.detectChanges();

    const groups = fixture.nativeElement.querySelectorAll(
      '.neural-table-group-header-row-root',
    );
    expect(groups).toHaveLength(2);
    expect(groups[0].textContent).toContain('Office (2)');
    expect(
      fixture.nativeElement.querySelectorAll('.group-total')[0].textContent,
    ).toContain('500');

    (
      fixture.nativeElement.querySelector('.group-toggle') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toEqual(['Home']);
    expect(
      fixture.nativeElement.querySelectorAll('tbody tr[hidden]'),
    ).toHaveLength(2);
  });

  it('uses native rowspan for a matching nested grouping column', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('groupRowsBy', 'category');
    fixture.componentRef.setInput('rowGroupMode', 'rowspan');
    fixture.detectChanges();

    const categoryCells = fixture.nativeElement.querySelectorAll(
      'tbody td[data-neural-column="category"]',
    );
    expect(categoryCells).toHaveLength(2);
    expect(categoryCells[0].getAttribute('rowspan')).toBe('2');
  });

  it('renders a native table, caption, column headers, and typed cell slot', async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
    expect(table.querySelector('caption')?.textContent).toContain('Products');
    expect(
      table.querySelectorAll('thead tr:first-child th[scope="col"]'),
    ).toHaveLength(5);
    expect(table.querySelector('.price-template')?.textContent).toContain(
      '320 USD',
    );
  });

  it('cycles sorting and synchronizes aria-sort with the rendered rows', async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const sortButton = fixture.nativeElement.querySelector(
      'button[aria-label*="Name"]',
    ) as HTMLButtonElement;
    const sortIcon = sortButton.querySelector(
      '[data-neural-sort-direction]',
    ) as HTMLElement;
    expect(sortIcon.dataset['neuralSortDirection']).toBe('none');
    expect(sortIcon.classList).toContain('nt-arrows-sort');

    sortButton.click();
    fixture.detectChanges();
    expect(sortIcon.dataset['neuralSortDirection']).toBe('asc');
    expect(sortIcon.classList).toContain('nt-sort-ascending');
    expect(sortButton.closest('th')?.getAttribute('aria-sort')).toBe(
      'ascending',
    );
    expect(
      fixture.nativeElement.querySelector(
        'tbody tr td[data-neural-column="name"]',
      )?.textContent,
    ).toContain('Angular Chair');

    sortButton.click();
    fixture.detectChanges();
    expect(sortIcon.dataset['neuralSortDirection']).toBe('desc');
    expect(sortIcon.classList).toContain('nt-sort-descending');
    expect(sortButton.closest('th')?.getAttribute('aria-sort')).toBe(
      'descending',
    );
  });

  it('composes NeuralCheckbox controls and supports select all', async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const controls = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(
      fixture.nativeElement.querySelectorAll('neural-checkbox'),
    ).toHaveLength(4);
    controls[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      1,
    ]);

    controls[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selection()).toHaveLength(3);
  });

  it('selects rows by click with Ctrl/Meta and Shift while skipping disabled rows', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', selectionProducts);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput(
      'selectableRow',
      (row: Product) => row.id !== 3,
    );
    fixture.detectChanges();

    const rows = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          'tbody tr[data-neural-row-index]',
        ),
      ) as HTMLTableRowElement[];
    rows()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      1,
    ]);

    rows()[1].dispatchEvent(
      new MouseEvent('click', { bubbles: true, ctrlKey: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      1, 2,
    ]);

    rows()[4].dispatchEvent(
      new MouseEvent('click', { bubbles: true, shiftKey: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      2, 4, 5,
    ]);
    expect(rows()[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('renders radio controls for single selection and keeps one row selected', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('selectionControl', 'radio');
    fixture.detectChanges();

    const controls = fixture.nativeElement.querySelectorAll(
      'tbody input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(controls).toHaveLength(3);
    expect(
      fixture.nativeElement.querySelectorAll('tbody neural-radio-group'),
    ).toHaveLength(3);
    controls[0].click();
    controls[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      2,
    ]);
  });

  it('moves roving row focus with the keyboard and skips disabled rows', async () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput(
      'selectableRow',
      (row: Product) => row.id !== 2,
    );
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      'tbody tr[data-neural-row-index]',
    ) as NodeListOf<HTMLTableRowElement>;
    expect(rows[0].tabIndex).toBe(0);
    expect(rows[1].hasAttribute('tabindex')).toBe(false);
    rows[0].focus();
    rows[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(document.activeElement).toBe(rows[2]);
    rows[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      3,
    ]);
  });

  it('applies page, filtered, and all select-all scopes', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', selectionProducts);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput('paginate', true);
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();

    fixture.componentInstance.toggleAll(new Event('change'));
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      1, 2,
    ]);

    fixture.componentInstance.selection.set([]);
    fixture.componentRef.setInput('selectAllMode', 'filtered');
    fixture.componentInstance.filters.set([
      { field: 'category', value: 'Office', matchMode: 'equals' },
    ]);
    fixture.detectChanges();
    fixture.componentInstance.toggleAll(new Event('change'));
    expect(fixture.componentInstance.selection().map((row) => row.id)).toEqual([
      1, 3,
    ]);

    fixture.componentInstance.selection.set([]);
    fixture.componentInstance.filters.set([]);
    fixture.componentRef.setInput('selectAllMode', 'all');
    fixture.detectChanges();
    fixture.componentInstance.toggleAll(new Event('change'));
    expect(fixture.componentInstance.selection()).toHaveLength(5);
  });

  it('keeps remote selection key-only and supports server supplied select-all keys', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('rowKey', 'id');
    fixture.componentRef.setInput('dataMode', 'remote');
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput('selectAllMode', 'all');
    fixture.componentRef.setInput('selectAllKeys', [1, 2, 3, 4, 5]);
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector(
      'tbody tr[data-neural-row-index="0"]',
    ) as HTMLTableRowElement;
    firstRow.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selection()).toEqual([]);
    expect(fixture.componentInstance.selectionKeys()).toEqual([1]);

    fixture.componentInstance.toggleAll(new Event('change'));
    expect(fixture.componentInstance.selection()).toEqual([]);
    expect(fixture.componentInstance.selectionKeys()).toEqual([1, 2, 3, 4, 5]);
  });

  it('renders custom empty state and preserves structural hooks in unstyled mode', async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.componentInstance.rows.set([]);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.custom-empty')).toBeTruthy();
    const cell = fixture.nativeElement.querySelector(
      '.neural-table-header-cell-root',
    );
    expect(cell.classList).not.toContain('neural-table-header-cell-base');
    expect(
      fixture.nativeElement.querySelector('.neural-table-scroll-root')
        .classList,
    ).not.toContain('neural-table-scroll-base');
    const filterControl = fixture.nativeElement.querySelector(
      '.neural-table-filter-control-root',
    );
    expect(filterControl).toBeTruthy();
    expect(filterControl.classList).not.toContain(
      'neural-table-filter-control-base',
    );
  });

  it('keeps sticky positioning structural but removes its visual surface when unstyled', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', [
      { ...columns[0], sticky: 'start' },
    ]);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('unstyled', true);
    fixture.detectChanges();

    const stickyCell = fixture.nativeElement.querySelector(
      'td.neural-table-sticky-root',
    );
    expect(stickyCell).toBeTruthy();
    expect(stickyCell.classList).toContain('neural-table-sticky-start-root');
    expect(stickyCell.classList).not.toContain('neural-table-sticky-base');
    expect(stickyCell.classList).not.toContain(
      'neural-table-sticky-start-base',
    );
  });

  it('filters through Neural controls and clears the model imperatively', async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const nameFilter = fixture.nativeElement.querySelector(
      'input[aria-label="Filter Name"]',
    ) as HTMLInputElement;
    expect(nameFilter.classList).toContain('neural-input-root');
    expect(fixture.nativeElement.querySelector('neural-select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    nameFilter.value = 'angular';
    nameFilter.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll(
          'tbody td[data-neural-column="name"]',
        ),
      ).map((cell) => (cell as HTMLElement).textContent?.trim()),
    ).toEqual(['Angular Chair']);
    expect(fixture.componentInstance.filters()).toEqual([
      { field: 'name', value: 'angular', matchMode: 'contains' },
    ]);

    const table = fixture.debugElement.children[0]
      .componentInstance as TableComponent<Product>;
    table.clearFilters();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll(
        'tbody td[data-neural-column="name"]',
      ),
    ).toHaveLength(3);
    expect(fixture.componentInstance.filters()).toEqual([]);
  });

  it('applies inclusive between filters', () => {
    const result = filterNeuralTableRows(
      products,
      columns,
      [{ field: 'price', value: [80, 180], matchMode: 'between' }],
      null,
    );
    expect(result.map((row) => row.id)).toEqual([2, 3]);
  });

  it('resizes columns from the keyboard and balances fit mode widths', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentInstance.columnWidths.set({
      name: 160,
      category: 140,
      price: 120,
    });
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector(
      '[data-neural-resize-column="name"]',
    ) as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.columnWidths()['name']).toBe(168);
    expect(fixture.componentInstance.columnWidths()['category']).toBe(132);
  });

  it('keeps unrelated controlled column widths unchanged in expand mode', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('resizableColumns', true);
    fixture.componentRef.setInput('columnResizeMode', 'expand');
    fixture.componentInstance.columnWidths.set({
      name: 160,
      category: 140,
      price: 120,
    });
    fixture.detectChanges();

    const categoryHeader = fixture.nativeElement.querySelector(
      'th[data-neural-column="category"]',
    ) as HTMLTableCellElement;
    categoryHeader.getBoundingClientRect = () => ({ width: 220 }) as DOMRect;

    const priceHandle = fixture.nativeElement.querySelector(
      '[data-neural-resize-column="price"]',
    ) as HTMLElement;
    priceHandle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.columnWidths()).toEqual({
      name: 160,
      category: 140,
      price: 112,
    });
  });

  it('reorders columns from the keyboard without mutating definitions', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.detectChanges();

    const originalIds = columns.map((column) => column.id);
    const handle = fixture.nativeElement.querySelector(
      '[data-neural-reorder-column="name"]',
    ) as HTMLButtonElement;
    handle.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.columnOrder()).toEqual([
      'category',
      'name',
      'price',
    ]);
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll(
          'thead th[scope="col"][data-neural-column]',
        ),
      ).map((cell) => (cell as HTMLElement).dataset['neuralColumn']),
    ).toEqual(['category', 'name', 'price']);
    expect(columns.map((column) => column.id)).toEqual(originalIds);
  });

  it('keeps keyboard reordering inside the same sticky region', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', [
      { ...columns[0], sticky: 'start' },
      columns[1],
      columns[2],
    ]);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.detectChanges();

    const handle = fixture.nativeElement.querySelector(
      '[data-neural-reorder-column="name"]',
    ) as HTMLButtonElement;
    handle.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.columnOrder()).toEqual([]);
  });

  it('renders grouped headers and updates colspan when a column is hidden', () => {
    const fixture = TestBed.createComponent(AdvancedTableHost);
    fixture.detectChanges();

    const identity = fixture.nativeElement.querySelector(
      'th[data-neural-header-group="identity"]',
    ) as HTMLTableCellElement;
    expect(identity.colSpan).toBe(2);
    expect(identity.querySelector('.identity-group')?.textContent).toContain(
      'Identity',
    );
    expect(
      fixture.nativeElement.querySelector('.price-summary')?.textContent,
    ).toContain('3 products');
    expect(fixture.nativeElement.querySelector('tfoot')).toBeTruthy();

    fixture.componentInstance.hiddenColumnIds.set(['category']);
    fixture.detectChanges();

    expect(
      (
        fixture.nativeElement.querySelector(
          'th[data-neural-header-group="identity"]',
        ) as HTMLTableCellElement
      ).colSpan,
    ).toBe(1);
  });

  it('keeps reorder, group, and footer hooks structural in unstyled mode', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput(
      'columns',
      columns.map((column) => ({
        ...column,
        footer: column.id === 'name' ? 'Summary' : undefined,
      })),
    );
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('reorderableColumns', true);
    fixture.componentRef.setInput('headerGroups', [
      { id: 'all', header: 'All columns', children: columns.map((c) => c.id) },
    ]);
    fixture.componentRef.setInput('unstyled', true);
    fixture.detectChanges();

    const reorderHandle = fixture.nativeElement.querySelector(
      '.neural-table-reorder-handle-root',
    );
    const groupCell = fixture.nativeElement.querySelector(
      '.neural-table-header-group-cell-root',
    );
    const footerCell = fixture.nativeElement.querySelector(
      '.neural-table-footer-cell-root',
    );
    expect(reorderHandle.classList).not.toContain(
      'neural-table-reorder-handle-base',
    );
    expect(groupCell.classList).not.toContain(
      'neural-table-header-group-cell-base',
    );
    expect(footerCell.classList).not.toContain('neural-table-footer-cell-base');
  });

  it('hides columns without mutating definitions and applies scroll height', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('value', products);
    fixture.componentRef.setInput('scrollHeight', '18rem');
    fixture.detectChanges();

    fixture.componentInstance.setColumnVisibility('category', false);
    fixture.detectChanges();

    expect(columns.find((column) => column.id === 'category')?.hidden).toBe(
      undefined,
    );
    expect(
      fixture.nativeElement.querySelector(
        'thead tr:first-child th[data-neural-column="category"]',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-table-scroll-root').style
        .maxHeight,
    ).toBe('18rem');
  });

  it('prioritizes localized loading and error states', () => {
    const fixture = TestBed.createComponent(TableComponent<Product>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', 'Network unavailable');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading data');

    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Network unavailable');
  });

  it('edits a cell with an immutable draft and completes with Enter', async () => {
    const fixture = TestBed.createComponent(EditingTableHost);
    fixture.detectChanges();

    const nameCell = fixture.nativeElement.querySelector(
      'tbody tr:first-child td[data-neural-column="name"]',
    ) as HTMLTableCellElement;
    nameCell.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cellStarts).toHaveLength(1);
    const editor = fixture.nativeElement.querySelector(
      '.name-editor',
    ) as HTMLInputElement;
    editor.value = 'Neural Workstation';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.cellCompletes).toHaveLength(1);
    expect(fixture.componentInstance.cellCompletes[0].draftRow.name).toBe(
      'Neural Workstation',
    );
    expect(products[0].name).toBe('Neural Desk');
    expect(fixture.nativeElement.querySelector('.name-editor')).toBeNull();
  });

  it('cancels a cell edit with Escape and marks read-only cells', () => {
    const fixture = TestBed.createComponent(EditingTableHost);
    fixture.detectChanges();

    const categoryCell = fixture.nativeElement.querySelector(
      'tbody tr:first-child td[data-neural-column="category"]',
    ) as HTMLTableCellElement;
    expect(categoryCell.dataset['neuralReadonly']).toBe('true');
    expect(categoryCell.tabIndex).toBe(-1);

    const nameCell = fixture.nativeElement.querySelector(
      'tbody tr:first-child td[data-neural-column="name"]',
    ) as HTMLTableCellElement;
    nameCell.click();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector(
      '.name-editor',
    ) as HTMLInputElement;
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.cellCancels).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.name-editor')).toBeNull();
  });

  it('keeps an invalid async cell draft open with an accessible error', async () => {
    const fixture = TestBed.createComponent(EditingTableHost);
    fixture.componentInstance.validation.set('Name is already in use.');
    fixture.detectChanges();

    const nameCell = fixture.nativeElement.querySelector(
      'tbody tr:first-child td[data-neural-column="name"]',
    ) as HTMLTableCellElement;
    nameCell.click();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector(
      '.name-editor',
    ) as HTMLInputElement;
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.cellCompletes).toHaveLength(0);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain('Name is already in use.');
    expect(fixture.nativeElement.querySelector('.name-editor')).toBeTruthy();
  });

  it('saves and cancels row drafts through the public row edit API', async () => {
    const fixture = TestBed.createComponent(EditingTableHost);
    fixture.componentInstance.mode.set('row');
    fixture.detectChanges();

    fixture.componentInstance.table().startRowEdit(products[0], 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.rowStarts).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelectorAll('tbody tr:first-child input')
        .length,
    ).toBe(2);

    const editor = fixture.nativeElement.querySelector(
      '.price-editor',
    ) as HTMLInputElement;
    editor.value = '410';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.componentInstance.table().saveEdit();
    fixture.detectChanges();

    expect(fixture.componentInstance.rowSaves).toHaveLength(1);
    expect(fixture.componentInstance.rowSaves[0].draftRow.price).toBe(410);
    expect(products[0].price).toBe(320);

    fixture.componentInstance.table().startRowEdit(products[1], 1);
    fixture.componentInstance.table().cancelEdit();
    expect(fixture.componentInstance.rowCancels).toHaveLength(1);
  });

  it('saves with Tab, skips locked cells, and keeps editor hooks headless', async () => {
    const fixture = TestBed.createComponent(EditingTableHost);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();

    const disabledPrice = fixture.nativeElement.querySelector(
      'tbody tr:nth-child(3) td[data-neural-column="price"]',
    ) as HTMLTableCellElement;
    expect(disabledPrice.getAttribute('aria-disabled')).toBe('true');
    expect(disabledPrice.dataset['neuralEditable']).toBeUndefined();

    const nameCell = fixture.nativeElement.querySelector(
      'tbody tr:first-child td[data-neural-column="name"]',
    ) as HTMLTableCellElement;
    nameCell.click();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector(
      '.name-editor',
    ) as HTMLInputElement;
    expect(
      fixture.nativeElement.querySelector('.neural-table-editor-root'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.neural-table-editor-base'),
    ).toBeNull();

    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.cellCompletes).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector(
        'tbody tr:first-child td[data-neural-column="price"]',
      ),
    ).toBe(document.activeElement);
  });
});
