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
import { NeuralCheckbox } from '@neural-ng/core/checkbox';
import {
  NeuralPopover,
  NeuralPopoverClose,
  NeuralPopoverInitialFocus,
  NeuralPopoverTrigger,
  type NeuralPopoverClasses,
  type NeuralPopoverCloseEvent,
  type NeuralPopoverOpenEvent,
  type NeuralPopoverPosition,
} from '@neural-ng/core/popover';
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

type PopoverDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-popover-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralCheckbox,
    NeuralPopover,
    NeuralPopoverClose,
    NeuralPopoverInitialFocus,
    NeuralPopoverTrigger,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './popover.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<PopoverDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly controlledOpen = signal(false);
  readonly activePosition = signal<NeuralPopoverPosition>('bottom-start');
  readonly lastEvent = signal('No Popover interaction yet.');
  readonly positions: readonly NeuralPopoverPosition[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'right',
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
  readonly headlessClasses: NeuralPopoverClasses = {
    root: 'w-72 rounded-2xl border border-cyan-300/25 bg-slate-950 text-slate-100 shadow-[0_24px_70px_rgba(2,6,23,.65)]',
    content: 'p-5',
    arrow: 'border-cyan-300/25 bg-slate-950',
  };
  readonly pageLinks: Record<
    PopoverDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Account panel', 'basic'],
      ['Logical positions', 'positions'],
      ['Controlled state', 'controlled'],
      ['Focus workflow', 'focus'],
      ['Dismiss policy', 'dismiss'],
      ['Trigger width', 'trigger-width'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Trigger contract', 'trigger-contract'],
      ['Roles and labels', 'roles'],
      ['Focus lifecycle', 'focus-lifecycle'],
      ['Keyboard', 'keyboard'],
      ['Top layer and RTL', 'top-layer'],
      ['SSR', 'ssr'],
    ],
    api: [
      ['Component inputs', 'inputs'],
      ['Trigger inputs', 'trigger-inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Directives', 'directives'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
      ['Legacy aliases', 'aliases'],
    ],
    tokens: [
      ['Sizing', 'sizing-tokens'],
      ['Surface', 'surface-tokens'],
      ['Arrow', 'arrow-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };
  readonly importCode = `import {
  NeuralPopover,
  NeuralPopoverTrigger,
  NeuralPopoverClose,
} from '@neural-ng/core/popover';

@Component({ imports: [NeuralPopover, NeuralPopoverTrigger, NeuralPopoverClose] })`;
  readonly basicCode = `<neural-button [neuralPopoverTriggerFor]="account" label="Account" icon="nt nt-user" />

<neural-popover #account role="dialog" ariaLabel="Account panel">
  <strong>Neural Admin</strong>
  <button neuralPopoverClose>Close</button>
</neural-popover>`;
  readonly positionsCode = `<button [neuralPopoverTriggerFor]="panel" popoverPosition="top-start">top-start</button>
<button [neuralPopoverTriggerFor]="panel" popoverPosition="right">right</button>
<neural-popover #panel showArrow>Viewport-aware content</neural-popover>`;
  readonly controlledCode = `<neural-popover #panel [(open)]="open" />`;
  readonly focusCode = `<button [neuralPopoverTriggerFor]="profile" popoverFocusOnOpen="first">Edit</button>
<neural-popover #profile role="dialog" ariaLabel="Edit profile">
  <input neuralPopoverInitialFocus />
</neural-popover>`;
  readonly policyCode = `<neural-popover [dismissible]="false" [closeOnEscape]="false">
  <button neuralPopoverClose>Explicit close</button>
</neural-popover>`;
  readonly widthCode = `<neural-button
  buttonClass="w-80 justify-between"
  label="Filter agents"
  icon="nt nt-chevron-down"
  iconPosition="end"
  [neuralPopoverTriggerFor]="filters"
/>

<neural-popover #filters matchTriggerWidth>
  The panel matches its active trigger.
</neural-popover>`;
  readonly unstyledCode = `<neural-popover unstyled showArrow [classes]="classes">Consumer-owned panel</neural-popover>`;
  readonly inputs = [
    ['open', 'ModelSignal<boolean>', 'false', 'Controlled visibility state.'],
    [
      'position',
      'NeuralPopoverPosition',
      "'bottom-start'",
      'Fallback logical placement.',
    ],
    ['offset', 'number', '8', 'Gap from the active trigger in pixels.'],
    ['viewportPadding', 'number', '8', 'Minimum distance from viewport edges.'],
    [
      'focusOnOpen',
      "'none' | 'first'",
      "'none'",
      'Optional focus transfer policy.',
    ],
    [
      'dismissible',
      'boolean',
      'true',
      'Closes on outside pointer interaction.',
    ],
    [
      'closeOnEscape',
      'boolean',
      'true',
      'Closes the topmost panel with Escape.',
    ],
    [
      'restoreFocus',
      'boolean',
      'true',
      'Returns focus for explicit and keyboard closes.',
    ],
    [
      'matchTriggerWidth',
      'boolean',
      'false',
      'Matches the active trigger inline size.',
    ],
    [
      'showArrow',
      'boolean',
      'false',
      'Renders the positioned structural arrow.',
    ],
    ['role', "'dialog' | 'region' | null", 'null', 'Opt-in semantic role.'],
    ['popoverId', 'string', 'generated', 'Stable ID linked to the trigger.'],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    [
      'ariaLabelledby',
      'string | null',
      'null',
      'Visible accessible-name reference.',
    ],
    [
      'ariaDescribedby',
      'string | null',
      'null',
      'Accessible description reference.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['popoverClass', 'string', "''", 'Additive root classes.'],
    [
      'classes',
      'NeuralPopoverClasses',
      '{}',
      'Typed root, content and arrow slots.',
    ],
  ] as const;
  readonly triggerInputs = [
    [
      'neuralPopoverTriggerFor',
      'NeuralPopover',
      'required',
      'Popover instance controlled by this trigger.',
    ],
    [
      'popoverPosition',
      'NeuralPopoverPosition',
      'component value',
      'Per-trigger placement override.',
    ],
    ['popoverOffset', 'number', 'component value', 'Per-trigger gap override.'],
    [
      'popoverViewportPadding',
      'number',
      'component value',
      'Per-trigger viewport padding.',
    ],
    [
      'popoverFocusOnOpen',
      "'none' | 'first'",
      'component value',
      'Per-trigger focus policy.',
    ],
    ['popoverDisabled', 'boolean', 'false', 'Disables disclosure behavior.'],
  ] as const;
  readonly outputs = [
    ['openChange', 'boolean', 'Generated by the open model.'],
    [
      'opened',
      'NeuralPopoverOpenEvent',
      'Active trigger and requested position.',
    ],
    [
      'closed',
      'NeuralPopoverCloseEvent',
      'Exact reason, trigger and original event.',
    ],
  ] as const;
  readonly methods = [
    ['showFor(trigger, options?)', 'void', 'Opens for a specific HTMLElement.'],
    [
      'toggleFor(trigger, options?, event?)',
      'void',
      'Toggles for a specific trigger.',
    ],
    [
      'hide(reason?, restoreFocus?, event?)',
      'void',
      'Closes with deterministic metadata.',
    ],
    [
      'isTriggerOpen(trigger)',
      'boolean',
      'Checks whether a trigger owns the open panel.',
    ],
  ] as const;
  readonly publicTypes = [
    [
      'NeuralPopoverPosition',
      "'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right'",
    ],
    [
      'NeuralPopoverCloseReason',
      "'trigger' | 'outside' | 'escape' | 'close-directive' | 'api' | 'native'",
    ],
    ['NeuralPopoverClasses', '{ root?, content?, arrow? }'],
    [
      'NeuralPopoverShowOptions',
      '{ position?, offset?, viewportPadding?, focusOnOpen? }',
    ],
  ] as const;
  readonly sizingTokens = [
    '--neural-popover-width',
    '--neural-popover-min-width',
    '--neural-popover-max-width',
    '--neural-popover-max-height',
    '--neural-popover-padding',
  ];
  readonly surfaceTokens = [
    '--neural-popover-color',
    '--neural-popover-background',
    '--neural-popover-border',
    '--neural-popover-radius',
    '--neural-popover-shadow',
    '--neural-popover-font-family',
  ];
  readonly arrowTokens = [
    '--neural-popover-arrow-size',
    '--neural-popover-arrow-background',
    '--neural-popover-arrow-border',
    '--neural-popover-arrow-offset',
  ];
  readonly motionTokens = [
    '--neural-popover-enter-duration',
    '--neural-popover-leave-duration',
    '--neural-popover-enter-distance',
    '--neural-popover-enter-scale',
    '--neural-popover-easing',
  ];

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  handleOpened(event: NeuralPopoverOpenEvent): void {
    this.activePosition.set(event.position);
    this.lastEvent.set(`Opened at ${event.position}.`);
  }
  handleClosed(event: NeuralPopoverCloseEvent): void {
    this.lastEvent.set(`Closed by ${event.reason}.`);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/popover${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): PopoverDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is PopoverDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
