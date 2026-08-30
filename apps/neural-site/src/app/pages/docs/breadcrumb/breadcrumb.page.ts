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
  NeuralBreadcrumb,
  NeuralBreadcrumbItemComponent,
  NeuralBreadcrumbSeparatorTemplate,
  type NeuralBreadcrumbClasses,
  type NeuralBreadcrumbItem,
  type NeuralBreadcrumbSelect,
} from '@neural-ng/core/breadcrumb';
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

type BreadcrumbDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-breadcrumb-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralBreadcrumb,
    NeuralBreadcrumbItemComponent,
    NeuralBreadcrumbSeparatorTemplate,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './breadcrumb.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly lastSelection = signal('none');
  readonly selectedView = signal<BreadcrumbDocView>(
    resolveView(this.router.url),
  );
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
  readonly items: readonly NeuralBreadcrumbItem[] = [
    { key: 'home', label: 'Home', iconClass: 'nt-home', href: '#selection' },
    { key: 'docs', label: 'Documentation', href: '#selection' },
    { key: 'components', label: 'Components', disabled: true },
    { key: 'navigation', label: 'Navigation', href: '#selection' },
    { key: 'breadcrumb', label: 'Breadcrumb', current: true },
  ];
  readonly hrefItems: readonly NeuralBreadcrumbItem[] = [
    { key: 'store', label: 'Store', href: '#navigation' },
    {
      key: 'account',
      label: 'Account',
      routerLink: ['/docs', 'components', 'avatar'],
      queryParams: { source: 'breadcrumb' },
      fragment: 'import',
    },
    { key: 'orders', label: 'Orders', current: true },
  ];
  readonly headlessClasses: NeuralBreadcrumbClasses = {
    root: 'w-full rounded-2xl border border-cyan-300/30 bg-slate-950 p-3 text-cyan-100 shadow-[0_16px_50px_rgba(6,182,212,.12)]',
    list: 'flex flex-wrap items-center gap-2',
    item: 'inline-flex items-center',
    link: 'inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-cyan-200 transition hover:bg-cyan-300/10 hover:text-white',
    current: 'font-black text-white',
    disabled: 'opacity-40',
    icon: 'text-cyan-400',
    label: 'truncate',
    separator: 'text-cyan-600',
    overflowItem: 'inline-flex',
    overflowTrigger:
      'grid size-8 cursor-pointer place-items-center rounded-lg hover:bg-cyan-300/10',
  };
  readonly pageLinks: Record<
    BreadcrumbDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Data-driven trail', 'data'],
      ['Selection event', 'selection'],
      ['Router and href', 'navigation'],
      ['Responsive overflow', 'overflow'],
      ['Projected items', 'projected'],
      ['Separators', 'separators'],
      ['States', 'states'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Landmark', 'landmark'],
      ['Current page', 'current-page'],
      ['Keyboard', 'keyboard'],
      ['Overflow', 'accessible-overflow'],
      ['RTL', 'rtl'],
    ],
    api: [
      ['Breadcrumb inputs', 'breadcrumb-inputs'],
      ['Breadcrumb output', 'breadcrumb-output'],
      ['Item inputs', 'item-inputs'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
    ],
    tokens: [
      ['Container tokens', 'container-tokens'],
      ['Item tokens', 'item-tokens'],
      ['State tokens', 'state-tokens'],
    ],
  };
  readonly importCode = `import { NeuralBreadcrumb, NeuralBreadcrumbItemComponent,
  NeuralBreadcrumbSeparatorTemplate } from '@neural-ng/core/breadcrumb';

@Component({
  imports: [NeuralBreadcrumb, NeuralBreadcrumbItemComponent, NeuralBreadcrumbSeparatorTemplate],
})`;
  readonly dataCode = `<neural-breadcrumb ariaLabel="Component documentation"
  [items]="items" (itemSelect)="select($event)" />`;
  readonly navigationCode = `readonly items: readonly NeuralBreadcrumbItem[] = [
  { key: 'store', label: 'Store', href: '/store', target: '_blank', rel: 'noopener' },
  { key: 'account', label: 'Account', routerLink: ['/account'], queryParams: { tab: 'profile' }, fragment: 'security' },
  { key: 'orders', label: 'Orders', current: true },
];`;
  readonly overflowCode = `<neural-breadcrumb [items]="items" [maxItems]="3"
  overflowLabel="More locations" [overflowTooltipDelay]="100"
  (itemSelect)="select($event)" />`;
  readonly projectedCode = `<neural-breadcrumb ariaLabel="Projected page trail">
  <neural-breadcrumb-item key="home" label="Home" iconClass="nt-home" routerLink="/" />
  <neural-breadcrumb-item key="guides" label="Guides" routerLink="/guides" />
  <neural-breadcrumb-item key="current" label="Breadcrumb" current />
</neural-breadcrumb>`;
  readonly separatorCode = `<neural-breadcrumb separatorIconClass="nt-arrow-right" [items]="items" />

<neural-breadcrumb [items]="items">
  <ng-template neuralBreadcrumbSeparator><span aria-hidden="true">/</span></ng-template>
</neural-breadcrumb>`;
  readonly statesCode = `readonly items = [
  { key: 'home', label: 'Home', routerLink: '/' },
  { key: 'locked', label: 'Locked', disabled: true },
  { key: 'active', label: 'Current section', current: true },
];`;
  readonly unstyledCode = `<neural-breadcrumb unstyled [items]="items" [classes]="classes" />`;
  readonly breadcrumbInputs = [
    [
      'items',
      'readonly NeuralBreadcrumbItem[]',
      '[]',
      'Immutable data-driven trail.',
    ],
    [
      'maxItems',
      'number',
      '0',
      'Visible edge count; values >= 2 collapse the middle.',
    ],
    ['ariaLabel', 'string', "'Breadcrumb'", 'Navigation landmark label.'],
    [
      'separatorIconClass',
      'string',
      "'nt-chevron-right'",
      'Default separator icon classes.',
    ],
    [
      'overflowIconClass',
      'string',
      "'nt-dots'",
      'Collapsed-items trigger icon.',
    ],
    [
      'overflowLabel',
      'string',
      "'More breadcrumb items'",
      'Menu and Tooltip accessible label.',
    ],
    [
      'overflowTooltipDelay',
      'number',
      '100',
      'Overflow Tooltip delay in milliseconds.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['breadcrumbClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralBreadcrumbClasses', '{}', 'Typed additive class slots.'],
  ] as const;
  readonly breadcrumbOutputs = [
    [
      'itemSelect',
      'NeuralBreadcrumbSelect',
      'User selection from a visible or overflow item.',
    ],
  ] as const;
  readonly itemInputs = [
    ['key', 'string', 'required', 'Stable identity and emitted key.'],
    ['label', 'string', 'required', 'Visible item label.'],
    ['iconClass', 'string', "''", 'Optional Neural Icon classes.'],
    ['href', 'string', "''", 'Native document URL.'],
    [
      'routerLink',
      'NeuralBreadcrumbRouterLink',
      'undefined',
      'Angular Router commands.',
    ],
    ['queryParams', 'Params | null', 'null', 'Router query parameters.'],
    ['fragment', 'string', "''", 'Router fragment.'],
    [
      'queryParamsHandling',
      'QueryParamsHandling | null',
      'null',
      'Merge, preserve, or replace query parameters.',
    ],
    [
      'preserveFragment',
      'boolean',
      'false',
      'Keeps the current fragment when no replacement is supplied.',
    ],
    [
      'skipLocationChange',
      'boolean',
      'false',
      'Navigates without adding the target URL to browser history.',
    ],
    [
      'replaceUrl',
      'boolean',
      'false',
      'Replaces the current browser history entry.',
    ],
    [
      'state',
      'Record<string, unknown> | undefined',
      'undefined',
      'Developer-defined Router history state.',
    ],
    ['target', 'string', "''", 'Native link target.'],
    ['rel', 'string', "''", 'Native link relationship.'],
    ['disabled', 'boolean', 'false', 'Readable inert state.'],
    [
      'current',
      'boolean | undefined',
      'undefined',
      'Explicit aria-current override.',
    ],
    ['itemClass', 'string', "''", 'Additive item class.'],
  ] as const;
  readonly classSlots = [
    'root',
    'list',
    'item',
    'link',
    'current',
    'disabled',
    'icon',
    'label',
    'separator',
    'overflowItem',
    'overflowTrigger',
  ] as const;
  readonly publicTypes = [
    [
      'NeuralBreadcrumbItem',
      'Immutable item data for links, state and identity.',
    ],
    ['NeuralBreadcrumbSelect', '{ key, item, originalEvent }'],
    ['NeuralBreadcrumbRouterLink', 'string | readonly unknown[] | UrlTree'],
    ['NeuralBreadcrumbClasses', 'Typed visual ownership slots.'],
  ] as const;
  readonly containerTokens = [
    '--neural-breadcrumb-padding',
    '--neural-breadcrumb-color',
    '--neural-breadcrumb-background',
    '--neural-breadcrumb-border',
    '--neural-breadcrumb-radius',
    '--neural-breadcrumb-shadow',
    '--neural-breadcrumb-gap',
    '--neural-breadcrumb-font-family',
  ] as const;
  readonly itemTokens = [
    '--neural-breadcrumb-item-gap',
    '--neural-breadcrumb-item-min-height',
    '--neural-breadcrumb-item-padding',
    '--neural-breadcrumb-item-color',
    '--neural-breadcrumb-item-color-active',
    '--neural-breadcrumb-item-background-active',
    '--neural-breadcrumb-item-radius',
    '--neural-breadcrumb-font-size',
    '--neural-breadcrumb-icon-size',
    '--neural-breadcrumb-separator-color',
    '--neural-breadcrumb-separator-size',
  ] as const;
  readonly stateTokens = [
    '--neural-breadcrumb-current-color',
    '--neural-breadcrumb-current-font-weight',
    '--neural-breadcrumb-disabled-opacity',
    '--neural-breadcrumb-focus-ring',
    '--neural-breadcrumb-focus-ring-offset',
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
  select(event: NeuralBreadcrumbSelect): void {
    this.lastSelection.set(event.key);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/breadcrumb${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): BreadcrumbDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is BreadcrumbDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
