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
import { NeuralMenu, type NeuralMenuEntry } from '@neural-ng/core/menu';
import {
  NeuralPanelMenu,
  type NeuralPanelMenuEntry,
} from '@neural-ng/core/panel-menu';
import {
  NeuralSidebar,
  NeuralSidebarContent,
  NeuralSidebarFooter,
  NeuralSidebarHeader,
  NeuralSidebarInitialFocus,
  NeuralSidebarLabel,
  NeuralSidebarLayout,
  NeuralSidebarMain,
  NeuralSidebarTrigger,
  type NeuralSidebarClasses,
} from '@neural-ng/core/sidebar';
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

type SidebarDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-sidebar-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralMenu,
    NeuralPanelMenu,
    NeuralSidebar,
    NeuralSidebarContent,
    NeuralSidebarFooter,
    NeuralSidebarHeader,
    NeuralSidebarInitialFocus,
    NeuralSidebarLabel,
    NeuralSidebarLayout,
    NeuralSidebarMain,
    NeuralSidebarTrigger,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './sidebar.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly shellOpen = signal(true);
  readonly hoverShellOpen = signal(false);
  readonly overlayOpen = signal(false);
  readonly lastState = signal('Desktop sidebar expanded.');
  readonly selectedView = signal<SidebarDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly navigation: readonly NeuralPanelMenuEntry[] = [
    {
      key: 'workspace',
      label: 'Workspace',
      iconClass: 'nt nt-layout-grid',
      items: [
        { key: 'overview', label: 'Overview', iconClass: 'nt nt-home' },
        { key: 'agents', label: 'Agents', iconClass: 'nt nt-ai-agent' },
      ],
    },
    {
      key: 'projects',
      label: 'Projects',
      iconClass: 'nt nt-folders',
      items: [
        {
          key: 'neural',
          label: 'NeuralNg',
          badge: 8,
          items: [
            { key: 'releases', label: 'Releases' },
            { key: 'issues', label: 'Issues', badge: 3 },
          ],
        },
        { key: 'website', label: 'Website' },
      ],
    },
  ];
  readonly quickNavigation: readonly NeuralMenuEntry[] = [
    {
      key: 'overview',
      label: 'Overview',
      iconClass: 'nt nt-home',
    },
    {
      key: 'activity',
      label: 'Activity',
      iconClass: 'nt nt-activity',
      badge: 4,
    },
    { separator: true },
    {
      key: 'account',
      label: 'Account',
      iconClass: 'nt nt-user',
    },
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
  readonly headlessClasses: NeuralSidebarClasses = {
    root: 'min-h-72 overflow-hidden rounded-3xl bg-slate-950 text-slate-100',
    panel:
      'border-r border-cyan-300/20 bg-slate-900/95 shadow-2xl backdrop-blur-2xl',
    header: 'border-b border-white/10 p-4 font-black text-cyan-300',
    content: 'min-h-0 overflow-auto p-3',
    footer: 'border-t border-white/10 p-4 text-xs text-slate-400',
    backdrop: 'bg-slate-950/55 backdrop-blur-sm',
  };
  readonly pageLinks: Record<
    SidebarDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Application shell', 'application-shell'],
      ['Hover rail', 'hover-rail'],
      ['Variants', 'variants'],
      ['Responsive offcanvas', 'responsive'],
      ['Composition', 'composition'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Landmark', 'landmark'],
      ['Trigger contract', 'trigger-contract'],
      ['Focus and dismissal', 'focus-dismissal'],
      ['RTL and responsive', 'rtl-responsive'],
      ['Reduced motion', 'reduced-motion'],
    ],
    api: [
      ['Components', 'components'],
      ['Inputs', 'inputs'],
      ['Models and events', 'models-events'],
      ['Class slots', 'class-slots'],
      ['Public types', 'public-types'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import { NeuralMenu } from '@neural-ng/core/menu';

import {
  NeuralSidebar,
  NeuralSidebarLayout,
  NeuralSidebarHeader,
  NeuralSidebarContent,
  NeuralSidebarFooter,
  NeuralSidebarLabel,
  NeuralSidebarInitialFocus,
  NeuralSidebarMain,
  NeuralSidebarTrigger,
} from '@neural-ng/core/sidebar';`;
  readonly menuCompositionCode = `<neural-sidebar-content>
  <neural-menu ariaLabel="Quick navigation" [items]="items" />
</neural-sidebar-content>`;
  readonly shellCode = `<neural-sidebar-layout>
  <neural-sidebar
    id="workspace-nav"
    [(open)]="open"
    variant="inset"
    openOnHover
    [hoverOpenDelay]="100"
    [hoverCloseDelay]="180"
  >
    <neural-sidebar-header>
      <span neuralSidebarLabel>Neural workspace</span>
    </neural-sidebar-header>
    <neural-sidebar-content>
      <neural-panel-menu ariaLabel="Workspace" [items]="items" />
    </neural-sidebar-content>
    <neural-sidebar-footer>
      <span neuralSidebarLabel>Signed in as Ada</span>
    </neural-sidebar-footer>
  </neural-sidebar>

  <main neuralSidebarMain>
    <button [neuralSidebarTrigger]="'workspace-nav'">Toggle</button>
  </main>
</neural-sidebar-layout>`;
  readonly hoverCode = `<neural-sidebar
  [(open)]="open"
  collapseMode="icon"
  openOnHover
  [hoverOpenDelay]="100"
  [hoverCloseDelay]="180"
  (hoverChange)="trackHover($event)"
>
  <neural-sidebar-content>
    <neural-panel-menu [items]="items" />
  </neural-sidebar-content>
</neural-sidebar>`;
  readonly variantsCode = `<neural-sidebar variant="sidebar" />
<neural-sidebar variant="floating" />
<neural-sidebar variant="inset" />`;
  readonly responsiveCode = `<neural-sidebar
  id="mobile-nav"
  [(open)]="open"
  breakpoint="64rem"
  collapseMode="icon"
  mobileMode="offcanvas"
  [modal]="true"
  [dismissibleBackdrop]="true"
/>
<button [neuralSidebarTrigger]="'mobile-nav'">Navigation</button>`;
  readonly unstyledCode = `<neural-sidebar-layout unstyled [classes]="sidebarClasses">
  <neural-sidebar unstyled [classes]="sidebarClasses">...</neural-sidebar>
  <main neuralSidebarMain neuralSidebarMainUnstyled>...</main>
</neural-sidebar-layout>`;
  readonly components = [
    [
      'NeuralSidebarLayout',
      'neural-sidebar-layout',
      'Flex application shell and overlay containing block.',
    ],
    [
      'NeuralSidebar',
      'neural-sidebar',
      'Responsive navigation landmark and state owner.',
    ],
    [
      'NeuralSidebarHeader',
      'neural-sidebar-header',
      'Branding and shell-level actions.',
    ],
    [
      'NeuralSidebarContent',
      'neural-sidebar-content',
      'Independent scrolling navigation region.',
    ],
    [
      'NeuralSidebarFooter',
      'neural-sidebar-footer',
      'Account and secondary actions.',
    ],
    [
      'NeuralSidebarMain',
      '[neuralSidebarMain]',
      'Flexible application content directive.',
    ],
    [
      'NeuralSidebarTrigger',
      '[neuralSidebarTrigger]',
      'External accessible toggle directive.',
    ],
    [
      'NeuralSidebarLabel',
      '[neuralSidebarLabel]',
      'Label hook hidden cleanly when the Sidebar becomes an icon rail.',
    ],
    [
      'NeuralSidebarInitialFocus',
      '[neuralSidebarInitialFocus]',
      'Preferred focus target when a modal offcanvas Sidebar opens.',
    ],
  ] as const;
  readonly inputs = [
    [
      'id',
      'string',
      'generated',
      'Stable target id used by external triggers.',
    ],
    [
      'open',
      'model<boolean>',
      'true',
      'Expanded, collapsed or offcanvas visibility state.',
    ],
    [
      'side',
      "'start' | 'end'",
      "'start'",
      'Logical placement that mirrors in RTL.',
    ],
    [
      'variant',
      "'sidebar' | 'floating' | 'inset'",
      "'sidebar'",
      'Visual relationship with application content.',
    ],
    [
      'collapseMode',
      "'none' | 'icon' | 'offcanvas'",
      "'icon'",
      'Desktop collapse behavior.',
    ],
    [
      'iconMenu',
      "'flyout' | 'hidden'",
      "'flyout'",
      'Presents top-level child menus beside a collapsed icon rail or hides them.',
    ],
    [
      'openOnHover',
      'boolean',
      'false',
      'Temporarily expands a collapsed desktop icon rail without mutating the controlled open model.',
    ],
    [
      'hoverOpenDelay',
      'number',
      '100',
      'Delay in milliseconds before pointer hover expands the icon rail.',
    ],
    [
      'hoverCloseDelay',
      'number',
      '180',
      'Delay in milliseconds before an unfocused hovered rail collapses.',
    ],
    ['responsive', 'boolean', 'true', 'Enables media-query mode switching.'],
    [
      'breakpoint',
      'string',
      "'64rem'",
      'Maximum width used by the mobile media query.',
    ],
    [
      'mobileMode',
      "'none' | 'icon' | 'offcanvas'",
      "'offcanvas'",
      'Collapse behavior below the breakpoint.',
    ],
    [
      'overlay',
      'boolean',
      'false',
      'Forces overlay/backdrop behavior in any mode.',
    ],
    [
      'showBackdrop',
      'boolean',
      'true',
      'Controls visual backdrop rendering independently from overlay positioning and modal focus behavior.',
    ],
    [
      'modal',
      'boolean',
      'true',
      'Contains Tab focus while an overlay is open.',
    ],
    [
      'dismissibleBackdrop',
      'boolean',
      'true',
      'Allows backdrop pointer dismissal.',
    ],
    [
      'closeOnEscape',
      'boolean',
      'true',
      'Allows Escape dismissal in overlay mode.',
    ],
    [
      'closeOnMobile',
      'boolean',
      'true',
      'Closes an expanded shell when it enters the mobile breakpoint.',
    ],
    [
      'closeOnNavigation',
      'boolean',
      'true',
      'Closes an open offcanvas Sidebar after Angular navigation completes.',
    ],
    [
      'blockScroll',
      'boolean',
      'true',
      'Locks document scrolling while a modal overlay Sidebar is open.',
    ],
    ['width', 'string', "'16rem'", 'Expanded panel inline size.'],
    ['iconWidth', 'string', "'3.5rem'", 'Collapsed icon-rail inline size.'],
    [
      'ariaLabel',
      'string | null',
      "'Application navigation'",
      'Accessible navigation landmark name.',
    ],
    ['ariaLabelledby', 'string | null', 'null', 'Visible label reference.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['sidebarClass', 'string', "''", 'Additive panel classes.'],
    [
      'classes',
      'NeuralSidebarClasses',
      '{}',
      'Typed layout and section class slots.',
    ],
  ] as const;
  readonly classSlots = [
    ['root', 'Application shell layout root.'],
    ['backdrop', 'Modal offcanvas backdrop.'],
    ['panel', 'Sidebar navigation panel.'],
    ['header', 'Header section.'],
    ['content', 'Scrollable content section.'],
    ['footer', 'Footer section.'],
  ] as const;
  readonly tokens = [
    '--neural-sidebar-layout-min-height',
    '--neural-sidebar-layout-background',
    '--neural-sidebar-main-background',
    '--neural-sidebar-color',
    '--neural-sidebar-background',
    '--neural-sidebar-border',
    '--neural-sidebar-radius',
    '--neural-sidebar-shadow',
    '--neural-sidebar-backdrop',
    '--neural-sidebar-backdrop-filter',
    '--neural-sidebar-header-padding',
    '--neural-sidebar-content-padding',
    '--neural-sidebar-footer-padding',
    '--neural-sidebar-floating-margin',
    '--neural-sidebar-inset-margin',
    '--neural-sidebar-duration',
    '--neural-sidebar-easing',
    '--neural-sidebar-rail-item-width',
    '--neural-sidebar-rail-label-offset',
    '--neural-sidebar-rail-label-padding',
    '--neural-sidebar-rail-label-color',
    '--neural-sidebar-rail-label-background',
    '--neural-sidebar-rail-label-border',
    '--neural-sidebar-rail-label-radius',
    '--neural-sidebar-rail-label-shadow',
    '--neural-sidebar-rail-label-font-size',
    '--neural-sidebar-rail-label-duration',
    '--neural-sidebar-rail-label-z-index',
    '--neural-sidebar-flyout-width',
    '--neural-sidebar-flyout-max-height',
    '--neural-sidebar-flyout-offset',
    '--neural-sidebar-nested-flyout-offset',
    '--neural-sidebar-nested-flyout-width',
    '--neural-sidebar-flyout-padding',
    '--neural-sidebar-flyout-color',
    '--neural-sidebar-flyout-background',
    '--neural-sidebar-flyout-border',
    '--neural-sidebar-flyout-radius',
    '--neural-sidebar-flyout-shadow',
    '--neural-sidebar-flyout-duration',
    '--neural-sidebar-flyout-z-index',
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
      `/docs/components/sidebar${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): SidebarDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is SidebarDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
