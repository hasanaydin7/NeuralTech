export type NeuralTableRowKey = string | number;
export type NeuralTableSortDirection = 'asc' | 'desc';
export type NeuralTableSortMode = 'single' | 'multiple';
export type NeuralTableDataMode = 'client' | 'remote';
export type NeuralTableSelectionMode = 'none' | 'single' | 'multiple';
export type NeuralTableSelectionControl = 'auto' | 'checkbox' | 'radio';
export type NeuralTableSelectAllMode = 'page' | 'filtered' | 'all';
export type NeuralTableEditMode = 'cell' | 'row';
export type NeuralTableRowGroupMode = 'subheader' | 'rowspan';
export type NeuralTableAggregate = 'sum' | 'average' | 'min' | 'max';
export type NeuralTableStateStorage = 'none' | 'local' | 'session';
export type NeuralTableLoadingMode = 'message' | 'skeleton';
export type NeuralTableEditValidationResult = boolean | string | null | void;
export type NeuralTableDensity = 'compact' | 'comfortable' | 'spacious';
export type NeuralTableAlign = 'start' | 'center' | 'end';
export type NeuralTableColumnResizeMode = 'fit' | 'expand';
export type NeuralTableColumnWidths = Readonly<Record<string, number>>;
export type NeuralTableColumnOrder = readonly string[];
export type NeuralTableFilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select';
export type NeuralTableFilterMatchMode =
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'in'
  | 'between';

export interface NeuralTableFilterOption {
  readonly label: string;
  readonly value: unknown;
}

export interface NeuralTableColumn<T> {
  readonly id: string;
  readonly header: string;
  readonly field?: keyof T | string;
  readonly valueAccessor?: (row: T, rowIndex: number) => unknown;
  readonly formatter?: (
    value: unknown,
    row: T,
    rowIndex: number,
  ) => string | number;
  readonly sortable?: boolean;
  readonly resizable?: boolean;
  readonly reorderable?: boolean;
  readonly filterable?: boolean;
  readonly filterType?: NeuralTableFilterType;
  readonly filterMatchMode?: NeuralTableFilterMatchMode;
  readonly filterOptions?: readonly NeuralTableFilterOption[];
  readonly filterPlaceholder?: string;
  readonly filterAriaLabel?: string;
  readonly align?: NeuralTableAlign;
  readonly width?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly hidden?: boolean;
  readonly sticky?: 'start' | 'end';
  readonly headerClass?: string;
  readonly cellClass?: string | ((row: T, rowIndex: number) => string);
  readonly footer?: string | number;
  readonly editable?:
    | boolean
    | ((row: T, rowIndex: number) => boolean);
  readonly readOnly?:
    | boolean
    | ((row: T, rowIndex: number) => boolean);
  readonly disabled?:
    | boolean
    | ((row: T, rowIndex: number) => boolean);
}

export interface NeuralTableEditEvent<T> {
  readonly row: T;
  readonly draftRow: T;
  readonly rowIndex: number;
  readonly rowKey: NeuralTableRowKey | null;
  readonly column: NeuralTableColumn<T>;
  readonly value: unknown;
  readonly previousValue: unknown;
  readonly nativeEvent?: Event;
}

export interface NeuralTableRowEditEvent<T> {
  readonly row: T;
  readonly draftRow: T;
  readonly rowIndex: number;
  readonly rowKey: NeuralTableRowKey | null;
  readonly changes: Readonly<Record<string, unknown>>;
  readonly nativeEvent?: Event;
}

export type NeuralTableEditValidator<T> = (
  event: NeuralTableEditEvent<T> | NeuralTableRowEditEvent<T>,
) =>
  | NeuralTableEditValidationResult
  | Promise<NeuralTableEditValidationResult>;

export interface NeuralTableHeaderGroup {
  readonly id: string;
  readonly header: string;
  readonly children: readonly (string | NeuralTableHeaderGroup)[];
  readonly headerClass?: string;
}

export interface NeuralTableSort {
  readonly field: string;
  readonly direction: NeuralTableSortDirection;
}

export interface NeuralTableFilter {
  readonly field: string;
  readonly value: unknown;
  readonly matchMode?: NeuralTableFilterMatchMode;
}

export interface NeuralTableFilterEvent {
  readonly filter: NeuralTableFilter | null;
  readonly filters: readonly NeuralTableFilter[];
  readonly nativeEvent?: Event;
}

export interface NeuralTableColumnResizeEvent<T> {
  readonly column: NeuralTableColumn<T>;
  readonly columnId: string;
  readonly width: number;
  readonly previousWidth: number;
  readonly mode: NeuralTableColumnResizeMode;
  readonly nativeEvent: PointerEvent | KeyboardEvent | MouseEvent;
}

export interface NeuralTableColumnVisibilityChange {
  readonly hiddenColumnIds: readonly string[];
  readonly visibleColumnIds: readonly string[];
  readonly changedColumnId?: string;
  readonly visible?: boolean;
  readonly nativeEvent?: Event;
}

export interface NeuralTableColumnReorderEvent<T> {
  readonly column: NeuralTableColumn<T>;
  readonly columnId: string;
  readonly previousIndex: number;
  readonly currentIndex: number;
  readonly columnOrder: NeuralTableColumnOrder;
  readonly nativeEvent: PointerEvent | KeyboardEvent;
}

export interface NeuralTableState {
  readonly version: 1;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly sort: readonly NeuralTableSort[];
  readonly filters: readonly NeuralTableFilter[];
  readonly globalFilter: unknown;
  readonly columnOrder: NeuralTableColumnOrder;
  readonly columnWidths: NeuralTableColumnWidths;
  readonly hiddenColumnIds: readonly string[];
  readonly selectionKeys: readonly NeuralTableRowKey[];
  readonly expandedRowKeys: readonly NeuralTableRowKey[];
  readonly expandedRowGroupKeys: readonly NeuralTableRowKey[];
}

export interface NeuralTableStateChange extends NeuralTableState {
  readonly reason:
    | 'sort'
    | 'filter'
    | 'page'
    | 'column'
    | 'selection'
    | 'expansion'
    | 'restore';
  readonly requestId: number;
}

export interface NeuralTableStateRestoreEvent {
  readonly key: string | null;
  readonly state: NeuralTableState;
  readonly source: 'api' | 'storage' | 'adapter';
}

export interface NeuralTableStateAdapter {
  load(
    key: string,
  ):
    | NeuralTableState
    | string
    | null
    | Promise<NeuralTableState | string | null>;
  save(
    key: string,
    state: NeuralTableState,
  ): void | Promise<void>;
  remove?(key: string): void | Promise<void>;
}

export interface NeuralTableRowEvent<T> {
  readonly row: T;
  readonly rowIndex: number;
  readonly nativeEvent?: Event;
}

export interface NeuralTableSortEvent {
  readonly sort: readonly NeuralTableSort[];
  readonly nativeEvent: MouseEvent;
}

export interface NeuralTableSelectionChange<T> {
  readonly selection: readonly T[];
  readonly selectionKeys: readonly NeuralTableRowKey[];
  readonly changedRow?: T;
  readonly changedRowKey?: NeuralTableRowKey;
  readonly selected: boolean;
  readonly reason: 'row' | 'control' | 'range' | 'all' | 'keyboard';
  readonly nativeEvent: Event;
}

export interface NeuralTableExpansionChange<T> {
  readonly row: T;
  readonly rowIndex: number;
  readonly expanded: boolean;
  readonly nativeEvent: MouseEvent;
}

export interface NeuralTableRowGroup<T> {
  readonly key: NeuralTableRowKey;
  readonly value: unknown;
  readonly rows: readonly T[];
  readonly groupIndex: number;
  readonly firstRowIndex: number;
}

export interface NeuralTableRowGroupContext<T> extends NeuralTableRowGroup<T> {
  readonly $implicit: unknown;
  readonly expanded: boolean;
  readonly toggle: (nativeEvent?: Event) => void;
  readonly aggregate: (
    field: keyof T | string | ((row: T, rowIndex: number) => unknown),
    operation: NeuralTableAggregate,
  ) => number | null;
}

export interface NeuralTableRowGroupExpansionChange<T>
  extends NeuralTableRowGroup<T> {
  readonly expanded: boolean;
  readonly nativeEvent?: Event;
}

export interface NeuralTableLabels {
  readonly loading: string;
  readonly empty: string;
  readonly error: string;
  readonly selectAll: string;
  readonly selectAllPage: string;
  readonly selectAllFiltered: string;
  readonly selectAllRows: string;
  readonly rowExpansion: string;
  readonly selectRow: string;
  readonly expandRow: string;
  readonly collapseRow: string;
  readonly expandGroup: string;
  readonly collapseGroup: string;
  readonly sortAscending: string;
  readonly sortDescending: string;
  readonly clearSort: string;
  readonly filter: string;
  readonly filterFrom: string;
  readonly filterTo: string;
  readonly filterAll: string;
  readonly filterTrue: string;
  readonly filterFalse: string;
  readonly resizeColumn: string;
  readonly reorderColumn: string;
  readonly columnMoved: string;
  readonly editValidationFailed: string;
}

export interface NeuralTableClasses {
  readonly root?: string;
  readonly scroll?: string;
  readonly table?: string;
  readonly caption?: string;
  readonly header?: string;
  readonly headerRow?: string;
  readonly headerCell?: string;
  readonly headerGroupRow?: string;
  readonly headerGroupCell?: string;
  readonly filterRow?: string;
  readonly filterCell?: string;
  readonly filterControl?: string;
  readonly filterRange?: string;
  readonly sortButton?: string;
  readonly sortIcon?: string;
  readonly resizeHandle?: string;
  readonly reorderHandle?: string;
  readonly dropIndicator?: string;
  readonly body?: string;
  readonly row?: string;
  readonly selectedRow?: string;
  readonly disabledRow?: string;
  readonly focusedRow?: string;
  readonly cell?: string;
  readonly editableCell?: string;
  readonly editingCell?: string;
  readonly readOnlyCell?: string;
  readonly disabledCell?: string;
  readonly editor?: string;
  readonly editError?: string;
  readonly editingRow?: string;
  readonly selectionCell?: string;
  readonly selectionControl?: string;
  readonly expansionCell?: string;
  readonly expansionButton?: string;
  readonly expansionRow?: string;
  readonly expansionContent?: string;
  readonly groupHeaderRow?: string;
  readonly groupHeaderCell?: string;
  readonly groupToggle?: string;
  readonly groupFooterRow?: string;
  readonly groupFooterCell?: string;
  readonly stateRow?: string;
  readonly stateCell?: string;
  readonly loading?: string;
  readonly skeletonRow?: string;
  readonly skeletonCell?: string;
  readonly skeletonLine?: string;
  readonly empty?: string;
  readonly error?: string;
  readonly footer?: string;
  readonly footerRow?: string;
  readonly footerCell?: string;
  readonly footerGroupRow?: string;
  readonly footerGroupCell?: string;
}

export interface NeuralTableCellContext<T> {
  readonly $implicit: unknown;
  readonly value: unknown;
  readonly row: T;
  readonly rowIndex: number;
  readonly column: NeuralTableColumn<T>;
  readonly selected: boolean;
  readonly expanded: boolean;
}

export interface NeuralTableEditorContext<T> {
  readonly $implicit: unknown;
  readonly value: unknown;
  readonly row: T;
  readonly draftRow: T;
  readonly rowIndex: number;
  readonly column: NeuralTableColumn<T>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly setValue: (value: unknown) => void;
  readonly save: (nativeEvent?: Event) => Promise<boolean>;
  readonly cancel: (nativeEvent?: Event) => void;
}

export interface NeuralTableHeaderContext<T> {
  readonly $implicit: NeuralTableColumn<T>;
  readonly column: NeuralTableColumn<T>;
  readonly sort: NeuralTableSort | null;
}

export interface NeuralTableHeaderGroupContext {
  readonly $implicit: NeuralTableHeaderGroup;
  readonly group: NeuralTableHeaderGroup;
  readonly colspan: number;
  readonly rowspan: number;
}

export interface NeuralTableFooterContext<T> {
  readonly $implicit: string | number | null;
  readonly value: string | number | null;
  readonly column: NeuralTableColumn<T>;
  readonly rows: readonly T[];
}

export interface NeuralTableFooterGroupContext {
  readonly $implicit: NeuralTableHeaderGroup;
  readonly group: NeuralTableHeaderGroup;
  readonly colspan: number;
  readonly rowspan: number;
}

export interface NeuralTableFilterContext<T> {
  readonly $implicit: unknown;
  readonly value: unknown;
  readonly column: NeuralTableColumn<T>;
  readonly filter: NeuralTableFilter | null;
  readonly apply: (value: unknown, nativeEvent?: Event) => void;
  readonly clear: (nativeEvent?: Event) => void;
}

export interface NeuralTableRowContext<T> {
  readonly $implicit: T;
  readonly row: T;
  readonly rowIndex: number;
}

export interface NeuralTableStateContext {
  readonly $implicit: string;
  readonly message: string;
  readonly columnCount: number;
}
