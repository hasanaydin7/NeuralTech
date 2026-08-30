import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import { NeuralSelect, type NeuralSelectClasses } from '@neural-ng/core/select';
import type {
  NeuralPageChange,
  NeuralPaginatorClasses,
  NeuralPaginatorLabels,
} from './paginator.types';
import {
  clampPageIndex,
  createPageChange,
  createPageItems,
  getPageCount,
  normalizeInteger,
} from './paginator.utils';
@Component({
  selector: 'neural-paginator',
  standalone: true,
  imports: [NeuralSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav [attr.aria-label]="resolvedLabels().navigation" [class]="rootClass()">
      @if (showReport()) {
        <span aria-live="polite" aria-atomic="true" [class]="reportClass()">
          {{ report() }}
        </span>
      }

      <ul [class]="listClass()">
        @if (showFirstLast()) {
          <li>
            <button
              type="button"
              [class]="navigationButtonClass()"
              [disabled]="disabled() || !canGoPrevious()"
              [attr.aria-label]="resolvedLabels().firstPage"
              (click)="goToPage(0)"
            >
              <i aria-hidden="true" [class]="iconClass(firstPageIcon())"></i>
            </button>
          </li>
        }
        <li>
          <button
            type="button"
            [class]="navigationButtonClass()"
            [disabled]="disabled() || !canGoPrevious()"
            [attr.aria-label]="resolvedLabels().previousPage"
            (click)="goToPage(effectivePageIndex() - 1)"
          >
            <i aria-hidden="true" [class]="iconClass(previousPageIcon())"></i>
          </button>
        </li>

        @for (item of pageItems(); track item) {
          <li>
            @if (isPage(item)) {
              <button
                type="button"
                [class]="pageButtonClass(item)"
                [disabled]="disabled()"
                [attr.aria-current]="
                  item === effectivePageIndex() ? 'page' : null
                "
                [attr.aria-label]="pageAriaLabel(item)"
                (click)="goToPage(item)"
              >
                {{ item + 1 }}
              </button>
            } @else {
              <span aria-hidden="true" [class]="ellipsisClass()">
                <i [class]="iconClass(ellipsisIcon())"></i>
              </span>
            }
          </li>
        }

        <li>
          <button
            type="button"
            [class]="navigationButtonClass()"
            [disabled]="disabled() || !canGoNext()"
            [attr.aria-label]="resolvedLabels().nextPage"
            (click)="goToPage(effectivePageIndex() + 1)"
          >
            <i aria-hidden="true" [class]="iconClass(nextPageIcon())"></i>
          </button>
        </li>
        @if (showFirstLast()) {
          <li>
            <button
              type="button"
              [class]="navigationButtonClass()"
              [disabled]="disabled() || !canGoNext()"
              [attr.aria-label]="resolvedLabels().lastPage"
              (click)="goToPage(pageCount() - 1)"
            >
              <i aria-hidden="true" [class]="iconClass(lastPageIcon())"></i>
            </button>
          </li>
        }
      </ul>

      @if (pageSizeChoices().length > 0) {
        <div [class]="pageSizeClass()">
          <span>{{ resolvedLabels().pageSize }}</span>
          <neural-select
            [class.neural-paginator-size-select-host]="!effectiveUnstyled()"
            appendTo="body"
            [options]="pageSizeChoices()"
            [value]="normalizedPageSize()"
            [disabled]="disabled()"
            [unstyled]="effectiveUnstyled()"
            [ariaLabel]="resolvedLabels().pageSize"
            [classes]="pageSizeSelectClasses()"
            (selectionChange)="changePageSize($event.value)"
          />
        </div>
      }
    </nav>
  `,
  styles: `
    :where(.neural-paginator-root) {
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
    }

    :where(.neural-paginator-list-root) {
      display: flex;
      align-items: center;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    :where(.neural-paginator-button-root) {
      box-sizing: border-box;
      display: inline-grid;
      place-items: center;
    }

    :where(.neural-paginator-base) {
      gap: var(--neural-paginator-gap, 0.75rem);
      color: var(--neural-paginator-color, inherit);
      font-family: var(--neural-paginator-font-family, inherit);
      font-size: var(--neural-paginator-font-size, 0.875rem);
    }

    :where(.neural-paginator-list-base) {
      gap: var(--neural-paginator-list-gap, 0.25rem);
    }

    :where(.neural-paginator-button-base) {
      min-width: var(--neural-paginator-button-size, 2.25rem);
      height: var(--neural-paginator-button-size, 2.25rem);
      padding: var(--neural-paginator-button-padding, 0.375rem);
      color: var(--neural-paginator-button-color, inherit);
      background: var(--neural-paginator-button-background, transparent);
      border: var(--neural-paginator-button-border, 1px solid transparent);
      border-radius: var(--neural-paginator-button-radius, 0.5rem);
      font: inherit;
      transition: var(--neural-paginator-transition, all 150ms ease);
      cursor: pointer;
    }

    :where(.neural-paginator-button-base:hover:not(:disabled)) {
      color: var(--neural-paginator-button-color-hover, inherit);
      background: var(--neural-paginator-button-background-hover, transparent);
      border-color: var(
        --neural-paginator-button-border-color-hover,
        transparent
      );
    }

    :where(.neural-paginator-button-base:focus-visible),
    :where(.neural-paginator-size-select-base:focus-visible) {
      outline: var(--neural-paginator-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-paginator-focus-ring-offset, 2px);
    }

    :where(.neural-paginator-button-base:disabled) {
      opacity: var(--neural-paginator-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(.neural-paginator-page-active-base) {
      color: var(--neural-paginator-active-color, inherit);
      background: var(--neural-paginator-active-background, transparent);
      border-color: var(--neural-paginator-active-border-color, currentColor);
    }

    :where(.neural-paginator-ellipsis-root) {
      display: inline-grid;
      place-items: center;
      min-width: var(--neural-paginator-button-size, 2.25rem);
      height: var(--neural-paginator-button-size, 2.25rem);
    }

    :where(.neural-paginator-report-base) {
      color: var(--neural-paginator-report-color, inherit);
      white-space: nowrap;
    }

    :where(.neural-paginator-size-root) {
      display: inline-flex;
      align-items: center;
    }

    :where(.neural-paginator-size-base) {
      gap: var(--neural-paginator-size-gap, 0.5rem);
      color: var(--neural-paginator-report-color, inherit);
      white-space: nowrap;
    }

    :where(.neural-paginator-size-select-host) {
      --neural-select-min-height: var(--neural-paginator-button-size, 2.25rem);
      --neural-select-padding: var(
        --neural-paginator-size-select-padding,
        0.375rem 0.5rem
      );
      --neural-select-trigger-end-padding: 2rem;
    }

    :where(.neural-paginator-rounded-base .neural-paginator-button-base) {
      border-radius: 9999px;
    }

    :where(.neural-paginator-outlined-base .neural-paginator-button-base) {
      background: transparent;
      border-color: transparent;
      box-shadow: none;
    }

    :where(
      .neural-paginator-outlined-base
        .neural-paginator-button-base:hover:not(:disabled)
    ) {
      background: color-mix(
        in srgb,
        var(--neural-color-primary, currentColor) 12%,
        var(--neural-paginator-button-background-hover, transparent)
      );
      border-color: transparent;
    }

    :where(.neural-paginator-outlined-base .neural-paginator-page-active-base) {
      color: var(--neural-color-primary, currentColor);
      background: transparent;
      border-color: transparent;
      font-weight: 700;
    }

    :where(
      .neural-paginator-outlined-base
        .neural-paginator-page-active-base:hover:not(:disabled)
    ) {
      background: color-mix(
        in srgb,
        var(--neural-color-primary, currentColor) 12%,
        var(--neural-paginator-button-background-hover, transparent)
      );
    }
  `,
})
export class NeuralPaginator {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly neuralLocale = inject(NeuralLocaleService);

  readonly totalItems = input(0);
  readonly pageIndex = model(0);
  readonly pageSize = model(10);
  readonly pageSizeOptions = input<readonly number[]>([]);
  readonly pageLinkCount = input(5);
  readonly showFirstLast = input(true, { transform: booleanAttribute });
  readonly showReport = input(true, { transform: booleanAttribute });
  readonly reportTemplate = input<string | null>(null);
  readonly labels = input<Partial<NeuralPaginatorLabels>>({});
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly outlined = input(false, { transform: booleanAttribute });
  readonly firstPageIcon = input('nt-chevrons-left');
  readonly previousPageIcon = input('nt-chevron-left');
  readonly nextPageIcon = input('nt-chevron-right');
  readonly lastPageIcon = input('nt-chevrons-right');
  readonly ellipsisIcon = input('nt-dots');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly paginatorClass = input('');
  readonly classes = input<NeuralPaginatorClasses>({});
  readonly pageChange = output<NeuralPageChange>();
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );

  readonly normalizedTotalItems = computed(() =>
    normalizeInteger(this.totalItems(), 0),
  );
  readonly normalizedPageSize = computed(() =>
    normalizeInteger(this.pageSize(), 1),
  );
  readonly pageCount = computed(() =>
    getPageCount(this.normalizedTotalItems(), this.normalizedPageSize()),
  );
  readonly effectivePageIndex = computed(() =>
    clampPageIndex(this.pageIndex(), this.pageCount()),
  );
  readonly pageState = computed(() =>
    createPageChange(
      this.effectivePageIndex(),
      this.normalizedPageSize(),
      this.normalizedTotalItems(),
    ),
  );
  readonly pageItems = computed(() =>
    createPageItems(
      this.effectivePageIndex(),
      this.pageCount(),
      this.pageLinkCount(),
    ),
  );
  readonly canGoPrevious = computed(
    () => this.pageCount() > 0 && this.effectivePageIndex() > 0,
  );
  readonly canGoNext = computed(
    () =>
      this.pageCount() > 0 && this.effectivePageIndex() < this.pageCount() - 1,
  );
  readonly resolvedLabels = computed<NeuralPaginatorLabels>(() => ({
    ...this.neuralLocale.messages().paginator,
    ...this.labels(),
  }));
  readonly pageSizeChoices = computed(() => {
    const choices = new Set(
      this.pageSizeOptions().map((size) => normalizeInteger(size, 1)),
    );
    if (choices.size > 0) {
      choices.add(this.normalizedPageSize());
    }
    return [...choices].sort((a, b) => a - b);
  });
  readonly report = computed(() => {
    const state = this.pageState();
    const start = state.totalItems === 0 ? 0 : state.startIndex + 1;
    return this.neuralLocale.format(
      this.reportTemplate() ?? this.neuralLocale.messages().paginator.report,
      {
        start,
        end: state.endIndex,
        total: state.totalItems,
        page: state.pageIndex + 1,
        pageCount: state.pageCount,
      },
    );
  });

  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-paginator-root',
      [
        'neural-paginator-base',
        this.rounded() ? 'neural-paginator-rounded-base' : '',
        this.outlined() ? 'neural-paginator-outlined-base' : '',
      ].join(' '),
      this.paginatorClass(),
      this.classes().root,
    ),
  );
  readonly listClass = computed(() =>
    this.composeClass(
      'neural-paginator-list-root',
      'neural-paginator-list-base',
      this.classes().list,
    ),
  );
  readonly navigationButtonClass = computed(() =>
    this.composeClass(
      'neural-paginator-button-root neural-paginator-navigation-root',
      'neural-paginator-button-base',
      this.classes().navigationButton,
    ),
  );
  readonly ellipsisClass = computed(() =>
    this.composeClass(
      'neural-paginator-ellipsis-root',
      'neural-paginator-ellipsis-base',
      this.classes().ellipsis,
    ),
  );
  readonly reportClass = computed(() =>
    this.composeClass(
      'neural-paginator-report-root',
      'neural-paginator-report-base',
      this.classes().report,
    ),
  );
  readonly pageSizeClass = computed(() =>
    this.composeClass(
      'neural-paginator-size-root',
      'neural-paginator-size-base',
      this.classes().pageSize,
    ),
  );
  readonly pageSizeSelectClass = computed(() =>
    this.composeClass(
      'neural-paginator-size-select-root',
      'neural-paginator-size-select-base',
      this.classes().pageSizeSelect,
    ),
  );
  readonly pageSizeSelectClasses = computed<NeuralSelectClasses>(() => ({
    trigger: this.pageSizeSelectClass(),
  }));

  pageButtonClass(pageIndex: number): string {
    return this.composeClass(
      'neural-paginator-button-root neural-paginator-page-root',
      [
        'neural-paginator-button-base',
        pageIndex === this.effectivePageIndex()
          ? 'neural-paginator-page-active-base'
          : '',
      ].join(' '),
      this.classes().pageButton,
      pageIndex === this.effectivePageIndex()
        ? this.classes().activePageButton
        : '',
    );
  }

  pageAriaLabel(pageIndex: number): string {
    return this.neuralLocale.format(this.resolvedLabels().page, {
      page: pageIndex + 1,
    });
  }

  isPage(item: number | string): item is number {
    return typeof item === 'number';
  }

  iconClass(icon: string): string {
    const classes = icon.trim().split(/\s+/).filter(Boolean);
    if (classes.some((className) => className.startsWith('nt-'))) {
      classes.unshift('nt');
    }
    return [
      ...new Set([
        'neural-paginator-icon-root',
        ...classes,
        this.classes().icon ?? '',
      ]),
    ]
      .filter(Boolean)
      .join(' ');
  }

  goToPage(pageIndex: number): void {
    if (this.disabled()) {
      return;
    }
    const nextState = createPageChange(
      pageIndex,
      this.normalizedPageSize(),
      this.normalizedTotalItems(),
    );
    if (
      nextState.pageCount === 0 ||
      nextState.pageIndex === this.effectivePageIndex()
    ) {
      return;
    }

    this.pageIndex.set(nextState.pageIndex);
    this.pageChange.emit(nextState);
  }

  changePageSize(value: number | null): void {
    if (this.disabled()) {
      return;
    }
    const nextSize = normalizeInteger(Number(value), 1);
    if (nextSize === this.normalizedPageSize()) {
      return;
    }

    const nextIndex = Math.floor(this.pageState().startIndex / nextSize);
    const nextState = createPageChange(
      nextIndex,
      nextSize,
      this.normalizedTotalItems(),
    );
    this.pageSize.set(nextState.pageSize);
    this.pageIndex.set(nextState.pageIndex);
    this.pageChange.emit(nextState);
  }

  private composeClass(
    structural: string,
    visual: string,
    ...consumerClasses: Array<string | undefined>
  ): string {
    const isUnstyled = this.effectiveUnstyled();
    return [structural, isUnstyled ? '' : visual, ...consumerClasses]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import `NeuralPaginator` instead. */
export { NeuralPaginator as PaginatorComponent };
