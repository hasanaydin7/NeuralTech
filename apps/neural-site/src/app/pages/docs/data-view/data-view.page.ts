import { SiteOnThisPage } from '../../../shared/on-this-page';
import { CurrencyPipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralDataView,
  NeuralDataViewEmptyTemplate,
  NeuralDataViewFooterTemplate,
  NeuralDataViewGridItemTemplate,
  NeuralDataViewHeaderTemplate,
  NeuralDataViewListItemTemplate,
  NeuralDataViewLoadingTemplate,
  type NeuralDataViewClasses,
  type NeuralDataViewLayout,
  type NeuralDataViewPageEvent,
  type NeuralDataViewSortOrder,
} from '@neural-ng/core/data-view';
import { NeuralSelect } from '@neural-ng/core/select';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type DataViewDocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface Product {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly stock: number;
  readonly metadata: { readonly category: string };
  readonly icon: string;
}

@Component({
  selector: 'app-data-view-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    CurrencyPipe,
    NeuralButton,
    NeuralDataView,
    NeuralDataViewEmptyTemplate,
    NeuralDataViewFooterTemplate,
    NeuralDataViewGridItemTemplate,
    NeuralDataViewHeaderTemplate,
    NeuralDataViewListItemTemplate,
    NeuralDataViewLoadingTemplate,
    NeuralSelect,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './data-view.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataViewPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<DataViewDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly products: readonly Product[] = [
    {
      id: 1,
      name: 'Signal Desk',
      description: 'A calm workspace for reactive products.',
      price: 899,
      stock: 24,
      metadata: { category: 'Office' },
      icon: 'nt-desktop',
    },
    {
      id: 2,
      name: 'Hydration Lamp',
      description: 'Adaptive light with instant startup.',
      price: 129,
      stock: 7,
      metadata: { category: 'Lighting' },
      icon: 'nt-bulb',
    },
    {
      id: 3,
      name: 'Standalone Chair',
      description: 'Ergonomic support without legacy modules.',
      price: 549,
      stock: 0,
      metadata: { category: 'Office' },
      icon: 'nt-armchair',
    },
    {
      id: 4,
      name: 'Neural Speaker',
      description: 'Clear spatial sound for focused teams.',
      price: 249,
      stock: 18,
      metadata: { category: 'Audio' },
      icon: 'nt-speakerphone',
    },
    {
      id: 5,
      name: 'Token Shelf',
      description: 'A modular home for design primitives.',
      price: 319,
      stock: 4,
      metadata: { category: 'Storage' },
      icon: 'nt-books',
    },
    {
      id: 6,
      name: 'Headless Clock',
      description: 'Timezone-safe focus for distributed agents.',
      price: 89,
      stock: 31,
      metadata: { category: 'Accessories' },
      icon: 'nt-clock',
    },
    {
      id: 7,
      name: 'Agent Hub',
      description: 'A command center for autonomous workflows.',
      price: 1149,
      stock: 11,
      metadata: { category: 'Compute' },
      icon: 'nt-cpu',
    },
    {
      id: 8,
      name: 'Context Board',
      description: 'Keep intent visible to every collaborator.',
      price: 199,
      stock: 16,
      metadata: { category: 'Office' },
      icon: 'nt-layout-board',
    },
  ];
  readonly layout = signal<NeuralDataViewLayout>('grid');
  readonly first = signal(0);
  readonly rows = signal(6);
  readonly sortField = signal('name');
  readonly sortOrder = signal<NeuralDataViewSortOrder>(1);
  readonly sortValue = signal<string | null>('name:1');
  readonly sortOptions = [
    { label: 'Name A–Z', value: 'name:1' },
    { label: 'Price low to high', value: 'price:1' },
    { label: 'Price high to low', value: 'price:-1' },
    { label: 'Category A–Z', value: 'metadata.category:1' },
  ] as const;
  readonly remoteItems = signal<readonly Product[]>(this.products.slice(0, 3));
  readonly remoteStatus = signal('Request 1 · records 1–3 of 80');
  readonly headlessClasses: NeuralDataViewClasses = {
    root: 'overflow-hidden rounded-2xl border border-violet-300/25 bg-slate-950 text-violet-50 shadow-[0_22px_65px_rgba(139,92,246,.16)]',
    header:
      'flex items-center justify-between border-b border-violet-300/15 px-5 py-4',
    content: 'bg-slate-950',
    list: 'divide-y divide-violet-300/15',
    item: 'px-5 py-4',
    paginator: 'border-t border-violet-300/15 p-3',
    footer:
      'border-t border-violet-300/15 px-5 py-3 text-xs text-violet-200/70',
  };
  readonly productTrackBy = (product: Product): number => product.id;
  readonly pageLinks: Record<
    DataViewDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['List and grid', 'layouts'],
      ['Local state', 'local-state'],
      ['Remote state', 'remote'],
      ['Loading and empty', 'states'],
      ['Templates', 'templates'],
      ['Identity and sorting', 'identity'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Region naming', 'region'],
      ['Collection semantics', 'collection'],
      ['Loading state', 'loading-a11y'],
      ['Controls', 'controls'],
      ['Motion', 'motion'],
    ],
    api: [
      ['Inputs and models', 'inputs'],
      ['Outputs', 'outputs'],
      ['Templates', 'template-api'],
      ['Class slots', 'class-slots'],
      ['Types and helpers', 'types'],
    ],
    tokens: [
      ['Root', 'root-tokens'],
      ['Layout and items', 'layout-tokens'],
      ['States', 'state-tokens'],
      ['Paginator', 'paginator-tokens'],
    ],
  };
  readonly importCode = `import {
  NeuralDataView,
  NeuralDataViewListItemTemplate,
  NeuralDataViewGridItemTemplate,
} from '@neural-ng/core/data-view';

@Component({ imports: [NeuralDataView, NeuralDataViewListItemTemplate,
  NeuralDataViewGridItemTemplate] })`;
  readonly layoutsCode = `<neural-data-view
  [value]="products"
  [(layout)]="layout"
  [(first)]="first"
  [(rows)]="rows"
  [(sortField)]="sortField"
  [(sortOrder)]="sortOrder"
  [trackBy]="productTrackBy"
>
  <ng-template [neuralDataViewListItem]="products" let-product>...</ng-template>
  <ng-template [neuralDataViewGridItem]="products" let-product>...</ng-template>
</neural-data-view>`;
  readonly remoteCode = `<neural-data-view
  dataMode="remote"
  [value]="serverPage()"
  [totalRecords]="80"
  [rows]="3"
  (stateChange)="loadPage($event)"
>...</neural-data-view>`;
  readonly statesCode = `<neural-data-view [value]="[]" loading [loadingRows]="3" />

<neural-data-view [value]="[]" emptyMessage="No matching products">
  <ng-template neuralDataViewEmpty let-label>{{ label }}</ng-template>
</neural-data-view>`;
  readonly templatesCode = `<ng-template neuralDataViewHeader>...</ng-template>
<ng-template [neuralDataViewListItem]="products"
  let-product let-index="originalIndex" let-first="first">...</ng-template>
<ng-template [neuralDataViewGridItem]="products" let-product>...</ng-template>
<ng-template neuralDataViewLoading let-label>...</ng-template>
<ng-template neuralDataViewEmpty let-label>...</ng-template>
<ng-template neuralDataViewFooter>...</ng-template>`;
  readonly identityCode = `readonly productTrackBy = (product: Product) => product.id;

readonly domainSort: NeuralDataViewSortComparator<Product> =
  (a, b, field, order) => compareDomainValues(a, b, field, order);`;
  readonly unstyledCode = `<neural-data-view
  unstyled [value]="products" [classes]="headlessClasses"
  ariaLabel="Headless product catalog"
>...</neural-data-view>`;
  readonly inputs = [
    ['value', 'readonly T[]', '[]', 'Immutable source or current remote page.'],
    ['layout', "'list' | 'grid'", "'list'", 'Controlled visual layout model.'],
    ['first', 'number', '0', 'Controlled first record offset model.'],
    [
      'rows',
      'number',
      '6',
      'Controlled page-size model; normalized to at least one.',
    ],
    [
      'sortField',
      'string',
      "''",
      'Controlled property path model; nested paths work.',
    ],
    ['sortOrder', '1 | -1', '1', 'Controlled ascending or descending model.'],
    [
      'dataMode',
      "'local' | 'remote'",
      "'local'",
      'Ownership of sorting and paging.',
    ],
    ['totalRecords', 'number', '0', 'Full remote result count.'],
    ['paginator', 'boolean', 'true', 'Composes Neural Paginator.'],
    ['pageSizeOptions', 'readonly number[]', '[6, 12, 24]', 'Paginator sizes.'],
    ['loading', 'boolean', 'false', 'Replaces content and exposes busy state.'],
    ['loadingRows', 'number', '6', 'Fallback skeleton count.'],
    [
      'emptyMessage',
      'string',
      "'No records found'",
      'Empty state label/context.',
    ],
    [
      'loadingMessage',
      'string',
      "'Loading records'",
      'Accessible loading label/context.',
    ],
    ['ariaLabel', 'string', "'Data view'", 'Accessible region name.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['dataViewClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralDataViewClasses', '{}', 'Typed additive slot classes.'],
    [
      'trackBy',
      'NeuralDataViewTrackBy<T> | null',
      'null',
      'Stable item identity.',
    ],
    [
      'sortComparator',
      'NeuralDataViewSortComparator<T> | null',
      'null',
      'Domain comparator.',
    ],
  ] as const;
  readonly outputs = [
    ['layoutChange', 'NeuralDataViewLayout', 'Generated by layout model.'],
    ['firstChange', 'number', 'Generated by first model.'],
    ['rowsChange', 'number', 'Generated by rows model.'],
    ['sortFieldChange', 'string', 'Generated by sortField model.'],
    ['sortOrderChange', '1 | -1', 'Generated by sortOrder model.'],
    [
      'stateChange',
      'NeuralDataViewStateChange',
      'Unified page/layout/sort event.',
    ],
    ['pageChange', 'NeuralDataViewPageEvent', 'Semantic paginator event.'],
    [
      'layoutChanged',
      'NeuralDataViewLayoutChange',
      'Layout event with previous value.',
    ],
    [
      'sortChange',
      'NeuralDataViewSortChange',
      'Sort event with previous field/order.',
    ],
  ] as const;
  readonly templateApi = [
    ['neuralDataViewListItem', 'NeuralDataViewItemTemplateContext<T>'],
    ['neuralDataViewGridItem', 'NeuralDataViewItemTemplateContext<T>'],
    ['neuralDataViewHeader', 'void'],
    ['neuralDataViewFooter', 'void'],
    ['neuralDataViewEmpty', 'NeuralDataViewStateTemplateContext'],
    ['neuralDataViewLoading', 'NeuralDataViewStateTemplateContext'],
  ] as const;
  readonly classSlots = [
    'root',
    'header',
    'content',
    'list',
    'grid',
    'item',
    'empty',
    'loading',
    'skeleton',
    'paginator',
    'footer',
  ] as const;
  readonly publicTypes = [
    ['NeuralDataViewLayout', "'list' | 'grid'"],
    ['NeuralDataViewDataMode', "'local' | 'remote'"],
    ['NeuralDataViewSortOrder', '1 | -1'],
    ['NeuralDataViewState', 'Serializable controlled state snapshot.'],
    [
      'NeuralDataViewStateChange',
      "State plus reason: 'page' | 'layout' | 'sort'.",
    ],
    [
      'NeuralDataViewItemTemplateContext<T>',
      'Typed item and positional context.',
    ],
    ['compareDataViewValues', 'Public null-safe default comparison helper.'],
  ] as const;
  readonly rootTokens = [
    '--neural-data-view-color',
    '--neural-data-view-background',
    '--neural-data-view-border',
    '--neural-data-view-radius',
    '--neural-data-view-shadow',
    '--neural-data-view-header-padding',
    '--neural-data-view-header-background',
    '--neural-data-view-header-border',
    '--neural-data-view-footer-padding',
    '--neural-data-view-footer-background',
    '--neural-data-view-footer-border',
  ] as const;
  readonly layoutTokens = [
    '--neural-data-view-content-background',
    '--neural-data-view-grid-min',
    '--neural-data-view-grid-gap',
    '--neural-data-view-grid-padding',
    '--neural-data-view-list-divider',
    '--neural-data-view-list-item-padding',
    '--neural-data-view-item-background',
    '--neural-data-view-item-border',
    '--neural-data-view-item-radius',
    '--neural-data-view-item-shadow',
    '--neural-data-view-item-hover-border',
    '--neural-data-view-item-hover-shadow',
  ] as const;
  readonly stateTokens = [
    '--neural-data-view-empty-min-height',
    '--neural-data-view-empty-gap',
    '--neural-data-view-empty-padding',
    '--neural-data-view-empty-color',
    '--neural-data-view-empty-icon-color',
    '--neural-data-view-loading-gap',
    '--neural-data-view-loading-padding',
    '--neural-data-view-skeleton-min-height',
    '--neural-data-view-skeleton-background',
    '--neural-data-view-skeleton-radius',
    '--neural-data-view-skeleton-duration',
  ] as const;
  readonly paginatorTokens = [
    '--neural-data-view-paginator-padding',
    '--neural-data-view-paginator-border',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  setLayout(layout: NeuralDataViewLayout): void {
    this.layout.set(layout);
  }
  updateSort(value: string | null): void {
    this.sortValue.set(value);
    const [field = 'name', order = '1'] = (value ?? 'name:1').split(':');
    this.sortField.set(field);
    this.sortOrder.set(Number(order) as NeuralDataViewSortOrder);
    this.first.set(0);
  }
  handleRemotePage(event: NeuralDataViewPageEvent): void {
    const start = event.first % this.products.length;
    this.remoteItems.set(
      Array.from(
        { length: event.rows },
        (_, index) => this.products[(start + index) % this.products.length],
      ),
    );
    this.remoteStatus.set(
      `Request page ${event.pageIndex + 1} · records ${event.first + 1}–${Math.min(event.first + event.rows, event.totalRecords)} of ${event.totalRecords}`,
    );
  }
  stockClass(product: Product): string {
    return product.stock === 0
      ? 'border-red-400/25 bg-red-500/10 text-red-500'
      : product.stock < 8
        ? 'border-amber-400/25 bg-amber-500/10 text-amber-500'
        : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-500';
  }
  stockLabel(product: Product): string {
    return product.stock === 0
      ? 'Out of stock'
      : product.stock < 8
        ? 'Low stock'
        : 'In stock';
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/data-view${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): DataViewDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is DataViewDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
