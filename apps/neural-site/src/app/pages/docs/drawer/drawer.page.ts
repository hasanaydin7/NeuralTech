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
  NeuralDrawer,
  NeuralDrawerBody,
  NeuralDrawerFooter,
  NeuralDrawerHeader,
  NeuralDrawerInitialFocus,
  type NeuralDrawerClasses,
  type NeuralDrawerClose,
} from '@neural-ng/core/drawer';
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

type DrawerDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-drawer-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralDrawer,
    NeuralDrawerBody,
    NeuralDrawerFooter,
    NeuralDrawerHeader,
    NeuralDrawerInitialFocus,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './drawer.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly selectedView = signal<DrawerDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly controlledOpen = signal(false);
  readonly nonModalOpen = signal(false);
  readonly lastClose = signal('No drawer closed yet.');
  readonly lifecycle = signal('Closed');
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralDrawerClasses = {
    root: 'w-[min(25rem,100vw)] border-0 bg-slate-950 text-cyan-50 shadow-[-24px_0_80px_rgba(2,8,23,.65)] backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm',
    header:
      'items-center justify-between border-b border-cyan-300/15 px-6 py-5',
    body: 'px-6 py-5 leading-7 text-cyan-50/75',
    footer:
      'items-center justify-end gap-3 border-t border-cyan-300/15 px-6 py-4',
    closeButton:
      'absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full text-cyan-200 transition hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-cyan-300',
    closeIcon: 'nt nt-x',
  };
  readonly pageLinks: Record<
    DrawerDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic composition', 'basic'],
      ['Logical positions', 'positions'],
      ['Controlled state', 'controlled'],
      ['Non-modal', 'non-modal'],
      ['Dismiss policy', 'dismiss-policy'],
      ['Lifecycle', 'lifecycle'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native semantics', 'native-semantics'],
      ['Accessible name', 'accessible-name'],
      ['Focus lifecycle', 'focus-lifecycle'],
      ['Keyboard', 'keyboard'],
      ['RTL positions', 'rtl'],
      ['SSR and hydration', 'ssr'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Sections', 'sections'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
      ['Deprecated aliases', 'deprecated-aliases'],
    ],
    tokens: [
      ['Surface', 'surface-tokens'],
      ['Layout', 'layout-tokens'],
      ['Sections', 'section-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralDrawer,
  NeuralDrawerHeader,
  NeuralDrawerBody,
  NeuralDrawerFooter,
  NeuralDrawerInitialFocus,
} from '@neural-ng/core/drawer';

@Component({ imports: [
  NeuralDrawer, NeuralDrawerHeader, NeuralDrawerBody,
  NeuralDrawerFooter, NeuralDrawerInitialFocus,
] })`;
  readonly basicCode = `<neural-button label="Open settings" (clicked)="drawer.show()" />

<neural-drawer #drawer ariaLabelledby="settings-title">
  <neural-drawer-header><h2 id="settings-title">Settings</h2></neural-drawer-header>
  <neural-drawer-body>
    <button neuralDrawerInitialFocus>Profile</button>
  </neural-drawer-body>
  <neural-drawer-footer>Actions</neural-drawer-footer>
</neural-drawer>`;
  readonly positionsCode = `<neural-drawer position="start" />
<neural-drawer position="end" />
<neural-drawer position="top" />
<neural-drawer position="bottom" />`;
  readonly controlledCode = `<neural-button (clicked)="open.set(true)" label="Open controlled" />
<neural-drawer [(open)]="open" ariaLabel="Controlled drawer">...</neural-drawer>`;
  readonly nonModalCode = `<neural-drawer #details [modal]="false" ariaLabel="Task details">
  <neural-drawer-body>...</neural-drawer-body>
  <neural-drawer-footer>
    <neural-button label="Close panel" (clicked)="details.close()" />
  </neural-drawer-footer>
</neural-drawer>`;
  readonly policyCode = `<neural-drawer
  [closeOnEscape]="false"
  [dismissibleBackdrop]="false"
  ariaLabelledby="required-title"
>...</neural-drawer>`;
  readonly lifecycleCode = `<neural-drawer
  (opened)="status.set('Opened')"
  (closed)="handleClose($event)"
/>`;
  readonly unstyledCode = `<neural-drawer unstyled [classes]="classes">
  <neural-drawer-header>Consumer header</neural-drawer-header>
  <neural-drawer-body>Consumer body</neural-drawer-body>
  <neural-drawer-footer>Consumer footer</neural-drawer-footer>
</neural-drawer>`;

  readonly inputs = [
    ['open', 'ModelSignal<boolean>', 'false', 'Controlled visible state.'],
    [
      'position',
      "'start' | 'end' | 'top' | 'bottom'",
      "'end'",
      'Logical viewport edge.',
    ],
    [
      'modal',
      'boolean',
      'true',
      'Uses native dialog top layer when true and non-modal Popover top layer when false.',
    ],
    ['closable', 'boolean', 'true', 'Renders localized close action.'],
    ['closeOnEscape', 'boolean', 'true', 'Allows Escape dismissal.'],
    [
      'dismissibleBackdrop',
      'boolean',
      'true',
      'Allows modal backdrop dismissal.',
    ],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    ['ariaLabelledby', 'string | null', 'null', 'Visible heading ID.'],
    ['ariaDescribedby', 'string | null', 'null', 'Description ID.'],
    ['closeLabel', 'string | null', 'locale', 'Close action label override.'],
    ['closeIcon', 'string', "'nt-x'", 'Neural Icons glyph suffix.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['drawerClass', 'string', "''", 'Additive native dialog class.'],
    ['classes', 'NeuralDrawerClasses', '{}', 'Typed additive class slots.'],
  ] as const;
  readonly outputs = [
    ['openChange', 'boolean', 'Generated by the open model.'],
    ['opened', 'void', 'Native drawer entered the top layer.'],
    ['closed', 'NeuralDrawerClose', 'Completed close with exact reason.'],
  ] as const;
  readonly methods = [
    ['show()', 'void', 'Opens the drawer.'],
    ['toggle()', 'void', 'Toggles controlled state.'],
    [
      "close(reason = 'api', returnValue = '', event?)",
      'void',
      'Closes with deterministic metadata.',
    ],
  ] as const;
  readonly sections = [
    ['neural-drawer-header', 'NeuralDrawerHeader', 'headerClass'],
    ['neural-drawer-body', 'NeuralDrawerBody', 'bodyClass'],
    ['neural-drawer-footer', 'NeuralDrawerFooter', 'footerClass'],
    [
      'neuralDrawerInitialFocus',
      'NeuralDrawerInitialFocus',
      'Initial focus marker',
    ],
  ] as const;
  readonly classSlots = [
    ['root', 'Native dialog panel.'],
    ['header', 'Projected header section.'],
    ['body', 'Independently scrollable body.'],
    ['footer', 'Action section.'],
    ['closeButton', 'Localized close action.'],
    ['closeIcon', 'Close Neural Icon.'],
  ] as const;
  readonly publicTypes = [
    ['NeuralDrawerPosition', "'start' | 'end' | 'top' | 'bottom'"],
    [
      'NeuralDrawerCloseReason',
      "'api' | 'escape' | 'backdrop' | 'close-button' | 'native'",
    ],
    ['NeuralDrawerClose', '{ reason, returnValue, nativeEvent? }'],
    [
      'NeuralDrawerClasses',
      '{ root?, header?, body?, footer?, closeButton?, closeIcon? }',
    ],
  ] as const;
  readonly surfaceTokens = [
    '--neural-drawer-color',
    '--neural-drawer-background',
    '--neural-drawer-shadow',
    '--neural-drawer-backdrop',
    '--neural-drawer-backdrop-filter',
  ] as const;
  readonly layoutTokens = [
    '--neural-drawer-size',
    '--neural-drawer-close-inset',
  ] as const;
  readonly sectionTokens = [
    '--neural-drawer-header-padding',
    '--neural-drawer-header-border',
    '--neural-drawer-body-padding',
    '--neural-drawer-footer-padding',
    '--neural-drawer-footer-border',
  ] as const;
  readonly motionTokens = [
    '--neural-drawer-duration',
    '--neural-drawer-leave-duration',
    '--neural-drawer-easing',
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

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/drawer${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }

  recordClose(event: NeuralDrawerClose): void {
    this.lastClose.set(
      `${event.reason}${event.returnValue ? ` · ${event.returnValue}` : ''}`,
    );
    this.lifecycle.set(`Closed · ${event.reason}`);
  }
}

function resolveView(url: string): DrawerDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is DrawerDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
