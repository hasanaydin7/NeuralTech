import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { NEURAL_NG_CONFIG, readNeuralOptionPath } from '@neural-ng/core';
import {
  NeuralPaginator,
  type NeuralPageChange,
} from '@neural-ng/core/paginator';
import {
  NeuralDataViewEmptyTemplate,
  NeuralDataViewFooterTemplate,
  NeuralDataViewGridItemTemplate,
  NeuralDataViewHeaderTemplate,
  NeuralDataViewListItemTemplate,
  NeuralDataViewLoadingTemplate,
  type NeuralDataViewItemTemplateContext,
} from './data-view-templates';
import type {
  NeuralDataViewClasses,
  NeuralDataViewDataMode,
  NeuralDataViewLayout,
  NeuralDataViewLayoutChange,
  NeuralDataViewPageEvent,
  NeuralDataViewSortChange,
  NeuralDataViewSortComparator,
  NeuralDataViewSortOrder,
  NeuralDataViewState,
  NeuralDataViewStateChange,
  NeuralDataViewTrackBy,
} from './data-view.types';

@Component({
  selector: 'neural-data-view',
  standalone: true,
  imports: [NgTemplateOutlet, NeuralPaginator],
  templateUrl: './data-view.component.html',
  styleUrl: './data-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-data-view-host' },
})
export class NeuralDataView<T = unknown> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  readonly listItemTemplate = contentChild(NeuralDataViewListItemTemplate<T>);
  readonly gridItemTemplate = contentChild(NeuralDataViewGridItemTemplate<T>);
  readonly headerTemplate = contentChild(NeuralDataViewHeaderTemplate);
  readonly footerTemplate = contentChild(NeuralDataViewFooterTemplate);
  readonly emptyTemplate = contentChild(NeuralDataViewEmptyTemplate);
  readonly loadingTemplate = contentChild(NeuralDataViewLoadingTemplate);

  readonly value = input<readonly T[]>([]);
  readonly layout = model<NeuralDataViewLayout>('list');
  readonly first = model(0);
  readonly rows = model(6);
  readonly sortField = model('');
  readonly sortOrder = model<NeuralDataViewSortOrder>(1);
  readonly dataMode = input<NeuralDataViewDataMode>('local');
  readonly totalRecords = input(0, { transform: numberAttribute });
  readonly paginator = input(true, { transform: booleanAttribute });
  readonly pageSizeOptions = input<readonly number[]>([6, 12, 24]);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingRows = input(6, { transform: numberAttribute });
  readonly emptyMessage = input('No records found');
  readonly loadingMessage = input('Loading records');
  readonly ariaLabel = input('Data view');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly dataViewClass = input('');
  readonly classes = input<NeuralDataViewClasses>({});
  readonly trackBy = input<NeuralDataViewTrackBy<T> | null>(null);
  readonly sortComparator = input<NeuralDataViewSortComparator<T> | null>(null);

  readonly stateChange = output<NeuralDataViewStateChange>();
  readonly pageChange = output<NeuralDataViewPageEvent>();
  readonly layoutChanged = output<NeuralDataViewLayoutChange>();
  readonly sortChange = output<NeuralDataViewSortChange>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedRows = computed(() =>
    Math.max(1, Math.trunc(this.rows()) || 1),
  );
  readonly normalizedFirst = computed(() =>
    Math.max(0, Math.trunc(this.first()) || 0),
  );
  readonly sortedValue = computed(() => {
    const source = this.value();
    const field = this.sortField().trim();
    if (this.dataMode() === 'remote' || !field) return source;
    return source
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const custom = this.sortComparator();
        const compared = custom
          ? custom(a.item, b.item, field, this.sortOrder())
          : compareDataViewValues(
              readNeuralOptionPath(a.item, field),
              readNeuralOptionPath(b.item, field),
            );
        return compared === 0 ? a.index - b.index : compared * this.sortOrder();
      })
      .map(({ item }) => item);
  });
  readonly effectiveTotalRecords = computed(() =>
    this.dataMode() === 'remote'
      ? Math.max(0, this.totalRecords())
      : this.value().length,
  );
  readonly pageCount = computed(() =>
    Math.max(
      1,
      Math.ceil(this.effectiveTotalRecords() / this.normalizedRows()),
    ),
  );
  readonly loadingPlaceholders = computed(() =>
    Array.from({ length: Math.max(1, Math.trunc(this.loadingRows()) || 1) }),
  );
  readonly pageIndex = computed(() =>
    Math.min(
      this.pageCount() - 1,
      Math.floor(this.normalizedFirst() / this.normalizedRows()),
    ),
  );
  readonly renderedItems = computed(() =>
    this.dataMode() === 'remote' || !this.paginator()
      ? this.sortedValue()
      : this.sortedValue().slice(
          this.pageIndex() * this.normalizedRows(),
          this.pageIndex() * this.normalizedRows() + this.normalizedRows(),
        ),
  );
  readonly state = computed<NeuralDataViewState>(() => ({
    first: this.pageIndex() * this.normalizedRows(),
    rows: this.normalizedRows(),
    pageIndex: this.pageIndex(),
    pageCount: this.pageCount(),
    totalRecords: this.effectiveTotalRecords(),
    layout: this.layout(),
    sortField: this.sortField().trim(),
    sortOrder: this.sortOrder(),
  }));
  readonly rootClass = computed(() =>
    this.compose(
      'neural-data-view-root',
      'neural-data-view-base',
      this.dataViewClass(),
      this.classes().root,
    ),
  );

  constructor() {
    effect(() => {
      if (
        this.dataMode() !== 'local' ||
        this.normalizedFirst() === this.state().first
      )
        return;
      this.first.set(this.state().first);
    });
  }
  setLayout(layout: NeuralDataViewLayout): void {
    if (layout === this.layout()) return;
    const previousLayout = this.layout();
    this.layout.set(layout);
    const event: NeuralDataViewLayoutChange = {
      ...this.state(),
      reason: 'layout',
      previousLayout,
    };
    this.layoutChanged.emit(event);
    this.stateChange.emit(event);
  }
  setSort(
    field: string,
    order: NeuralDataViewSortOrder = this.sortOrder(),
  ): void {
    const previousField = this.sortField();
    const previousOrder = this.sortOrder();
    if (field === previousField && order === previousOrder) return;
    this.sortField.set(field);
    this.sortOrder.set(order);
    this.first.set(0);
    const event: NeuralDataViewSortChange = {
      ...this.state(),
      reason: 'sort',
      previousField,
      previousOrder,
    };
    this.sortChange.emit(event);
    this.stateChange.emit(event);
  }
  handlePageChange(event: NeuralPageChange): void {
    this.rows.set(event.pageSize);
    this.first.set(event.startIndex);
    const change: NeuralDataViewPageEvent = { ...this.state(), reason: 'page' };
    this.pageChange.emit(change);
    this.stateChange.emit(change);
  }
  itemContext(item: T, index: number): NeuralDataViewItemTemplateContext<T> {
    const pageOffset =
      this.dataMode() === 'remote'
        ? this.normalizedFirst()
        : this.paginator()
          ? this.state().first
          : 0;
    return {
      $implicit: item,
      item,
      index,
      originalIndex: pageOffset + index,
      layout: this.layout(),
      first: index === 0,
      last: index === this.renderedItems().length - 1,
    };
  }
  trackItem(index: number, item: T): unknown {
    return (
      this.trackBy()?.(item, this.itemContext(item, index).originalIndex) ??
      item
    );
  }
  stateContext(label: string) {
    return { $implicit: label, label };
  }
  classFor(
    slot: keyof NeuralDataViewClasses,
    root: string,
    base: string,
  ): string {
    return this.compose(root, base, this.classes()[slot]);
  }
  private compose(
    root: string,
    base: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [root, this.effectiveUnstyled() ? '' : base, ...consumer]
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import and use `NeuralDataView` instead. */
export { NeuralDataView as DataViewComponent };

export function compareDataViewValues(first: unknown, second: unknown): number {
  if (Object.is(first, second)) return 0;
  if (first === null || first === undefined) return -1;
  if (second === null || second === undefined) return 1;
  if (typeof first === 'number' && typeof second === 'number')
    return first - second;
  if (typeof first === 'boolean' && typeof second === 'boolean')
    return Number(first) - Number(second);
  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}
