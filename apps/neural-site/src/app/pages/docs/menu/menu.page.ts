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
  NeuralMenu,
  NeuralMenuGroup,
  NeuralMenuItem,
  NeuralMenuSeparatorItem,
  NeuralMenuTrigger,
  type NeuralMenuClasses,
  type NeuralMenuEntry,
  type NeuralMenuSelect,
} from '@neural-ng/core/menu';
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

type MenuDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-menu-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralMenu,
    NeuralMenuGroup,
    NeuralMenuItem,
    NeuralMenuSeparatorItem,
    NeuralMenuTrigger,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './menu.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly popupOpen = signal(false);
  readonly persistentOpen = signal(false);
  readonly lastSelection = signal('No command selected.');
  readonly selectedView = signal<MenuDocView>(resolveView(this.router.url));
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
  readonly pageLinks: Record<
    MenuDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Inline menu', 'inline'],
      ['Category groups', 'groups'],
      ['Popup menu', 'popup'],
      ['Logical positions', 'positions'],
      ['Projected items', 'projected'],
      ['State and dismissal', 'state'],
      ['Links and metadata', 'metadata'],
      ['Unstyled', 'unstyled'],
      ['Component boundary', 'boundary'],
    ],
    accessibility: [
      ['Semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Trigger and focus', 'trigger-focus'],
      ['Direction and motion', 'direction-motion'],
    ],
    api: [
      ['Menu inputs', 'inputs'],
      ['Item inputs', 'item-inputs'],
      ['Group inputs', 'group-api'],
      ['Trigger API', 'trigger-api'],
      ['Events', 'events'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Data contract', 'data-contract'],
    ],
    tokens: [['Component tokens', 'design-tokens']],
  };
  readonly items: readonly NeuralMenuEntry[] = [
    {
      key: 'profile',
      label: 'Profile',
      iconClass: 'nt-user',
      shortcut: 'Ctrl P',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      iconClass: 'nt-bell',
      badge: 4,
    },
    { key: 'settings', label: 'Settings', iconClass: 'nt-settings' },
    { separator: true, key: 'main-separator' },
    {
      key: 'documentation',
      label: 'Documentation',
      iconClass: 'nt-download',
      routerLink: '/docs/installation',
    },
    {
      key: 'locked',
      label: 'Locked action',
      iconClass: 'nt-lock',
      disabled: true,
    },
  ];
  readonly groupedItems: readonly NeuralMenuEntry[] = [
    {
      key: 'projects',
      label: 'Projects',
      items: [
        { key: 'overview', label: 'Overview', iconClass: 'nt-folders' },
        { key: 'activity', label: 'Activity', iconClass: 'nt-activity' },
      ],
    },
    {
      key: 'workspace',
      label: 'Workspace',
      items: [
        { key: 'members', label: 'Members', iconClass: 'nt-user' },
        { key: 'settings', label: 'Settings', iconClass: 'nt-settings' },
      ],
    },
  ];
  readonly headlessClasses: NeuralMenuClasses = {
    root: 'w-64 rounded-2xl border border-fuchsia-400/35 bg-slate-950 p-2 text-slate-100 shadow-2xl',
    list: 'grid gap-1',
    group: 'grid gap-1',
    groupLabel:
      'px-3 pb-1 pt-3 text-[0.65rem] font-black uppercase tracking-[0.14em] text-fuchsia-300/70',
    groupList: 'grid gap-1',
    item: 'flex min-h-10 w-full items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2 text-left text-sm font-bold text-inherit transition hover:bg-fuchsia-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300',
    disabledItem: 'cursor-not-allowed opacity-40',
    icon: 'text-fuchsia-300',
    label: 'min-w-0 truncate',
    meta: 'ml-auto flex items-center gap-2 text-xs text-slate-400',
    badge: 'rounded-full bg-fuchsia-300 px-2 py-0.5 font-black text-slate-950',
    shortcut: 'font-mono text-[0.65rem]',
    separator: 'my-1 h-px bg-fuchsia-400/25',
  };
  readonly importCode = `import { NeuralMenu, NeuralMenuGroup, NeuralMenuItem, NeuralMenuSeparatorItem, NeuralMenuTrigger, type NeuralMenuEntry } from '@neural-ng/core/menu';\n\n@Component({ imports: [NeuralMenu, NeuralMenuGroup, NeuralMenuTrigger] })`;
  readonly inlineCode = `<neural-menu menuId="workspace-actions" ariaLabel="Workspace actions" [items]="items" (itemSelect)="run($event)" />`;
  readonly groupsCode = `const items: readonly NeuralMenuEntry[] = [\n  {\n    key: 'projects',\n    label: 'Projects',\n    items: [\n      { key: 'overview', label: 'Overview', routerLink: '/projects' },\n      { key: 'activity', label: 'Activity', routerLink: '/projects/activity' },\n    ],\n  },\n];`;
  readonly popupCode = `<neural-button label="Account actions" icon="nt-user" [neuralMenuTriggerFor]="accountMenu" menuPosition="bottom-start" />\n\n<neural-menu #accountMenu="neuralMenu" popup [items]="items" [(open)]="menuOpen" (itemSelect)="run($event)" />`;
  readonly projectedCode = `<neural-menu ariaLabel="Developer actions">\n  <neural-menu-group key="project" label="Project">\n    <neural-menu-item key="inspect" label="Inspect" iconClass="nt-eye" />\n    <neural-menu-item key="copy" label="Copy" iconClass="nt-copy" />\n  </neural-menu-group>\n  <neural-menu-separator />\n  <neural-menu-item key="delete" label="Delete" disabled />\n</neural-menu>`;
  readonly stateCode = `<neural-menu #persistent="neuralMenu" popup [closeOnSelect]="false" [(open)]="open" [items]="items" />\n\n<neural-menu disabled [items]="items" />`;
  readonly metadataCode = `const items: readonly NeuralMenuEntry[] = [\n  { key: 'profile', label: 'Profile', iconClass: 'nt-user', shortcut: 'Ctrl P' },\n  { key: 'notifications', label: 'Notifications', badge: 4 },\n  { separator: true, key: 'main-separator' },\n  {\n    key: 'docs',\n    label: 'Documentation',\n    routerLink: ['/docs', 'installation'],\n    queryParams: { source: 'menu' },\n  },\n  { key: 'help', label: 'External help', href: 'https://example.com/help', target: '_blank', rel: 'noopener' },\n];`;
  readonly unstyledCode = `<neural-menu unstyled [items]="items" [classes]="menuClasses" ariaLabel="Headless commands" />`;
  readonly menuInputs = [
    [
      'items',
      'readonly NeuralMenuEntry[]',
      '[]',
      'Data-driven actions, separators, and category groups.',
    ],
    [
      'popup',
      'boolean',
      'false',
      'Uses the native Popover top layer and trigger API.',
    ],
    [
      'open',
      'model<boolean>',
      'false',
      'Controlled visibility and openChange output.',
    ],
    ['disabled', 'boolean', 'false', 'Disables opening and item activation.'],
    [
      'closeOnSelect',
      'boolean',
      'true',
      'Closes a popup after an enabled action.',
    ],
    ['menuId', 'string', 'generated', 'Stable aria-controls identity.'],
    ['ariaLabel', 'string | null', 'null', 'Accessible name fallback.'],
    [
      'ariaLabelledby',
      'string | null',
      'null',
      'External accessible label reference.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['menuClass', 'string', `''`, 'Consumer root class.'],
    ['classes', 'NeuralMenuClasses', '{}', 'Typed visual slots.'],
  ] as const;
  readonly itemInputs = [
    [
      'item',
      'NeuralMenuAction | null',
      'null',
      'Complete delegated action object.',
    ],
    ['key', 'string', `''`, 'Stable unique action key.'],
    ['label', 'string', `''`, 'Visible label and typeahead source.'],
    ['iconClass', 'string', `''`, 'Neural Icon or consumer classes.'],
    [
      'badge',
      'string | number | undefined',
      'undefined',
      'Trailing status value.',
    ],
    ['shortcut', 'string', `''`, 'Shortcut hint.'],
    ['disabled', 'boolean', 'false', 'Visible but inert action.'],
    ['href', 'string', `''`, 'Enabled native anchor action.'],
    [
      'routerLink',
      'NeuralMenuRouterLink | null',
      'null',
      'Angular SPA destination; takes precedence over href.',
    ],
    [
      'queryParams / fragment',
      'Params | string',
      'null',
      'Router query and fragment state.',
    ],
    [
      'queryParamsHandling / preserveFragment',
      'QueryParamsHandling | boolean',
      'null / false',
      'Angular Router URL composition options.',
    ],
    [
      'skipLocationChange / replaceUrl',
      'boolean',
      'false',
      'Angular Router history behavior.',
    ],
    ['state', 'Record<string, unknown>', 'undefined', 'Router history state.'],
    ['target / rel', 'string', `''`, 'Native link attributes.'],
    ['itemClass', 'string', `''`, 'Per-action consumer class.'],
  ] as const;
  readonly triggerInputs = [
    [
      'neuralMenuTriggerFor',
      'NeuralMenu',
      'required',
      'Popup instance controlled by the trigger.',
    ],
    [
      'menuPosition',
      'NeuralMenuPosition',
      `'bottom-start'`,
      'Logical placement with flip and clamping.',
    ],
  ] as const;
  readonly groupInputs = [
    [
      'group',
      'NeuralMenuGroupEntry | null',
      'null',
      'Complete delegated group object.',
    ],
    ['key', 'string', `''`, 'Stable group identity and ARIA label ID source.'],
    ['label', 'string', `''`, 'Visible non-interactive category heading.'],
    ['groupClass', 'string', `''`, 'Per-group root consumer class.'],
    ['labelClass', 'string', `''`, 'Per-group heading consumer class.'],
    ['listClass', 'string', `''`, 'Per-group action list consumer class.'],
  ] as const;
  readonly events = [
    ['openChange', 'boolean', 'Controlled visibility changed.'],
    [
      'itemSelect',
      'NeuralMenuSelect',
      'Enabled action selected by pointer or keyboard.',
    ],
  ] as const;
  readonly methods = [
    [
      'showFor(trigger, position?, focus?)',
      'Opens, positions and focuses the popup.',
    ],
    ['toggleFor(trigger, position?)', 'Toggles a popup for a trigger.'],
    ['hide(restoreFocus?)', 'Closes and optionally restores focus.'],
    ['isTriggerOpen(trigger)', 'Reports trigger ownership.'],
  ] as const;
  readonly classSlots = [
    'root',
    'list',
    'group',
    'groupLabel',
    'groupList',
    'item',
    'disabledItem',
    'icon',
    'label',
    'meta',
    'badge',
    'shortcut',
    'separator',
  ] as const;
  readonly tokens = [
    '--neural-menu-width',
    '--neural-menu-max-width',
    '--neural-menu-max-height',
    '--neural-menu-padding',
    '--neural-menu-color',
    '--neural-menu-background',
    '--neural-menu-border',
    '--neural-menu-radius',
    '--neural-menu-shadow',
    '--neural-menu-font-family',
    '--neural-menu-z-index',
    '--neural-menu-list-gap',
    '--neural-menu-group-gap',
    '--neural-menu-group-label-padding',
    '--neural-menu-group-label-color',
    '--neural-menu-group-label-font-size',
    '--neural-menu-group-label-font-weight',
    '--neural-menu-group-label-letter-spacing',
    '--neural-menu-group-label-transform',
    '--neural-menu-group-list-gap',
    '--neural-menu-item-gap',
    '--neural-menu-item-min-height',
    '--neural-menu-item-padding',
    '--neural-menu-item-color',
    '--neural-menu-item-background',
    '--neural-menu-item-color-active',
    '--neural-menu-item-background-active',
    '--neural-menu-item-radius',
    '--neural-menu-item-font-size',
    '--neural-menu-item-font-weight',
    '--neural-menu-item-line-height',
    '--neural-menu-item-transition',
    '--neural-menu-focus-ring',
    '--neural-menu-focus-ring-offset',
    '--neural-menu-disabled-opacity',
    '--neural-menu-icon-color',
    '--neural-menu-icon-size',
    '--neural-menu-meta-gap',
    '--neural-menu-meta-color',
    '--neural-menu-badge-min-width',
    '--neural-menu-badge-padding',
    '--neural-menu-badge-color',
    '--neural-menu-badge-background',
    '--neural-menu-badge-radius',
    '--neural-menu-badge-font-size',
    '--neural-menu-shortcut-color',
    '--neural-menu-shortcut-font-size',
    '--neural-menu-separator-margin',
    '--neural-menu-separator-color',
    '--neural-menu-enter-duration',
    '--neural-menu-leave-duration',
    '--neural-menu-enter-distance',
    '--neural-menu-enter-scale',
    '--neural-menu-easing',
  ] as const;
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  select(event: NeuralMenuSelect): void {
    this.lastSelection.set(`${event.item.label} selected by ${event.source}.`);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/menu${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): MenuDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is MenuDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
