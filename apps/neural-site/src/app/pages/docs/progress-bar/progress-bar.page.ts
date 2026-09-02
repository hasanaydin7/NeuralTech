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
  NeuralProgressBar,
  type NeuralProgressBarClasses,
} from '@neural-ng/core/progress-bar';
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

type ProgressBarDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-progress-bar-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralProgressBar,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './progress-bar.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<ProgressBarDocView>(
    resolveView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly progress = signal(36);
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralProgressBarClasses = {
    root: 'w-full text-cyan-100',
    track:
      'relative h-5 overflow-hidden rounded-full bg-slate-800 ring-1 ring-cyan-300/20',
    buffer: 'absolute inset-y-0 left-0 bg-cyan-300/15 transition-[width]',
    value:
      'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-[width]',
    label:
      'absolute inset-0 grid place-items-center text-[.65rem] font-black text-white',
  };
  readonly pageLinks: Record<
    ProgressBarDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Interactive progress', 'interactive'],
      ['Semantic severities', 'severities'],
      ['Sizes and variants', 'sizes'],
      ['Buffer', 'buffer'],
      ['Indeterminate', 'indeterminate'],
      ['Custom range and labels', 'labels'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Progress semantics', 'semantics'],
      ['Accessible names', 'accessible-names'],
      ['Value descriptions', 'value-descriptions'],
      ['Unknown progress', 'unknown-progress'],
      ['Reduced motion', 'reduced-motion'],
      ['SSR and hydration', 'ssr'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Layout', 'layout-tokens'],
      ['Surface', 'surface-tokens'],
      ['Sizes', 'size-tokens'],
      ['Severity', 'severity-tokens'],
      ['Label', 'label-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralProgressBar,
  type NeuralProgressBarClasses,
} from '@neural-ng/core/progress-bar';

@Component({ imports: [NeuralProgressBar] })`;
  readonly interactiveCode = `<neural-progress-bar
  [value]="progress()"
  ariaLabel="Upload progress"
/>`;
  readonly severityCode = `<neural-progress-bar [value]="64" severity="success" />`;
  readonly sizeCode = `<neural-progress-bar size="small" [showValue]="false" [value]="38" />
<neural-progress-bar size="medium" [value]="55" />
<neural-progress-bar size="large" striped animated [value]="72" />`;
  readonly bufferCode = `<neural-progress-bar
  [value]="35"
  [bufferValue]="68"
  ariaLabel="Video playback buffer"
/>`;
  readonly indeterminateCode = `<neural-progress-bar
  mode="indeterminate"
  label="Loading"
  ariaLabel="Loading search results"
/>`;
  readonly labelCode = `<neural-progress-bar
  [value]="7"
  [max]="10"
  label="7 / 10 files"
  ariaValueText="7 of 10 files completed"
  ariaLabel="File upload progress"
/>`;
  readonly unstyledCode = `<neural-progress-bar
  [value]="64"
  [bufferValue]="82"
  unstyled
  progressClass="my-progress"
  [classes]="classes"
/>`;
  readonly inputs = [
    ['value', 'number', '0', 'Current determinate value.'],
    ['min', 'number', '0', 'Lower range boundary.'],
    ['max', 'number', '100', 'Upper range boundary.'],
    [
      'bufferValue',
      'number | null',
      'null',
      'Prepared progress rendered behind the current value.',
    ],
    [
      'mode',
      "'determinate' | 'indeterminate'",
      "'determinate'",
      'Known or unknown completion mode.',
    ],
    [
      'size',
      "'small' | 'medium' | 'large'",
      "'medium'",
      'Track and label preset.',
    ],
    [
      'severity',
      'NeuralProgressBarSeverity',
      "'info'",
      'Semantic value color.',
    ],
    ['rounded', 'boolean', 'true', 'Uses rounded track geometry.'],
    ['striped', 'boolean', 'false', 'Adds a striped value surface.'],
    [
      'animated',
      'boolean',
      'false',
      'Animates stripes when striped is enabled.',
    ],
    [
      'showValue',
      'boolean',
      'true',
      'Controls the visual label without removing semantics.',
    ],
    ['label', 'string | null', 'null', 'Explicit visual value label.'],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    [
      'ariaLabelledBy',
      'string | null',
      'null',
      'Visible accessible-name reference.',
    ],
    [
      'ariaValueText',
      'string | null',
      'computed label',
      'Localized or descriptive accessible value.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['progressClass', 'string', "''", 'Additive root classes.'],
    [
      'classes',
      'NeuralProgressBarClasses',
      '{}',
      'Typed root, track, buffer, value and label slots.',
    ],
  ] as const;
  readonly publicTypes = [
    ['NeuralProgressBarMode', "'determinate' | 'indeterminate'"],
    ['NeuralProgressBarSize', "'small' | 'medium' | 'large'"],
    [
      'NeuralProgressBarSeverity',
      "'primary' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'error'",
    ],
    ['NeuralProgressBarClasses', '{ root?, track?, buffer?, value?, label? }'],
  ] as const;
  readonly layoutTokens = [
    '--neural-progress-bar-radius',
    '--neural-progress-bar-track-border',
    '--neural-progress-bar-shadow',
  ];
  readonly surfaceTokens = [
    '--neural-progress-bar-track-background',
    '--neural-progress-bar-buffer-background',
    '--neural-progress-bar-value-background',
    '--neural-progress-bar-stripe-color',
    '--neural-progress-bar-stripe-size',
  ];
  readonly sizeTokens = [
    '--neural-progress-bar-small-height',
    '--neural-progress-bar-medium-height',
    '--neural-progress-bar-large-height',
    '--neural-progress-bar-small-font-size',
    '--neural-progress-bar-medium-font-size',
    '--neural-progress-bar-large-font-size',
  ];
  readonly severityTokens = [
    '--neural-progress-bar-primary-background',
    '--neural-progress-bar-secondary-background',
    '--neural-progress-bar-neutral-background',
    '--neural-progress-bar-info-background',
    '--neural-progress-bar-success-background',
    '--neural-progress-bar-warning-background',
    '--neural-progress-bar-error-background',
  ];
  readonly labelTokens = [
    '--neural-progress-bar-label-color',
    '--neural-progress-bar-label-font-family',
    '--neural-progress-bar-label-font-weight',
    '--neural-progress-bar-label-line-height',
    '--neural-progress-bar-label-shadow',
  ];
  readonly motionTokens = [
    '--neural-progress-bar-transition',
    '--neural-progress-bar-stripe-duration',
    '--neural-progress-bar-indeterminate-width',
    '--neural-progress-bar-indeterminate-duration',
    '--neural-progress-bar-indeterminate-easing',
  ];

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  decrease(): void {
    this.progress.update((value) => Math.max(0, value - 10));
  }

  increase(): void {
    this.progress.update((value) => Math.min(100, value + 10));
  }

  reset(): void {
    this.progress.set(0);
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/progress-bar${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): ProgressBarDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is ProgressBarDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
