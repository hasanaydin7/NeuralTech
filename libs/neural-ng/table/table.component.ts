import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  PLATFORM_ID,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralCheckbox,
  type NeuralCheckboxClasses,
} from '@neural-ng/core/checkbox';
import { NeuralInput } from '@neural-ng/core/input';
import {
  NeuralRadioGroup,
  type NeuralRadioClasses,
} from '@neural-ng/core/radio';
import { NeuralSelect } from '@neural-ng/core/select';
import type { NeuralSelectClasses } from '@neural-ng/core/select';
import {
  filterNeuralTableRows,
  aggregateNeuralTableRows,
  paginateNeuralTableRows,
  resolveNeuralTablePath,
  resolveNeuralTableValue,
  sortNeuralTableRows,
} from './table-data-engine';
import {
  NEURAL_TABLE_STATE_VERSION,
  parseNeuralTableState,
  serializeNeuralTableState,
} from './table-state';
import {
  NeuralTableCellDirective,
  NeuralTableEmptyDirective,
  NeuralTableEditorDirective,
  NeuralTableErrorDirective,
  NeuralTableExpansionDirective,
  NeuralTableGroupFooterDirective,
  NeuralTableGroupHeaderDirective,
  NeuralTableFilterDirective,
  NeuralTableFooterDirective,
  NeuralTableFooterGroupDirective,
  NeuralTableHeaderDirective,
  NeuralTableHeaderGroupDirective,
  NeuralTableLoadingDirective,
} from './table-templates';
import type {
  NeuralTableCellContext,
  NeuralTableClasses,
  NeuralTableColumn,
  NeuralTableColumnOrder,
  NeuralTableColumnReorderEvent,
  NeuralTableColumnResizeEvent,
  NeuralTableColumnResizeMode,
  NeuralTableColumnVisibilityChange,
  NeuralTableColumnWidths,
  NeuralTableDataMode,
  NeuralTableDensity,
  NeuralTableEditEvent,
  NeuralTableEditMode,
  NeuralTableEditValidator,
  NeuralTableEditorContext,
  NeuralTableExpansionChange,
  NeuralTableFilter,
  NeuralTableFilterContext,
  NeuralTableFilterEvent,
  NeuralTableFilterOption,
  NeuralTableFooterContext,
  NeuralTableFooterGroupContext,
  NeuralTableHeaderContext,
  NeuralTableHeaderGroup,
  NeuralTableHeaderGroupContext,
  NeuralTableLabels,
  NeuralTableRowEvent,
  NeuralTableRowEditEvent,
  NeuralTableRowGroup,
  NeuralTableRowGroupContext,
  NeuralTableRowGroupExpansionChange,
  NeuralTableRowGroupMode,
  NeuralTableRowKey,
  NeuralTableSelectionChange,
  NeuralTableSelectionControl,
  NeuralTableSelectionMode,
  NeuralTableSelectAllMode,
  NeuralTableSort,
  NeuralTableSortEvent,
  NeuralTableSortMode,
  NeuralTableStateChange,
  NeuralTableState,
  NeuralTableStateAdapter,
  NeuralTableStateRestoreEvent,
  NeuralTableStateStorage,
  NeuralTableLoadingMode,
  NeuralTableStateContext,
} from './table.types';

interface NeuralTableResizeSession<T> {
  readonly pointerId: number;
  readonly column: NeuralTableColumn<T>;
  readonly neighbor: NeuralTableColumn<T> | null;
  readonly startX: number;
  readonly direction: 1 | -1;
  readonly startWidth: number;
  readonly neighborStartWidth: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly neighborMinWidth: number;
  readonly neighborMaxWidth: number;
  readonly initialWidths: NeuralTableColumnWidths;
  width: number;
}

type NeuralTableDropPosition = 'before' | 'after';

interface NeuralTableActiveDrop {
  readonly columnId: string;
  readonly position: NeuralTableDropPosition;
}

interface NeuralTableResolvedGroupCell {
  readonly id: string;
  readonly group: NeuralTableHeaderGroup | null;
  readonly colspan: number;
  readonly rowspan: number;
}

interface NeuralTableReorderSession<T> {
  readonly pointerId: number;
  readonly source: NeuralTableColumn<T>;
  readonly startX: number;
  readonly startY: number;
  active: boolean;
}

interface NeuralTableActiveEdit<T> {
  readonly row: T;
  readonly rowIndex: number;
  readonly rowIdentity: NeuralTableRowKey;
  readonly columnId: string | null;
}

interface NeuralTableResolvedRowGroup<T> extends NeuralTableRowGroup<T> {
  readonly lastRowIndex: number;
}

@Component({
  selector: 'neural-table',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NeuralButton,
    NeuralCheckbox,
    NeuralInput,
    NeuralRadioGroup,
    NeuralSelect,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './table.component.scss',
  host: {
    '[class]': 'rootClass()',
    '[attr.data-neural-density]': 'density()',
    '[attr.data-neural-loading]': 'loading()',
    '[attr.data-neural-empty]': 'isEmpty()',
    '[attr.data-neural-error]': 'error() ? true : null',
  },
  template: `
    <div
      [class]="scrollClass()"
      [style.max-height]="scrollHeight() || null"
      [attr.data-neural-scrollable]="scrollHeight() ? true : null"
    >
      <table
        [class]="tableElementClass()"
        [style.width]="resizedTableWidth()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledby() || null"
        [attr.aria-describedby]="ariaDescribedby() || null"
        [attr.aria-busy]="loading()"
        [attr.data-neural-striped]="striped()"
        [attr.data-neural-hoverable]="hoverable()"
        [attr.data-neural-gridlines]="gridlines()"
        [attr.data-neural-resizable]="resizableColumns()"
        [attr.data-neural-resize-mode]="columnResizeMode()"
        [attr.data-neural-selection-control]="
          selectionMode() === 'none' ? null : resolvedSelectionControl()
        "
      >
        @if (caption()) {
          <caption [class]="captionClass()">
            {{
              caption()
            }}
          </caption>
        }
        <colgroup>
          @if (selectionMode() !== 'none') {
            <col class="neural-table-control-column-root" />
          }
          @if (hasExpansion()) {
            <col class="neural-table-control-column-root" />
          }
          @for (column of visibleColumns(); track column.id) {
            <col
              [style.width]="columnWidth(column)"
              [style.min-width]="column.minWidth ?? null"
              [style.max-width]="column.maxWidth ?? null"
            />
          }
        </colgroup>
        <thead [class]="headerClass()">
          @for (groupRow of headerGroupRows(); track $index) {
            <tr [class]="headerGroupRowClass()">
              @if (controlColumnCount() > 0) {
                <th
                  aria-hidden="true"
                  [class]="headerGroupCellClass(null)"
                  [attr.colspan]="controlColumnCount()"
                ></th>
              }
              @for (cell of groupRow; track cell.id) {
                <th
                  scope="colgroup"
                  [class]="headerGroupCellClass(cell.group)"
                  [attr.colspan]="cell.colspan"
                  [attr.rowspan]="cell.rowspan > 1 ? cell.rowspan : null"
                  [attr.data-neural-header-group]="cell.group?.id ?? null"
                >
                  @if (cell.group) {
                    @if (headerGroupTemplate(cell.group); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template.templateRef"
                        [ngTemplateOutletContext]="headerGroupContext(cell)"
                      />
                    } @else {
                      {{ cell.group.header }}
                    }
                  }
                </th>
              }
            </tr>
          }
          <tr [class]="headerRowClass()">
            @if (selectionMode() !== 'none') {
              @if (selectionMode() === 'multiple') {
                <th
                  scope="col"
                  [class]="controlHeaderCellClass()"
                  data-neural-table-selection-header
                >
                  @if (resolvedSelectionControl() === 'checkbox') {
                    <neural-checkbox
                      unstyled
                      [inputClass]="selectionControlClass()"
                      [classes]="selectionCheckboxClasses"
                      [checked]="allVisibleSelected()"
                      [indeterminate]="someVisibleSelected()"
                      [disabled]="disabled() || selectionScopeSize() === 0"
                      [ariaLabel]="selectAllAriaLabel()"
                      (stateChange)="toggleAll($event.nativeEvent)"
                    />
                  }
                </th>
              } @else {
                <td
                  [class]="controlHeaderCellClass()"
                  data-neural-table-selection-header
                ></td>
              }
            }
            @if (hasExpansion()) {
              <th scope="col" [class]="controlHeaderCellClass()">
                <span class="neural-table-sr-only-root">
                  {{ resolvedLabels().rowExpansion }}
                </span>
              </th>
            }
            @for (column of visibleColumns(); track column.id) {
              <th
                scope="col"
                [class]="headerCellClass(column)"
                [attr.aria-sort]="ariaSort(column)"
                [attr.data-neural-column]="column.id"
                [attr.data-neural-align]="column.align ?? 'start'"
                [attr.data-neural-sticky]="column.sticky ?? null"
                [attr.data-neural-drop-position]="dropPosition(column)"
                [style.width]="columnWidth(column)"
                [style.min-width]="column.minWidth ?? null"
                [style.max-width]="column.maxWidth ?? null"
                [style.inset-inline-start]="
                  column.sticky === 'start' ? stickyOffset(column) : null
                "
                [style.inset-inline-end]="
                  column.sticky === 'end' ? stickyOffset(column) : null
                "
              >
                @if (reorderableColumns() && column.reorderable !== false) {
                  <neural-button
                    [unstyled]="true"
                    [buttonClass]="reorderHandleClass()"
                    [disabled]="disabled()"
                    [ariaLabel]="reorderAriaLabel(column)"
                    [title]="reorderAriaLabel(column)"
                    ariaKeyShortcuts="ArrowLeft ArrowRight"
                    [attr.data-neural-reorder-column]="column.id"
                    (clicked)="$event.stopPropagation()"
                    (pointerDown)="startPointerColumnReorder(column, $event)"
                    (pointerMove)="movePointerColumnReorder($event)"
                    (pointerUp)="endPointerColumnReorder($event)"
                    (pointerCancel)="cancelPointerColumnReorder($event)"
                    (keydown)="reorderColumnWithKeyboard(column, $event)"
                  />
                }
                @if (column.sortable) {
                  <neural-button
                    [unstyled]="true"
                    [buttonClass]="sortButtonClass()"
                    [disabled]="disabled()"
                    [ariaLabel]="sortAriaLabel(column)"
                    (clicked)="toggleSort(column, $event)"
                  >
                    @if (headerTemplate(column); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template.templateRef"
                        [ngTemplateOutletContext]="headerContext(column)"
                      />
                    } @else {
                      {{ column.header }}
                    }
                    <span
                      [class]="sortIconClasses(column)"
                      [attr.data-neural-sort-direction]="
                        currentSort(column)?.direction ?? 'none'
                      "
                      aria-hidden="true"
                    ></span>
                  </neural-button>
                } @else {
                  @if (headerTemplate(column); as template) {
                    <ng-container
                      [ngTemplateOutlet]="template.templateRef"
                      [ngTemplateOutletContext]="headerContext(column)"
                    />
                  } @else {
                    {{ column.header }}
                  }
                }
                @if (resizableColumns() && column.resizable !== false) {
                  <span
                    role="separator"
                    tabindex="0"
                    aria-orientation="vertical"
                    [class]="resizeHandleClass()"
                    [attr.aria-label]="resizeAriaLabel(column)"
                    [attr.aria-valuenow]="columnWidthValue(column)"
                    [attr.aria-valuemin]="columnMinWidthValue(column)"
                    [attr.aria-valuemax]="columnMaxWidthValue(column)"
                    [attr.title]="resizeAriaLabel(column)"
                    [attr.data-neural-resize-column]="column.id"
                    (pointerdown)="startColumnResize(column, $event)"
                    (pointermove)="moveColumnResize($event)"
                    (pointerup)="endColumnResize($event)"
                    (pointercancel)="cancelColumnResize($event)"
                    (dblclick)="autoSizeColumn(column, $event)"
                    (keydown)="resizeColumnWithKeyboard(column, $event)"
                  ></span>
                }
              </th>
            }
          </tr>
          @if (hasFilterableColumns()) {
            <tr [class]="filterRowClass()">
              @if (selectionMode() !== 'none') {
                <td [class]="controlFilterCellClass()"></td>
              }
              @if (hasExpansion()) {
                <td [class]="controlFilterCellClass()"></td>
              }
              @for (column of visibleColumns(); track column.id) {
                <td
                  [class]="filterCellClass(column)"
                  [attr.data-neural-column]="column.id"
                  [attr.data-neural-sticky]="column.sticky ?? null"
                  [style.inset-inline-start]="
                    column.sticky === 'start' ? stickyOffset(column) : null
                  "
                  [style.inset-inline-end]="
                    column.sticky === 'end' ? stickyOffset(column) : null
                  "
                >
                  @if (column.filterable) {
                    @if (filterTemplate(column); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template.templateRef"
                        [ngTemplateOutletContext]="filterContext(column)"
                      />
                    } @else if (filterMatchMode(column) === 'between') {
                      <span [class]="filterRangeClass()">
                        <input
                          neuralInput
                          unstyled
                          [type]="filterInputType(column)"
                          [class]="filterControlClass()"
                          [value]="filterRangeValue(column, 0)"
                          [placeholder]="filterAriaLabel(column, 'filterFrom')"
                          [attr.aria-label]="
                            filterAriaLabel(column, 'filterFrom')
                          "
                          [disabled]="disabled()"
                          (input)="onRangeFilterInput(column, 0, $event)"
                        />
                        <input
                          neuralInput
                          unstyled
                          [type]="filterInputType(column)"
                          [class]="filterControlClass()"
                          [value]="filterRangeValue(column, 1)"
                          [placeholder]="filterAriaLabel(column, 'filterTo')"
                          [attr.aria-label]="
                            filterAriaLabel(column, 'filterTo')
                          "
                          [disabled]="disabled()"
                          (input)="onRangeFilterInput(column, 1, $event)"
                        />
                      </span>
                    } @else if (
                      column.filterType === 'select' ||
                      column.filterType === 'boolean'
                    ) {
                      <neural-select
                        fluid
                        appendTo="body"
                        optionLabel="label"
                        optionValue="value"
                        [options]="filterSelectOptions(column)"
                        [value]="selectFilterValue(column)"
                        [classes]="builtInFilterSelectClasses()"
                        [unstyled]="unstyled()"
                        [placeholder]="resolvedLabels().filterAll"
                        [ariaLabel]="filterAriaLabel(column)"
                        [disabled]="disabled()"
                        (valueChange)="onSelectFilterValue(column, $event)"
                      />
                    } @else {
                      <input
                        neuralInput
                        unstyled
                        [type]="filterInputType(column)"
                        [class]="filterControlClass()"
                        [value]="filterControlValue(column)"
                        [placeholder]="
                          column.filterPlaceholder ?? column.header
                        "
                        [attr.aria-label]="filterAriaLabel(column)"
                        [disabled]="disabled()"
                        (input)="onFilterInput(column, $event)"
                      />
                    }
                  }
                </td>
              }
            </tr>
          }
        </thead>
        <tbody [class]="bodyClass()">
          @if (loading()) {
            @if (loadingMode() === 'skeleton' && !loadingTemplate()) {
              @for (_ of skeletonRows(); track $index) {
                <tr [class]="skeletonRowClass()" aria-hidden="true">
                  @for (_ of skeletonControlCells(); track $index) {
                    <td [class]="skeletonCellClass()">
                      <span [class]="skeletonLineClass()"></span>
                    </td>
                  }
                  @for (column of visibleColumns(); track column.id) {
                    <td
                      [class]="skeletonCellClass()"
                      [attr.data-neural-column]="column.id"
                    >
                      <span
                        [class]="skeletonLineClass()"
                        [style.inline-size.%]="skeletonLineWidth($index)"
                      ></span>
                    </td>
                  }
                </tr>
              }
            } @else {
              <ng-container
                [ngTemplateOutlet]="
                  loadingTemplate()?.templateRef ?? defaultState
                "
                [ngTemplateOutletContext]="
                  stateContext(resolvedLabels().loading)
                "
              />
            }
          } @else if (error()) {
            <ng-container
              [ngTemplateOutlet]="errorTemplate()?.templateRef ?? defaultState"
              [ngTemplateOutletContext]="
                stateContext(error() || resolvedLabels().error)
              "
            />
          } @else if (isEmpty()) {
            <ng-container
              [ngTemplateOutlet]="emptyTemplate()?.templateRef ?? defaultState"
              [ngTemplateOutletContext]="stateContext(resolvedLabels().empty)"
            />
          } @else {
            @for (
              row of displayRows();
              track rowIdentity(row, $index);
              let rowIndex = $index
            ) {
              @if (
                rowGroupMode() === 'subheader' && isFirstRowInGroup(rowIndex);
                as firstInGroup
              ) {
                @if (firstInGroup) {
                  <tr
                    [class]="groupHeaderRowClass()"
                    [attr.data-neural-group-key]="rowGroupAt(rowIndex)?.key"
                  >
                    <th
                      scope="rowgroup"
                      [class]="groupHeaderCellClass()"
                      [attr.colspan]="columnCount()"
                    >
                      @if (groupHeaderTemplate(); as template) {
                        <ng-container
                          [ngTemplateOutlet]="template.templateRef"
                          [ngTemplateOutletContext]="rowGroupContext(rowIndex)"
                        />
                      } @else {
                        @if (expandableRowGroups()) {
                          <neural-button
                            [unstyled]="true"
                            [buttonClass]="groupToggleClass()"
                            [ariaExpanded]="
                              isRowGroupExpanded(rowIndex) ? 'true' : 'false'
                            "
                            [ariaLabel]="rowGroupLabel(rowIndex)"
                            (clicked)="toggleRowGroup(rowIndex, $event)"
                          >
                            <span
                              class="neural-table-group-toggle-icon-root"
                              aria-hidden="true"
                            ></span>
                            <span>{{ rowGroupAt(rowIndex)?.value }}</span>
                            <span class="neural-table-group-count-root">{{
                              rowGroupAt(rowIndex)?.rows?.length
                            }}</span>
                          </neural-button>
                        } @else {
                          <span>{{ rowGroupAt(rowIndex)?.value }}</span>
                          <span class="neural-table-group-count-root">{{
                            rowGroupAt(rowIndex)?.rows?.length
                          }}</span>
                        }
                      }
                    </th>
                  </tr>
                }
              }
              <tr
                [class]="rowClass(row, rowIndex)"
                [hidden]="isRowHiddenByGroup(rowIndex)"
                [attr.aria-selected]="
                  selectionMode() === 'none' ? null : isSelected(row)
                "
                [attr.aria-disabled]="
                  selectionMode() === 'none' || isRowSelectable(row, rowIndex)
                    ? null
                    : 'true'
                "
                [attr.data-neural-selected]="isSelected(row) || null"
                [attr.data-neural-selectable]="
                  selectionMode() === 'none'
                    ? null
                    : isRowSelectable(row, rowIndex)
                "
                [attr.data-neural-row-index]="rowIndex"
                [attr.tabindex]="rowTabIndex(row, rowIndex)"
                (focus)="focusRow(row, rowIndex)"
                (keydown)="handleRowKeydown(row, rowIndex, $event)"
                (click)="handleRowClick(row, rowIndex, $event)"
                (dblclick)="
                  rowDoubleClick.emit({ row, rowIndex, nativeEvent: $event })
                "
              >
                @if (selectionMode() !== 'none') {
                  <td [class]="selectionCellClass()">
                    @if (resolvedSelectionControl() === 'checkbox') {
                      <neural-checkbox
                        unstyled
                        [inputClass]="selectionControlClass()"
                        [classes]="selectionCheckboxClasses"
                        [checked]="isSelected(row)"
                        [disabled]="!isRowSelectable(row, rowIndex)"
                        [ariaLabel]="rowLabel('selectRow', rowIndex)"
                        (stateChange)="
                          toggleRow(
                            row,
                            rowIndex,
                            $event.nativeEvent,
                            'control'
                          )
                        "
                      />
                    } @else {
                      <neural-radio-group
                        unstyled
                        orientation="horizontal"
                        [classes]="selectionRadioClasses"
                        [options]="radioSelectionOption(row, rowIndex)"
                        optionLabel="label"
                        optionValue="value"
                        [value]="
                          isSelected(row) ? rowIdentity(row, rowIndex) : null
                        "
                        [disabled]="!isRowSelectable(row, rowIndex)"
                        [ariaLabel]="rowLabel('selectRow', rowIndex)"
                        (selectionChange)="toggleRowFromRadio(row, rowIndex)"
                      />
                    }
                  </td>
                }
                @if (hasExpansion()) {
                  <td [class]="expansionCellClass()">
                    <neural-button
                      [unstyled]="true"
                      [buttonClass]="expansionButtonClass()"
                      [disabled]="disabled()"
                      [ariaExpanded]="
                        isExpanded(row, rowIndex) ? 'true' : 'false'
                      "
                      [ariaLabel]="
                        rowLabel(
                          isExpanded(row, rowIndex)
                            ? 'collapseRow'
                            : 'expandRow',
                          rowIndex
                        )
                      "
                      (clicked)="toggleExpansion(row, rowIndex, $event)"
                    >
                      <span
                        class="neural-table-expansion-icon-root"
                        aria-hidden="true"
                        >{{ isExpanded(row, rowIndex) ? '−' : '+' }}</span
                      >
                    </neural-button>
                  </td>
                }
                @for (column of visibleColumns(); track column.id) {
                  @if (shouldRenderGroupCell(column, rowIndex)) {
                    <td
                      [class]="cellClass(column, row, rowIndex)"
                      [attr.rowspan]="groupCellRowspan(column, rowIndex)"
                      [attr.data-neural-column]="column.id"
                      [attr.data-neural-align]="column.align ?? 'start'"
                      [attr.data-neural-sticky]="column.sticky ?? null"
                      [style.inset-inline-start]="
                        column.sticky === 'start' ? stickyOffset(column) : null
                      "
                      [style.inset-inline-end]="
                        column.sticky === 'end' ? stickyOffset(column) : null
                      "
                      [attr.data-neural-editable]="
                        isCellEditable(column, row, rowIndex) || null
                      "
                      [attr.data-neural-editing]="
                        isCellEditing(column, row, rowIndex) || null
                      "
                      [attr.data-neural-readonly]="
                        isCellReadOnly(column, row, rowIndex) || null
                      "
                      [attr.data-neural-disabled]="
                        isCellDisabled(column, row, rowIndex) || null
                      "
                      [attr.aria-disabled]="
                        isCellDisabled(column, row, rowIndex) ? 'true' : null
                      "
                      [attr.tabindex]="
                        isCellEditable(column, row, rowIndex) ? 0 : null
                      "
                      (click)="handleCellClick(row, rowIndex, column, $event)"
                      (dblclick)="startCellEdit(row, rowIndex, column, $event)"
                      (keydown)="
                        handleCellKeydown(row, rowIndex, column, $event)
                      "
                    >
                      @if (
                        isCellEditing(column, row, rowIndex) &&
                          editorTemplate(column);
                        as editor
                      ) {
                        <div
                          [class]="editorClass()"
                          [attr.aria-busy]="editLoading()"
                        >
                          <ng-container
                            [ngTemplateOutlet]="editor.templateRef"
                            [ngTemplateOutletContext]="
                              editorContext(column, row, rowIndex)
                            "
                          />
                          @if (
                            editError() &&
                            shouldShowEditError(column, row, rowIndex)
                          ) {
                            <span [class]="editErrorClass()" role="alert">
                              {{ editError() }}
                            </span>
                          }
                        </div>
                      } @else if (cellTemplate(column); as template) {
                        <ng-container
                          [ngTemplateOutlet]="template.templateRef"
                          [ngTemplateOutletContext]="
                            cellContext(column, row, rowIndex)
                          "
                        />
                      } @else {
                        {{ formattedValue(column, row, rowIndex) }}
                      }
                    </td>
                  }
                }
              </tr>
              @if (hasExpansion() && isExpanded(row, rowIndex)) {
                <tr
                  [class]="expansionRowClass()"
                  [hidden]="isRowHiddenByGroup(rowIndex)"
                >
                  <td
                    [class]="expansionContentClass()"
                    [attr.colspan]="columnCount()"
                  >
                    <ng-container
                      [ngTemplateOutlet]="
                        expansionTemplate()?.templateRef ?? null
                      "
                      [ngTemplateOutletContext]="{
                        $implicit: row,
                        row,
                        rowIndex,
                      }"
                    />
                  </td>
                </tr>
              }
              @if (
                rowGroupMode() === 'subheader' &&
                  isLastRowInGroup(rowIndex) &&
                  isRowGroupExpanded(rowIndex) &&
                  groupFooterTemplate();
                as groupFooter
              ) {
                <tr
                  [class]="groupFooterRowClass()"
                  [attr.data-neural-group-key]="rowGroupAt(rowIndex)?.key"
                >
                  <td
                    [class]="groupFooterCellClass()"
                    [attr.colspan]="columnCount()"
                  >
                    <ng-container
                      [ngTemplateOutlet]="groupFooter.templateRef"
                      [ngTemplateOutletContext]="rowGroupContext(rowIndex)"
                    />
                  </td>
                </tr>
              }
            }
          }
        </tbody>
        @if (hasFooter()) {
          <tfoot [class]="footerClass()">
            @for (groupRow of footerGroupRows(); track $index) {
              <tr [class]="footerGroupRowClass()">
                @if (controlColumnCount() > 0) {
                  <th
                    aria-hidden="true"
                    [class]="footerGroupCellClass(null)"
                    [attr.colspan]="controlColumnCount()"
                  ></th>
                }
                @for (cell of groupRow; track cell.id) {
                  <th
                    scope="colgroup"
                    [class]="footerGroupCellClass(cell.group)"
                    [attr.colspan]="cell.colspan"
                    [attr.rowspan]="cell.rowspan > 1 ? cell.rowspan : null"
                    [attr.data-neural-footer-group]="cell.group?.id ?? null"
                  >
                    @if (cell.group) {
                      @if (footerGroupTemplate(cell.group); as template) {
                        <ng-container
                          [ngTemplateOutlet]="template.templateRef"
                          [ngTemplateOutletContext]="footerGroupContext(cell)"
                        />
                      } @else {
                        {{ cell.group.header }}
                      }
                    }
                  </th>
                }
              </tr>
            }
            @if (hasLeafFooter()) {
              <tr [class]="footerRowClass()">
                @if (selectionMode() !== 'none') {
                  <td [class]="footerCellClass(null)"></td>
                }
                @if (hasExpansion()) {
                  <td [class]="footerCellClass(null)"></td>
                }
                @for (column of visibleColumns(); track column.id) {
                  <td
                    [class]="footerCellClass(column)"
                    [attr.data-neural-column]="column.id"
                    [attr.data-neural-align]="column.align ?? 'start'"
                    [attr.data-neural-sticky]="column.sticky ?? null"
                    [style.inset-inline-start]="
                      column.sticky === 'start' ? stickyOffset(column) : null
                    "
                    [style.inset-inline-end]="
                      column.sticky === 'end' ? stickyOffset(column) : null
                    "
                  >
                    @if (footerTemplate(column); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template.templateRef"
                        [ngTemplateOutletContext]="footerContext(column)"
                      />
                    } @else {
                      {{ column.footer ?? '' }}
                    }
                  </td>
                }
              </tr>
            }
          </tfoot>
        }
      </table>
    </div>
    <span class="neural-table-live-region-root" aria-live="polite">
      {{ reorderAnnouncement() }}
    </span>
    <span class="neural-table-sr-only-root" aria-live="polite">
      {{ loading() ? resolvedLabels().loading : '' }}
    </span>

    <ng-template #defaultState let-message="message">
      <tr [class]="stateRowClass()">
        <td [class]="stateCellClass()" [attr.colspan]="columnCount()">
          <span [class]="activeStateClass()">{{ message }}</span>
        </td>
      </tr>
    </ng-template>
  `,
})
export class NeuralTable<T = unknown> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly locale = inject(NeuralLocaleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly browserReady = signal(false);
  private readonly restoredPersistenceKey = signal<string | null>(null);
  private persistenceSequence = 0;
  private cancelPersistenceLoad: (() => void) | null = null;
  private clearedPersistenceSnapshot: string | null = null;
  private readonly persistenceWriter = {
    version: 0,
    destroyed: false,
    queue: Promise.resolve(),
  };
  private readonly filterTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly filterDrafts = signal<Readonly<Record<string, unknown>>>({});
  private resizeSession: NeuralTableResizeSession<T> | null = null;
  private reorderSession: NeuralTableReorderSession<T> | null = null;
  private readonly activeDrop = signal<NeuralTableActiveDrop | null>(null);
  private readonly selectionAnchor = signal<NeuralTableRowKey | null>(null);
  private readonly focusedRow = signal<NeuralTableRowKey | null>(null);
  private readonly activeEdit = signal<NeuralTableActiveEdit<T> | null>(null);
  private readonly editDraft = signal<Readonly<Record<string, unknown>>>({});
  private editValidationSequence = 0;
  private destroyed = false;
  private resolveDestroyed!: () => void;
  private readonly destroyedSignal = new Promise<void>((resolve) => {
    this.resolveDestroyed = resolve;
  });
  readonly editLoading = signal(false);
  readonly editError = signal<string | null>(null);

  readonly value = input<readonly T[]>([]);
  readonly columns = input.required<readonly NeuralTableColumn<T>[]>();
  readonly rowKey = input<
    keyof T | string | ((row: T) => NeuralTableRowKey) | null
  >(null);
  readonly dataMode = input<NeuralTableDataMode>('client');
  readonly stateKey = input<string | null>(null);
  readonly stateStorage = input<NeuralTableStateStorage>('local');
  readonly stateAdapter = input<NeuralTableStateAdapter | null>(null);
  readonly groupRowsBy = input<
    keyof T | string | ((row: T, rowIndex: number) => unknown) | null
  >(null);
  readonly rowGroupMode = input<NeuralTableRowGroupMode>('subheader');
  readonly expandableRowGroups = input(false, { transform: booleanAttribute });
  readonly expandedRowGroupKeys = model<readonly NeuralTableRowKey[]>([]);
  readonly sortMode = input<NeuralTableSortMode>('single');
  readonly selectionMode = input<NeuralTableSelectionMode>('none');
  readonly editMode = input<NeuralTableEditMode | null>(null);
  readonly editValidator = input<NeuralTableEditValidator<T> | null>(null);
  readonly selectionControl = input<NeuralTableSelectionControl>('auto');
  readonly selectAllMode = input<NeuralTableSelectAllMode>('page');
  readonly selectOnRowClick = input(true, { transform: booleanAttribute });
  readonly selectableRow = input<(row: T, rowIndex: number) => boolean>(
    () => true,
  );
  readonly selectAllKeys = input<readonly NeuralTableRowKey[]>([]);
  readonly sort = model<readonly NeuralTableSort[]>([]);
  readonly filters = model<readonly NeuralTableFilter[]>([]);
  readonly globalFilter = model<unknown>(null);
  readonly selection = model<readonly T[]>([]);
  readonly selectionKeys = model<readonly NeuralTableRowKey[]>([]);
  readonly expandedRowKeys = model<readonly NeuralTableRowKey[]>([]);
  readonly columnWidths = model<NeuralTableColumnWidths>({});
  readonly hiddenColumnIds = model<readonly string[]>([]);
  readonly columnOrder = model<NeuralTableColumnOrder>([]);
  readonly headerGroups = input<readonly NeuralTableHeaderGroup[]>([]);
  readonly footerGroups = input<readonly NeuralTableHeaderGroup[]>([]);
  readonly pageIndex = model(0);
  readonly pageSize = model(10);
  readonly paginate = input(false, { transform: booleanAttribute });
  readonly totalItems = input<number | null>(null);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingMode = input<NeuralTableLoadingMode>('message');
  readonly loadingRows = input(5, { transform: numberAttribute });
  readonly error = input<string | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly striped = input(false, { transform: booleanAttribute });
  readonly hoverable = input(true, { transform: booleanAttribute });
  readonly gridlines = input(false, { transform: booleanAttribute });
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  readonly stickyFooter = input(false, { transform: booleanAttribute });
  readonly scrollHeight = input('');
  readonly resizableColumns = input(false, { transform: booleanAttribute });
  readonly reorderableColumns = input(false, { transform: booleanAttribute });
  readonly columnResizeMode = input<NeuralTableColumnResizeMode>('fit');
  readonly minColumnWidth = input(64, { transform: numberAttribute });
  readonly columnResizeStep = input(8, { transform: numberAttribute });
  readonly filterDelay = input(250, { transform: numberAttribute });
  readonly density = input<NeuralTableDensity>('comfortable');
  readonly caption = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledby = input('');
  readonly ariaDescribedby = input('');
  readonly labels = input<Partial<NeuralTableLabels>>({});
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly tableClass = input('');
  readonly classes = input<NeuralTableClasses>({});
  readonly builtInFilterSelectClasses = computed<NeuralSelectClasses>(() => ({
    trigger: this.filterControlClass(),
  }));
  readonly selectionCheckboxClasses: NeuralCheckboxClasses = {
    control: 'neural-table-selection-proxy-root',
    label: 'neural-table-selection-proxy-root',
  };
  readonly selectionRadioClasses: NeuralRadioClasses = {
    root: 'neural-table-selection-radio-group-root',
    option: 'neural-table-selection-radio-option-root',
    input:
      'neural-table-selection-control-root neural-table-selection-control-base',
    control: 'neural-table-selection-proxy-root',
    label: 'neural-table-selection-proxy-root',
  };

  readonly sortEvent = output<NeuralTableSortEvent>();
  readonly filterEvent = output<NeuralTableFilterEvent>();
  readonly selectionEvent = output<NeuralTableSelectionChange<T>>();
  readonly rowSelect = output<NeuralTableRowEvent<T>>();
  readonly rowUnselect = output<NeuralTableRowEvent<T>>();
  readonly rowClick = output<NeuralTableRowEvent<T>>();
  readonly rowDoubleClick = output<NeuralTableRowEvent<T>>();
  readonly expansionChange = output<NeuralTableExpansionChange<T>>();
  readonly rowGroupExpansionChange =
    output<NeuralTableRowGroupExpansionChange<T>>();
  readonly columnResize = output<NeuralTableColumnResizeEvent<T>>();
  readonly columnVisibilityChange = output<NeuralTableColumnVisibilityChange>();
  readonly columnReorder = output<NeuralTableColumnReorderEvent<T>>();
  readonly stateChange = output<NeuralTableStateChange>();
  readonly stateRestore = output<NeuralTableStateRestoreEvent>();
  readonly cellEditStart = output<NeuralTableEditEvent<T>>();
  readonly cellEditComplete = output<NeuralTableEditEvent<T>>();
  readonly cellEditCancel = output<NeuralTableEditEvent<T>>();
  readonly rowEditStart = output<NeuralTableRowEditEvent<T>>();
  readonly rowEditSave = output<NeuralTableRowEditEvent<T>>();
  readonly rowEditCancel = output<NeuralTableRowEditEvent<T>>();

  readonly cellTemplates = contentChildren(NeuralTableCellDirective);
  readonly editorTemplates = contentChildren(NeuralTableEditorDirective);
  readonly headerTemplates = contentChildren(NeuralTableHeaderDirective);
  readonly headerGroupTemplates = contentChildren(
    NeuralTableHeaderGroupDirective,
  );
  readonly filterTemplates = contentChildren(NeuralTableFilterDirective);
  readonly footerTemplates = contentChildren(NeuralTableFooterDirective);
  readonly footerGroupTemplates = contentChildren(
    NeuralTableFooterGroupDirective,
  );
  readonly expansionTemplate = contentChild(NeuralTableExpansionDirective);
  readonly groupHeaderTemplate = contentChild(NeuralTableGroupHeaderDirective);
  readonly groupFooterTemplate = contentChild(NeuralTableGroupFooterDirective);
  readonly loadingTemplate = contentChild(NeuralTableLoadingDirective);
  readonly emptyTemplate = contentChild(NeuralTableEmptyDirective);
  readonly errorTemplate = contentChild(NeuralTableErrorDirective);

  readonly orderedColumns = computed(() => {
    const columns = this.columns();
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ordered = this.columnOrder()
      .map((id) => byId.get(id))
      .filter((column): column is NeuralTableColumn<T> => Boolean(column));
    const included = new Set(ordered.map((column) => column.id));
    return [
      ...ordered,
      ...columns.filter((column) => !included.has(column.id)),
    ];
  });
  private readonly hiddenColumnIdSet = computed(
    () => new Set(this.hiddenColumnIds()),
  );
  private readonly selectedKeySet = computed(() => {
    if (this.dataMode() === 'remote') {
      return new Set(this.selectionKeys());
    }
    return new Set(
      this.selection()
        .map((row) => this.keyFor(row))
        .filter((key): key is NeuralTableRowKey => key !== null),
    );
  });
  private readonly selectedRowSet = computed(() => new Set(this.selection()));
  private readonly expandedRowKeySet = computed(
    () => new Set(this.expandedRowKeys()),
  );
  private readonly expandedRowGroupKeySet = computed(
    () => new Set(this.expandedRowGroupKeys()),
  );
  readonly visibleColumns = computed(() =>
    this.orderedColumns().filter(
      (column) => !column.hidden && !this.hiddenColumnIdSet().has(column.id),
    ),
  );
  readonly headerGroupRows = computed(() =>
    this.resolveGroupRows(this.headerGroups()),
  );
  readonly footerGroupRows = computed(() =>
    this.resolveGroupRows(this.footerGroups()),
  );
  readonly resizedTableWidth = computed(() => {
    if (
      !this.resizableColumns() ||
      this.columnResizeMode() !== 'expand' ||
      this.visibleColumns().length === 0
    ) {
      return null;
    }
    const widths = this.visibleColumns().map(
      (column) => this.columnWidths()[column.id],
    );
    if (widths.some((width) => !Number.isFinite(width))) return null;
    const controls =
      (this.selectionMode() === 'none' ? 0 : 48) +
      (this.hasExpansion() ? 48 : 0);
    return `${widths.reduce((total, width) => total + width, controls)}px`;
  });
  readonly hasFilterableColumns = computed(() =>
    this.visibleColumns().some((column) => column.filterable),
  );
  readonly filteredRows = computed(() =>
    this.dataMode() === 'remote'
      ? [...this.value()]
      : filterNeuralTableRows(
          this.value(),
          this.visibleColumns(),
          this.filters(),
          this.globalFilter(),
        ),
  );
  readonly processedRows = computed(() =>
    this.dataMode() === 'remote'
      ? this.filteredRows()
      : sortNeuralTableRows(
          this.filteredRows(),
          this.visibleColumns(),
          this.sort(),
        ),
  );
  readonly ungroupedDisplayRows = computed(() =>
    this.paginate() && this.dataMode() === 'client'
      ? paginateNeuralTableRows(
          this.processedRows(),
          this.pageIndex(),
          this.pageSize(),
        )
      : this.processedRows(),
  );
  readonly rowGroups = computed<readonly NeuralTableResolvedRowGroup<T>[]>(
    () => {
      const groupBy = this.groupRowsBy();
      if (!groupBy) return [];
      const groups = new Map<
        NeuralTableRowKey,
        { value: unknown; rows: T[]; firstRowIndex: number }
      >();
      this.ungroupedDisplayRows().forEach((row, rowIndex) => {
        const value =
          typeof groupBy === 'function'
            ? groupBy(row, rowIndex)
            : resolveNeuralTablePath(row, String(groupBy));
        const key = this.toRowGroupKey(value);
        const group = groups.get(key);
        if (group) group.rows.push(row);
        else groups.set(key, { value, rows: [row], firstRowIndex: rowIndex });
      });
      let cursor = 0;
      return Array.from(groups.entries()).map(([key, group], groupIndex) => {
        const firstRowIndex = cursor;
        cursor += group.rows.length;
        return {
          key,
          value: group.value,
          rows: group.rows,
          groupIndex,
          firstRowIndex,
          lastRowIndex: cursor - 1,
        };
      });
    },
  );
  readonly displayRows = computed(() =>
    this.groupRowsBy()
      ? this.rowGroups().flatMap((group) => group.rows)
      : this.ungroupedDisplayRows(),
  );
  private readonly radioSelectionOptions = computed(() => {
    const options = new Map<
      NeuralTableRowKey,
      readonly { readonly value: NeuralTableRowKey; readonly label: string }[]
    >();
    this.displayRows().forEach((row, rowIndex) => {
      const value = this.rowIdentity(row, rowIndex);
      options.set(value, [{ value, label: '' }]);
    });
    return options;
  });
  readonly rowGroupIndex = computed(() => {
    const index = new Map<number, NeuralTableResolvedRowGroup<T>>();
    for (const group of this.rowGroups()) {
      for (
        let rowIndex = group.firstRowIndex;
        rowIndex <= group.lastRowIndex;
        rowIndex += 1
      ) {
        index.set(rowIndex, group);
      }
    }
    return index;
  });
  readonly resolvedTotalItems = computed(
    () => this.totalItems() ?? this.filteredRows().length,
  );
  readonly isEmpty = computed(
    () => !this.loading() && !this.error() && this.displayRows().length === 0,
  );
  readonly skeletonRows = computed(() => {
    const requested = Math.trunc(this.loadingRows());
    const length = Number.isFinite(requested)
      ? Math.min(1_000, Math.max(1, requested || 1))
      : 5;
    return Array.from({ length });
  });
  readonly skeletonControlCells = computed(() =>
    Array.from({ length: this.controlColumnCount() }),
  );
  readonly hasExpansion = computed(() => Boolean(this.expansionTemplate()));
  readonly columnCount = computed(
    () =>
      this.visibleColumns().length +
      (this.selectionMode() === 'none' ? 0 : 1) +
      (this.hasExpansion() ? 1 : 0),
  );
  readonly controlColumnCount = computed(
    () =>
      (this.selectionMode() === 'none' ? 0 : 1) + (this.hasExpansion() ? 1 : 0),
  );
  readonly hasLeafFooter = computed(
    () =>
      this.footerTemplates().length > 0 ||
      this.visibleColumns().some((column) => column.footer !== undefined),
  );
  readonly hasFooter = computed(
    () => this.footerGroupRows().length > 0 || this.hasLeafFooter(),
  );
  readonly resolvedLabels = computed<NeuralTableLabels>(() => ({
    ...this.locale.messages().table,
    ...this.labels(),
  }));
  readonly resolvedSelectionControl = computed<
    Exclude<NeuralTableSelectionControl, 'auto'>
  >(() => {
    const control = this.selectionControl();
    if (control !== 'auto') return control;
    return this.selectionMode() === 'single' ? 'radio' : 'checkbox';
  });
  readonly selectionScopeRows = computed(() => {
    if (this.dataMode() === 'remote') {
      return this.displayRows().filter((row, rowIndex) =>
        this.isRowSelectable(row, rowIndex),
      );
    }
    const rows =
      this.selectAllMode() === 'all'
        ? this.value()
        : this.selectAllMode() === 'filtered'
          ? this.processedRows()
          : this.displayRows();
    return rows.filter((row, rowIndex) => this.isRowSelectable(row, rowIndex));
  });
  readonly selectionScopeKeys = computed(() => {
    if (
      this.dataMode() === 'remote' &&
      this.selectAllMode() !== 'page' &&
      this.selectAllKeys().length > 0
    ) {
      return [...new Set(this.selectAllKeys())];
    }
    return this.selectionScopeRows()
      .map((row) => this.keyFor(row))
      .filter((key): key is NeuralTableRowKey => key !== null);
  });
  readonly selectionScopeSize = computed(() =>
    this.dataMode() === 'remote'
      ? this.selectionScopeKeys().length
      : this.selectionScopeRows().length,
  );
  readonly allVisibleSelected = computed(() => {
    if (this.dataMode() === 'remote') {
      const keys = this.selectionScopeKeys();
      const selectedKeys = this.selectedKeySet();
      return keys.length > 0 && keys.every((key) => selectedKeys.has(key));
    }
    const rows = this.selectionScopeRows();
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  });
  readonly someVisibleSelected = computed(() => {
    if (this.allVisibleSelected()) return false;
    return this.dataMode() === 'remote'
      ? this.selectionScopeKeys().some((key) => this.selectedKeySet().has(key))
      : this.selectionScopeRows().some((row) => this.isSelected(row));
  });
  readonly reorderAnnouncement = signal('');
  readonly latestRequestId = signal(0);
  readonly state = computed<NeuralTableState>(() => this.captureState());

  constructor() {
    let stabilitySubscription: { unsubscribe(): void } | null = null;
    if (this.isBrowser) {
      stabilitySubscription = this.applicationRef.isStable.subscribe(
        (stable) => {
          if (stable) this.browserReady.set(true);
        },
      );
    }
    effect(() => {
      const ready = this.browserReady();
      const key = this.stateKey();
      const storage = this.stateStorage();
      const adapter = this.stateAdapter();
      if (!ready || !this.isBrowser) return;
      this.persistenceWriter.version += 1;
      this.clearedPersistenceSnapshot = null;
      this.restoredPersistenceKey.set(null);
      void this.restorePersistedState(key, storage, adapter);
    });
    effect(() => {
      const ready = this.browserReady();
      const key = this.stateKey();
      const storage = this.stateStorage();
      const adapter = this.stateAdapter();
      const state = this.state();
      if (
        !ready ||
        !this.isBrowser ||
        !key ||
        this.restoredPersistenceKey() !== key ||
        (!adapter && storage === 'none')
      ) {
        return;
      }
      void this.persistState(key, state, storage, adapter);
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.resolveDestroyed();
      this.editValidationSequence += 1;
      this.persistenceWriter.destroyed = true;
      this.persistenceWriter.version += 1;
      this.cancelPersistenceLoad?.();
      this.cancelPersistenceLoad = null;
      stabilitySubscription?.unsubscribe();
      for (const timer of this.filterTimers.values()) clearTimeout(timer);
      this.filterTimers.clear();
    });
  }

  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-table-root',
      'neural-table-base',
      this.classes().root,
    ),
  );
  readonly scrollClass = computed(() =>
    this.composeClass(
      'neural-table-scroll-root',
      'neural-table-scroll-base',
      this.classes().scroll,
    ),
  );
  readonly tableElementClass = computed(() =>
    this.composeClass(
      'neural-table-table-root',
      'neural-table-table-base',
      this.tableClass(),
      this.classes().table,
    ),
  );
  readonly captionClass = computed(() =>
    this.composeClass(
      'neural-table-caption-root',
      'neural-table-caption-base',
      this.classes().caption,
    ),
  );
  readonly headerClass = computed(() =>
    this.composeClass(
      'neural-table-header-root',
      `neural-table-header-base ${
        this.stickyHeader() ? 'neural-table-sticky-header-root' : ''
      }`,
      this.classes().header,
    ),
  );
  readonly headerRowClass = computed(() =>
    this.composeClass(
      'neural-table-header-row-root',
      'neural-table-header-row-base',
      this.classes().headerRow,
    ),
  );
  readonly headerGroupRowClass = computed(() =>
    this.composeClass(
      'neural-table-header-group-row-root',
      'neural-table-header-group-row-base',
      this.classes().headerGroupRow,
    ),
  );
  readonly filterRowClass = computed(() =>
    this.composeClass(
      'neural-table-filter-row-root',
      'neural-table-filter-row-base',
      this.classes().filterRow,
    ),
  );
  readonly filterControlClass = computed(() =>
    this.composeClass(
      'neural-table-filter-control-root',
      'neural-table-filter-control-base',
      this.classes().filterControl,
    ),
  );
  readonly filterRangeClass = computed(() =>
    this.composeClass(
      'neural-table-filter-range-root',
      'neural-table-filter-range-base',
      this.classes().filterRange,
    ),
  );
  readonly sortButtonClass = computed(() =>
    this.composeClass(
      'neural-table-sort-button-root',
      'neural-table-sort-button-base',
      this.classes().sortButton,
    ),
  );
  readonly sortIconClass = computed(() =>
    this.composeClass(
      'neural-table-sort-icon-root',
      'neural-table-sort-icon-base',
      this.classes().sortIcon,
    ),
  );

  sortIconClasses(column: NeuralTableColumn<T>): string {
    const structuralClasses = this.sortIconClass();
    if (this.unstyled()) return structuralClasses;
    const direction = this.currentSort(column)?.direction;
    const iconClass =
      direction === 'asc'
        ? 'nt-sort-ascending'
        : direction === 'desc'
          ? 'nt-sort-descending'
          : 'nt-arrows-sort';
    return `${structuralClasses} nt ${iconClass}`;
  }
  readonly resizeHandleClass = computed(() =>
    this.composeClass(
      'neural-table-resize-handle-root',
      'neural-table-resize-handle-base',
      this.classes().resizeHandle,
    ),
  );
  readonly reorderHandleClass = computed(() =>
    this.composeClass(
      'neural-table-reorder-handle-root',
      'neural-table-reorder-handle-base',
      this.classes().reorderHandle,
    ),
  );
  readonly bodyClass = computed(() =>
    this.composeClass(
      'neural-table-body-root',
      'neural-table-body-base',
      this.classes().body,
    ),
  );
  readonly editorClass = computed(() =>
    this.composeClass(
      'neural-table-editor-root',
      'neural-table-editor-base',
      this.classes().editor,
    ),
  );
  readonly editErrorClass = computed(() =>
    this.composeClass(
      'neural-table-edit-error-root',
      'neural-table-edit-error-base',
      this.classes().editError,
    ),
  );
  readonly footerClass = computed(() =>
    this.composeClass(
      'neural-table-footer-root',
      `neural-table-footer-base ${
        this.stickyFooter() ? 'neural-table-sticky-footer-root' : ''
      }`,
      this.classes().footer,
    ),
  );
  readonly footerRowClass = computed(() =>
    this.composeClass(
      'neural-table-footer-row-root',
      'neural-table-footer-row-base',
      this.classes().footerRow,
    ),
  );
  readonly footerGroupRowClass = computed(() =>
    this.composeClass(
      'neural-table-footer-group-row-root',
      'neural-table-footer-group-row-base',
      this.classes().footerGroupRow,
    ),
  );
  readonly selectionCellClass = computed(() =>
    this.composeClass(
      'neural-table-cell-root neural-table-selection-cell-root',
      'neural-table-cell-base neural-table-selection-cell-base',
      this.classes().cell,
      this.classes().selectionCell,
    ),
  );
  readonly controlHeaderCellClass = computed(() =>
    this.composeClass(
      'neural-table-header-cell-root neural-table-control-header-cell-root',
      'neural-table-header-cell-base neural-table-control-header-cell-base',
      this.classes().headerCell,
    ),
  );
  readonly controlFilterCellClass = computed(() =>
    this.composeClass(
      'neural-table-filter-cell-root neural-table-control-filter-cell-root',
      'neural-table-filter-cell-base neural-table-control-filter-cell-base',
      this.classes().filterCell,
    ),
  );
  readonly selectionControlClass = computed(() =>
    this.composeClass(
      'neural-table-selection-control-root',
      'neural-table-selection-control-base',
      this.classes().selectionControl,
    ),
  );
  readonly expansionCellClass = computed(() =>
    this.composeClass(
      'neural-table-cell-root neural-table-expansion-cell-root',
      'neural-table-cell-base neural-table-expansion-cell-base',
      this.classes().cell,
      this.classes().expansionCell,
    ),
  );
  readonly expansionButtonClass = computed(() =>
    this.composeClass(
      'neural-table-expansion-button-root',
      'neural-table-expansion-button-base',
      this.classes().expansionButton,
    ),
  );
  readonly expansionRowClass = computed(() =>
    this.composeClass(
      'neural-table-expansion-row-root',
      'neural-table-expansion-row-base',
      this.classes().expansionRow,
    ),
  );
  readonly expansionContentClass = computed(() =>
    this.composeClass(
      'neural-table-expansion-content-root',
      'neural-table-expansion-content-base',
      this.classes().expansionContent,
    ),
  );
  readonly groupHeaderRowClass = computed(() =>
    this.composeClass(
      'neural-table-group-header-row-root',
      'neural-table-group-header-row-base',
      this.classes().groupHeaderRow,
    ),
  );
  readonly groupHeaderCellClass = computed(() =>
    this.composeClass(
      'neural-table-group-header-cell-root',
      'neural-table-group-header-cell-base',
      this.classes().groupHeaderCell,
    ),
  );
  readonly groupToggleClass = computed(() =>
    this.composeClass(
      'neural-table-group-toggle-root',
      'neural-table-group-toggle-base',
      this.classes().groupToggle,
    ),
  );
  readonly groupFooterRowClass = computed(() =>
    this.composeClass(
      'neural-table-group-footer-row-root',
      'neural-table-group-footer-row-base',
      this.classes().groupFooterRow,
    ),
  );
  readonly groupFooterCellClass = computed(() =>
    this.composeClass(
      'neural-table-group-footer-cell-root',
      'neural-table-group-footer-cell-base',
      this.classes().groupFooterCell,
    ),
  );
  readonly stateRowClass = computed(() =>
    this.composeClass(
      'neural-table-state-row-root',
      'neural-table-state-row-base',
      this.classes().stateRow,
    ),
  );
  readonly stateCellClass = computed(() =>
    this.composeClass(
      'neural-table-state-cell-root',
      'neural-table-state-cell-base',
      this.classes().stateCell,
    ),
  );
  readonly activeStateClass = computed(() => {
    const consumer = this.loading()
      ? this.classes().loading
      : this.error()
        ? this.classes().error
        : this.classes().empty;
    return this.composeClass(
      `neural-table-state-root neural-table-${
        this.loading() ? 'loading' : this.error() ? 'error' : 'empty'
      }-root`,
      'neural-table-state-base',
      consumer,
    );
  });
  readonly skeletonRowClass = computed(() =>
    this.composeClass(
      'neural-table-skeleton-row-root',
      'neural-table-skeleton-row-base',
      this.classes().skeletonRow,
    ),
  );
  readonly skeletonCellClass = computed(() =>
    this.composeClass(
      'neural-table-cell-root neural-table-skeleton-cell-root',
      'neural-table-cell-base neural-table-skeleton-cell-base',
      this.classes().cell,
      this.classes().skeletonCell,
    ),
  );
  readonly skeletonLineClass = computed(() =>
    this.composeClass(
      'neural-table-skeleton-line-root',
      'neural-table-skeleton-line-base',
      this.classes().skeletonLine,
    ),
  );

  skeletonLineWidth(columnIndex: number): number {
    return [72, 88, 64, 78][columnIndex % 4];
  }

  headerCellClass(column: NeuralTableColumn<T>): string {
    const drop = this.dropPosition(column);
    return this.composeClass(
      [
        'neural-table-header-cell-root',
        column.sticky ? 'neural-table-sticky-root' : '',
        column.sticky ? `neural-table-sticky-${column.sticky}-root` : '',
        drop ? `neural-table-drop-${drop}-root` : '',
      ].join(' '),
      [
        'neural-table-header-cell-base',
        column.sticky ? 'neural-table-sticky-base' : '',
        column.sticky ? `neural-table-sticky-${column.sticky}-base` : '',
        drop ? `neural-table-drop-${drop}-base` : '',
      ].join(' '),
      this.classes().headerCell,
      column.headerClass,
      drop ? this.classes().dropIndicator : '',
    );
  }

  headerGroupCellClass(group: NeuralTableHeaderGroup | null): string {
    return this.composeClass(
      'neural-table-header-group-cell-root',
      'neural-table-header-group-cell-base',
      this.classes().headerGroupCell,
      group?.headerClass,
    );
  }

  footerGroupCellClass(group: NeuralTableHeaderGroup | null): string {
    return this.composeClass(
      'neural-table-footer-group-cell-root',
      'neural-table-footer-group-cell-base',
      this.classes().footerGroupCell,
      group?.headerClass,
    );
  }

  footerCellClass(column: NeuralTableColumn<T> | null): string {
    return this.composeClass(
      [
        'neural-table-footer-cell-root',
        column?.sticky ? 'neural-table-sticky-root' : '',
        column?.sticky ? `neural-table-sticky-${column.sticky}-root` : '',
      ].join(' '),
      [
        'neural-table-footer-cell-base',
        column?.sticky ? 'neural-table-sticky-base' : '',
        column?.sticky ? `neural-table-sticky-${column.sticky}-base` : '',
      ].join(' '),
      this.classes().footerCell,
    );
  }

  filterCellClass(column: NeuralTableColumn<T>): string {
    return this.composeClass(
      [
        'neural-table-filter-cell-root',
        column.sticky ? 'neural-table-sticky-root' : '',
        column.sticky ? `neural-table-sticky-${column.sticky}-root` : '',
      ].join(' '),
      [
        'neural-table-filter-cell-base',
        column.sticky ? 'neural-table-sticky-base' : '',
        column.sticky ? `neural-table-sticky-${column.sticky}-base` : '',
      ].join(' '),
      this.classes().filterCell,
    );
  }

  rowClass(row: T, rowIndex: number): string {
    const selectable = this.isRowSelectable(row, rowIndex);
    const focused = this.focusedRow() === this.rowIdentity(row, rowIndex);
    const editing = this.isRowEditing(row, rowIndex);
    return this.composeClass(
      'neural-table-row-root',
      [
        this.isSelected(row) ? 'neural-table-selected-row-base' : '',
        !selectable ? 'neural-table-disabled-row-base' : '',
        focused ? 'neural-table-focused-row-base' : '',
        editing ? 'neural-table-editing-row-base' : '',
      ].join(' '),
      this.classes().row,
      this.isSelected(row) ? this.classes().selectedRow : '',
      !selectable ? this.classes().disabledRow : '',
      focused ? this.classes().focusedRow : '',
      editing ? this.classes().editingRow : '',
    );
  }

  cellClass(column: NeuralTableColumn<T>, row: T, rowIndex: number): string {
    const columnClass =
      typeof column.cellClass === 'function'
        ? column.cellClass(row, rowIndex)
        : column.cellClass;
    const editable = this.isCellEditable(column, row, rowIndex);
    const editing = this.isCellEditing(column, row, rowIndex);
    const readOnly = this.isCellReadOnly(column, row, rowIndex);
    const disabled = this.isCellDisabled(column, row, rowIndex);
    return this.composeClass(
      [
        'neural-table-cell-root',
        column.sticky ? 'neural-table-sticky-root' : '',
        column.sticky ? `neural-table-sticky-${column.sticky}-root` : '',
      ].join(' '),
      [
        'neural-table-cell-base',
        column.sticky ? 'neural-table-sticky-base' : '',
        column.sticky ? `neural-table-sticky-${column.sticky}-base` : '',
        editable ? 'neural-table-editable-cell-base' : '',
        editing ? 'neural-table-editing-cell-base' : '',
        readOnly ? 'neural-table-readonly-cell-base' : '',
        disabled ? 'neural-table-disabled-cell-base' : '',
      ].join(' '),
      this.classes().cell,
      editable ? this.classes().editableCell : '',
      editing ? this.classes().editingCell : '',
      readOnly ? this.classes().readOnlyCell : '',
      disabled ? this.classes().disabledCell : '',
      columnClass,
    );
  }

  cellTemplate(column: NeuralTableColumn<T>) {
    return this.cellTemplates().find(
      (template) => template.column() === column.id,
    );
  }

  editorTemplate(column: NeuralTableColumn<T>) {
    return this.editorTemplates().find(
      (template) => template.column() === column.id,
    );
  }

  headerTemplate(column: NeuralTableColumn<T>) {
    return this.headerTemplates().find(
      (template) => template.column() === column.id,
    );
  }

  headerGroupTemplate(group: NeuralTableHeaderGroup) {
    return this.headerGroupTemplates().find(
      (template) => template.group() === group.id,
    );
  }

  footerTemplate(column: NeuralTableColumn<T>) {
    return this.footerTemplates().find(
      (template) => template.column() === column.id,
    );
  }

  footerGroupTemplate(group: NeuralTableHeaderGroup) {
    return this.footerGroupTemplates().find(
      (template) => template.group() === group.id,
    );
  }

  filterTemplate(column: NeuralTableColumn<T>) {
    return this.filterTemplates().find(
      (template) => template.column() === column.id,
    );
  }

  cellContext(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): NeuralTableCellContext<T> {
    const value = resolveNeuralTableValue(row, column, rowIndex);
    return {
      $implicit: value,
      value,
      row,
      rowIndex,
      column,
      selected: this.isSelected(row),
      expanded: this.isExpanded(row, rowIndex),
    };
  }

  editorContext(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): NeuralTableEditorContext<T> {
    const value = this.editValue(column, row, rowIndex);
    return {
      $implicit: value,
      value,
      row,
      draftRow: this.draftRow(row),
      rowIndex,
      column,
      loading: this.editLoading(),
      error: this.editError(),
      setValue: (nextValue) => this.setEditValue(column, nextValue),
      save: (nativeEvent) => this.saveEdit(nativeEvent),
      cancel: (nativeEvent) => this.cancelEdit(nativeEvent),
    };
  }

  isCellReadOnly(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): boolean {
    const readOnly =
      typeof column.readOnly === 'function'
        ? column.readOnly(row, rowIndex)
        : column.readOnly;
    return readOnly === true;
  }

  isCellDisabled(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): boolean {
    const disabled =
      typeof column.disabled === 'function'
        ? column.disabled(row, rowIndex)
        : column.disabled;
    return this.disabled() || disabled === true;
  }

  isCellEditable(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): boolean {
    if (!this.editMode() || !this.editorTemplate(column)) return false;
    const editable =
      typeof column.editable === 'function'
        ? column.editable(row, rowIndex)
        : column.editable;
    return (
      editable !== false &&
      !this.isCellReadOnly(column, row, rowIndex) &&
      !this.isCellDisabled(column, row, rowIndex)
    );
  }

  isRowEditing(row: T, rowIndex: number): boolean {
    const edit = this.activeEdit();
    return Boolean(
      edit &&
        edit.rowIdentity === this.rowIdentity(row, rowIndex) &&
        this.editMode() === 'row',
    );
  }

  isEditingRow(row: T, rowIndex: number): boolean {
    return this.activeEdit()?.rowIdentity === this.rowIdentity(row, rowIndex);
  }

  isCellEditing(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): boolean {
    const edit = this.activeEdit();
    if (!edit || edit.rowIdentity !== this.rowIdentity(row, rowIndex)) {
      return false;
    }
    return this.editMode() === 'row'
      ? this.isCellEditable(column, row, rowIndex)
      : edit.columnId === column.id;
  }

  shouldShowEditError(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): boolean {
    if (!this.editError() || !this.isCellEditing(column, row, rowIndex)) {
      return false;
    }
    if (this.editMode() === 'cell') return true;
    return (
      this.visibleColumns().find((candidate) =>
        this.isCellEditable(candidate, row, rowIndex),
      )?.id === column.id
    );
  }

  handleCellClick(
    row: T,
    rowIndex: number,
    column: NeuralTableColumn<T>,
    nativeEvent: MouseEvent,
  ): void {
    if (!this.isCellEditable(column, row, rowIndex)) return;
    nativeEvent.stopPropagation();
    if (this.editMode() === 'cell') {
      this.startCellEdit(row, rowIndex, column, nativeEvent);
    }
  }

  startCellEdit(
    row: T,
    rowIndex: number,
    column: NeuralTableColumn<T>,
    nativeEvent?: Event,
  ): void {
    if (this.editLoading() || !this.isCellEditable(column, row, rowIndex)) {
      return;
    }
    if (this.editMode() === 'row') {
      this.startRowEdit(row, rowIndex, nativeEvent);
      return;
    }
    const identity = this.rowIdentity(row, rowIndex);
    const current = this.activeEdit();
    if (current?.rowIdentity === identity && current.columnId === column.id) {
      return;
    }
    if (current) this.cancelEdit(nativeEvent);
    this.activeEdit.set({
      row,
      rowIndex,
      rowIdentity: identity,
      columnId: column.id,
    });
    this.editDraft.set({});
    this.editError.set(null);
    const value = resolveNeuralTableValue(row, column, rowIndex);
    this.cellEditStart.emit(
      this.cellEditEvent(row, rowIndex, column, value, value, nativeEvent),
    );
  }

  startRowEdit(row: T, rowIndex: number, nativeEvent?: Event): void {
    if (
      this.editLoading() ||
      this.editMode() !== 'row' ||
      !this.visibleColumns().some((column) =>
        this.isCellEditable(column, row, rowIndex),
      )
    ) {
      return;
    }
    const identity = this.rowIdentity(row, rowIndex);
    if (this.activeEdit()?.rowIdentity === identity) return;
    if (this.activeEdit()) this.cancelEdit(nativeEvent);
    this.activeEdit.set({
      row,
      rowIndex,
      rowIdentity: identity,
      columnId: null,
    });
    this.editDraft.set({});
    this.editError.set(null);
    this.rowEditStart.emit(this.rowEditEvent(row, rowIndex, nativeEvent));
  }

  async saveEdit(nativeEvent?: Event): Promise<boolean> {
    const edit = this.activeEdit();
    if (!edit || this.editLoading()) return false;
    const column =
      edit.columnId === null
        ? null
        : (this.visibleColumns().find(
            (candidate) => candidate.id === edit.columnId,
          ) ?? null);
    const event = column
      ? this.cellEditEvent(
          edit.row,
          edit.rowIndex,
          column,
          this.editValue(column, edit.row, edit.rowIndex),
          resolveNeuralTableValue(edit.row, column, edit.rowIndex),
          nativeEvent,
        )
      : this.rowEditEvent(edit.row, edit.rowIndex, nativeEvent);
    const validator = this.editValidator();
    if (validator) {
      const validationSequence = ++this.editValidationSequence;
      this.editLoading.set(true);
      this.editError.set(null);
      let validation: Promise<
        | { readonly kind: 'result'; readonly value: unknown }
        | { readonly kind: 'error'; readonly error: unknown }
      >;
      try {
        validation = Promise.resolve(validator(event)).then(
          (value) => ({ kind: 'result' as const, value }),
          (error: unknown) => ({ kind: 'error' as const, error }),
        );
      } catch (error: unknown) {
        validation = Promise.resolve({ kind: 'error' as const, error });
      }
      const outcome = await Promise.race([
        validation,
        this.destroyedSignal.then(() => ({ kind: 'destroyed' as const })),
      ]);
      if (
        outcome.kind === 'destroyed' ||
        this.destroyed ||
        validationSequence !== this.editValidationSequence ||
        this.activeEdit() !== edit
      ) {
        return false;
      }
      this.editLoading.set(false);
      if (outcome.kind === 'error') {
        this.editError.set(
          outcome.error instanceof Error
            ? outcome.error.message
            : this.resolvedLabels().editValidationFailed,
        );
        return false;
      }
      if (outcome.value === false || typeof outcome.value === 'string') {
        this.editError.set(
          typeof outcome.value === 'string'
            ? outcome.value
            : this.resolvedLabels().editValidationFailed,
        );
        return false;
      }
    }
    if (this.destroyed || this.activeEdit() !== edit) return false;
    if (column) this.cellEditComplete.emit(event as NeuralTableEditEvent<T>);
    else this.rowEditSave.emit(event as NeuralTableRowEditEvent<T>);
    this.resetEditState();
    return true;
  }

  cancelEdit(nativeEvent?: Event): void {
    const edit = this.activeEdit();
    if (!edit || this.editLoading()) return;
    const column =
      edit.columnId === null
        ? null
        : (this.visibleColumns().find(
            (candidate) => candidate.id === edit.columnId,
          ) ?? null);
    if (column) {
      const previous = resolveNeuralTableValue(edit.row, column, edit.rowIndex);
      this.cellEditCancel.emit(
        this.cellEditEvent(
          edit.row,
          edit.rowIndex,
          column,
          this.editValue(column, edit.row, edit.rowIndex),
          previous,
          nativeEvent,
        ),
      );
    } else {
      this.rowEditCancel.emit(
        this.rowEditEvent(edit.row, edit.rowIndex, nativeEvent),
      );
    }
    this.resetEditState();
  }

  handleCellKeydown(
    row: T,
    rowIndex: number,
    column: NeuralTableColumn<T>,
    nativeEvent: KeyboardEvent,
  ): void {
    if (nativeEvent.defaultPrevented) return;
    if (!this.isCellEditable(column, row, rowIndex)) return;
    if (!this.isCellEditing(column, row, rowIndex)) {
      if (nativeEvent.key === 'Enter') {
        nativeEvent.preventDefault();
        nativeEvent.stopPropagation();
        this.startCellEdit(row, rowIndex, column, nativeEvent);
      }
      return;
    }
    if (nativeEvent.key === 'Escape') {
      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
      this.cancelEdit(nativeEvent);
      return;
    }
    if (nativeEvent.key === 'Enter') {
      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
      void this.saveEdit(nativeEvent);
      return;
    }
    if (nativeEvent.key === 'Tab' && this.editMode() === 'cell') {
      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
      const cell = nativeEvent.currentTarget as HTMLElement;
      const backwards = nativeEvent.shiftKey;
      void this.saveEdit(nativeEvent).then((saved) => {
        if (saved) this.focusAdjacentEditableCell(cell, backwards);
      });
    }
  }

  headerContext(column: NeuralTableColumn<T>): NeuralTableHeaderContext<T> {
    return { $implicit: column, column, sort: this.currentSort(column) };
  }

  rowGroupAt(rowIndex: number): NeuralTableResolvedRowGroup<T> | null {
    return this.rowGroupIndex().get(rowIndex) ?? null;
  }

  isFirstRowInGroup(rowIndex: number): boolean {
    return this.rowGroupAt(rowIndex)?.firstRowIndex === rowIndex;
  }

  isLastRowInGroup(rowIndex: number): boolean {
    return this.rowGroupAt(rowIndex)?.lastRowIndex === rowIndex;
  }

  isRowGroupExpanded(rowIndex: number): boolean {
    if (!this.expandableRowGroups()) return true;
    const group = this.rowGroupAt(rowIndex);
    return group ? this.expandedRowGroupKeySet().has(group.key) : true;
  }

  isRowHiddenByGroup(rowIndex: number): boolean {
    return (
      this.rowGroupMode() === 'subheader' &&
      this.expandableRowGroups() &&
      !this.isRowGroupExpanded(rowIndex)
    );
  }

  toggleRowGroup(rowIndex: number, nativeEvent?: Event): void {
    if (!this.expandableRowGroups() || this.disabled()) return;
    nativeEvent?.stopPropagation();
    const group = this.rowGroupAt(rowIndex);
    if (!group) return;
    const expanded = !this.expandedRowGroupKeySet().has(group.key);
    this.expandedRowGroupKeys.update((keys) =>
      expanded
        ? [...new Set([...keys, group.key])]
        : keys.filter((key) => key !== group.key),
    );
    this.rowGroupExpansionChange.emit({ ...group, expanded, nativeEvent });
    this.emitState('expansion');
  }

  rowGroupLabel(rowIndex: number): string {
    const group = this.rowGroupAt(rowIndex);
    const key = this.isRowGroupExpanded(rowIndex)
      ? 'collapseGroup'
      : 'expandGroup';
    return this.locale.format(this.resolvedLabels()[key], {
      group: String(group?.value ?? ''),
    });
  }

  rowGroupContext(rowIndex: number): NeuralTableRowGroupContext<T> | null {
    const group = this.rowGroupAt(rowIndex);
    if (!group) return null;
    return {
      ...group,
      $implicit: group.value,
      expanded: this.isRowGroupExpanded(rowIndex),
      toggle: (nativeEvent?: Event) =>
        this.toggleRowGroup(rowIndex, nativeEvent),
      aggregate: (field, operation) =>
        aggregateNeuralTableRows(group.rows, field, operation),
    };
  }

  shouldRenderGroupCell(
    column: NeuralTableColumn<T>,
    rowIndex: number,
  ): boolean {
    if (this.rowGroupMode() !== 'rowspan' || !this.isRowGroupColumn(column)) {
      return true;
    }
    return this.isFirstRowInGroup(rowIndex);
  }

  groupCellRowspan(
    column: NeuralTableColumn<T>,
    rowIndex: number,
  ): number | null {
    if (
      this.rowGroupMode() !== 'rowspan' ||
      !this.isRowGroupColumn(column) ||
      !this.isFirstRowInGroup(rowIndex)
    ) {
      return null;
    }
    return this.rowGroupAt(rowIndex)?.rows.length ?? null;
  }

  headerGroupContext(
    cell: NeuralTableResolvedGroupCell,
  ): NeuralTableHeaderGroupContext {
    const group = cell.group as NeuralTableHeaderGroup;
    return {
      $implicit: group,
      group,
      colspan: cell.colspan,
      rowspan: cell.rowspan,
    };
  }

  footerContext(column: NeuralTableColumn<T>): NeuralTableFooterContext<T> {
    const value = column.footer ?? null;
    return {
      $implicit: value,
      value,
      column,
      rows: this.processedRows(),
    };
  }

  footerGroupContext(
    cell: NeuralTableResolvedGroupCell,
  ): NeuralTableFooterGroupContext {
    const group = cell.group as NeuralTableHeaderGroup;
    return {
      $implicit: group,
      group,
      colspan: cell.colspan,
      rowspan: cell.rowspan,
    };
  }

  filterContext(column: NeuralTableColumn<T>): NeuralTableFilterContext<T> {
    const filter = this.activeFilter(column);
    return {
      $implicit: filter?.value ?? null,
      value: filter?.value ?? null,
      column,
      filter,
      apply: (value, nativeEvent) =>
        this.applyColumnFilter(column, value, nativeEvent),
      clear: (nativeEvent) => this.applyColumnFilter(column, null, nativeEvent),
    };
  }

  stateContext(message: string): NeuralTableStateContext {
    return { $implicit: message, message, columnCount: this.columnCount() };
  }

  formattedValue(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): string | number {
    const value = resolveNeuralTableValue(row, column, rowIndex);
    if (column.formatter) return column.formatter(value, row, rowIndex);
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  currentSort(column: NeuralTableColumn<T>): NeuralTableSort | null {
    return (
      this.sort().find(
        (sort) =>
          sort.field === column.id || sort.field === String(column.field ?? ''),
      ) ?? null
    );
  }

  ariaSort(column: NeuralTableColumn<T>): 'ascending' | 'descending' | null {
    const sort = this.currentSort(column);
    return sort
      ? sort.direction === 'asc'
        ? 'ascending'
        : 'descending'
      : null;
  }

  sortAriaLabel(column: NeuralTableColumn<T>): string {
    const sort = this.currentSort(column);
    const key =
      sort?.direction === 'asc'
        ? 'sortDescending'
        : sort?.direction === 'desc'
          ? 'clearSort'
          : 'sortAscending';
    return this.locale.format(this.resolvedLabels()[key], {
      column: column.header,
    });
  }

  toggleSort(column: NeuralTableColumn<T>, nativeEvent: MouseEvent): void {
    if (this.disabled() || !column.sortable) return;
    const current = this.currentSort(column);
    const nextEntry: NeuralTableSort | null =
      current?.direction === 'asc'
        ? { field: column.id, direction: 'desc' }
        : current?.direction === 'desc'
          ? null
          : { field: column.id, direction: 'asc' };
    const withoutCurrent = this.sort().filter((entry) => entry !== current);
    const next =
      this.sortMode() === 'multiple'
        ? nextEntry
          ? [...withoutCurrent, nextEntry]
          : withoutCurrent
        : nextEntry
          ? [nextEntry]
          : [];
    this.sort.set(next);
    this.sortEvent.emit({ sort: next, nativeEvent });
    this.emitState('sort');
  }

  isSelected(row: T): boolean {
    const key = this.keyFor(row);
    return key === null
      ? this.dataMode() !== 'remote' && this.selectedRowSet().has(row)
      : this.selectedKeySet().has(key);
  }

  isRowSelectable(row: T, rowIndex: number): boolean {
    return (
      !this.disabled() &&
      this.selectableRow()(row, rowIndex) &&
      (this.dataMode() !== 'remote' || this.keyFor(row) !== null)
    );
  }

  rowTabIndex(row: T, rowIndex: number): 0 | -1 | null {
    if (
      this.selectionMode() === 'none' ||
      !this.isRowNavigable(row, rowIndex)
    ) {
      return null;
    }
    const focused = this.focusedRow();
    if (focused !== null) {
      return focused === this.rowIdentity(row, rowIndex) ? 0 : -1;
    }
    return this.firstSelectableDisplayIndex() === rowIndex ? 0 : -1;
  }

  focusRow(row: T, rowIndex: number): void {
    if (this.isRowNavigable(row, rowIndex)) {
      this.focusedRow.set(this.rowIdentity(row, rowIndex));
    }
  }

  handleRowClick(row: T, rowIndex: number, nativeEvent: MouseEvent): void {
    this.rowClick.emit({ row, rowIndex, nativeEvent });
    if (
      !this.selectOnRowClick() ||
      !this.isRowSelectable(row, rowIndex) ||
      this.isInteractiveTarget(nativeEvent)
    ) {
      return;
    }
    this.selectFromInteraction(row, rowIndex, nativeEvent, 'row');
  }

  handleRowKeydown(row: T, rowIndex: number, nativeEvent: KeyboardEvent): void {
    if (
      nativeEvent.target !== nativeEvent.currentTarget ||
      !this.isRowSelectable(row, rowIndex)
    ) {
      return;
    }
    if (
      nativeEvent.key === 'ArrowDown' ||
      nativeEvent.key === 'ArrowUp' ||
      nativeEvent.key === 'Home' ||
      nativeEvent.key === 'End'
    ) {
      nativeEvent.preventDefault();
      if (
        nativeEvent.shiftKey &&
        this.selectionMode() === 'multiple' &&
        this.selectionAnchor() === null
      ) {
        this.selectionAnchor.set(this.rowIdentity(row, rowIndex));
      }
      const targetIndex = this.keyboardTargetIndex(rowIndex, nativeEvent.key);
      if (targetIndex < 0) return;
      const target = this.displayRows()[targetIndex];
      this.focusedRow.set(this.rowIdentity(target, targetIndex));
      this.focusDisplayRow(
        nativeEvent.currentTarget as HTMLElement,
        targetIndex,
      );
      if (nativeEvent.shiftKey && this.selectionMode() === 'multiple') {
        this.selectRange(target, targetIndex, nativeEvent, false);
      }
      return;
    }
    if (nativeEvent.key !== ' ' && nativeEvent.key !== 'Enter') return;
    nativeEvent.preventDefault();
    this.selectFromInteraction(row, rowIndex, nativeEvent, 'keyboard');
  }

  toggleRow(
    row: T,
    rowIndex: number,
    nativeEvent: Event,
    reason: NeuralTableSelectionChange<T>['reason'] = 'control',
  ): void {
    if (
      this.selectionMode() === 'none' ||
      !this.isRowSelectable(row, rowIndex)
    ) {
      return;
    }
    const pointer = nativeEvent as MouseEvent;
    if (pointer.shiftKey && this.selectionMode() === 'multiple') {
      this.selectRange(
        row,
        rowIndex,
        nativeEvent,
        pointer.ctrlKey || pointer.metaKey,
      );
      return;
    }
    const selected = this.isSelected(row);
    if (this.resolvedSelectionControl() === 'radio' && selected) return;
    const current = this.selectedRowsForMutation();
    const next = selected
      ? current.filter((candidate) => !this.sameRow(candidate, row))
      : this.selectionMode() === 'single'
        ? [row]
        : this.uniqueRows([...current, row]);
    this.commitSelection(next, row, !selected, nativeEvent, reason, rowIndex);
    this.selectionAnchor.set(this.rowIdentity(row, rowIndex));
  }

  radioSelectionOption(
    row: T,
    rowIndex: number,
  ): readonly { readonly value: NeuralTableRowKey; readonly label: string }[] {
    return (
      this.radioSelectionOptions().get(this.rowIdentity(row, rowIndex)) ?? []
    );
  }

  toggleRowFromRadio(row: T, rowIndex: number): void {
    this.toggleRow(row, rowIndex, new Event('change'), 'control');
  }

  toggleAll(nativeEvent: Event): void {
    if (this.disabled() || this.selectionMode() !== 'multiple') return;
    const shouldSelect = !this.allVisibleSelected();
    if (this.dataMode() === 'remote') {
      const scope = this.selectionScopeKeys();
      const scopeSet = new Set(scope);
      const outsideScope = this.selectionKeys().filter(
        (key) => !scopeSet.has(key),
      );
      const nextKeys = shouldSelect
        ? [...new Set([...scope, ...outsideScope])]
        : this.selectionKeys().filter((key) => !scopeSet.has(key));
      this.selectionKeys.set(nextKeys);
      this.selectionEvent.emit({
        selection: [],
        selectionKeys: nextKeys,
        selected: shouldSelect,
        reason: 'all',
        nativeEvent,
      });
      this.emitState('selection');
      return;
    }
    const scope = this.selectionScopeRows();
    const scopeKeys = new Set(
      scope
        .map((row) => this.keyFor(row))
        .filter((key): key is NeuralTableRowKey => key !== null),
    );
    const scopeRows = new Set(scope);
    const isInScope = (row: T) => {
      const key = this.keyFor(row);
      return key === null ? scopeRows.has(row) : scopeKeys.has(key);
    };
    const outsideScope = this.selection().filter(
      (selected) => !isInScope(selected),
    );
    const next = shouldSelect
      ? this.uniqueRows([...scope, ...outsideScope])
      : this.selection().filter((selected) => !isInScope(selected));
    this.commitSelection(next, undefined, shouldSelect, nativeEvent, 'all');
  }

  isExpanded(row: T, rowIndex: number): boolean {
    return this.expandedRowKeySet().has(this.rowIdentity(row, rowIndex));
  }

  toggleExpansion(row: T, rowIndex: number, nativeEvent: MouseEvent): void {
    nativeEvent.stopPropagation();
    if (this.disabled()) return;
    const key = this.rowIdentity(row, rowIndex);
    const expanded = this.expandedRowKeySet().has(key);
    const next = expanded
      ? this.expandedRowKeys().filter((candidate) => candidate !== key)
      : [...this.expandedRowKeys(), key];
    this.expandedRowKeys.set(next);
    this.expansionChange.emit({
      row,
      rowIndex,
      expanded: !expanded,
      nativeEvent,
    });
    this.emitState('expansion');
  }

  rowIdentity(row: T, rowIndex: number): NeuralTableRowKey {
    return this.keyFor(row) ?? rowIndex;
  }

  columnWidth(column: NeuralTableColumn<T>): string | null {
    const width = this.columnWidths()[column.id];
    return Number.isFinite(width) ? `${width}px` : (column.width ?? null);
  }

  columnWidthValue(column: NeuralTableColumn<T>): number {
    const width = this.columnWidths()[column.id];
    if (Number.isFinite(width)) return Math.round(width);
    return this.pixelValue(column.width, this.safeMinimumColumnWidth());
  }

  columnMinWidthValue(column: NeuralTableColumn<T>): number {
    return Math.round(
      this.pixelValue(column.minWidth, this.safeMinimumColumnWidth()),
    );
  }

  columnMaxWidthValue(column: NeuralTableColumn<T>): number | null {
    if (!column.maxWidth) return null;
    const value = this.pixelValue(column.maxWidth, Number.NaN);
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  canResizeColumn(column: NeuralTableColumn<T>): boolean {
    if (this.disabled() || column.resizable === false) return false;
    return (
      this.columnResizeMode() === 'expand' ||
      this.resizeNeighbor(column) !== null
    );
  }

  resizeAriaLabel(column: NeuralTableColumn<T>): string {
    return this.locale.format(this.resolvedLabels().resizeColumn, {
      column: column.header,
    });
  }

  reorderAriaLabel(column: NeuralTableColumn<T>): string {
    return this.locale.format(this.resolvedLabels().reorderColumn, {
      column: column.header,
    });
  }

  dropPosition(column: NeuralTableColumn<T>): NeuralTableDropPosition | null {
    const drop = this.activeDrop();
    return drop?.columnId === column.id ? drop.position : null;
  }

  startPointerColumnReorder(
    column: NeuralTableColumn<T>,
    nativeEvent: PointerEvent,
  ): void {
    if (
      !this.canReorderColumn(column) ||
      (nativeEvent.pointerType === 'mouse' && nativeEvent.button !== 0)
    ) {
      return;
    }
    nativeEvent.preventDefault();
    nativeEvent.stopPropagation();
    const handle = nativeEvent.currentTarget as HTMLElement;
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(nativeEvent.pointerId);
    this.reorderSession = {
      pointerId: nativeEvent.pointerId,
      source: column,
      startX: nativeEvent.clientX,
      startY: nativeEvent.clientY,
      active: false,
    };
    this.activeDrop.set(null);
  }

  movePointerColumnReorder(nativeEvent: PointerEvent): void {
    const session = this.reorderSession;
    if (!session || session.pointerId !== nativeEvent.pointerId) return;
    const distance = Math.hypot(
      nativeEvent.clientX - session.startX,
      nativeEvent.clientY - session.startY,
    );
    if (!session.active && distance < 4) return;
    session.active = true;
    nativeEvent.preventDefault();
    this.activeDrop.set(
      this.pointerDropAt(
        nativeEvent.currentTarget as HTMLElement,
        session.source,
        nativeEvent.clientX,
        nativeEvent.clientY,
      ),
    );
  }

  endPointerColumnReorder(nativeEvent: PointerEvent): void {
    const session = this.reorderSession;
    if (!session || session.pointerId !== nativeEvent.pointerId) return;
    const handle = nativeEvent.currentTarget as HTMLElement;
    const distance = Math.hypot(
      nativeEvent.clientX - session.startX,
      nativeEvent.clientY - session.startY,
    );
    session.active ||= distance >= 4;
    if (session.active) {
      this.activeDrop.set(
        this.pointerDropAt(
          handle,
          session.source,
          nativeEvent.clientX,
          nativeEvent.clientY,
        ),
      );
    }
    if (handle.hasPointerCapture(nativeEvent.pointerId)) {
      handle.releasePointerCapture(nativeEvent.pointerId);
    }
    nativeEvent.stopPropagation();
    const drop = this.activeDrop();
    const target = drop
      ? this.orderedColumns().find((column) => column.id === drop.columnId)
      : null;
    if (session.active && target && drop) {
      this.commitColumnReorder(
        session.source,
        target,
        drop.position,
        nativeEvent,
      );
    }
    this.reorderSession = null;
    this.activeDrop.set(null);
  }

  cancelPointerColumnReorder(nativeEvent: PointerEvent): void {
    const session = this.reorderSession;
    if (!session || session.pointerId !== nativeEvent.pointerId) return;
    this.reorderSession = null;
    this.activeDrop.set(null);
  }

  reorderColumnWithKeyboard(
    column: NeuralTableColumn<T>,
    nativeEvent: KeyboardEvent,
  ): void {
    if (nativeEvent.key === 'Escape' && this.reorderSession) {
      this.reorderSession = null;
      this.activeDrop.set(null);
      return;
    }
    if (
      nativeEvent.altKey ||
      nativeEvent.ctrlKey ||
      nativeEvent.metaKey ||
      (nativeEvent.key !== 'ArrowLeft' && nativeEvent.key !== 'ArrowRight') ||
      !this.canReorderColumn(column)
    ) {
      return;
    }
    nativeEvent.preventDefault();
    nativeEvent.stopPropagation();
    const region = this.visibleColumns().filter((candidate) =>
      this.sameStickyRegion(column, candidate),
    );
    const current = region.findIndex((candidate) => candidate.id === column.id);
    const rtl = this.locale.direction() === 'rtl';
    const movement =
      (nativeEvent.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
    const target = region[current + movement];
    if (!target) return;
    this.commitColumnReorder(
      column,
      target,
      movement > 0 ? 'after' : 'before',
      nativeEvent,
    );
  }

  startColumnResize(
    column: NeuralTableColumn<T>,
    nativeEvent: PointerEvent,
  ): void {
    if (!this.canResizeColumn(column) || nativeEvent.button !== 0) return;
    const handle = nativeEvent.currentTarget as HTMLElement;
    const headerCell = handle.closest('th');
    const table = handle.closest('table');
    if (!headerCell || !table) return;

    nativeEvent.preventDefault();
    nativeEvent.stopPropagation();
    handle.setPointerCapture(nativeEvent.pointerId);

    const widths = this.measureColumnWidths(table);
    const neighbor = this.resizeNeighbor(column);
    const neighborCell = neighbor
      ? this.headerCellFor(table, neighbor.id)
      : null;
    const style = getComputedStyle(headerCell);
    const neighborStyle = neighborCell ? getComputedStyle(neighborCell) : null;
    const startWidth =
      widths[column.id] ?? headerCell.getBoundingClientRect().width;
    const neighborStartWidth = neighbor
      ? (widths[neighbor.id] ??
        neighborCell?.getBoundingClientRect().width ??
        0)
      : 0;

    this.columnWidths.set(widths);
    this.resizeSession = {
      pointerId: nativeEvent.pointerId,
      column,
      neighbor,
      startX: nativeEvent.clientX,
      direction: getComputedStyle(table).direction === 'rtl' ? -1 : 1,
      startWidth,
      neighborStartWidth,
      minWidth: this.computedLimit(
        style.minWidth,
        this.safeMinimumColumnWidth(),
      ),
      maxWidth: this.computedLimit(style.maxWidth, Number.POSITIVE_INFINITY),
      neighborMinWidth: this.computedLimit(
        neighborStyle?.minWidth,
        this.safeMinimumColumnWidth(),
      ),
      neighborMaxWidth: this.computedLimit(
        neighborStyle?.maxWidth,
        Number.POSITIVE_INFINITY,
      ),
      initialWidths: widths,
      width: startWidth,
    };
  }

  moveColumnResize(nativeEvent: PointerEvent): void {
    const session = this.resizeSession;
    if (!session || session.pointerId !== nativeEvent.pointerId) return;
    nativeEvent.preventDefault();
    const delta = (nativeEvent.clientX - session.startX) * session.direction;
    session.width = this.applyResizeDelta(session, delta);
  }

  endColumnResize(nativeEvent: PointerEvent): void {
    const session = this.resizeSession;
    if (!session || session.pointerId !== nativeEvent.pointerId) return;
    const handle = nativeEvent.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(nativeEvent.pointerId)) {
      handle.releasePointerCapture(nativeEvent.pointerId);
    }
    this.resizeSession = null;
    if (Math.round(session.width) === Math.round(session.startWidth)) return;
    this.columnResize.emit({
      column: session.column,
      columnId: session.column.id,
      width: Math.round(session.width),
      previousWidth: Math.round(session.startWidth),
      mode: this.columnResizeMode(),
      nativeEvent,
    });
    this.emitState('column');
  }

  cancelColumnResize(nativeEvent: PointerEvent): void {
    const session = this.resizeSession;
    if (!session || session.pointerId !== nativeEvent.pointerId) return;
    this.columnWidths.set(session.initialWidths);
    this.resizeSession = null;
  }

  resizeColumnWithKeyboard(
    column: NeuralTableColumn<T>,
    nativeEvent: KeyboardEvent,
  ): void {
    if (
      !this.canResizeColumn(column) ||
      (nativeEvent.key !== 'ArrowLeft' && nativeEvent.key !== 'ArrowRight')
    ) {
      return;
    }
    nativeEvent.preventDefault();
    nativeEvent.stopPropagation();
    const handle = nativeEvent.currentTarget as HTMLElement;
    const table = handle.closest('table');
    const headerCell = handle.closest('th');
    if (!table || !headerCell) return;
    const direction = getComputedStyle(table).direction === 'rtl' ? -1 : 1;
    const step =
      Math.max(1, this.columnResizeStep()) * (nativeEvent.shiftKey ? 4 : 1);
    const delta = (nativeEvent.key === 'ArrowRight' ? step : -step) * direction;
    this.resizeColumnBy(column, delta, nativeEvent, table, headerCell);
  }

  autoSizeColumn(column: NeuralTableColumn<T>, nativeEvent: MouseEvent): void {
    if (!this.canResizeColumn(column)) return;
    nativeEvent.preventDefault();
    nativeEvent.stopPropagation();
    const handle = nativeEvent.currentTarget as HTMLElement;
    const table = handle.closest('table');
    const headerCell = handle.closest('th');
    if (!table || !headerCell) return;
    const cells = Array.from(
      table.querySelectorAll<HTMLElement>(
        'thead tr:first-child th[data-neural-column], tbody td[data-neural-column]',
      ),
    ).filter((cell) => cell.dataset['neuralColumn'] === column.id);
    const desired = Math.max(
      this.safeMinimumColumnWidth(),
      ...cells.map((cell) => cell.scrollWidth + 8),
    );
    const current = headerCell.getBoundingClientRect().width;
    this.resizeColumnBy(
      column,
      desired - current,
      nativeEvent,
      table,
      headerCell,
    );
  }

  isColumnVisible(columnId: string): boolean {
    const column = this.columns().find(
      (candidate) => candidate.id === columnId,
    );
    return Boolean(
      column && !column.hidden && !this.hiddenColumnIdSet().has(columnId),
    );
  }

  setColumnVisibility(
    columnId: string,
    visible: boolean,
    nativeEvent?: Event,
  ): void {
    const column = this.columns().find(
      (candidate) => candidate.id === columnId,
    );
    if (!column || column.hidden) return;
    const hidden = new Set(this.hiddenColumnIds());
    if (visible) hidden.delete(columnId);
    else hidden.add(columnId);
    const next = [...hidden];
    if (
      next.length === this.hiddenColumnIds().length &&
      next.every((id, index) => id === this.hiddenColumnIds()[index])
    ) {
      return;
    }
    this.hiddenColumnIds.set(next);
    this.columnVisibilityChange.emit({
      hiddenColumnIds: next,
      visibleColumnIds: this.columns()
        .filter(
          (candidate) => !candidate.hidden && !next.includes(candidate.id),
        )
        .map((candidate) => candidate.id),
      changedColumnId: columnId,
      visible,
      nativeEvent,
    });
    this.emitState('column');
  }

  toggleColumnVisibility(columnId: string, nativeEvent?: Event): void {
    this.setColumnVisibility(
      columnId,
      !this.isColumnVisible(columnId),
      nativeEvent,
    );
  }

  showAllColumns(nativeEvent?: Event): void {
    if (this.hiddenColumnIds().length === 0) return;
    this.hiddenColumnIds.set([]);
    this.columnVisibilityChange.emit({
      hiddenColumnIds: [],
      visibleColumnIds: this.columns()
        .filter((column) => !column.hidden)
        .map((column) => column.id),
      nativeEvent,
    });
    this.emitState('column');
  }

  stickyOffset(column: NeuralTableColumn<T>): string {
    const columns = this.visibleColumns();
    const index = columns.indexOf(column);
    const controls =
      column.sticky === 'start'
        ? (this.selectionMode() === 'none' ? 0 : 1) +
          (this.hasExpansion() ? 1 : 0)
        : 0;
    const siblings =
      column.sticky === 'start'
        ? columns.slice(0, index)
        : columns.slice(index + 1);
    const sizes = [
      ...(controls > 0 ? [`${controls * 3}rem`] : []),
      ...siblings
        .filter((candidate) => candidate.sticky === column.sticky)
        .map((candidate) => this.columnWidth(candidate) ?? '0px'),
    ];
    if (sizes.length === 0) return '0px';
    return sizes.length === 1 ? sizes[0] : `calc(${sizes.join(' + ')})`;
  }

  rowLabel(
    key: 'selectRow' | 'expandRow' | 'collapseRow',
    rowIndex: number,
  ): string {
    return this.locale.format(this.resolvedLabels()[key], {
      row: this.pageIndex() * this.pageSize() + rowIndex + 1,
    });
  }

  selectAllAriaLabel(): string {
    const labels = this.resolvedLabels();
    return this.selectAllMode() === 'all'
      ? labels.selectAllRows
      : this.selectAllMode() === 'filtered'
        ? labels.selectAllFiltered
        : labels.selectAllPage;
  }

  activeFilter(column: NeuralTableColumn<T>): NeuralTableFilter | null {
    return (
      this.filters().find(
        (filter) =>
          filter.field === column.id ||
          filter.field === String(column.field ?? ''),
      ) ?? null
    );
  }

  filterMatchMode(
    column: NeuralTableColumn<T>,
  ): NonNullable<NeuralTableFilter['matchMode']> {
    if (column.filterMatchMode) return column.filterMatchMode;
    return column.filterType === 'select' || column.filterType === 'boolean'
      ? 'equals'
      : 'contains';
  }

  filterInputType(column: NeuralTableColumn<T>): 'text' | 'number' | 'date' {
    return column.filterType === 'number'
      ? 'number'
      : column.filterType === 'date'
        ? 'date'
        : 'text';
  }

  filterOptions(
    column: NeuralTableColumn<T>,
  ): readonly NeuralTableFilterOption[] {
    if (column.filterType !== 'boolean') return column.filterOptions ?? [];
    return (
      column.filterOptions ?? [
        { label: this.resolvedLabels().filterTrue, value: true },
        { label: this.resolvedLabels().filterFalse, value: false },
      ]
    );
  }

  filterSelectOptions(
    column: NeuralTableColumn<T>,
  ): readonly NeuralTableFilterOption[] {
    return [
      { label: this.resolvedLabels().filterAll, value: null },
      ...this.filterOptions(column),
    ];
  }

  selectFilterValue(column: NeuralTableColumn<T>): unknown {
    const value = this.activeFilter(column)?.value ?? null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }

  filterAriaLabel(
    column: NeuralTableColumn<T>,
    key: 'filter' | 'filterFrom' | 'filterTo' = 'filter',
  ): string {
    if (key === 'filter' && column.filterAriaLabel) {
      return column.filterAriaLabel;
    }
    return this.locale.format(this.resolvedLabels()[key], {
      column: column.header,
    });
  }

  filterControlValue(column: NeuralTableColumn<T>): string | number {
    const value = this.filterValue(column);
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }

  filterRangeValue(
    column: NeuralTableColumn<T>,
    index: 0 | 1,
  ): string | number {
    const value = this.filterValue(column);
    const entry = Array.isArray(value) ? value[index] : null;
    return typeof entry === 'string' || typeof entry === 'number' ? entry : '';
  }

  onFilterInput(column: NeuralTableColumn<T>, nativeEvent: Event): void {
    const control = nativeEvent.target as HTMLInputElement;
    this.queueColumnFilter(
      column,
      this.controlFilterValue(column, control),
      nativeEvent,
    );
  }

  onRangeFilterInput(
    column: NeuralTableColumn<T>,
    index: 0 | 1,
    nativeEvent: Event,
  ): void {
    const control = nativeEvent.target as HTMLInputElement;
    const current = this.filterValue(column);
    const range: [unknown, unknown] = Array.isArray(current)
      ? [current[0] ?? null, current[1] ?? null]
      : [null, null];
    range[index] = this.controlFilterValue(column, control);
    this.queueColumnFilter(column, range, nativeEvent);
  }

  onSelectFilterValue(column: NeuralTableColumn<T>, selected: unknown): void {
    const value =
      selected !== null && this.filterMatchMode(column) === 'in'
        ? [selected]
        : selected;
    this.applyColumnFilter(column, value);
  }

  applyColumnFilter(
    column: NeuralTableColumn<T>,
    value: unknown,
    nativeEvent?: Event,
  ): void {
    this.cancelFilterTimer(column.id);
    this.removeFilterDraft(column.id);
    const withoutColumn = this.filters().filter(
      (filter) =>
        filter.field !== column.id &&
        filter.field !== String(column.field ?? ''),
    );
    const filter = this.isEmptyFilterValue(value)
      ? null
      : {
          field: column.id,
          value,
          matchMode: this.filterMatchMode(column),
        };
    const next = filter ? [...withoutColumn, filter] : withoutColumn;
    this.filters.set(next);
    this.pageIndex.set(0);
    this.filterEvent.emit({ filter, filters: next, nativeEvent });
    this.emitState('filter');
  }

  clearFilters(includeGlobal = false): void {
    for (const timer of this.filterTimers.values()) clearTimeout(timer);
    this.filterTimers.clear();
    this.filterDrafts.set({});
    this.filters.set([]);
    if (includeGlobal) this.globalFilter.set(null);
    this.pageIndex.set(0);
    this.filterEvent.emit({ filter: null, filters: [] });
    this.emitState('filter');
  }

  setFilters(
    filters: readonly NeuralTableFilter[],
    globalFilter: unknown = this.globalFilter(),
  ): void {
    for (const timer of this.filterTimers.values()) clearTimeout(timer);
    this.filterTimers.clear();
    this.filterDrafts.set({});
    this.filters.set(filters);
    this.globalFilter.set(globalFilter);
    this.pageIndex.set(0);
    this.emitState('filter');
  }

  setPage(pageIndex: number, pageSize = this.pageSize()): void {
    this.pageIndex.set(Math.max(0, Math.trunc(pageIndex) || 0));
    this.pageSize.set(Math.max(1, Math.trunc(pageSize) || 1));
    this.emitState('page');
  }

  captureState(): NeuralTableState {
    return {
      version: NEURAL_TABLE_STATE_VERSION,
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      sort: this.sort().map((item) => ({ ...item })),
      filters: this.filters().map((item) => ({ ...item })),
      globalFilter: this.globalFilter(),
      columnOrder: [...this.columnOrder()],
      columnWidths: { ...this.columnWidths() },
      hiddenColumnIds: [...this.hiddenColumnIds()],
      selectionKeys: [...this.selectionKeys()],
      expandedRowKeys: [...this.expandedRowKeys()],
      expandedRowGroupKeys: [...this.expandedRowGroupKeys()],
    };
  }

  serializeState(): string {
    return serializeNeuralTableState(this.captureState());
  }

  restoreState(
    value: string | NeuralTableState,
    source: NeuralTableStateRestoreEvent['source'] = 'api',
    key: string | null = null,
  ): boolean {
    const state = parseNeuralTableState(value);
    if (!state) return false;
    const columnIds = new Set(this.columns().map((column) => column.id));
    const columnFields = new Set(
      this.columns().map((column) => String(column.field ?? column.id)),
    );
    const validStateField = (field: string) =>
      columnIds.has(field) || columnFields.has(field);
    const columnOrder = state.columnOrder.filter(
      (id, index, values) => columnIds.has(id) && values.indexOf(id) === index,
    );
    const columnWidths = Object.fromEntries(
      Object.entries(state.columnWidths).filter(
        ([id, width]) =>
          columnIds.has(id) && Number.isFinite(width) && width > 0,
      ),
    );
    const hiddenColumnIds = state.hiddenColumnIds.filter(
      (id, index, values) => columnIds.has(id) && values.indexOf(id) === index,
    );
    this.pageIndex.set(state.pageIndex);
    this.pageSize.set(state.pageSize);
    this.sort.set(state.sort.filter((item) => validStateField(item.field)));
    this.filters.set(
      state.filters.filter((item) => validStateField(item.field)),
    );
    this.globalFilter.set(state.globalFilter);
    this.columnOrder.set(columnOrder);
    this.columnWidths.set(columnWidths);
    this.hiddenColumnIds.set(hiddenColumnIds);
    this.selectionKeys.set([...new Set(state.selectionKeys)]);
    if (this.dataMode() === 'client') {
      const keys = new Set(state.selectionKeys);
      this.selection.set(
        this.value().filter((row) => {
          const rowKey = this.keyFor(row);
          return rowKey !== null && keys.has(rowKey);
        }),
      );
    }
    this.expandedRowKeys.set([...new Set(state.expandedRowKeys)]);
    this.expandedRowGroupKeys.set([...new Set(state.expandedRowGroupKeys)]);
    const restored = this.captureState();
    this.stateRestore.emit({ key, state: restored, source });
    this.emitState('restore');
    return true;
  }

  async clearStoredState(): Promise<void> {
    const key = this.stateKey();
    if (!key || !this.isBrowser) return;
    this.clearedPersistenceSnapshot = this.persistenceFingerprint(
      this.captureState(),
    );
    const adapter = this.stateAdapter();
    const storage = this.stateStorage();
    const document = this.document;
    await this.enqueuePersistenceOperation(async () => {
      if (adapter) {
        await adapter.remove?.(key);
        return;
      }
      const view = document.defaultView;
      if (!view || storage === 'none') return;
      const target =
        storage === 'session' ? view.sessionStorage : view.localStorage;
      target.removeItem(key);
    });
  }

  isLatestRequest(requestId: number): boolean {
    return requestId === this.latestRequestId();
  }

  private resizeColumnBy(
    column: NeuralTableColumn<T>,
    delta: number,
    nativeEvent: KeyboardEvent | MouseEvent,
    table: HTMLTableElement,
    headerCell: HTMLTableCellElement,
  ): void {
    const widths = this.measureColumnWidths(table);
    const neighbor = this.resizeNeighbor(column);
    const neighborCell = neighbor
      ? this.headerCellFor(table, neighbor.id)
      : null;
    const style = getComputedStyle(headerCell);
    const neighborStyle = neighborCell ? getComputedStyle(neighborCell) : null;
    const startWidth =
      widths[column.id] ?? headerCell.getBoundingClientRect().width;
    const session: NeuralTableResizeSession<T> = {
      pointerId: -1,
      column,
      neighbor,
      startX: 0,
      direction: 1,
      startWidth,
      neighborStartWidth: neighbor
        ? (widths[neighbor.id] ??
          neighborCell?.getBoundingClientRect().width ??
          0)
        : 0,
      minWidth: this.computedLimit(
        style.minWidth,
        this.safeMinimumColumnWidth(),
      ),
      maxWidth: this.computedLimit(style.maxWidth, Number.POSITIVE_INFINITY),
      neighborMinWidth: this.computedLimit(
        neighborStyle?.minWidth,
        this.safeMinimumColumnWidth(),
      ),
      neighborMaxWidth: this.computedLimit(
        neighborStyle?.maxWidth,
        Number.POSITIVE_INFINITY,
      ),
      initialWidths: widths,
      width: startWidth,
    };
    this.columnWidths.set(widths);
    const width = this.applyResizeDelta(session, delta);
    if (Math.round(width) === Math.round(startWidth)) return;
    this.columnResize.emit({
      column,
      columnId: column.id,
      width: Math.round(width),
      previousWidth: Math.round(startWidth),
      mode: this.columnResizeMode(),
      nativeEvent,
    });
    this.emitState('column');
  }

  private applyResizeDelta(
    session: NeuralTableResizeSession<T>,
    delta: number,
  ): number {
    let width = this.clamp(
      session.startWidth + delta,
      session.minWidth,
      session.maxWidth,
    );
    const next = { ...session.initialWidths };
    if (this.columnResizeMode() === 'fit' && session.neighbor) {
      let appliedDelta = width - session.startWidth;
      const neighborWidth = this.clamp(
        session.neighborStartWidth - appliedDelta,
        session.neighborMinWidth,
        session.neighborMaxWidth,
      );
      appliedDelta = session.neighborStartWidth - neighborWidth;
      width = this.clamp(
        session.startWidth + appliedDelta,
        session.minWidth,
        session.maxWidth,
      );
      next[session.neighbor.id] = neighborWidth;
    }
    next[session.column.id] = width;
    this.columnWidths.set(next);
    return width;
  }

  private measureColumnWidths(table: HTMLTableElement): Record<string, number> {
    const widths: Record<string, number> = { ...this.columnWidths() };
    for (const cell of Array.from(
      table.querySelectorAll<HTMLTableCellElement>(
        'thead tr:first-child th[data-neural-column]',
      ),
    )) {
      const columnId = cell.dataset['neuralColumn'];
      if (columnId && Number.isFinite(widths[columnId])) continue;
      const measuredWidth = cell.getBoundingClientRect().width;
      if (columnId && measuredWidth > 0) widths[columnId] = measuredWidth;
    }
    return widths;
  }

  private headerCellFor(
    table: HTMLTableElement,
    columnId: string,
  ): HTMLTableCellElement | null {
    return (
      Array.from(
        table.querySelectorAll<HTMLTableCellElement>(
          'thead tr:first-child th[data-neural-column]',
        ),
      ).find((cell) => cell.dataset['neuralColumn'] === columnId) ?? null
    );
  }

  private resolveGroupRows(
    groups: readonly NeuralTableHeaderGroup[],
  ): readonly (readonly NeuralTableResolvedGroupCell[])[] {
    if (groups.length === 0 || this.visibleColumns().length === 0) return [];
    const paths = new Map<string, readonly NeuralTableHeaderGroup[]>();
    const visit = (
      group: NeuralTableHeaderGroup,
      parents: readonly NeuralTableHeaderGroup[],
    ): void => {
      const path = [...parents, group];
      for (const child of group.children) {
        if (typeof child === 'string') {
          if (!paths.has(child)) paths.set(child, path);
        } else {
          visit(child, path);
        }
      }
    };
    for (const group of groups) visit(group, []);
    const depth = Math.max(
      0,
      ...this.visibleColumns().map(
        (column) => paths.get(column.id)?.length ?? 0,
      ),
    );
    const rows: NeuralTableResolvedGroupCell[][] = [];
    for (let level = 0; level < depth; level += 1) {
      const row: NeuralTableResolvedGroupCell[] = [];
      for (const column of this.visibleColumns()) {
        const path = paths.get(column.id) ?? [];
        if (path.length === 0 && level > 0) continue;
        if (path.length > 0 && level >= path.length) continue;
        const group = path[level] ?? null;
        const rowspan =
          path.length === 0
            ? depth
            : level === path.length - 1
              ? depth - level
              : 1;
        const previous = row[row.length - 1];
        if (
          group &&
          previous?.group?.id === group.id &&
          previous.rowspan === rowspan
        ) {
          row[row.length - 1] = {
            ...previous,
            colspan: previous.colspan + 1,
          };
        } else {
          row.push({
            id: group
              ? `${level}:${group.id}:${row.length}`
              : `${level}:empty:${column.id}`,
            group,
            colspan: 1,
            rowspan,
          });
        }
      }
      rows.push(row);
    }
    return rows;
  }

  private canReorderColumn(column: NeuralTableColumn<T>): boolean {
    return (
      this.reorderableColumns() &&
      !this.disabled() &&
      column.reorderable !== false
    );
  }

  private sameStickyRegion(
    source: NeuralTableColumn<T>,
    target: NeuralTableColumn<T>,
  ): boolean {
    return (source.sticky ?? 'none') === (target.sticky ?? 'none');
  }

  private pointerDropAt(
    handle: HTMLElement,
    source: NeuralTableColumn<T>,
    clientX: number,
    clientY: number,
  ): NeuralTableActiveDrop | null {
    const element = handle.ownerDocument.elementFromPoint(clientX, clientY);
    const cell = element?.closest<HTMLElement>('th[data-neural-column]');
    const target = cell
      ? this.orderedColumns().find(
          (column) => column.id === cell.dataset['neuralColumn'],
        )
      : null;
    if (
      !cell ||
      !target ||
      target.id === source.id ||
      !this.sameStickyRegion(source, target)
    ) {
      return null;
    }
    const rect = cell.getBoundingClientRect();
    const rtl = getComputedStyle(cell).direction === 'rtl';
    const before = rtl
      ? clientX > rect.left + rect.width / 2
      : clientX < rect.left + rect.width / 2;
    return {
      columnId: target.id,
      position: before ? 'before' : 'after',
    };
  }

  private commitColumnReorder(
    source: NeuralTableColumn<T>,
    target: NeuralTableColumn<T>,
    position: NeuralTableDropPosition,
    nativeEvent: PointerEvent | KeyboardEvent,
  ): void {
    if (
      source.id === target.id ||
      !this.canReorderColumn(source) ||
      !this.sameStickyRegion(source, target)
    ) {
      return;
    }
    const current = this.orderedColumns();
    const previousIndex = current.findIndex(
      (column) => column.id === source.id,
    );
    const withoutSource = current.filter((column) => column.id !== source.id);
    const targetIndex = withoutSource.findIndex(
      (column) => column.id === target.id,
    );
    if (previousIndex < 0 || targetIndex < 0) return;
    const insertionIndex = targetIndex + (position === 'after' ? 1 : 0);
    const nextColumns = [...withoutSource];
    nextColumns.splice(insertionIndex, 0, source);
    const currentIndex = nextColumns.findIndex(
      (column) => column.id === source.id,
    );
    if (currentIndex === previousIndex) return;
    const nextOrder = nextColumns.map((column) => column.id);
    this.columnOrder.set(nextOrder);
    this.columnReorder.emit({
      column: source,
      columnId: source.id,
      previousIndex,
      currentIndex,
      columnOrder: nextOrder,
      nativeEvent,
    });
    this.emitState('column');
    this.reorderAnnouncement.set(
      this.locale.format(this.resolvedLabels().columnMoved, {
        column: source.header,
        position: currentIndex + 1,
      }),
    );
  }

  private resizeNeighbor(
    column: NeuralTableColumn<T>,
  ): NeuralTableColumn<T> | null {
    const columns = this.visibleColumns();
    return (
      columns
        .slice(columns.indexOf(column) + 1)
        .find((candidate) => candidate.resizable !== false) ?? null
    );
  }

  private computedLimit(value: string | undefined, fallback: number): number {
    if (!value || value === 'none') return fallback;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private pixelValue(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private safeMinimumColumnWidth(): number {
    const value = this.minColumnWidth();
    return Number.isFinite(value) ? Math.max(32, value) : 64;
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
  }

  private keyFor(row: T): NeuralTableRowKey | null {
    const key = this.rowKey();
    if (typeof key === 'function') return key(row);
    if (typeof key === 'string' && row !== null && typeof row === 'object') {
      const value = (row as Readonly<Record<string, unknown>>)[key];
      return typeof value === 'string' || typeof value === 'number'
        ? value
        : null;
    }
    return null;
  }

  private filterValue(column: NeuralTableColumn<T>): unknown {
    const drafts = this.filterDrafts();
    return Object.prototype.hasOwnProperty.call(drafts, column.id)
      ? drafts[column.id]
      : this.activeFilter(column)?.value;
  }

  private controlFilterValue(
    column: NeuralTableColumn<T>,
    control: HTMLInputElement,
  ): unknown {
    if (control.value === '') return null;
    if (column.filterType === 'number') {
      return Number.isNaN(control.valueAsNumber) ? null : control.valueAsNumber;
    }
    return control.value;
  }

  private queueColumnFilter(
    column: NeuralTableColumn<T>,
    value: unknown,
    nativeEvent: Event,
  ): void {
    this.filterDrafts.update((drafts) => ({ ...drafts, [column.id]: value }));
    this.cancelFilterTimer(column.id);
    const delay = Math.max(0, this.filterDelay());
    if (delay === 0) {
      this.applyColumnFilter(column, value, nativeEvent);
      return;
    }
    this.filterTimers.set(
      column.id,
      setTimeout(() => {
        this.filterTimers.delete(column.id);
        this.applyColumnFilter(column, value, nativeEvent);
      }, delay),
    );
  }

  private cancelFilterTimer(columnId: string): void {
    const timer = this.filterTimers.get(columnId);
    if (timer) clearTimeout(timer);
    this.filterTimers.delete(columnId);
  }

  private removeFilterDraft(columnId: string): void {
    this.filterDrafts.update((drafts) => {
      if (!Object.prototype.hasOwnProperty.call(drafts, columnId))
        return drafts;
      const next = { ...drafts };
      delete next[columnId];
      return next;
    });
  }

  private isEmptyFilterValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) {
      return (
        value.length === 0 ||
        value.every((entry) => this.isEmptyFilterValue(entry))
      );
    }
    return false;
  }

  private selectFromInteraction(
    row: T,
    rowIndex: number,
    nativeEvent: MouseEvent | KeyboardEvent,
    reason: 'row' | 'keyboard',
  ): void {
    if (this.selectionMode() === 'none') return;
    if (nativeEvent.shiftKey && this.selectionMode() === 'multiple') {
      this.selectRange(
        row,
        rowIndex,
        nativeEvent,
        nativeEvent.ctrlKey || nativeEvent.metaKey,
      );
      return;
    }
    if (
      this.selectionMode() === 'multiple' &&
      (nativeEvent.ctrlKey || nativeEvent.metaKey)
    ) {
      this.toggleRow(row, rowIndex, nativeEvent, reason);
      return;
    }
    const selected = this.isSelected(row);
    if (
      selected &&
      (this.selectionMode() === 'single' || this.selectedSelectionSize() === 1)
    ) {
      this.selectionAnchor.set(this.rowIdentity(row, rowIndex));
      return;
    }
    this.commitSelection([row], row, true, nativeEvent, reason, rowIndex);
    this.selectionAnchor.set(this.rowIdentity(row, rowIndex));
  }

  private selectRange(
    row: T,
    rowIndex: number,
    nativeEvent: Event,
    additive: boolean,
  ): void {
    const rows = this.displayRows();
    const anchor = this.selectionAnchor();
    const anchorIndex =
      anchor === null
        ? rowIndex
        : rows.findIndex(
            (candidate, index) => this.rowIdentity(candidate, index) === anchor,
          );
    const start = Math.min(anchorIndex < 0 ? rowIndex : anchorIndex, rowIndex);
    const end = Math.max(anchorIndex < 0 ? rowIndex : anchorIndex, rowIndex);
    const range = rows
      .slice(start, end + 1)
      .filter((candidate, offset) =>
        this.isRowSelectable(candidate, start + offset),
      );
    if (this.dataMode() === 'remote') {
      const rangeKeys = range
        .map((candidate) => this.keyFor(candidate))
        .filter((key): key is NeuralTableRowKey => key !== null);
      const nextKeys = additive
        ? [...new Set([...this.selectionKeys(), ...rangeKeys])]
        : rangeKeys;
      this.selectionKeys.set(nextKeys);
      this.selectionEvent.emit({
        selection: [],
        selectionKeys: nextKeys,
        changedRow: row,
        changedRowKey: this.keyFor(row) ?? undefined,
        selected: true,
        reason: 'range',
        nativeEvent,
      });
      this.emitState('selection');
    } else {
      const next = additive
        ? this.uniqueRows([...this.selection(), ...range])
        : range;
      this.commitSelection(next, row, true, nativeEvent, 'range', rowIndex);
    }
    if (anchor === null) {
      this.selectionAnchor.set(this.rowIdentity(row, rowIndex));
    }
  }

  private commitSelection(
    nextRows: readonly T[],
    changedRow: T | undefined,
    selected: boolean,
    nativeEvent: Event,
    reason: NeuralTableSelectionChange<T>['reason'],
    changedRowIndex = -1,
  ): void {
    let eventSelection: readonly T[] = nextRows;
    let nextKeys: readonly NeuralTableRowKey[];
    if (this.dataMode() === 'remote') {
      const changedKey =
        changedRow === undefined ? null : this.keyFor(changedRow);
      if (changedKey === null) return;
      nextKeys =
        this.selectionMode() === 'single' && selected
          ? [changedKey]
          : selected
            ? [...new Set([...this.selectionKeys(), changedKey])]
            : this.selectionKeys().filter((key) => key !== changedKey);
      this.selectionKeys.set(nextKeys);
      eventSelection = [];
    } else {
      const unique = this.uniqueRows(nextRows);
      this.selection.set(unique);
      nextKeys = unique
        .map((candidate) => this.keyFor(candidate))
        .filter((key): key is NeuralTableRowKey => key !== null);
      this.selectionKeys.set(nextKeys);
      eventSelection = unique;
    }
    const changedRowKey =
      changedRow === undefined
        ? undefined
        : (this.keyFor(changedRow) ?? undefined);
    this.selectionEvent.emit({
      selection: eventSelection,
      selectionKeys: nextKeys,
      changedRow,
      changedRowKey,
      selected,
      reason,
      nativeEvent,
    });
    this.emitState('selection');
    if (changedRow === undefined) return;
    const event = {
      row: changedRow,
      rowIndex: changedRowIndex,
      nativeEvent,
    };
    if (selected) this.rowSelect.emit(event);
    else this.rowUnselect.emit(event);
  }

  private selectedRowsForMutation(): readonly T[] {
    return this.dataMode() === 'remote'
      ? this.displayRows().filter((row) => this.isSelected(row))
      : this.selection();
  }

  private selectedSelectionSize(): number {
    return this.dataMode() === 'remote'
      ? this.selectionKeys().length
      : this.selection().length;
  }

  private uniqueRows(rows: readonly T[]): readonly T[] {
    const keys = new Set<NeuralTableRowKey>();
    const references = new Set<T>();
    const unique: T[] = [];
    for (const row of rows) {
      const key = this.keyFor(row);
      if (key === null) {
        if (references.has(row)) continue;
        references.add(row);
      } else {
        if (keys.has(key)) continue;
        keys.add(key);
      }
      unique.push(row);
    }
    return unique;
  }

  private firstSelectableDisplayIndex(): number {
    return this.displayRows().findIndex((row, rowIndex) =>
      this.isRowNavigable(row, rowIndex),
    );
  }

  private keyboardTargetIndex(currentIndex: number, key: string): number {
    const selectableIndices = this.displayRows()
      .map((row, rowIndex) =>
        this.isRowNavigable(row, rowIndex) ? rowIndex : -1,
      )
      .filter((rowIndex) => rowIndex >= 0);
    if (selectableIndices.length === 0) return -1;
    if (key === 'Home') return selectableIndices[0];
    if (key === 'End') return selectableIndices[selectableIndices.length - 1];
    const currentPosition = selectableIndices.indexOf(currentIndex);
    const movement = key === 'ArrowDown' ? 1 : -1;
    return selectableIndices[currentPosition + movement] ?? -1;
  }

  private focusDisplayRow(currentRow: HTMLElement, rowIndex: number): void {
    const body = currentRow.closest('tbody');
    queueMicrotask(() => {
      body
        ?.querySelector<HTMLElement>(`tr[data-neural-row-index="${rowIndex}"]`)
        ?.focus({ preventScroll: true });
    });
  }

  private isInteractiveTarget(nativeEvent: MouseEvent): boolean {
    const target = nativeEvent.target;
    const currentTarget = nativeEvent.currentTarget;
    return (
      target instanceof Element &&
      target !== currentTarget &&
      Boolean(
        target.closest(
          'a, button, input, select, textarea, [contenteditable="true"], [role="button"]',
        ),
      )
    );
  }

  private isRowNavigable(row: T, rowIndex: number): boolean {
    return (
      this.isRowSelectable(row, rowIndex) && !this.isRowHiddenByGroup(rowIndex)
    );
  }

  private sameRow(left: T, right: T): boolean {
    const leftKey = this.keyFor(left);
    return leftKey === null
      ? Object.is(left, right)
      : leftKey === this.keyFor(right);
  }

  private emitState(reason: NeuralTableStateChange['reason']): void {
    const requestId = this.latestRequestId() + 1;
    this.latestRequestId.set(requestId);
    this.stateChange.emit({
      ...this.captureState(),
      reason,
      requestId,
    });
  }

  private async restorePersistedState(
    key: string | null,
    storage: NeuralTableStateStorage,
    adapter: NeuralTableStateAdapter | null,
  ): Promise<void> {
    this.cancelPersistenceLoad?.();
    const sequence = ++this.persistenceSequence;
    if (!key || (!adapter && storage === 'none')) {
      this.cancelPersistenceLoad = null;
      this.restoredPersistenceKey.set(null);
      return;
    }
    let cancelCurrentLoad!: () => void;
    const currentLoadCancelled = new Promise<void>((resolve) => {
      cancelCurrentLoad = resolve;
    });
    this.cancelPersistenceLoad = cancelCurrentLoad;
    try {
      let stored: NeuralTableState | string | null;
      if (adapter) {
        let load: Promise<
          | {
              readonly kind: 'result';
              readonly value: NeuralTableState | string | null;
            }
          | { readonly kind: 'error'; readonly error: unknown }
        >;
        try {
          load = Promise.resolve(adapter.load(key)).then(
            (value) => ({ kind: 'result' as const, value }),
            (error: unknown) => ({ kind: 'error' as const, error }),
          );
        } catch (error: unknown) {
          load = Promise.resolve({ kind: 'error' as const, error });
        }
        const outcome = await Promise.race([
          load,
          this.destroyedSignal.then(() => ({
            kind: 'destroyed' as const,
          })),
          currentLoadCancelled.then(() => ({
            kind: 'cancelled' as const,
          })),
        ]);
        if (outcome.kind === 'destroyed' || outcome.kind === 'cancelled') {
          return;
        }
        if (outcome.kind === 'error') throw outcome.error;
        stored = outcome.value;
      } else {
        stored = this.resolveStorage(storage)?.getItem(key) ?? null;
      }
      if (this.destroyed || sequence !== this.persistenceSequence) {
        return;
      }
      if (stored !== null) {
        this.restoreState(stored, adapter ? 'adapter' : 'storage', key);
      }
    } catch {
      // Persistence failures never prevent Table from rendering.
    } finally {
      if (this.cancelPersistenceLoad === cancelCurrentLoad) {
        this.cancelPersistenceLoad = null;
      }
      if (!this.destroyed && sequence === this.persistenceSequence) {
        this.restoredPersistenceKey.set(key);
      }
    }
  }

  private persistState(
    key: string,
    state: NeuralTableState,
    storage: NeuralTableStateStorage,
    adapter: NeuralTableStateAdapter | null,
  ): Promise<void> {
    const serialized = this.persistenceFingerprint(state);
    if (serialized !== null && serialized === this.clearedPersistenceSnapshot) {
      return Promise.resolve();
    }
    this.clearedPersistenceSnapshot = null;
    const document = this.document;
    return this.enqueuePersistenceOperation(async () => {
      if (adapter) {
        await adapter.save(key, state);
      } else {
        const view = document.defaultView;
        if (!view || storage === 'none') return;
        const target =
          storage === 'session' ? view.sessionStorage : view.localStorage;
        target.setItem(key, serialized ?? serializeNeuralTableState(state));
      }
    });
  }

  private enqueuePersistenceOperation(
    operation: () => void | Promise<void>,
  ): Promise<void> {
    const writer = this.persistenceWriter;
    const version = ++writer.version;
    writer.queue = writer.queue
      .catch(() => undefined)
      .then(async () => {
        if (writer.destroyed || version !== writer.version) return;
        try {
          await operation();
        } catch {
          // Storage quotas, privacy modes, and adapter errors are non-fatal.
        }
      });
    return writer.queue;
  }

  private persistenceFingerprint(state: NeuralTableState): string | null {
    try {
      return serializeNeuralTableState(state);
    } catch {
      return null;
    }
  }

  private resolveStorage(storage: NeuralTableStateStorage): Storage | null {
    const view = this.document.defaultView;
    if (!view || storage === 'none') return null;
    return storage === 'session' ? view.sessionStorage : view.localStorage;
  }

  private editValue(
    column: NeuralTableColumn<T>,
    row: T,
    rowIndex: number,
  ): unknown {
    const draft = this.editDraft();
    return Object.prototype.hasOwnProperty.call(draft, column.id)
      ? draft[column.id]
      : resolveNeuralTableValue(row, column, rowIndex);
  }

  private setEditValue(column: NeuralTableColumn<T>, value: unknown): void {
    if (!this.activeEdit() || this.editLoading()) return;
    this.editDraft.update((draft) => ({ ...draft, [column.id]: value }));
    this.editError.set(null);
  }

  private draftRow(row: T): T {
    if (row === null || typeof row !== 'object') return row;
    const draft = { ...(row as Record<string, unknown>) };
    for (const [columnId, value] of Object.entries(this.editDraft())) {
      const column = this.columns().find(
        (candidate) => candidate.id === columnId,
      );
      const path =
        typeof column?.field === 'string'
          ? column.field
          : column?.field
            ? String(column.field)
            : columnId;
      this.assignDraftPath(draft, path, value);
    }
    return draft as T;
  }

  private assignDraftPath(
    target: Record<string, unknown>,
    path: string,
    value: unknown,
  ): void {
    const segments = path.split('.').filter(Boolean);
    if (segments.length === 0) return;
    let cursor = target;
    for (const segment of segments.slice(0, -1)) {
      const current = cursor[segment];
      const next =
        current && typeof current === 'object'
          ? { ...(current as Record<string, unknown>) }
          : {};
      cursor[segment] = next;
      cursor = next;
    }
    cursor[segments[segments.length - 1]] = value;
  }

  private cellEditEvent(
    row: T,
    rowIndex: number,
    column: NeuralTableColumn<T>,
    value: unknown,
    previousValue: unknown,
    nativeEvent?: Event,
  ): NeuralTableEditEvent<T> {
    return {
      row,
      draftRow: this.draftRow(row),
      rowIndex,
      rowKey: this.keyFor(row),
      column,
      value,
      previousValue,
      nativeEvent,
    };
  }

  private rowEditEvent(
    row: T,
    rowIndex: number,
    nativeEvent?: Event,
  ): NeuralTableRowEditEvent<T> {
    return {
      row,
      draftRow: this.draftRow(row),
      rowIndex,
      rowKey: this.keyFor(row),
      changes: this.editDraft(),
      nativeEvent,
    };
  }

  private resetEditState(): void {
    this.activeEdit.set(null);
    this.editDraft.set({});
    this.editError.set(null);
    this.editLoading.set(false);
  }

  private focusAdjacentEditableCell(
    currentCell: HTMLElement,
    backwards: boolean,
  ): void {
    const table = currentCell.closest('table');
    if (!table) return;
    const cells = Array.from(
      table.querySelectorAll<HTMLElement>('td[data-neural-editable="true"]'),
    );
    const currentIndex = cells.indexOf(currentCell);
    if (currentIndex < 0 || cells.length === 0) return;
    const offset = backwards ? -1 : 1;
    const nextIndex = (currentIndex + offset + cells.length) % cells.length;
    cells[nextIndex]?.focus();
  }

  private isRowGroupColumn(column: NeuralTableColumn<T>): boolean {
    const groupBy = this.groupRowsBy();
    if (!groupBy || typeof groupBy === 'function') return false;
    return (
      column.id === String(groupBy) ||
      String(column.field ?? '') === String(groupBy)
    );
  }

  private toRowGroupKey(value: unknown): NeuralTableRowKey {
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (value === null || value === undefined) return '__neural_empty_group__';
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private composeClass(
    structural: string,
    visual: string,
    ...consumerClasses: Array<string | undefined>
  ): string {
    return [
      structural,
      this.unstyled() || this.config.unstyled ? '' : visual,
      ...consumerClasses,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use NeuralTable. */
export { NeuralTable as TableComponent };
