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
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import {
  NeuralTooltip,
  type NeuralTooltipClasses,
  type NeuralTooltipPosition,
} from '@neural-ng/core/tooltip';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type TooltipDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-tooltip-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    NeuralTooltip,
  ],
  templateUrl: './tooltip.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly selectedView = signal<TooltipDocView>(
    resolveTooltipDocView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly dynamicText = signal('Agent is ready');
  readonly tooltipDisabled = signal(false);
  readonly positions: readonly (NeuralTooltipPosition | null)[] = [
    'top-start',
    'top',
    'top-end',
    'left',
    null,
    'right',
    'bottom-start',
    'bottom',
    'bottom-end',
  ];
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralTooltipClasses = {
    root: 'z-[1200] max-w-64 text-xs',
    content:
      'block rounded-xl border border-cyan-300/30 bg-slate-950 px-3 py-2 font-bold text-cyan-50 shadow-[0_14px_38px_rgba(8,145,178,.22)]',
    arrow: 'bg-slate-950 ring-1 ring-cyan-300/30',
  };

  readonly pageLinks: Record<
    TooltipDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Positions', 'positions'],
      ['Delays and state', 'delays'],
      ['Dynamic content', 'dynamic'],
      ['Imperative API', 'imperative'],
      ['Disabled controls', 'disabled'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Description', 'description'],
      ['Keyboard', 'keyboard'],
      ['Pointer and focus', 'pointer-focus'],
      ['Content rules', 'content-rules'],
      ['RTL and viewport', 'rtl-viewport'],
      ['SSR and cleanup', 'ssr-cleanup'],
    ],
    api: [
      ['Directive', 'directive'],
      ['Inputs', 'inputs'],
      ['State and methods', 'state-methods'],
      ['Class slots', 'class-slots'],
      ['Public types', 'public-types'],
      ['Compatibility', 'compatibility'],
    ],
    tokens: [
      ['Surface', 'surface-tokens'],
      ['Typography', 'typography-tokens'],
      ['Arrow and sizing', 'sizing-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };

  readonly importCode = `import { NeuralTooltip } from '@neural-ng/core/tooltip';

@Component({
  imports: [NeuralTooltip],
})
export class AccountActions {}`;

  readonly basicCode = `<neural-button
  label="Account settings"
  icon="nt nt-settings"
  neuralTooltip="Manage profile, security and preferences"
/>`;
  readonly positionsCode = `<neural-button
  neuralTooltip="Logical start follows document direction"
  tooltipPosition="bottom-start"
  label="bottom-start"
/>`;
  readonly delaysCode = `<neural-button
  neuralTooltip="Appears after intent is clear"
  [showDelay]="700"
  [hideDelay]="150"
  [tooltipDisabled]="disabled()"
/>`;
  readonly dynamicCode = `<neural-button
  [neuralTooltip]="status()"
  label="Agent status"
/>

status.set('Agent completed the task');`;
  readonly imperativeCode = `<neural-button
  #tip="neuralTooltip"
  neuralTooltip="Controlled through the directive API"
  label="Tooltip target"
/>

<neural-button label="Show" (clicked)="tip.show()" />
<neural-button label="Hide" (clicked)="tip.hide(true)" />`;
  readonly disabledCode = `<!-- Native disabled controls cannot receive focus. -->
<span
  tabindex="0"
  neuralTooltip="Permission is required"
  aria-label="Unavailable action: Permission is required"
>
  <neural-button label="Deploy" [disabled]="true" />
</span>`;
  readonly unstyledCode = `<span
  neuralTooltip="Consumer-owned tooltip surface"
  unstyled
  [classes]="tooltipClasses"
>
  <neural-button label="Headless tooltip" outlined />
</span>`;

  readonly inputs = [
    ['neuralTooltip', 'string', `''`, 'Plain descriptive tooltip content.'],
    [
      'tooltipPosition',
      'NeuralTooltipPosition',
      `'top'`,
      'Requested logical overlay placement.',
    ],
    [
      'tooltipDisabled',
      'boolean',
      'false',
      'Prevents opening and closes an active tooltip.',
    ],
    ['showDelay', 'number', '300', 'Pointer or focus opening delay in ms.'],
    ['hideDelay', 'number', '80', 'Leave or blur closing delay in ms.'],
    [
      'tooltipId',
      'string | null',
      'null',
      'Stable ID used by aria-describedby; generated when absent.',
    ],
    [
      'tooltipClass',
      'string',
      `''`,
      'Additional class applied to the floating root.',
    ],
    ['classes', 'NeuralTooltipClasses', '{}', 'Typed classes for every slot.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
  ] as const;
  readonly classSlots = [
    ['root', 'Fixed-position top-layer host and placement state.'],
    ['content', 'Text surface containing the accessible description.'],
    ['arrow', 'Position-aware decorative arrow.'],
  ] as const;
  readonly surfaceTokens = [
    '--neural-tooltip-color',
    '--neural-tooltip-background',
    '--neural-tooltip-border',
    '--neural-tooltip-radius',
    '--neural-tooltip-shadow',
    '--neural-tooltip-padding',
  ] as const;
  readonly typographyTokens = [
    '--neural-tooltip-font-family',
    '--neural-tooltip-font-size',
    '--neural-tooltip-font-weight',
    '--neural-tooltip-line-height',
  ] as const;
  readonly sizingTokens = [
    '--neural-tooltip-max-width',
    '--neural-tooltip-z-index',
    '--neural-tooltip-arrow-size',
    '--neural-tooltip-arrow-corner-offset',
  ] as const;
  readonly motionTokens = [
    '--neural-tooltip-enter-scale',
    '--neural-tooltip-enter-duration',
    '--neural-tooltip-enter-easing',
    '--neural-tooltip-leave-duration',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveTooltipDocView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  cycleDynamicText(): void {
    this.dynamicText.update((value) =>
      value === 'Agent is ready'
        ? 'Agent completed the task'
        : 'Agent is ready',
    );
  }

  toggleTooltipDisabled(): void {
    this.tooltipDisabled.update((value) => !value);
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isTooltipDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/tooltip${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveTooltipDocView(url: string): TooltipDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isTooltipDocView(
  value: NeuralTabValue | null,
): value is TooltipDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
