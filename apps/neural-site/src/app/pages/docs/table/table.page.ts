import { SiteOnThisPage } from '../../../shared/on-this-page';
import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  ViewportScroller,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Pipe,
  type PipeTransform,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralCheckbox } from '@neural-ng/core/checkbox';
import { NeuralInput } from '@neural-ng/core/input';
import { NeuralInputNumber } from '@neural-ng/core/input-number';
import { NeuralPaginator } from '@neural-ng/core/paginator';
import { NeuralSelect } from '@neural-ng/core/select';
import {
  NeuralTable,
  NeuralTableCellDirective,
  NeuralTableEmptyDirective,
  NeuralTableEditorDirective,
  NeuralTableErrorDirective,
  NeuralTableExpansionDirective,
  NeuralTableFooterDirective,
  NeuralTableGroupFooterDirective,
  NeuralTableLoadingDirective,
  type NeuralTableClasses,
  type NeuralTableColumn,
  type NeuralTableColumnOrder,
  type NeuralTableColumnResizeMode,
  type NeuralTableColumnWidths,
  type NeuralTableFilter,
  type NeuralTableHeaderGroup,
  type NeuralTableRowEditEvent,
  type NeuralTableRowKey,
  type NeuralTableSelectionChange,
  type NeuralTableStateChange,
} from '@neural-ng/core/table';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type TableDocView = 'component' | 'accessibility' | 'api' | 'tokens';

interface Product {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly price: number;
  readonly inventory: number;
  readonly featured: boolean;
  readonly status: 'In stock' | 'Low stock' | 'Out of stock';
  readonly releasedAt: string;
  readonly description: string;
}

@Pipe({ name: 'availabilityLabel', standalone: true })
class AvailabilityLabelPipe implements PipeTransform {
  transform(value: Product['status']): string {
    if (value === 'In stock') return 'Available now';
    if (value === 'Low stock') return 'Limited availability';
    return 'Unavailable';
  }
}

@Component({
  selector: 'app-table-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    AvailabilityLabelPipe,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NeuralButton,
    NeuralCheckbox,
    NeuralInput,
    NeuralInputNumber,
    NeuralPaginator,
    NeuralSelect,
    NeuralTable,
    NeuralTableCellDirective,
    NeuralTableEmptyDirective,
    NeuralTableEditorDirective,
    NeuralTableErrorDirective,
    NeuralTableExpansionDirective,
    NeuralTableFooterDirective,
    NeuralTableGroupFooterDirective,
    NeuralTableLoadingDirective,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './table.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<TableDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly products: readonly Product[] = [
    {
      id: 1001,
      code: 'NN-1001',
      name: 'Signal Desk',
      category: 'Office',
      price: 899,
      inventory: 24,
      featured: true,
      status: 'In stock',
      releasedAt: '2026-08-04T09:30:00.000Z',
      description: 'A modular desk for focused agent workflows.',
    },
    {
      id: 1002,
      code: 'NN-1002',
      name: 'Hydration Lamp',
      category: 'Lighting',
      price: 129,
      inventory: 7,
      featured: false,
      status: 'Low stock',
      releasedAt: '2026-07-21T12:15:00.000Z',
      description: 'Adaptive workspace light with a compact profile.',
    },
    {
      id: 1003,
      code: 'NN-1003',
      name: 'Standalone Chair',
      category: 'Office',
      price: 549,
      inventory: 0,
      featured: true,
      status: 'Out of stock',
      releasedAt: '2026-06-12T08:00:00.000Z',
      description: 'Ergonomic seating with independent lumbar support.',
    },
    {
      id: 1004,
      code: 'NN-1004',
      name: 'Neural Speaker',
      category: 'Audio',
      price: 249,
      inventory: 18,
      featured: false,
      status: 'In stock',
      releasedAt: '2026-05-30T16:45:00.000Z',
      description: 'Near-field audio for calls and concentration.',
    },
    {
      id: 1005,
      code: 'NN-1005',
      name: 'Token Shelf',
      category: 'Storage',
      price: 319,
      inventory: 4,
      featured: true,
      status: 'Low stock',
      releasedAt: '2026-04-18T10:20:00.000Z',
      description: 'Configurable storage for evolving workspaces.',
    },
    {
      id: 1006,
      code: 'NN-1006',
      name: 'Headless Clock',
      category: 'Accessories',
      price: 89,
      inventory: 31,
      featured: false,
      status: 'In stock',
      releasedAt: '2026-03-03T14:10:00.000Z',
      description: 'A minimal time surface with no visual lock-in.',
    },
  ];
  readonly columns: readonly NeuralTableColumn<Product>[] = [
    {
      id: 'code',
      header: 'Code',
      field: 'code',
      sortable: true,
      filterable: true,
      width: '8rem',
    },
    {
      id: 'name',
      header: 'Product',
      field: 'name',
      sortable: true,
      filterable: true,
      editable: true,
      minWidth: '11rem',
    },
    {
      id: 'category',
      header: 'Category',
      field: 'category',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Office', value: 'Office' },
        { label: 'Lighting', value: 'Lighting' },
        { label: 'Audio', value: 'Audio' },
        { label: 'Storage', value: 'Storage' },
        { label: 'Accessories', value: 'Accessories' },
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
      align: 'end',
      formatter: (value) => `$${Number(value).toLocaleString('en-US')}`,
    },
    {
      id: 'inventory',
      header: 'Stock',
      field: 'inventory',
      sortable: true,
      align: 'end',
    },
    {
      id: 'status',
      header: 'Status',
      field: 'status',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'In stock', value: 'In stock' },
        { label: 'Low stock', value: 'Low stock' },
        { label: 'Out of stock', value: 'Out of stock' },
      ],
    },
  ];
  readonly compactColumns = this.columns.slice(0, 4);
  readonly editColumns: readonly NeuralTableColumn<Product>[] = [
    this.columns[0],
    { ...this.columns[1], editable: true },
    { ...this.columns[2], editable: true },
    { ...this.columns[3], editable: true },
    {
      id: 'featured',
      header: 'Featured',
      field: 'featured',
      editable: true,
      formatter: (value) => (value ? 'Yes' : 'No'),
    },
    { id: 'actions', header: 'Actions', width: '7rem', align: 'center' },
  ];
  readonly categoryOptions = [
    { label: 'Office', value: 'Office' },
    { label: 'Lighting', value: 'Lighting' },
    { label: 'Audio', value: 'Audio' },
    { label: 'Storage', value: 'Storage' },
    { label: 'Accessories', value: 'Accessories' },
  ] as const;
  readonly headerGroups: readonly NeuralTableHeaderGroup[] = [
    {
      id: 'identity',
      header: 'Product information',
      children: ['code', 'name', 'category'],
    },
    {
      id: 'commercial',
      header: 'Operations',
      children: ['price', 'inventory', 'status'],
    },
  ];
  readonly selection = signal<readonly Product[]>([]);
  readonly selectionKeys = signal<readonly NeuralTableRowKey[]>([]);
  readonly singleSelection = signal<readonly Product[]>([]);
  readonly singleSelectionKeys = signal<readonly NeuralTableRowKey[]>([]);
  readonly filters = signal<readonly NeuralTableFilter[]>([]);
  readonly globalFilter = signal('');
  readonly expandedRowKeys = signal<readonly NeuralTableRowKey[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(3);
  readonly remotePageIndex = signal(0);
  readonly remotePageSize = signal(3);
  readonly editableProducts = signal<readonly Product[]>(
    this.products.map((product) => ({ ...product })),
  );
  readonly editStatus = signal('No edit interaction yet.');
  readonly hiddenColumnIds = signal<readonly string[]>([]);
  readonly columnWidths = signal<NeuralTableColumnWidths>({});
  readonly columnOrder = signal<NeuralTableColumnOrder>(
    this.columns.map((column) => column.id),
  );
  readonly resizeMode = signal<NeuralTableColumnResizeMode>('expand');
  readonly resizeModeOptions = [
    { label: 'Fit adjacent column', value: 'fit' },
    { label: 'Expand table width', value: 'expand' },
  ] as const;
  readonly singleSelectionLabel = computed(
    () => this.singleSelection()[0]?.name || 'No active product',
  );
  readonly expandedGroups = signal<readonly NeuralTableRowKey[]>([
    'Office',
    'Lighting',
    'Audio',
    'Storage',
    'Accessories',
  ]);
  readonly eventStatus = signal('No table interaction yet.');
  readonly remoteStatus = signal('No remote request yet.');
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralTableClasses = {
    root: 'overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 text-slate-100',
    scroll: 'overflow-auto',
    table: 'w-full border-collapse text-left text-sm',
    header: 'bg-cyan-950/60 text-cyan-200',
    headerCell: 'border-b border-cyan-500/40 px-4 py-3 font-bold',
    row: 'border-b border-slate-800 last:border-0',
    cell: 'px-4 py-3',
    body: 'divide-y divide-slate-800',
  };
  readonly pageLinks: Record<
    TableDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic table', 'basic'],
      ['Column model', 'column-model'],
      ['Formatting and pipes', 'formatting'],
      ['Interactive data', 'interactive'],
      ['Visual variants', 'variants'],
      ['Pagination', 'pagination'],
      ['Selection', 'selection'],
      ['Expansion', 'expansion'],
      ['Editing', 'editing'],
      ['Layout', 'layout'],
      ['Grouped headers', 'headers'],
      ['Summaries', 'summaries'],
      ['Row grouping', 'grouping'],
      ['Remote and state', 'remote'],
      ['Loading states', 'states'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native semantics', 'native'],
      ['Sorting and filters', 'sorting-a11y'],
      ['Selection keyboard', 'selection-a11y'],
      ['Editing keyboard', 'editing-a11y'],
      ['Live state', 'live-state'],
      ['SSR', 'ssr'],
    ],
    api: [
      ['Inputs and models', 'inputs'],
      ['Outputs', 'outputs'],
      ['Templates', 'templates'],
      ['Methods', 'methods'],
      ['Column contract', 'columns'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Utilities', 'utilities'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Surfaces', 'surface-tokens'],
      ['Interaction', 'interaction-tokens'],
      ['Layout and editing', 'layout-tokens'],
    ],
  };
  readonly importCode = `import { Component } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralCheckbox } from '@neural-ng/core/checkbox';
import { NeuralInput } from '@neural-ng/core/input';
import { NeuralInputNumber } from '@neural-ng/core/input-number';
import { NeuralPaginator } from '@neural-ng/core/paginator';
import { NeuralSelect } from '@neural-ng/core/select';
import {
  NeuralTable,
  NeuralTableCellDirective,
  NeuralTableEditorDirective,
  NeuralTableFilterDirective,
  NeuralTableExpansionDirective,
  NeuralTableFooterDirective,
  NeuralTableGroupFooterDirective,
  NeuralTableGroupHeaderDirective,
  NeuralTableHeaderDirective,
  NeuralTableHeaderGroupDirective,
  NeuralTableLoadingDirective,
  type NeuralTableColumn,
} from '@neural-ng/core/table';

@Component({
  imports: [
    NeuralButton,
    NeuralCheckbox,
    NeuralInput,
    NeuralInputNumber,
    NeuralPaginator,
    NeuralSelect,
    NeuralTable,
    NeuralTableCellDirective,
    NeuralTableEditorDirective,
    NeuralTableFilterDirective,
    NeuralTableExpansionDirective,
    NeuralTableFooterDirective,
    NeuralTableGroupFooterDirective,
    NeuralTableGroupHeaderDirective,
    NeuralTableHeaderDirective,
    NeuralTableHeaderGroupDirective,
    NeuralTableLoadingDirective,
  ],
})
export class InventoryPage {}`;
  readonly basicCode = `<neural-table
  [value]="products"
  [columns]="columns"
  ariaLabel="Products"
/>`;
  readonly columnCode = `interface Product {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly price: number;
}

readonly columns: readonly NeuralTableColumn<Product>[] = [
  { id: 'code', header: 'Code', field: 'code' },
  { id: 'name', header: 'Product', field: 'name' },
  { id: 'category', header: 'Category', field: 'category' },
  {
    id: 'price',
    header: 'Price',
    field: 'price',
    align: 'end',
    formatter: (value) => \`$\${Number(value).toLocaleString('en-US')}\`,
  },
];`;
  readonly formattingColumns: readonly NeuralTableColumn<Product>[] = [
    { id: 'name', header: 'Product', field: 'name', sortable: true },
    { id: 'price', header: 'Price', field: 'price', sortable: true },
    {
      id: 'inventory',
      header: 'Inventory',
      field: 'inventory',
      sortable: true,
    },
    {
      id: 'releasedAt',
      header: 'Released',
      field: 'releasedAt',
      sortable: true,
    },
    { id: 'status', header: 'Availability', field: 'status', sortable: true },
  ];
  readonly formattingPipeCode = `import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, Pipe, type PipeTransform } from '@angular/core';
import { NeuralTable, NeuralTableCellDirective } from '@neural-ng/core/table';

@Pipe({ name: 'availabilityLabel', standalone: true })
export class AvailabilityLabelPipe implements PipeTransform {
  transform(value: Product['status']): string {
    if (value === 'In stock') return 'Available now';
    if (value === 'Low stock') return 'Limited availability';
    return 'Unavailable';
  }
}

@Component({
  imports: [
    NeuralTable,
    NeuralTableCellDirective,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    AvailabilityLabelPipe,
  ],
})
export class InventoryPage {}`;
  readonly formattingCode = `<neural-table
  [value]="products"
  [columns]="formattingColumns"
  ariaLabel="Formatted product data"
>
  <ng-template neuralTableCell="price" let-row="row">
    {{ $any(row).price | currency: 'USD' : 'symbol' : '1.2-2' : 'en-US' }}
  </ng-template>

  <ng-template neuralTableCell="inventory" let-row="row">
    {{ $any(row).inventory | number: '1.0-0' }} units
  </ng-template>

  <ng-template neuralTableCell="releasedAt" let-row="row">
    {{ $any(row).releasedAt | date: 'mediumDate' : undefined : 'en-US' }}
  </ng-template>

  <ng-template neuralTableCell="status" let-row="row">
    {{ $any(row).status | availabilityLabel }}
  </ng-template>
</neural-table>`;
  readonly interactiveCode = `<input
  neuralInput
  type="search"
  placeholder="Search products"
  [value]="query()"
  (input)="query.set($any($event.target).value)"
/>

<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  [(filters)]="filters"
  [globalFilter]="query()"
  sortMode="multiple"
  [(expandedRowKeys)]="expandedRowKeys"
  striped
  hoverable
  stickyHeader
  scrollHeight="24rem"
  ariaLabel="Product inventory"
>
  <ng-template neuralTableCell="status" let-value>
    <span class="status-pill">{{ value }}</span>
  </ng-template>

  <ng-template neuralTableExpansion let-row>
    {{ $any(row).description }}
  </ng-template>
</neural-table>`;
  readonly variantsCode = `<neural-table
  [value]="products"
  [columns]="columns"
  density="compact"
  striped
  hoverable
  gridlines
/>

<neural-table
  [value]="products"
  [columns]="columns"
  density="spacious"
  [hoverable]="false"
/>`;
  readonly paginationCode = `<neural-table
  [value]="products"
  [columns]="columns"
  paginate
  [(pageIndex)]="pageIndex"
  [(pageSize)]="pageSize"
/>

<neural-paginator
  [totalItems]="products.length"
  [(pageIndex)]="pageIndex"
  [(pageSize)]="pageSize"
  [pageSizeOptions]="[3, 5, 10]"
/>`;
  readonly selectionCode = `<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  selectionMode="multiple"
  selectionControl="checkbox"
  selectAllMode="filtered"
  [selectableRow]="selectableProduct"
  [(selection)]="selectedProducts"
  [(selectionKeys)]="selectedKeys"
/>

<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  selectionMode="single"
  selectionControl="radio"
  [(selection)]="activeProduct"
/>`;
  readonly expansionCode = `<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  [(expandedRowKeys)]="expandedRowKeys"
>
  <ng-template neuralTableExpansion let-row>
    <strong>{{ $any(row).name }}</strong>
    <p>{{ $any(row).description }}</p>
  </ng-template>
</neural-table>`;
  readonly editingCode = `<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  editMode="cell"
>
  <ng-template
    neuralTableEditor="name"
    let-value
    let-setValue="setValue"
  >
    <input
      neuralInput
      [value]="value"
      (input)="setValue($any($event.target).value)"
    />
  </ng-template>
</neural-table>`;
  readonly rowEditingCode = `<neural-table
  #rowTable
  [value]="products"
  [columns]="editColumns"
  rowKey="id"
  editMode="row"
>
  <ng-template neuralTableEditor="name" let-value let-setValue="setValue">
    <input neuralInput [value]="value" (input)="setValue($any($event.target).value)" />
  </ng-template>
  <ng-template neuralTableEditor="category" let-value let-setValue="setValue">
    <neural-select appendTo="body" optionLabel="label" optionValue="value" [options]="categoryOptions" [value]="value" (valueChange)="setValue($event)" />
  </ng-template>
  <ng-template neuralTableEditor="price" let-value let-setValue="setValue">
    <neural-input-number mode="currency" currency="USD" [value]="value" (valueChange)="setValue($event)" />
  </ng-template>
  <ng-template neuralTableEditor="featured" let-value let-setValue="setValue">
    <neural-checkbox [checked]="value" (checkedChange)="setValue($event)" />
  </ng-template>
  <ng-template neuralTableCell="actions" let-row="row" let-rowIndex="rowIndex">
    @if (rowTable.isRowEditing(row, rowIndex)) {
      <neural-button icon="nt nt-check" ariaLabel="Save row" variant="text" (clicked)="rowTable.saveEdit($event)" />
      <neural-button icon="nt nt-x" ariaLabel="Cancel edit" variant="text" (clicked)="rowTable.cancelEdit($event)" />
    } @else {
      <neural-button icon="nt nt-edit" ariaLabel="Edit row" variant="text" (clicked)="rowTable.startRowEdit(row, rowIndex, $event)" />
    }
  </ng-template>
</neural-table>`;
  readonly layoutCode = `<div class="layout-toolbar">
  <neural-select
    ariaLabel="Column resize mode"
    [options]="resizeModeOptions"
    optionLabel="label"
    optionValue="value"
    [value]="resizeMode()"
    (valueChange)="setResizeMode($event)"
  />
  <neural-button label="Show all columns" variant="outlined" (clicked)="hiddenColumnIds.set([])" />
</div>

<div class="column-visibility">
  @for (column of columns; track column.id) {
    <neural-checkbox
      [checked]="!hiddenColumnIds().includes(column.id)"
      (checkedChange)="setColumnVisible(column.id, $event)"
    >{{ column.header }}</neural-checkbox>
  }
</div>

<neural-table
  [value]="products"
  [columns]="columns"
  [(hiddenColumnIds)]="hiddenColumnIds"
  [(columnWidths)]="columnWidths"
  [(columnOrder)]="columnOrder"
  scrollHeight="20rem"
  stickyHeader
  stickyFooter
  resizableColumns
  reorderableColumns
  [columnResizeMode]="resizeMode()"
  density="compact"
/>`;
  readonly summaryCode = `<neural-table [value]="products" [columns]="columns">
  <ng-template neuralTableFooter="price" let-rows="rows">
    {{ sumRows(rows, 'price') }}
  </ng-template>
  <ng-template neuralTableFooter="inventory" let-rows="rows">
    {{ sumRows(rows, 'inventory') }} units
  </ng-template>
</neural-table>`;
  readonly headerCode = `<neural-table
  [value]="products"
  [columns]="columns"
  [headerGroups]="headerGroups"
  gridlines
/>`;
  readonly groupCode = `<neural-table
  [value]="products"
  [columns]="columns"
  groupRowsBy="category"
  rowGroupMode="subheader"
  expandableRowGroups
  [(expandedRowGroupKeys)]="expandedGroups"
>
  <ng-template neuralTableGroupFooter let-rows="rows">
    {{ rows.length }} products
  </ng-template>
</neural-table>

<neural-table
  [value]="products"
  [columns]="columns"
  groupRowsBy="category"
  rowGroupMode="rowspan"
  gridlines
/>`;
  readonly remoteCode = `<neural-table
  dataMode="remote"
  [value]="currentPage"
  [totalItems]="totalItems"
  [columns]="columns"
  paginate
  [(sort)]="sort"
  [(filters)]="filters"
  [(pageIndex)]="pageIndex"
  [(pageSize)]="pageSize"
  (stateChange)="loadFromApi($event)"
/>

<neural-paginator
  [totalItems]="totalItems"
  [(pageIndex)]="pageIndex"
  [(pageSize)]="pageSize"
  [pageSizeOptions]="[10, 25, 50]"
/>`;
  readonly persistenceCode = `// Browser storage: restores after hydration.
<neural-table
  #table
  stateKey="inventory-table"
  stateStorage="session"
  [value]="products"
  [columns]="columns"
/>

// URL/router integration remains application-owned and JSON-safe.
const queryValue = table.serializeState();
table.restoreState(queryValue);

// Replace browser storage when enterprise persistence is required.
readonly stateAdapter: NeuralTableStateAdapter = {
  load: (key) => this.preferences.load(key),
  save: (key, state) => this.preferences.save(key, state),
  remove: (key) => this.preferences.remove(key),
};`;
  readonly stateCode = `<neural-table
  loading
  loadingMode="skeleton"
  [loadingRows]="5"
  [value]="products"
  [columns]="columns"
>
  <ng-template neuralTableLoading let-message="message">
    <tr><td colspan="6"><i class="nt nt-loader-3 nt-spin"></i> {{ message }}</td></tr>
  </ng-template>
  <ng-template neuralTableEmpty>
    <tr><td colspan="6">No products match this view.</td></tr>
  </ng-template>
  <ng-template neuralTableError let-message="message">
    <tr><td colspan="6">{{ message }}</td></tr>
  </ng-template>
</neural-table>`;
  readonly unstyledCode = `<neural-table\n  unstyled\n  [value]="products"\n  [columns]="columns"\n  [classes]="tableClasses"\n/>`;
  readonly inputs = [
    ['value', 'readonly T[]', '[]', 'Rows supplied to the table.'],
    [
      'columns',
      'readonly NeuralTableColumn<T>[]',
      'required',
      'Typed leaf-column definitions.',
    ],
    [
      'rowKey',
      'keyof T | path | callback | null',
      'null',
      'Stable identity for selection, expansion and remote state.',
    ],
    [
      'dataMode',
      "'client' | 'remote'",
      "'client'",
      'Controls whether data operations are local or emitted.',
    ],
    [
      'stateKey / stateStorage / stateAdapter',
      'persistence inputs',
      'null / local / null',
      'Selects built-in or custom state persistence.',
    ],
    [
      'groupRowsBy',
      'keyof T | path | callback | null',
      'null',
      'Groups rows by a nested value or accessor.',
    ],
    [
      'rowGroupMode',
      "'subheader' | 'rowspan'",
      "'subheader'",
      'Chooses grouped-row presentation.',
    ],
    [
      'expandableRowGroups',
      'boolean',
      'false',
      'Enables group disclosure controls.',
    ],
    [
      'expandedRowGroupKeys',
      'model<readonly RowKey[]>',
      '[]',
      'Controlled expanded group keys.',
    ],
    [
      'sortMode',
      "'single' | 'multiple'",
      "'single'",
      'Sort contract for sortable columns.',
    ],
    [
      'selectionMode',
      "'none' | 'single' | 'multiple'",
      "'none'",
      'Enables row selection.',
    ],
    [
      'selectionControl',
      "'auto' | 'checkbox' | 'radio'",
      "'auto'",
      'Visible selection control.',
    ],
    [
      'selectAllMode',
      "'page' | 'filtered' | 'all'",
      "'page'",
      'Scope of select-all.',
    ],
    [
      'selectOnRowClick',
      'boolean',
      'true',
      'Allows the row surface to select.',
    ],
    [
      'selectableRow',
      '(row, index) => boolean',
      '() => true',
      'Disables individual rows from selection.',
    ],
    [
      'selectAllKeys',
      'readonly RowKey[]',
      '[]',
      'Complete remote key scope for filtered/all selection.',
    ],
    [
      'sort / filters / globalFilter',
      'models',
      '[] / [] / null',
      'Controlled data-operation state.',
    ],
    [
      'selection / selectionKeys',
      'models',
      '[]',
      'Controlled row and key selection.',
    ],
    [
      'expandedRowKeys',
      'model<readonly RowKey[]>',
      '[]',
      'Controlled row expansion.',
    ],
    [
      'columnWidths / hiddenColumnIds / columnOrder',
      'models',
      '{} / [] / []',
      'Controlled column layout.',
    ],
    [
      'headerGroups / footerGroups',
      'readonly NeuralTableHeaderGroup[]',
      '[]',
      'Nested grouped header and footer definitions.',
    ],
    [
      'pageIndex / pageSize',
      'number models',
      '0 / 10',
      'Controlled paging state.',
    ],
    [
      'paginate / totalItems',
      'boolean / number | null',
      'false / null',
      'Client slicing and remote result count.',
    ],
    [
      'editMode / editValidator',
      'cell | row | null / callback',
      'null',
      'Editing mode and sync/async validation.',
    ],
    [
      'loading / loadingMode / loadingRows',
      'state inputs',
      "false / 'message' / 5",
      'Loading message or skeleton rows.',
    ],
    ['error', 'string | null', 'null', 'Error state message.'],
    ['disabled', 'boolean', 'false', 'Disables interactive table behavior.'],
    [
      'striped / hoverable / gridlines',
      'boolean',
      'false / true / false',
      'Visual row and grid variants.',
    ],
    [
      'stickyHeader / stickyFooter',
      'boolean',
      'false',
      'Pins table edge sections in a scroll surface.',
    ],
    [
      'scrollHeight',
      'string',
      "''",
      'Constrains the scroll viewport block size.',
    ],
    [
      'resizableColumns / reorderableColumns',
      'boolean',
      'false',
      'Enables pointer and keyboard column layout.',
    ],
    [
      'columnResizeMode',
      "'fit' | 'expand'",
      "'fit'",
      'Determines adjacent-width behavior.',
    ],
    [
      'minColumnWidth / columnResizeStep',
      'number',
      '64 / 8',
      'Resize constraints in CSS pixels.',
    ],
    [
      'filterDelay',
      'number',
      '250',
      'Text/number filter debounce in milliseconds.',
    ],
    [
      'density',
      "'compact' | 'comfortable' | 'spacious'",
      "'comfortable'",
      'Semantic row-density preset.',
    ],
    ['caption', 'string', "''", 'Native table caption.'],
    [
      'ariaLabel / ariaLabelledby / ariaDescribedby',
      'string',
      "''",
      'Accessible table naming and description.',
    ],
    [
      'labels',
      'Partial<NeuralTableLabels>',
      '{}',
      'Component-level localized copy override.',
    ],
    [
      'unstyled / tableClass / classes',
      'headless inputs',
      'false / empty / {}',
      'Visual ownership and additive classes.',
    ],
  ] as const;
  readonly outputs = [
    [
      'sortEvent / filterEvent',
      'sort and filter events',
      'Detailed user data-operation events.',
    ],
    [
      'selectionEvent',
      'NeuralTableSelectionChange<T>',
      'Selection rows, keys, reason and native event.',
    ],
    [
      'rowSelect / rowUnselect',
      'NeuralTableRowEvent<T>',
      'Semantic row selection lifecycle.',
    ],
    [
      'rowClick / rowDoubleClick',
      'NeuralTableRowEvent<T>',
      'Native row activation details.',
    ],
    [
      'expansionChange / rowGroupExpansionChange',
      'expansion events',
      'Row and group disclosure changes.',
    ],
    [
      'columnResize / columnVisibilityChange / columnReorder',
      'column events',
      'Controlled layout changes.',
    ],
    [
      'stateChange / stateRestore',
      'state events',
      'Serializable state requests and restoration.',
    ],
    [
      'cellEditStart / Complete / Cancel',
      'NeuralTableEditEvent<T>',
      'Cell editing lifecycle.',
    ],
    [
      'rowEditStart / Save / Cancel',
      'NeuralTableRowEditEvent<T>',
      'Row editing lifecycle.',
    ],
  ] as const;
  readonly templates = [
    ['neuralTableCell="id"', 'Typed body cell context.'],
    ['neuralTableEditor="id"', 'Draft editor with setValue, save and cancel.'],
    ['neuralTableHeader="id"', 'Leaf-column header.'],
    ['neuralTableHeaderGroup="id"', 'Resolved grouped header.'],
    [
      'neuralTableFilter="id"',
      'Column filter control and apply/clear callbacks.',
    ],
    ['neuralTableFooter="id"', 'Leaf-column footer.'],
    ['neuralTableFooterGroup="id"', 'Resolved grouped footer.'],
    ['neuralTableExpansion', 'Expanded row content.'],
    ['neuralTableGroupHeader', 'Row-group header and aggregate helper.'],
    ['neuralTableGroupFooter', 'Row-group footer and aggregate helper.'],
    ['neuralTableLoading', 'Custom loading state.'],
    ['neuralTableEmpty', 'Custom empty state.'],
    ['neuralTableError', 'Custom error state.'],
  ] as const;
  readonly methods = [
    ['clearFilters(includeGlobal?)', 'Clears filter state.'],
    ['setFilters(filters, global?)', 'Replaces controlled filters.'],
    ['setPage(index, size?)', 'Updates controlled paging.'],
    ['startCellEdit / startRowEdit', 'Begins a typed draft.'],
    ['saveEdit / cancelEdit', 'Commits validation or restores source data.'],
    [
      'setColumnVisibility / toggleColumnVisibility / showAllColumns',
      'Controls visible columns.',
    ],
    [
      'captureState / serializeState / restoreState',
      'Creates and restores versioned JSON-safe state.',
    ],
    ['clearStoredState()', 'Removes the configured persistence snapshot.'],
    ['isLatestRequest(id)', 'Rejects stale remote responses.'],
  ] as const;
  readonly columnFields = [
    'id, header, field, valueAccessor, formatter',
    'sortable, resizable, reorderable',
    'filterable, filterType, filterMatchMode, filterOptions',
    'align, width, minWidth, maxWidth, hidden, sticky',
    'headerClass, cellClass, footer',
    'editable, readOnly, disabled',
  ];
  readonly publicTypes = [
    'NeuralTableColumn<T>, NeuralTableClasses, NeuralTableLabels',
    'NeuralTableSort, NeuralTableFilter and match/filter types',
    'Selection, row, expansion and grouping events/contexts',
    'Cell/row editor events, contexts and validators',
    'Column order, width, resize, visibility and reorder contracts',
    'Versioned state, storage, adapter, restore and request state',
    'Header/footer group definitions and template contexts',
  ];
  readonly utilities = [
    'resolveNeuralTablePath / resolveNeuralTableValue',
    'compareNeuralTableValues / sortNeuralTableRows',
    'matchesNeuralTableFilter / filterNeuralTableRows',
    'paginateNeuralTableRows',
    'aggregateNeuralTableValues / aggregateNeuralTableRows',
    'serializeNeuralTableState / parseNeuralTableState',
  ];
  readonly surfaceTokens = [
    '--neural-table-color',
    '--neural-table-muted-color',
    '--neural-table-background',
    '--neural-table-header-background',
    '--neural-table-header-color',
    '--neural-table-filter-background',
    '--neural-table-filter-control-background',
    '--neural-table-group-header-background',
    '--neural-table-group-header-color',
    '--neural-table-footer-background',
    '--neural-table-footer-color',
    '--neural-table-footer-group-background',
    '--neural-table-footer-group-color',
    '--neural-table-cell-background',
    '--neural-table-stripe-background',
    '--neural-table-sticky-stripe-background',
    '--neural-table-hover-background',
    '--neural-table-selected-background',
    '--neural-table-sticky-background',
    '--neural-table-expansion-content-background',
    '--neural-table-expansion-background',
  ];
  readonly interactionTokens = [
    '--neural-table-filter-control-border',
    '--neural-table-filter-control-border-hover',
    '--neural-table-resize-handle-color',
    '--neural-table-resize-handle-active-color',
    '--neural-table-reorder-handle-color',
    '--neural-table-reorder-handle-active-color',
    '--neural-table-drop-indicator-color',
    '--neural-table-expansion-background-hover',
    '--neural-table-border',
    '--neural-table-row-border',
    '--neural-table-expansion-border',
    '--neural-table-expansion-border-hover',
    '--neural-table-focus-color',
    '--neural-table-row-focus-color',
    '--neural-table-disabled-row-opacity',
    '--neural-table-accent',
    '--neural-table-selected-indicator',
    '--neural-table-sorted-color',
    '--neural-table-sort-hover-color',
    '--neural-table-sort-icon-color',
    '--neural-table-control-background',
    '--neural-table-control-border',
    '--neural-table-scrollbar-color',
  ];
  readonly layoutTokens = [
    '--neural-table-shadow',
    '--neural-table-sticky-start-shadow',
    '--neural-table-sticky-end-shadow',
    '--neural-table-expansion-shadow',
    '--neural-table-radius',
    '--neural-table-font-size',
    '--neural-table-row-height',
    '--neural-table-cell-padding',
    '--neural-table-editable-hover-background',
    '--neural-table-editing-background',
    '--neural-table-editing-row-background',
    '--neural-table-editing-border-color',
    '--neural-table-edit-error-color',
    '--neural-table-filter-cell-padding',
    '--neural-table-filter-control-radius',
    '--neural-table-caption-padding',
    '--neural-table-state-padding',
    '--neural-table-expansion-padding',
    '--neural-table-transition-duration',
  ];

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  selectionChanged(event: NeuralTableSelectionChange<Product>): void {
    this.eventStatus.set(
      `${event.selectionKeys.length} selected via ${event.reason}.`,
    );
  }

  readonly selectableProduct = (product: Product): boolean =>
    product.status !== 'Out of stock';

  setColumnVisible(columnId: string, visible: boolean): void {
    this.hiddenColumnIds.update((current) =>
      visible
        ? current.filter((id) => id !== columnId)
        : current.includes(columnId)
          ? current
          : [...current, columnId],
    );
  }

  setResizeMode(value: unknown): void {
    if (value === 'fit' || value === 'expand') this.resizeMode.set(value);
  }

  saveRowEdit(event: NeuralTableRowEditEvent<Product>): void {
    this.editableProducts.update((products) =>
      products.map((product) =>
        product.id === event.draftRow.id ? { ...event.draftRow } : product,
      ),
    );
    this.editStatus.set(`${event.draftRow.name} saved.`);
  }

  cancelRowEdit(event: NeuralTableRowEditEvent<Product>): void {
    this.editStatus.set(`${event.row.name} edit cancelled.`);
  }

  sumRows(rows: readonly Product[], field: 'price' | 'inventory'): number {
    return rows.reduce((total, row) => total + row[field], 0);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
  remoteChanged(event: NeuralTableStateChange): void {
    this.remoteStatus.set(`Request ${event.requestId}: ${event.reason}.`);
  }
  statusClass(status: Product['status']): string {
    if (status === 'In stock')
      return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-500';
    if (status === 'Low stock')
      return 'border-amber-400/30 bg-amber-500/10 text-amber-500';
    return 'border-rose-400/30 bg-rose-500/10 text-rose-500';
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/table${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): TableDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is TableDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
