import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  NeuralPaginator,
  type NeuralPageChange,
  type NeuralPaginatorClasses,
} from '@neural-ng/core/paginator';
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

type PaginatorDocView = 'component' | 'accessibility' | 'api' | 'tokens';

interface ResultItem {
  readonly id: number;
  readonly name: string;
  readonly category: string;
}

@Component({
  selector: 'app-paginator-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralPaginator,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './paginator.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly selectedView = signal<PaginatorDocView>(
    resolveView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);
  readonly compactPage = signal(12);
  readonly localizedPage = signal(2);
  readonly headlessPage = signal(4);
  readonly lastEvent = signal('No page interaction yet.');
  readonly items = Array.from(
    { length: 137 },
    (_, index): ResultItem => ({
      id: index + 1,
      name: `Agent workflow ${String(index + 1).padStart(3, '0')}`,
      category:
        ['Automation', 'Reasoning', 'Retrieval'][index % 3] ?? 'Automation',
    }),
  );
  readonly visibleItems = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.items.slice(start, start + this.pageSize());
  });
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralPaginatorClasses = {
    root: 'flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-slate-950 p-5 font-mono text-slate-200',
    list: 'flex items-center gap-1.5',
    navigationButton:
      'grid size-10 place-items-center rounded-xl border border-cyan-400/25 text-cyan-300 transition hover:bg-cyan-400/10 disabled:opacity-35',
    pageButton:
      'grid size-10 place-items-center rounded-xl border border-slate-700 transition hover:border-cyan-400/50',
    activePageButton: 'border-cyan-300 bg-cyan-400 text-slate-950',
    icon: 'text-sm',
    ellipsis: 'grid size-10 place-items-center text-slate-500',
    report: 'text-xs text-slate-400',
    pageSize: 'gap-2 text-xs text-slate-400',
    pageSizeSelect:
      'rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100 outline-none focus:border-cyan-300',
  };
  readonly pageLinks: Record<
    PaginatorDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic pagination', 'basic'],
      ['Page window', 'window'],
      ['Report and locale', 'report'],
      ['Visibility and states', 'states'],
      ['Visual variants', 'variants'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Landmark and structure', 'landmark'],
      ['Current page and report', 'announcements'],
      ['Keyboard behavior', 'keyboard'],
      ['Localized labels', 'localized-labels'],
    ],
    api: [
      ['Inputs and models', 'inputs'],
      ['Events', 'events'],
      ['Class slots', 'class-slots'],
      ['Page state', 'page-state'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };

  readonly importCode = `import { NeuralPaginator } from '@neural-ng/core/paginator';

@Component({ imports: [NeuralPaginator] })`;
  readonly basicCode = `<neural-paginator
  [totalItems]="items.length"
  [(pageIndex)]="pageIndex"
  [(pageSize)]="pageSize"
  [pageSizeOptions]="[5, 10, 20]"
  (pageChange)="pageChanged($event)"
/>`;
  readonly windowCode = `<neural-paginator
  [totalItems]="420"
  [(pageIndex)]="page"
  [pageSize]="10"
  [pageLinkCount]="5"
/>`;
  readonly reportCode = `<neural-paginator
  [totalItems]="96"
  [(pageIndex)]="page"
  reportTemplate="Showing {start}–{end} of {total} workflows · page {page}/{pageCount}"
  [labels]="{
    navigation: 'Workflow pages',
    previousPage: 'Previous workflows',
    nextPage: 'Next workflows',
    page: 'Workflow page {page}'
  }"
/>`;
  readonly statesCode = `<neural-paginator [totalItems]="72" [showFirstLast]="false" [showReport]="false" />
<neural-paginator [totalItems]="72" disabled />
<neural-paginator [totalItems]="0" />`;
  readonly variantsCode = `<neural-paginator [totalItems]="96" rounded />
<neural-paginator [totalItems]="96" outlined />
<neural-paginator [totalItems]="96" rounded outlined />`;
  readonly unstyledCode = `<neural-paginator
  unstyled
  [totalItems]="180"
  [(pageIndex)]="page"
  [pageSizeOptions]="[10, 20, 50]"
  paginatorClass="my-paginator"
  [classes]="paginatorClasses"
/>`;

  readonly inputs = [
    [
      'totalItems',
      'number',
      '0',
      'Full collection size; negative and fractional values normalize safely.',
    ],
    ['pageIndex', 'model<number>', '0', 'Zero-based controlled page index.'],
    [
      'pageSize',
      'model<number>',
      '10',
      'Items per page; changing it preserves the first visible item.',
    ],
    [
      'pageSizeOptions',
      'readonly number[]',
      '[]',
      'Sorted size choices; an empty array hides the selector.',
    ],
    [
      'pageLinkCount',
      'number',
      '5',
      'Maximum numeric page window, normalized to at least five.',
    ],
    [
      'showFirstLast',
      'boolean',
      'true',
      'Shows first-page and last-page controls.',
    ],
    ['showReport', 'boolean', 'true', 'Shows the polite current-range report.'],
    [
      'reportTemplate',
      'string | null',
      'null',
      'Local report override with supported placeholders.',
    ],
    [
      'labels',
      'Partial<NeuralPaginatorLabels>',
      '{}',
      'Component-level accessible-label overrides.',
    ],
    [
      'disabled',
      'boolean',
      'false',
      'Disables every navigation and NeuralSelect size control.',
    ],
    [
      'rounded',
      'boolean',
      'false',
      'Makes navigation and numeric page controls circular.',
    ],
    [
      'outlined',
      'boolean',
      'false',
      'Removes resting borders and backgrounds; hover uses a primary-tinted theme surface.',
    ],
    [
      'firstPageIcon',
      'string',
      'nt-chevrons-left',
      'First-page Neural Icons class.',
    ],
    [
      'previousPageIcon',
      'string',
      'nt-chevron-left',
      'Previous-page icon class.',
    ],
    ['nextPageIcon', 'string', 'nt-chevron-right', 'Next-page icon class.'],
    [
      'lastPageIcon',
      'string',
      'nt-chevrons-right',
      'Last-page Neural Icons class.',
    ],
    ['ellipsisIcon', 'string', 'nt-dots', 'Truncated page-window icon class.'],
    [
      'unstyled',
      'boolean',
      'false',
      'Removes NeuralNg visual classes while retaining structure.',
    ],
    [
      'paginatorClass',
      'string',
      `''`,
      'Additive class applied to the internal nav.',
    ],
    [
      'classes',
      'NeuralPaginatorClasses',
      '{}',
      'Typed additive classes for internal slots.',
    ],
  ] as const;
  readonly outputs = [
    [
      'pageIndexChange',
      'number',
      'Implicit model output when the selected page changes.',
    ],
    [
      'pageSizeChange',
      'number',
      'Implicit model output when the user chooses another size.',
    ],
    [
      'pageChange',
      'NeuralPageChange',
      'Semantic user event containing the complete normalized page state.',
    ],
  ] as const;
  readonly classSlots = [
    ['root', 'Internal nav landmark.'],
    ['list', 'Native list containing page controls.'],
    ['navigationButton', 'First, previous, next, and last buttons.'],
    ['pageButton', 'Every numeric page button.'],
    ['activePageButton', 'Current numeric page button.'],
    ['icon', 'All navigation and ellipsis icons.'],
    ['ellipsis', 'Non-interactive truncated-range marker.'],
    ['report', 'Live current-range text.'],
    ['pageSize', 'Page-size label wrapper.'],
    ['pageSizeSelect', 'Trigger of the composed NeuralSelect size control.'],
  ] as const;
  readonly tokens = [
    '--neural-paginator-gap',
    '--neural-paginator-list-gap',
    '--neural-paginator-color',
    '--neural-paginator-font-family',
    '--neural-paginator-font-size',
    '--neural-paginator-button-size',
    '--neural-paginator-button-padding',
    '--neural-paginator-button-color',
    '--neural-paginator-button-background',
    '--neural-paginator-button-border',
    '--neural-paginator-button-radius',
    '--neural-paginator-button-color-hover',
    '--neural-paginator-button-background-hover',
    '--neural-paginator-button-border-color-hover',
    '--neural-paginator-active-color',
    '--neural-paginator-active-background',
    '--neural-paginator-active-border-color',
    '--neural-paginator-report-color',
    '--neural-paginator-size-gap',
    '--neural-paginator-size-select-padding',
    '--neural-paginator-focus-ring',
    '--neural-paginator-focus-ring-offset',
    '--neural-paginator-disabled-opacity',
    '--neural-paginator-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  handlePageChange(event: NeuralPageChange): void {
    this.lastEvent.set(
      `Page ${event.pageIndex + 1}/${event.pageCount} · items ${event.startIndex + 1}–${event.endIndex}`,
    );
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/paginator${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): PaginatorDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is PaginatorDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
