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
  NeuralProgressSpinner,
  type NeuralProgressSpinnerClasses,
} from '@neural-ng/core/progress-spinner';
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

type ProgressSpinnerDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-progress-spinner-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralProgressSpinner,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './progress-spinner.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<ProgressSpinnerDocView>(
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
  readonly headlessClasses: NeuralProgressSpinnerClasses = {
    root: 'gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-cyan-100 ring-1 ring-cyan-300/20',
    svg: 'size-9',
    track: 'stroke-slate-700',
    indicator:
      'origin-center animate-spin stroke-cyan-400 [stroke-linecap:round] [stroke-dasharray:88_38]',
    label: 'text-sm font-black tracking-wide',
  };
  readonly pageLinks: Record<
    ProgressSpinnerDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Variants', 'variants'],
      ['Semantic severities', 'severities'],
      ['Sizes', 'sizes'],
      ['Labels and naming', 'labels'],
      ['Stroke and speed', 'motion'],
      ['Unstyled', 'unstyled'],
      ['Usage boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Indeterminate semantics', 'semantics'],
      ['Accessible names', 'accessible-names'],
      ['Value descriptions', 'value-descriptions'],
      ['Reduced motion', 'reduced-motion'],
      ['Localization', 'localization'],
      ['SSR and hydration', 'ssr'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Layout and sizes', 'layout-tokens'],
      ['Surface', 'surface-tokens'],
      ['Color and severity', 'severity-tokens'],
      ['Label', 'label-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralProgressSpinner,
  type NeuralProgressSpinnerClasses,
} from '@neural-ng/core/progress-spinner';

@Component({ imports: [NeuralProgressSpinner] })`;
  readonly basicCode = `<neural-progress-spinner ariaLabel="Loading results" />`;
  readonly variantCode = `<neural-progress-spinner
  variant="multicolor"
  dynamicStroke
  size="large"
  ariaLabel="AI is reasoning"
/>

<neural-progress-spinner
  dual
  reverse
  size="large"
  ariaLabel="Loading coordinated tasks"
/>

<neural-progress-spinner
  dual
  variant="multicolor"
  [syncDualColor]="false"
  ariaLabel="Independent color cycles"
/>`;
  readonly severityCode = `<neural-progress-spinner severity="primary" ariaLabel="Primary task" />
<neural-progress-spinner severity="success" ariaLabel="Saving" />
<neural-progress-spinner severity="error" ariaLabel="Retrying failed task" />`;
  readonly sizeCode = `<neural-progress-spinner size="small" ariaLabel="Small task" />
<neural-progress-spinner size="medium" ariaLabel="Medium task" />
<neural-progress-spinner size="large" ariaLabel="Large task" />`;
  readonly labelCode = `<neural-progress-spinner
  label="Synchronizing workspace"
  ariaValueText="Waiting for the remote agent"
/>`;
  readonly motionCode = `<neural-progress-spinner
  [strokeWidth]="3"
  [speed]="1200"
  severity="warning"
  ariaLabel="Connecting"
/>`;
  readonly unstyledCode = `<neural-progress-spinner
  label="Agent is reasoning"
  unstyled
  spinnerClass="my-spinner"
  [classes]="headlessClasses"
/>`;
  readonly inputs = [
    [
      'size',
      "'small' | 'medium' | 'large'",
      "'medium'",
      'Spinner diameter preset.',
    ],
    [
      'variant',
      "'solid' | 'multicolor'",
      "'solid'",
      'Single semantic color or an animated five-color cycle.',
    ],
    [
      'severity',
      'NeuralProgressSpinnerSeverity',
      "'info'",
      'Semantic indicator color.',
    ],
    [
      'dynamicStroke',
      'boolean',
      'false',
      'Grows and contracts the visible arc while it rotates.',
    ],
    [
      'dual',
      'boolean',
      'false',
      'Adds a counter-rotating inner track and indicator.',
    ],
    [
      'reverse',
      'boolean',
      'false',
      'Reverses the primary direction while dual arcs stay opposed.',
    ],
    [
      'syncDualColor',
      'boolean',
      'true',
      'Keeps both dual arcs on the same multicolor cycle.',
    ],
    [
      'strokeWidth',
      'number',
      '4',
      'SVG stroke width, clamped from 1 through 12.',
    ],
    [
      'speed',
      'number',
      '900',
      'Rotation duration in milliseconds, clamped from 200 through 10000.',
    ],
    ['label', 'string | null', 'null', 'Optional visible loading label.'],
    [
      'showLabel',
      'boolean',
      'true',
      'Controls visible label rendering while preserving its accessible fallback.',
    ],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    [
      'ariaLabelledBy',
      'string | null',
      'null',
      'ID reference that takes precedence over ariaLabel.',
    ],
    [
      'ariaValueText',
      'string | null',
      'null',
      'Optional human-readable task state.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['spinnerClass', 'string', "''", 'Additive root classes.'],
    [
      'classes',
      'NeuralProgressSpinnerClasses',
      '{}',
      'Typed outer, inner and label class slots.',
    ],
  ] as const;
  readonly publicTypes = [
    ['NeuralProgressSpinnerSize', "'small' | 'medium' | 'large'"],
    ['NeuralProgressSpinnerVariant', "'solid' | 'multicolor'"],
    [
      'NeuralProgressSpinnerSeverity',
      "'primary' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'error'",
    ],
    [
      'NeuralProgressSpinnerClasses',
      '{ root?, svg?, track?, indicator?, inner?, innerTrack?, innerIndicator?, label? }',
    ],
  ] as const;
  readonly layoutTokens = [
    '--neural-progress-spinner-small-size',
    '--neural-progress-spinner-medium-size',
    '--neural-progress-spinner-large-size',
    '--neural-progress-spinner-gap',
    '--neural-progress-spinner-font-family',
    '--neural-progress-spinner-dual-scale',
    '--neural-progress-spinner-dual-track-opacity',
    '--neural-progress-spinner-dual-indicator-opacity',
  ];
  readonly surfaceTokens = [
    '--neural-progress-spinner-track-color',
    '--neural-progress-spinner-indicator-color',
    '--neural-progress-spinner-filter',
  ];
  readonly severityTokens = [
    '--neural-progress-spinner-primary-color',
    '--neural-progress-spinner-secondary-color',
    '--neural-progress-spinner-neutral-color',
    '--neural-progress-spinner-info-color',
    '--neural-progress-spinner-success-color',
    '--neural-progress-spinner-warning-color',
    '--neural-progress-spinner-error-color',
    '--neural-progress-spinner-color-1',
    '--neural-progress-spinner-color-2',
    '--neural-progress-spinner-color-3',
    '--neural-progress-spinner-color-4',
    '--neural-progress-spinner-color-5',
  ];
  readonly labelTokens = [
    '--neural-progress-spinner-label-color',
    '--neural-progress-spinner-label-font-size',
    '--neural-progress-spinner-label-font-weight',
    '--neural-progress-spinner-label-line-height',
  ];
  readonly motionTokens = [
    '--neural-progress-spinner-duration',
    '--neural-progress-spinner-dasharray',
    '--neural-progress-spinner-easing',
    '--neural-progress-spinner-linecap',
    '--neural-progress-spinner-color-duration',
    '--neural-progress-spinner-dynamic-stroke-duration',
  ];

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/progress-spinner${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): ProgressSpinnerDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is ProgressSpinnerDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
