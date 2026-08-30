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
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralTag,
  type NeuralTagClasses,
  type NeuralTagRemove,
} from '@neural-ng/core/tag';
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

type TagDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-tag-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralTag,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './tag.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<TagDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly filters = signal(['Angular', 'Signals', 'Accessibility']);
  readonly lastEvent = signal('No tag removed.');
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralTagClasses = {
    root: 'inline-flex items-center gap-2 rounded-full border border-fuchsia-300/35 bg-slate-950 px-3 py-1.5 text-xs font-black text-fuchsia-100 shadow-[0_10px_30px_rgba(217,70,239,.2)]',
    icon: 'text-fuchsia-300',
    label: 'tracking-wide',
    content: 'inline-flex items-center gap-1.5',
    removeButton:
      'grid size-5 cursor-pointer place-items-center rounded-full text-fuchsia-200 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300',
    removeIcon: 'text-xs',
  };
  readonly pageLinks: Record<
    TagDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic usage', 'basic'],
      ['Severities', 'severities'],
      ['Sizes and shapes', 'sizes'],
      ['Icons and content', 'content'],
      ['Removable tags', 'removable'],
      ['States', 'states'],
      ['Unstyled', 'unstyled'],
      ['Tag vs Badge', 'boundaries'],
    ],
    accessibility: [
      ['Text semantics', 'semantics'],
      ['Meaningful icons', 'icons-a11y'],
      ['Removal control', 'removal-a11y'],
      ['Disabled state', 'disabled-a11y'],
      ['RTL', 'rtl'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Base tokens', 'base-tokens'],
      ['Size tokens', 'size-tokens'],
      ['Severity tokens', 'severity-tokens'],
      ['Removal tokens', 'removal-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralTag,
  type NeuralTagRemove,
} from '@neural-ng/core/tag';

@Component({ imports: [NeuralTag] })`;
  readonly basicCode = `<neural-tag value="Angular" />
<neural-tag value="Signals" severity="primary" />
<neural-tag value="Headless" [rounded]="false" />`;
  readonly severityCode = `<neural-tag value="Primary" severity="primary" />
<neural-tag value="Secondary" severity="secondary" />
<neural-tag value="Neutral" severity="neutral" />
<neural-tag value="Info" severity="info" />
<neural-tag value="Success" severity="success" />
<neural-tag value="Warning" severity="warning" />
<neural-tag value="Error" severity="error" />`;
  readonly sizeCode = `<neural-tag value="Small" size="small" />
<neural-tag value="Medium" size="medium" />
<neural-tag value="Large" size="large" />
<neural-tag value="Square corners" [rounded]="false" />`;
  readonly contentCode = `<neural-tag value="Angular" iconClass="nt nt-brand-angular" />
<neural-tag value="Verified" iconClass="nt nt-circle-check" severity="success" />

<neural-tag severity="info">
  <strong>Projected</strong>
  <span>content</span>
</neural-tag>`;
  readonly removableCode = `@for (filter of filters(); track filter) {
  <neural-tag
    [value]="filter"
    removable
    [removeLabel]="'Remove ' + filter + ' filter'"
    (removed)="removeFilter($event)"
  />
}`;
  readonly statesCode = `<neural-tag value="Available" removable severity="success" />
<neural-tag value="Locked" removable disabled severity="secondary" />
<neural-tag value="Custom remove icon" removable
  removeIconClass="nt nt-trash" severity="error" />`;
  readonly unstyledCode = `<neural-tag
  value="Agentic"
  iconClass="nt nt-sparkles"
  removable
  unstyled
  [classes]="classes"
/>`;

  readonly inputs = [
    [
      'value',
      'string | null | undefined',
      'null',
      'Text label; absence renders projected content.',
    ],
    [
      'severity',
      'NeuralTagSeverity',
      "'neutral'",
      'Semantic visual treatment.',
    ],
    [
      'size',
      'NeuralTagSize',
      "'medium'",
      'Small, medium or large density preset.',
    ],
    ['rounded', 'boolean', 'true', 'Uses the pill-shaped corner token.'],
    ['iconClass', 'string | null', 'null', 'Prepends an icon class.'],
    [
      'iconAriaLabel',
      'string | null',
      'null',
      'Makes the icon meaningful instead of decorative.',
    ],
    ['removable', 'boolean', 'false', 'Adds an accessible removal control.'],
    [
      'disabled',
      'boolean',
      'false',
      'Disables removal and exposes aria-disabled.',
    ],
    [
      'removeLabel',
      'string | null',
      'null',
      'Overrides the generated remove accessible name.',
    ],
    ['removeIconClass', 'string', "'nt nt-x'", 'Removal control icon class.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['tagClass', 'string', "''", 'Consumer class merged onto the root.'],
    [
      'classes',
      'NeuralTagClasses',
      '{}',
      'Typed classes for every visual slot.',
    ],
  ] as const;
  readonly outputs = [
    [
      'removed',
      'NeuralTagRemove',
      'Emits the value and original pointer event; ownership remains controlled.',
    ],
  ] as const;
  readonly classSlots = [
    'root',
    'icon',
    'label',
    'content',
    'removeButton',
    'removeIcon',
  ] as const;
  readonly publicTypes = [
    [
      'NeuralTagSeverity',
      "'primary' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'error'",
    ],
    ['NeuralTagSize', "'small' | 'medium' | 'large'"],
    ['NeuralTagRemove', '{ value: string | null; originalEvent: MouseEvent }'],
    ['NeuralTagClasses', 'Typed root, icon, label, content and removal slots.'],
  ] as const;
  readonly baseTokens = [
    '--neural-tag-height',
    '--neural-tag-gap',
    '--neural-tag-padding',
    '--neural-tag-color',
    '--neural-tag-background',
    '--neural-tag-border',
    '--neural-tag-radius',
    '--neural-tag-rounded-radius',
    '--neural-tag-shadow',
    '--neural-tag-font-family',
    '--neural-tag-font-size',
    '--neural-tag-font-weight',
    '--neural-tag-line-height',
    '--neural-tag-icon-color',
    '--neural-tag-icon-size',
    '--neural-tag-content-gap',
    '--neural-tag-disabled-opacity',
  ] as const;
  readonly sizeTokens = [
    '--neural-tag-small-height',
    '--neural-tag-small-gap',
    '--neural-tag-small-padding',
    '--neural-tag-small-font-size',
    '--neural-tag-large-height',
    '--neural-tag-large-gap',
    '--neural-tag-large-padding',
    '--neural-tag-large-font-size',
  ] as const;
  readonly severityTokens = [
    '--neural-tag-primary-color',
    '--neural-tag-primary-background',
    '--neural-tag-primary-border-color',
    '--neural-tag-secondary-color',
    '--neural-tag-secondary-background',
    '--neural-tag-secondary-border-color',
    '--neural-tag-neutral-color',
    '--neural-tag-neutral-background',
    '--neural-tag-neutral-border-color',
    '--neural-tag-info-color',
    '--neural-tag-info-background',
    '--neural-tag-info-border-color',
    '--neural-tag-success-color',
    '--neural-tag-success-background',
    '--neural-tag-success-border-color',
    '--neural-tag-warning-color',
    '--neural-tag-warning-background',
    '--neural-tag-warning-border-color',
    '--neural-tag-error-color',
    '--neural-tag-error-background',
    '--neural-tag-error-border-color',
  ] as const;
  readonly removalTokens = [
    '--neural-tag-remove-size',
    '--neural-tag-remove-margin',
    '--neural-tag-remove-color',
    '--neural-tag-remove-background',
    '--neural-tag-remove-color-hover',
    '--neural-tag-remove-background-hover',
    '--neural-tag-remove-radius',
    '--neural-tag-remove-icon-size',
    '--neural-tag-focus-ring',
    '--neural-tag-focus-ring-offset',
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

  removeFilter(event: NeuralTagRemove): void {
    if (event.value === null) return;
    this.filters.update((filters) =>
      filters.filter((item) => item !== event.value),
    );
    this.lastEvent.set(`${event.value} removed.`);
  }

  resetFilters(): void {
    this.filters.set(['Angular', 'Signals', 'Accessibility']);
    this.lastEvent.set('Filters restored.');
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/tag${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): TagDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is TagDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
