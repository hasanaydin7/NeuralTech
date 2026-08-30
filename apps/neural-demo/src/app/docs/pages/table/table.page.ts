import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralCheckbox } from '@neural-ng/core/checkbox';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { NeuralInput } from '@neural-ng/core/input';
import { InputNumberComponent } from '@neural-ng/core/input-number';
import { PaginatorComponent } from '@neural-ng/core/paginator';
import { SelectComponent } from '@neural-ng/core/select';
import {
  NeuralTableCellDirective,
  NeuralTableEmptyDirective,
  NeuralTableEditorDirective,
  NeuralTableErrorDirective,
  NeuralTableExpansionDirective,
  NeuralTableGroupFooterDirective,
  NeuralTableGroupHeaderDirective,
  NeuralTableFooterDirective,
  NeuralTableFooterGroupDirective,
  NeuralTableHeaderGroupDirective,
  NeuralTableLoadingDirective,
  NeuralTable,
  filterNeuralTableRows,
  paginateNeuralTableRows,
  sortNeuralTableRows,
  type NeuralTableClasses,
  type NeuralTableColumn,
  type NeuralTableColumnOrder,
  type NeuralTableColumnReorderEvent,
  type NeuralTableColumnResizeEvent,
  type NeuralTableColumnResizeMode,
  type NeuralTableColumnWidths,
  type NeuralTableEditEvent,
  type NeuralTableEditValidator,
  type NeuralTableFilter,
  type NeuralTableHeaderGroup,
  type NeuralTableRowKey,
  type NeuralTableRowEditEvent,
  type NeuralTableSelectAllMode,
  type NeuralTableSelectionChange,
  type NeuralTableStateChange,
} from '@neural-ng/core/table';
import { NeuralTag, type NeuralTagSeverity } from '@neural-ng/core/tag';
import { CodeView } from '../../../shared/code-view';
import {
  TableEnterpriseStateDemo,
  TableRequestIdentityDemo,
} from './table-part7-demo';

export interface DemoProduct {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly price: number;
  readonly inventory: number;
  readonly status: 'In stock' | 'Low stock' | 'Out of stock';
  readonly description: string;
  readonly featured?: boolean;
}

interface GroupedDemoProduct extends DemoProduct {
  readonly supplier: {
    readonly region: 'Europe' | 'Americas' | 'Asia Pacific';
  };
}

@Component({
  selector: 'app-table-page',
  imports: [
    NeuralButton,
    NeuralCheckbox,
    CodeView,
    NeuralInput,
    InputNumberComponent,
    PaginatorComponent,
    NeuralTable,
    NeuralTableCellDirective,
    NeuralTableEmptyDirective,
    NeuralTableEditorDirective,
    NeuralTableErrorDirective,
    NeuralTableExpansionDirective,
    NeuralTableGroupFooterDirective,
    NeuralTableGroupHeaderDirective,
    NeuralTableFooterDirective,
    NeuralTableFooterGroupDirective,
    NeuralTableHeaderGroupDirective,
    NeuralTableLoadingDirective,
    SelectComponent,
    NeuralTag,
    TableEnterpriseStateDemo,
    TableRequestIdentityDemo,
  ],
  templateUrl: './table.page.html',
  styleUrls: ['./table.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly products: readonly DemoProduct[] = [
    {
      id: 1,
      code: 'NN-1001',
      name: 'Signal Desk',
      category: 'Office',
      price: 899,
      inventory: 24,
      status: 'In stock',
      description: 'A height-adjustable workspace for focused product teams.',
    },
    {
      id: 2,
      code: 'NN-1002',
      name: 'Hydration Lamp',
      category: 'Lighting',
      price: 129,
      inventory: 7,
      status: 'Low stock',
      description: 'Low-glare ambient lighting with adaptive temperature.',
    },
    {
      id: 3,
      code: 'NN-1003',
      name: 'Standalone Chair',
      category: 'Office',
      price: 549,
      inventory: 0,
      status: 'Out of stock',
      description: 'Ergonomic support with a breathable technical weave.',
    },
    {
      id: 4,
      code: 'NN-1004',
      name: 'Neural Speaker',
      category: 'Audio',
      price: 249,
      inventory: 18,
      status: 'In stock',
      description: 'Compact spatial audio for modern work and living spaces.',
    },
    {
      id: 5,
      code: 'NN-1005',
      name: 'Token Shelf',
      category: 'Storage',
      price: 319,
      inventory: 4,
      status: 'Low stock',
      description: 'A modular shelf system built around reusable units.',
    },
    {
      id: 6,
      code: 'NN-1006',
      name: 'Headless Clock',
      category: 'Accessories',
      price: 89,
      inventory: 31,
      status: 'In stock',
      description: 'A quiet analog clock with a completely adaptable face.',
    },
    {
      id: 7,
      code: 'NN-1007',
      name: 'Strict Cabinet',
      category: 'Storage',
      price: 479,
      inventory: 12,
      status: 'In stock',
      description: 'Lockable steel storage with exact modular dimensions.',
    },
    {
      id: 8,
      code: 'NN-1008',
      name: 'SSR Planter',
      category: 'Accessories',
      price: 74,
      inventory: 0,
      status: 'Out of stock',
      description: 'A self-watering planter that looks good on first render.',
    },
  ];
  readonly allProductKeys = this.products.map((product) => product.id);
  readonly groupedProducts: readonly GroupedDemoProduct[] = this.products.map(
    (product, index) => ({
      ...product,
      supplier: {
        region:
          index % 3 === 0
            ? 'Europe'
            : index % 3 === 1
              ? 'Americas'
              : 'Asia Pacific',
      },
    }),
  );

  readonly columns: readonly NeuralTableColumn<DemoProduct>[] = [
    {
      id: 'code',
      header: 'Code',
      field: 'code',
      sortable: true,
      filterable: true,
      filterPlaceholder: 'NN-1001',
      sticky: 'start',
      width: '7.5rem',
      cellClass: 'docs-product-code',
    },
    {
      id: 'name',
      header: 'Product',
      field: 'name',
      sortable: true,
      filterable: true,
      filterPlaceholder: 'Product name',
      cellClass: 'docs-product-name',
    },
    {
      id: 'category',
      header: 'Category',
      field: 'category',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Accessories', value: 'Accessories' },
        { label: 'Audio', value: 'Audio' },
        { label: 'Lighting', value: 'Lighting' },
        { label: 'Office', value: 'Office' },
        { label: 'Storage', value: 'Storage' },
      ],
    },
    {
      id: 'price',
      header: 'Price',
      field: 'price',
      sortable: true,
      filterable: true,
      filterType: 'number',
      filterMatchMode: 'equals',
      align: 'end',
      formatter: (value) => `$${Number(value).toLocaleString('en-US')}`,
    },
    {
      id: 'inventory',
      header: 'Stock',
      field: 'inventory',
      sortable: true,
      filterable: true,
      filterType: 'number',
      filterMatchMode: 'equals',
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
  readonly compactColumns: readonly NeuralTableColumn<DemoProduct>[] =
    this.columns.slice(0, 3).map((column) => ({
      ...column,
      filterable: false,
    }));
  readonly remoteColumns = this.columns.slice(0, 3);
  readonly layoutColumns: readonly NeuralTableColumn<DemoProduct>[] =
    this.columns.map((column) => ({
      ...column,
      filterable: false,
      align: 'start',
      sticky:
        column.id === 'code' || column.id === 'name'
          ? 'start'
          : column.id === 'status'
            ? 'end'
            : undefined,
      width:
        column.id === 'name'
          ? '160px'
          : column.id === 'code'
            ? '100px'
            : column.id === 'category' || column.id === 'price'
              ? '120px'
              : column.id === 'inventory'
                ? '110px'
                : '150px',
      minWidth: column.id === 'name' ? '160px' : '96px',
      maxWidth: column.id === 'name' ? '360px' : '260px',
    }));
  readonly reorderColumns: readonly NeuralTableColumn<DemoProduct>[] =
    this.columns.map((column) => ({
      ...column,
      filterable: false,
      sticky: undefined,
      width:
        column.id === 'name'
          ? '180px'
          : column.id === 'code'
            ? '110px'
            : '130px',
    }));
  readonly groupedColumns: readonly NeuralTableColumn<DemoProduct>[] =
    this.columns.map((column) => ({
      ...column,
      filterable: false,
      sticky: undefined,
      footer: column.id === 'name' ? 'Visible summary' : undefined,
    }));
  readonly rowGroupColumns: readonly NeuralTableColumn<GroupedDemoProduct>[] = [
    { id: 'category', header: 'Category', field: 'category', width: '9rem' },
    {
      id: 'name',
      header: 'Product',
      field: 'name',
      cellClass: 'docs-product-name',
    },
    {
      id: 'region',
      header: 'Supplier region',
      field: 'supplier.region',
    },
    {
      id: 'price',
      header: 'Price',
      field: 'price',
      align: 'end',
      formatter: (value) => `$${Number(value).toLocaleString('en-US')}`,
    },
    { id: 'inventory', header: 'Stock', field: 'inventory', align: 'end' },
  ];
  readonly editColumns: readonly NeuralTableColumn<DemoProduct>[] = [
    {
      id: 'code',
      header: 'Code',
      field: 'code',
      editable: true,
      readOnly: true,
      cellClass: 'docs-product-code',
    },
    {
      id: 'name',
      header: 'Product',
      field: 'name',
      editable: true,
      cellClass: 'docs-product-name',
    },
    {
      id: 'category',
      header: 'Category',
      field: 'category',
      editable: true,
    },
    {
      id: 'price',
      header: 'Price',
      field: 'price',
      editable: true,
      disabled: (row) => row.inventory === 0,
      align: 'end',
      formatter: (value) => `$${Number(value).toLocaleString('en-US')}`,
    },
    {
      id: 'featured',
      header: 'Featured',
      field: 'featured',
      editable: true,
      align: 'center',
      formatter: (value) => (value ? 'Yes' : 'No'),
    },
  ];
  readonly rowEditColumns: readonly NeuralTableColumn<DemoProduct>[] = [
    ...this.editColumns,
    { id: 'actions', header: 'Actions', editable: false },
  ];
  readonly cellEditColumns: readonly NeuralTableColumn<DemoProduct>[] = [
    ...this.editColumns,
    { id: 'actions', header: 'Actions', editable: false, align: 'center' },
  ];
  readonly categoryOptions = [
    { label: 'Accessories', value: 'Accessories' },
    { label: 'Audio', value: 'Audio' },
    { label: 'Lighting', value: 'Lighting' },
    { label: 'Office', value: 'Office' },
    { label: 'Storage', value: 'Storage' },
  ] as const;
  readonly productHeaderGroups: readonly NeuralTableHeaderGroup[] = [
    {
      id: 'product-information',
      header: 'Product information',
      children: [
        {
          id: 'identity',
          header: 'Identity',
          children: ['code', 'name'],
        },
        {
          id: 'classification',
          header: 'Classification',
          children: ['category'],
        },
      ],
    },
    {
      id: 'operations',
      header: 'Operations',
      children: [
        {
          id: 'commercial',
          header: 'Commercial',
          children: ['price'],
        },
        {
          id: 'inventory-group',
          header: 'Inventory',
          children: ['inventory', 'status'],
        },
      ],
    },
  ];
  readonly productFooterGroups: readonly NeuralTableHeaderGroup[] = [
    {
      id: 'visible-totals',
      header: 'Current visible totals',
      children: this.columns.map((column) => column.id),
    },
  ];
  readonly selectedProducts = signal<readonly DemoProduct[]>([]);
  readonly advancedSelectedProducts = signal<readonly DemoProduct[]>([]);
  readonly advancedSelectionKeys = signal<readonly NeuralTableRowKey[]>([]);
  readonly advancedPageIndex = signal(0);
  readonly advancedPageSize = signal(4);
  readonly advancedSelectAllMode = signal<NeuralTableSelectAllMode>('page');
  readonly advancedSelectionStatus = signal(
    'Click a row, use Ctrl/Meta, Shift, or the keyboard.',
  );
  readonly radioSelection = signal<readonly DemoProduct[]>([]);
  readonly remoteSelectionKeys = signal<readonly NeuralTableRowKey[]>([]);
  readonly editableProducts = signal<readonly DemoProduct[]>(
    this.products.slice(0, 4).map((product, index) => ({
      ...product,
      featured: index === 0,
    })),
  );
  readonly cellEditStatus = signal(
    'Click an editable cell or focus it and press Enter.',
  );
  readonly rowEditStatus = signal('Use Edit to create an immutable row draft.');
  readonly columnFilters = signal<readonly NeuralTableFilter[]>([]);
  readonly expandedKeys = signal<readonly (string | number)[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(4);
  readonly query = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly remoteEvent = signal('No remote request yet.');
  readonly remoteFilters = signal<readonly NeuralTableFilter[]>([]);
  readonly remoteRows = signal<readonly DemoProduct[]>(
    this.products.slice(0, 3),
  );
  readonly remoteTotal = signal(this.products.length);
  readonly layoutColumnWidths = signal<NeuralTableColumnWidths>({
    code: 100,
    name: 160,
    category: 120,
    price: 120,
    inventory: 110,
    status: 150,
  });
  readonly layoutHiddenColumnIds = signal<readonly string[]>([]);
  readonly layoutResizeMode = signal<NeuralTableColumnResizeMode>('expand');
  readonly layoutStatus = signal(
    "Drag a column's right edge, use Arrow keys, or double-click to auto-size.",
  );
  readonly reorderColumnOrder = signal<NeuralTableColumnOrder>(
    this.reorderColumns.map((column) => column.id),
  );
  readonly reorderColumnWidths = signal<NeuralTableColumnWidths>({
    code: 110,
    name: 180,
    category: 130,
    price: 130,
    inventory: 130,
    status: 130,
  });
  readonly reorderStatus = signal(
    'Drag a six-dot grip or focus it and press an Arrow key.',
  );
  readonly groupedHiddenColumnIds = signal<readonly string[]>([]);
  readonly expandedCategoryGroups = signal<readonly NeuralTableRowKey[]>([
    'Office',
    'Lighting',
    'Audio',
    'Storage',
    'Accessories',
  ]);
  readonly headlessClasses: NeuralTableClasses = {
    root: 'docs-headless-table',
    scroll: 'docs-headless-table__scroll',
    table: 'docs-headless-table__table',
    headerCell: 'docs-headless-table__header',
    cell: 'docs-headless-table__cell',
    row: 'docs-headless-table__row',
    selectedRow: 'docs-headless-table__row--selected',
  };

  readonly validateTableEdit: NeuralTableEditValidator<DemoProduct> = async (
    event,
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const draft = event.draftRow;
    if (draft.name.trim().length < 3) {
      return 'Product name must contain at least 3 characters.';
    }
    if (draft.price < 1 || draft.price > 2000) {
      return 'Price must be between 1 and 2,000.';
    }
    return true;
  };

  readonly importCode = `import {
  NeuralTable,
  NeuralTableCellDirective,
  NeuralTableEditorDirective,
  NeuralTableExpansionDirective,
  type NeuralTableColumn,
} from '@neural-ng/core/table';`;
  readonly editingCode = `<neural-table
  #table
  [value]="products()"
  [columns]="editColumns"
  rowKey="id"
  editMode="cell"
  [editValidator]="validateEdit"
  (cellEditComplete)="applyDraft($event)"
>
  <ng-template neuralTableEditor="name" let-value let-setValue="setValue">
    <input neuralInput [value]="value" (input)="setValue($any($event.target).value)" />
  </ng-template>
  <ng-template neuralTableEditor="category" let-value let-setValue="setValue">
    <neural-select appendTo="body" [options]="categories" [value]="$any(value)"
      (valueChange)="setValue($event)" />
  </ng-template>
  <ng-template neuralTableEditor="price" let-value let-setValue="setValue">
    <neural-input-number [value]="$any(value)"
      (valueChange)="setValue($event)" />
  </ng-template>
  <ng-template neuralTableEditor="featured" let-value let-setValue="setValue">
    <neural-checkbox [checked]="$any(value)"
      (checkedChange)="setValue($event)" />
  </ng-template>
  <ng-template neuralTableCell="actions" let-row="row" let-rowIndex="rowIndex">
    @if (table.isEditingRow(row, rowIndex)) {
      <button aria-label="Save cell edit" (click)="table.saveEdit($event)">
        <i class="nt nt-check"></i>
      </button>
      <button aria-label="Cancel cell edit" (click)="table.cancelEdit($event)">
        <i class="nt nt-x"></i>
      </button>
    }
  </ng-template>
</neural-table>`;
  readonly basicCode = `<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  selectionMode="multiple"
  [(selection)]="selectedProducts"
  [(expandedRowKeys)]="expandedKeys"
  [(filters)]="columnFilters"
  [globalFilter]="query()"
  [paginate]="true"
  [(pageIndex)]="pageIndex"
  [pageSize]="pageSize()"
  striped
  stickyHeader
  ariaLabel="Product inventory"
>
  <ng-template neuralTableCell="status" let-row="row">
    <neural-tag [value]="row.status" />
  </ng-template>
  <ng-template neuralTableExpansion let-row>
    {{ row.description }}
  </ng-template>
</neural-table>`;
  readonly remoteCode = `<neural-table
  dataMode="remote"
  [value]="currentPage"
  [totalItems]="totalItems"
  [columns]="columns"
  [(filters)]="filters"
  (stateChange)="loadFromApi($event)"
/>`;
  readonly headlessCode = `<neural-table
  [value]="products"
  [columns]="columns"
  unstyled
  tableClass="my-table"
  [classes]="{
    headerCell: 'my-header',
    cell: 'my-cell',
    row: 'my-row'
  }"
/>`;
  readonly advancedSelectionCode = `<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  selectionMode="multiple"
  selectionControl="checkbox"
  [selectableRow]="isSelectableProduct"
  [selectAllMode]="selectAllMode()"
  [(selection)]="selectedProducts"
  [paginate]="true"
  [(pageIndex)]="pageIndex"
  [pageSize]="4"
/>

<!-- Remote mode never stores row objects. -->
<neural-table
  dataMode="remote"
  rowKey="id"
  selectionMode="multiple"
  [(selectionKeys)]="selectedKeys"
  [selectAllKeys]="allResultKeys"
/>`;
  readonly layoutCode = `<neural-table
  [value]="products"
  [columns]="columns"
  scrollHeight="21rem"
  stickyHeader
  resizableColumns
  columnResizeMode="expand"
  [(columnWidths)]="columnWidths"
  [(hiddenColumnIds)]="hiddenColumnIds"
  (columnResize)="saveWidths($event)"
  (columnVisibilityChange)="saveVisibility($event)"
/>`;
  readonly reorderCode = `<neural-table
  [value]="products"
  [columns]="columns"
  reorderableColumns
  resizableColumns
  columnResizeMode="expand"
  [(columnOrder)]="columnOrder"
  [(columnWidths)]="columnWidths"
  (columnReorder)="saveOrder($event)"
/>`;
  readonly groupedCode = `<neural-table
  [value]="products"
  [columns]="columns"
  [headerGroups]="headerGroups"
  [footerGroups]="footerGroups"
  [(hiddenColumnIds)]="hiddenColumnIds"
>
  <ng-template neuralTableHeaderGroup="identity" let-group>
    {{ group.header }}
  </ng-template>
  <ng-template neuralTableFooter="price" let-rows="rows">
    {{ totalPrice(rows) | currency }}
  </ng-template>
</neural-table>`;
  readonly rowGroupingCode = `<neural-table
  [value]="products"
  [columns]="columns"
  rowKey="id"
  groupRowsBy="category"
  rowGroupMode="subheader"
  expandableRowGroups
  [(expandedRowGroupKeys)]="expandedGroups"
  stickyFooter
>
  <ng-template neuralTableGroupHeader
    let-category
    let-rows="rows"
    let-expanded="expanded"
    let-toggle="toggle">
    <button type="button" [attr.aria-expanded]="expanded" (click)="toggle($event)">
      {{ category }} · {{ rows.length }} products
    </button>
  </ng-template>
  <ng-template neuralTableGroupFooter
    let-category
    let-aggregate="aggregate">
    {{ category }} total: {{ aggregate('price', 'sum') }}
  </ng-template>
  <ng-template neuralTableFooter="price" let-rows="rows">
    Grand total: {{ totalPrice(rows) }}
  </ng-template>
</neural-table>`;
  readonly rowSpanCode = `<neural-table
  [value]="products"
  [columns]="columns"
  groupRowsBy="supplier.region"
  rowGroupMode="rowspan"
/>

// Nested paths work in grouping, sorting, filtering, editing and cells.
{ id: 'region', field: 'supplier.region', header: 'Supplier region' }`;
  readonly enterpriseStateCode = `<neural-table
  #table
  stateKey="inventory-table"
  stateStorage="session"
  [stateAdapter]="optionalAdapter"
  [value]="products"
  [columns]="columns"
  [(sort)]="sort"
  [(filters)]="filters"
  [(pageIndex)]="pageIndex"
  [(columnOrder)]="columnOrder"
  [(columnWidths)]="columnWidths"
  [(hiddenColumnIds)]="hiddenColumnIds"
  (stateRestore)="onRestore($event)"
/>

// URLSearchParams handles encoding; the snapshot stays plain JSON.
const params = new URLSearchParams();
params.set('table', table.serializeState());
table.restoreState(params.get('table')!);

const adapter: NeuralTableStateAdapter = {
  load: (key) => stateStore.get(key),
  save: (key, state) => stateStore.set(key, JSON.stringify(state)),
  remove: (key) => stateStore.delete(key)
};`;
  readonly requestIdentityCode = `<neural-table
  #table
  dataMode="remote"
  (stateChange)="load(table, $event)"
/>

async function load(
  table: NeuralTable<Product>,
  state: NeuralTableStateChange
) {
  const response = await api.products(state);
  if (!table.isLatestRequest(state.requestId)) return;
  rows.set(response.rows);
}`;
  readonly skeletonCode = `<neural-table
  [columns]="columns"
  [loading]="true"
  loadingMode="skeleton"
  [loadingRows]="5"
/>

<!-- A custom neuralTableLoading template still takes precedence. -->`;

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  clearInventoryFilters(table: NeuralTable<DemoProduct>): void {
    this.query.set('');
    table.clearFilters(true);
  }

  isSelectableProduct(product: DemoProduct): boolean {
    return product.inventory > 0;
  }

  updateAdvancedSelectAllMode(nativeEvent: Event): void {
    this.advancedSelectAllMode.set(
      (nativeEvent.target as HTMLSelectElement)
        .value as NeuralTableSelectAllMode,
    );
  }

  recordAdvancedSelection(
    event: NeuralTableSelectionChange<DemoProduct>,
  ): void {
    const scope =
      event.reason === 'all' ? this.advancedSelectAllMode() : event.reason;
    this.advancedSelectionStatus.set(
      `${event.selected ? 'Selected' : 'Unselected'} via ${scope}.`,
    );
  }

  clearAdvancedSelection(): void {
    this.advancedSelectedProducts.set([]);
    this.advancedSelectionKeys.set([]);
    this.advancedSelectionStatus.set('Selection cleared.');
  }

  setLayoutColumnVisibility(
    table: NeuralTable<DemoProduct>,
    columnId: string,
    nativeEvent: Event,
  ): void {
    const visible = (nativeEvent.target as HTMLInputElement).checked;
    table.setColumnVisibility(columnId, visible, nativeEvent);
    this.layoutStatus.set(
      `${columnId} is now ${visible ? 'visible' : 'hidden'}.`,
    );
  }

  recordColumnResize(event: NeuralTableColumnResizeEvent<DemoProduct>): void {
    this.layoutStatus.set(
      `${event.column.header}: ${event.previousWidth}px → ${event.width}px (${event.mode}).`,
    );
  }

  recordColumnReorder(event: NeuralTableColumnReorderEvent<DemoProduct>): void {
    this.reorderStatus.set(
      `${event.column.header}: ${event.previousIndex + 1} → ${event.currentIndex + 1}.`,
    );
  }

  resetColumnOrder(): void {
    this.reorderColumnOrder.set(this.reorderColumns.map((column) => column.id));
    this.reorderStatus.set('Column order reset.');
  }

  toggleGroupedColumn(columnId: string, nativeEvent: Event): void {
    const visible = (nativeEvent.target as HTMLInputElement).checked;
    const hidden = new Set(this.groupedHiddenColumnIds());
    if (visible) hidden.delete(columnId);
    else hidden.add(columnId);
    this.groupedHiddenColumnIds.set([...hidden]);
  }

  totalPrice(rows: readonly DemoProduct[]): string {
    const total = rows.reduce((sum, row) => sum + row.price, 0);
    return `$${total.toLocaleString('en-US')}`;
  }

  totalInventory(rows: readonly DemoProduct[]): number {
    return rows.reduce((sum, row) => sum + row.inventory, 0);
  }

  updateLayoutResizeMode(nativeEvent: Event): void {
    this.layoutResizeMode.set(
      (nativeEvent.target as HTMLSelectElement)
        .value as NeuralTableColumnResizeMode,
    );
  }

  severity(status: DemoProduct['status']): NeuralTagSeverity {
    if (status === 'In stock') return 'success';
    if (status === 'Low stock') return 'warning';
    return 'error';
  }

  applyCellEdit(event: NeuralTableEditEvent<DemoProduct>): void {
    this.replaceEditableProduct(event.draftRow);
    this.cellEditStatus.set(
      `${event.column.header} saved for ${event.draftRow.name}.`,
    );
  }

  cancelCellEdit(event: NeuralTableEditEvent<DemoProduct>): void {
    this.cellEditStatus.set(`${event.column.header} edit cancelled.`);
  }

  applyRowEdit(event: NeuralTableRowEditEvent<DemoProduct>): void {
    this.replaceEditableProduct(event.draftRow);
    this.rowEditStatus.set(
      `${event.draftRow.name} saved with ${Object.keys(event.changes).length} change(s).`,
    );
  }

  cancelRowEdit(event: NeuralTableRowEditEvent<DemoProduct>): void {
    this.rowEditStatus.set(`${event.row.name} row edit cancelled.`);
  }

  private replaceEditableProduct(product: DemoProduct): void {
    this.editableProducts.update((products) =>
      products.map((candidate) =>
        candidate.id === product.id ? product : candidate,
      ),
    );
  }

  showLoading(): void {
    this.error.set(null);
    this.loading.set(true);
  }

  showError(): void {
    this.loading.set(false);
    this.error.set('Inventory service is temporarily unavailable.');
  }

  resetState(): void {
    this.loading.set(false);
    this.error.set(null);
  }

  recordRemoteState(event: NeuralTableStateChange): void {
    const filter = event.filters[0];
    const filtered = filterNeuralTableRows(
      this.products,
      this.remoteColumns,
      event.filters,
      event.globalFilter,
    );
    const sorted = sortNeuralTableRows(
      filtered,
      this.remoteColumns,
      event.sort,
    );
    this.remoteRows.set(
      paginateNeuralTableRows(sorted, event.pageIndex, event.pageSize),
    );
    this.remoteTotal.set(filtered.length);
    this.remoteEvent.set(
      event.reason === 'filter'
        ? `filter: ${filter?.field ?? 'none'} ${String(filter?.value ?? '')}`.trim()
        : `${event.reason}: ${event.sort[0]?.field ?? 'none'} ${
            event.sort[0]?.direction ?? ''
          }`.trim(),
    );
  }
}
