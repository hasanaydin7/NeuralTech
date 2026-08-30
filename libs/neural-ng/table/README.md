# NeuralNg Table

Signal-first, native-table data presentation for Angular 22+. Import only the
secondary entry point:

**Beta status:** the documented contract is ready for application-level
validation. Beta consumers should still pin an exact version until stable.

```ts
import { NeuralTable, NeuralTableCellDirective, NeuralTableEditorDirective, NeuralTableFilterDirective, NeuralTableFooterDirective, NeuralTableHeaderGroupDirective, type NeuralTableColumn, type NeuralTableHeaderGroup } from '@neural-ng/core/table';
```

```html
<neural-table [value]="products" [columns]="columns" [(filters)]="filters" rowKey="id" selectionMode="multiple" [(selection)]="selectedProducts" [paginate]="true" [(pageIndex)]="pageIndex" [pageSize]="10" striped stickyHeader ariaLabel="Products">
  <ng-template neuralTableCell="status" let-row="row">
    <app-status [value]="row.status" />
  </ng-template>
</neural-table>
```

## Data contract

`columns` supports property paths, `valueAccessor`, `formatter`, sorting,
filtering, alignment, widths, visibility, sticky edges, and per-column class
hooks. The component keeps a real `<table>` with native heading, row-group,
`aria-sort`, `aria-busy`, and `aria-selected` semantics.

Interactive controls are composed from NeuralNg primitives: selection uses
`NeuralCheckbox`/`NeuralRadioGroup`, actions use `NeuralButton`, filters use
`NeuralInput`/`NeuralSelect`, and visible paging composes `NeuralPaginator`.
Their internal native elements preserve browser behavior without exposing raw
controls in the Table template.

Client mode applies stable sorting, field/global filters, and optional paging.
`dataMode="remote"` renders the supplied page unchanged and emits `stateChange`
when user actions request new state.

Table owns paging state but intentionally does not duplicate the pagination
surface. Compose `NeuralPaginator` and bind the same `[(pageIndex)]` and
`[(pageSize)]` models. Page-size controls then use `NeuralSelect`, including in
remote mode, rather than a browser-native select.

Set `filterable: true` on a column to render an accessible filter row.

`TableComponent` remains available as a deprecated compatibility alias. New
code should import `NeuralTable`.
Built-in text, number, date, and range filters use `NeuralInput`. Select and
boolean filters use `NeuralSelect` with a body-appended overlay. Table keeps
ownership of filter layout tokens while shared controls provide the same focus,
keyboard, theme, and global unstyled behavior used elsewhere in NeuralNg.
`filterType` supports `text`, `number`, `date`, `boolean`, and `select`.
Configure selects with `filterOptions`; configure matching with
`filterMatchMode`. Available modes are `contains`, `startsWith`, `endsWith`,
`equals`, `notEquals`, `lt`, `lte`, `gt`, `gte`, `in`, and `between`.
Text-like controls debounce by `filterDelay` (250 ms by default). Every applied
filter updates `[(filters)]`, resets the client page, emits `filterEvent`, and
emits `stateChange` in both client and remote modes. Call `clearFilters()` or
`clearFilters(true)` to also clear `globalFilter`.

Sorting cycles ascending, descending, and unsorted. Use `sortMode="multiple"`
for compound sorting. Two-way models are available for `sort`, `filters`,
`globalFilter`, `selection`, `selectionKeys`, `expandedRowKeys`, `pageIndex`,
and `pageSize`.

## Advanced selection

Set `selectionMode` to `single` or `multiple`. `selectionControl="auto"`
renders radios for single selection and checkboxes for multiple selection;
either control can be requested explicitly. Selectable rows use roving
`tabindex`: ArrowUp/ArrowDown move between rows, Home/End jump to an edge, and
Space or Enter selects the focused row.

Row clicks select by default. In multiple mode a plain click replaces the
selection, Ctrl/Meta toggles one row, and Shift selects an inclusive range.
Checkbox clicks always toggle. Set `selectOnRowClick="false"` to require the
control, or provide `selectableRow(row, rowIndex)` to disable individual rows.
Disabled rows remain in the native table, expose `aria-disabled`, and are
skipped by range selection and keyboard navigation.

`selectAllMode` controls the header checkbox scope:

- `page`: the current client page.
- `filtered`: all filtered client rows, before paging.
- `all`: all client rows, ignoring filters.

Client mode keeps row objects in `[(selection)]` and mirrors stable keys into
`[(selectionKeys)]` when `rowKey` is available. Remote mode requires `rowKey`
and uses only `[(selectionKeys)]`; row objects are never stored or emitted as
the selection. For remote `filtered` or `all` selection, pass the complete
server-resolved key scope through `selectAllKeys`.

`selectionEvent` reports `selection`, `selectionKeys`, the changed row/key,
the selected state, and a `reason` of `row`, `control`, `range`, `all`, or
`keyboard`. `rowSelect` and `rowUnselect` remain available for individual
changes.

## Cell and row editing

Set `editMode="cell"` or `editMode="row"` and mark editor-backed columns with
`editable: true`. A column may use an `editable(row, rowIndex)` callback.
Set `readOnly: true` or provide a `readOnly(row, rowIndex)` callback to retain
the value while preventing that cell from entering edit mode. `disabled`
accepts the same boolean/callback shape and also exposes `aria-disabled`.

Declare one typed editor per editable column:

```html
<ng-template neuralTableEditor="name" let-value let-setValue="setValue" let-save="save" let-cancel="cancel" let-loading="loading" let-error="error">
  <input neuralInput [value]="value" [disabled]="loading" (input)="setValue($any($event.target).value)" />
</ng-template>
```

The editor context also exposes `row`, immutable `draftRow`, `rowIndex`, and
`column`. Table never mutates `value`. Apply `draftRow` from
`cellEditComplete` or `rowEditSave` to the owning Signal/store.

Cell mode starts on click, double-click, or Enter. Enter completes, Escape
cancels, and Tab completes then focuses the next editable cell. Row mode can
start from a double-click or `startRowEdit(row, rowIndex)`; use `saveEdit()` and
`cancelEdit()` for action controls. Tab moves through controls inside a row
draft, Enter saves, and Escape cancels.

`editValidator` receives a typed cell or row event and may return
`true`/`void`, `false`, an error string, or a Promise of those values. While a
Promise is pending, the editor exposes `loading=true` and `aria-busy`; rejected
drafts stay open and expose the returned message with `role="alert"`. The
active editor is locked while validation is pending. Late validation results
are ignored after cancellation, replacement, or component destruction.

Lifecycle outputs are `cellEditStart`, `cellEditComplete`, `cellEditCancel`,
`rowEditStart`, `rowEditSave`, and `rowEditCancel`. Cell events include the
column, current and previous values; row events include the complete change
record. Neural Input, Select, Checkbox, and InputNumber can bind directly to
`value` and `setValue`.

## Templates and states

- `neuralTableCell="columnId"`: custom cell with `value`, `row`, `rowIndex`,
  `column`, `selected`, and `expanded`.
- `neuralTableEditor="columnId"`: typed immutable editor context.
- `neuralTableHeader="columnId"`: custom header.
- `neuralTableHeaderGroup="groupId"`: custom grouped-header label with
  `group` and `colspan`.
- `neuralTableFilter="columnId"`: custom filter with `value`, `column`,
  `filter`, `apply`, and `clear`.
- `neuralTableFooter="columnId"`: typed summary cell with `column`, `value`,
  and the processed `rows`.
- `neuralTableFooterGroup="groupId"`: grouped footer label.
- `neuralTableExpansion`: expanded row content.
- `neuralTableLoading`, `neuralTableEmpty`, `neuralTableError`: state rows.

Loading, empty, error, sorting, selection, and expansion labels use the active
`NeuralLocaleService`; local `labels` overrides remain available.

## Headless mode

`unstyled` removes all `*-base` visual classes while retaining native
semantics, behavior, `neural-table-*-root` structural hooks, and
`data-neural-*` attributes. `provideNeuralNg({ unstyled: true })` is also
respected. Use `tableClass`, typed `classes`, and column class slots for
Tailwind or application-owned styles.

Horizontal overflow is intentional. Table beta does not transform rows into
cards because doing so would weaken table semantics. Virtualization, export,
and tree data remain deferred.

## Scroll and column layout

Use `scrollHeight` with `stickyHeader` for a constrained vertical viewport.
Sticky start/end columns use logical offsets and update when resized columns
change.

Enable `resizableColumns` and choose `columnResizeMode="fit"` (balance the next
column) or `"expand"` (grow the table). Widths are pixel values exposed through
`[(columnWidths)]`. Resize separators support pointer, touch, Arrow keys, and
double-click auto-size. Configure `minColumnWidth`, `columnResizeStep`, and
per-column `minWidth`, `maxWidth`, or `resizable: false`. Listen to
`columnResize` after a completed interaction.

Use `[(hiddenColumnIds)]` for dynamic visibility without mutating column
definitions. `setColumnVisibility`, `toggleColumnVisibility`, and
`showAllColumns` are available for custom column choosers;
`columnVisibilityChange` reports the resulting visible and hidden IDs.

## Column ordering

Enable `reorderableColumns` to render a dedicated six-dot grip in each
reorderable leaf header. Users drag the grip with the primary mouse button,
touch, or pen. Keyboard users focus the grip and press `ArrowLeft` or
`ArrowRight`.

`[(columnOrder)]` is a controlled readonly list of column IDs.
`columnReorder` reports the source column, previous/current indices, completed
order, and native event. Column definitions are never mutated. Set
`reorderable: false` on a column to remove its grip. Sticky `start`, normal,
and sticky `end` columns remain inside their own logical ordering regions.

## Grouped headers and summaries

Pass nested `headerGroups` definitions whose children are group objects or
leaf column IDs. Table derives native `scope="colgroup"` cells and recalculates
every `colspan` from the current ordered, visible leaves. Groups with no
visible descendants are omitted.

Use `footer` on a column or `neuralTableFooter` for a typed summary template.
`footerGroups` and `neuralTableFooterGroup` provide grouped summary labels.
The `rows` footer context contains processed client rows so applications own
aggregation rules. `stickyFooter` keeps the native `tfoot` at the logical
bottom of a constrained scroll surface.

## Row grouping and aggregation

Set `groupRowsBy` to a property path or `(row, rowIndex) => value`. Client-side
rows are collected into stable groups after filtering, sorting, and paging.
Nested paths such as `supplier.region` use the same resolver as cells,
filtering, sorting, and immutable editing.

`rowGroupMode="subheader"` inserts native group header/footer rows. Enable
`expandableRowGroups` and bind `[(expandedRowGroupKeys)]` for controlled
expansion. `rowGroupExpansionChange` reports the group, rows, index, expanded
state, and native event.

```html
<neural-table [value]="products" [columns]="columns" groupRowsBy="category" expandableRowGroups [(expandedRowGroupKeys)]="expandedGroups">
  <ng-template neuralTableGroupHeader let-value let-toggle="toggle">
    <neural-button [label]="value" variant="text" (clicked)="toggle($event)" />
  </ng-template>
  <ng-template neuralTableGroupFooter let-aggregate="aggregate"> Total: {{ aggregate('price', 'sum') }} </ng-template>
</neural-table>
```

Both typed group templates expose `$implicit`/group value, `key`, `rows`,
`groupIndex`, `firstRowIndex`, `expanded`, `toggle`, and `aggregate`.
Aggregation operations are `sum`, `average`, `min`, and `max`. The standalone
`aggregateNeuralTableRows` and `aggregateNeuralTableValues` helpers are also
exported for application-owned summaries.

Use `rowGroupMode="rowspan"` when the grouping path matches a visible column.
Table renders that column once per group with native `rowspan`. A final
`neuralTableFooter` can be frozen with `stickyFooter` and `scrollHeight`.

## Versioned state and persistence

`captureState()` returns a versioned `NeuralTableState` containing paging,
sorts, filters, global filter, column order, pixel widths, hidden columns,
selection keys, expanded row keys, and expanded group keys. The snapshot uses
plain JSON values and never includes row objects or browser-only handles.

Use `serializeState()` for `URLSearchParams`, router query parameters, or an
application store. `restoreState()` accepts the serialized JSON or a state
object, validates its version, removes unknown columns, restores client
selection from stable `rowKey` values, and emits `stateRestore`.

```ts
const params = new URLSearchParams();
params.set('table', table.serializeState());
table.restoreState(params.get('table')!);
```

Set `stateKey` to enable automatic persistence. `stateStorage` is `local`
(default), `session`, or `none`. Restore begins only after hydration, and all
browser storage access is platform-guarded and failure-tolerant.

Provide `stateAdapter` to replace browser storage. Its async-capable `load`,
`save`, and optional `remove` methods receive the state key and typed snapshot.
The adapter takes precedence over `stateStorage`. Call `clearStoredState()` to
remove the active persisted snapshot; custom adapters must implement `remove`
for this operation. Adapter writes are serialized, obsolete queued snapshots
are coalesced, and removal is ordered after an already-running save. Late loads
are ignored after the key changes or the component is destroyed.

`stateChange` now contains the complete snapshot, a change `reason`, and a
monotonically increasing `requestId`. Before applying a remote response, call
`table.isLatestRequest(event.requestId)`. This prevents slow older responses
from replacing newer data without coupling Table to a particular HTTP client.

## Loading skeleton

Set `loadingMode="skeleton"` and configure `loadingRows` to preserve table
geometry during a request. Skeleton rows are hidden from the accessibility
tree while the localized loading message is announced through a live region.
A custom `neuralTableLoading` template always takes precedence. In headless
mode only `neural-table-skeleton-*-root` hooks remain. Invalid non-finite
values fall back to five rows; finite values are clamped to `1..1000`.

## Public API inventory

Inputs and models:

- Data: `value`, `columns`, `dataMode`, `rowKey`, `totalItems`.
- Transform state: `sort`, `sortMode`, `filters`, `globalFilter`, `filterDelay`,
  `pageIndex`, `pageSize`, `paginate`.
- Selection/expansion: `selectionMode`, `selectionControl`, `selection`,
  `selectionKeys`, `selectableRow`, `selectOnRowClick`, `selectAllMode`,
  `selectAllKeys`, `expandedRowKeys`.
- Editing: `editMode`, `editValidator`.
- Grouping/summaries: `groupRowsBy`, `rowGroupMode`, `expandableRowGroups`,
  `expandedRowGroupKeys`, `headerGroups`, `footerGroups`.
- Layout: `columnWidths`, `hiddenColumnIds`, `columnOrder`,
  `resizableColumns`, `reorderableColumns`, `columnResizeMode`,
  `minColumnWidth`, `columnResizeStep`, `scrollHeight`, `stickyHeader`,
  `stickyFooter`.
- States/styles: `loading`, `loadingMode`, `loadingRows`, `error`, `disabled`,
  `striped`, `hoverable`, `gridlines`, `density`, `caption`, `labels`,
  `unstyled`, `tableClass`, `classes`.
- Accessible naming: `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`.
- Persistence: `stateKey`, `stateStorage`, `stateAdapter`.

Outputs:

- Data interaction: `sortEvent`, `filterEvent`, `stateChange`, `stateRestore`.
- Selection/rows: `selectionEvent`, `rowSelect`, `rowUnselect`, `rowClick`,
  `rowDoubleClick`, `expansionChange`, `rowGroupExpansionChange`.
- Editing: `cellEditStart`, `cellEditComplete`, `cellEditCancel`,
  `rowEditStart`, `rowEditSave`, `rowEditCancel`.
- Layout: `columnResize`, `columnVisibilityChange`, `columnReorder`.

Imperative methods intended for application integration include
`clearFilters`, `setFilters`, `setPage`, `startCellEdit`, `startRowEdit`,
`saveEdit`, `cancelEdit`, `setColumnVisibility`, `toggleColumnVisibility`,
`showAllColumns`, `captureState`, `serializeState`, `restoreState`,
`clearStoredState`, and `isLatestRequest`.

## Accessibility and verification

Table intentionally keeps native `<table>`, row group, heading, footer,
caption, checkbox/radio, and button semantics; it does not opt into
`role="grid"`. Sorting exposes `aria-sort`, resize handles are keyboard
operable separators, selection uses roving focus, grouped disclosure controls
expose expansion state, validation errors use alerts, and loading is announced
without exposing decorative skeleton rows.

The beta gate covers unit tests, SSR/prerender, Chromium, Firefox, WebKit, and
automated axe scans of the primary styled, editable, grouped, persistent,
loading, and unstyled examples. Automated checks complement—rather than
replace—screen-reader and keyboard testing.

## Beta boundaries

Deferred beyond the current beta: virtual scrolling, tree table, data export,
column context menus, server-owned grouping, and responsive card conversion.
See `CHANGELOG.md` and `SIZE.md` for the frozen contract and current
package/style measurements.
