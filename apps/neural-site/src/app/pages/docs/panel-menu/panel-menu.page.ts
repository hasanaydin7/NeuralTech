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
  NeuralPanelMenu,
  NeuralPanelMenuItem,
  NeuralPanelMenuSeparator,
  type NeuralPanelMenuClasses,
  type NeuralPanelMenuEntry,
  type NeuralPanelMenuSelect,
  type NeuralPanelMenuToggle,
} from '@neural-ng/core/panel-menu';
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

type PanelMenuDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-panel-menu-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralPanelMenu,
    NeuralPanelMenuItem,
    NeuralPanelMenuSeparator,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './panel-menu.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelMenuPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<PanelMenuDocView>(
    resolveView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly expandedKeys = signal<readonly string[]>(['workspace']);
  readonly multipleKeys = signal<readonly string[]>(['workspace', 'cloud']);
  readonly projectedKeys = signal<readonly string[]>(['account']);
  readonly headlessKeys = signal<readonly string[]>(['runtime']);
  readonly lastEvent = signal('No interaction yet.');

  readonly items: readonly NeuralPanelMenuEntry[] = [
    {
      key: 'workspace',
      label: 'Workspace',
      iconClass: 'nt nt-folders',
      badge: 3,
      items: [
        {
          key: 'documents',
          label: 'Documents',
          iconClass: 'nt nt-file-text',
          shortcut: 'Ctrl D',
        },
        {
          key: 'media',
          label: 'Media',
          iconClass: 'nt nt-photo',
          items: [
            { key: 'images', label: 'Images', badge: 12 },
            { key: 'video', label: 'Video', disabled: true },
          ],
        },
      ],
    },
    {
      key: 'cloud',
      label: 'Cloud',
      iconClass: 'nt nt-cloud',
      items: [
        {
          key: 'deployments',
          label: 'Deployments',
          iconClass: 'nt nt-package-off',
        },
        {
          key: 'activity',
          label: 'Activity',
          iconClass: 'nt nt-activity',
          shortcut: 'Ctrl A',
        },
      ],
    },
    { separator: true },
    {
      key: 'settings',
      label: 'Settings',
      iconClass: 'nt nt-settings',
      items: [
        { key: 'profile', label: 'Profile', iconClass: 'nt nt-user' },
        { key: 'security', label: 'Security', iconClass: 'nt nt-shield' },
      ],
    },
  ];
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px]',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralPanelMenuClasses = {
    root: 'w-full max-w-sm rounded-2xl bg-slate-950 p-3 text-slate-100',
    list: 'flex flex-col gap-1',
    item: 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-300',
    expandedItem: 'bg-cyan-400/10 text-cyan-300',
    disabledItem: 'opacity-40',
    icon: 'text-cyan-300',
    label: 'truncate',
    meta: 'ml-auto flex items-center gap-2 text-xs text-slate-400',
    badge: 'rounded-full bg-cyan-300 px-2 py-0.5 text-slate-950',
    indicator: 'size-2 rotate-45 border-b-2 border-r-2 border-current',
    group: 'grid transition-[grid-template-rows] duration-200',
    groupInner: 'overflow-hidden',
    separator: 'my-2 h-px bg-slate-800',
  };
  readonly pageLinks: Record<
    PanelMenuDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Data hierarchy', 'data'],
      ['RouterLink', 'router-link'],
      ['Multiple roots', 'multiple'],
      ['Projected items', 'projected'],
      ['States', 'states'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Tree semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Focus and motion', 'focus-motion'],
    ],
    api: [
      ['Inputs and models', 'inputs'],
      ['Events', 'events'],
      ['Entry model', 'entry-model'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly importCode = `import { NeuralPanelMenu, type NeuralPanelMenuEntry } from '@neural-ng/core/panel-menu';\n\n@Component({ imports: [NeuralPanelMenu] })`;
  readonly dataCode = `<neural-panel-menu\n  ariaLabel="Workspace navigation"\n  [items]="items"\n  [(expandedKeys)]="expandedKeys"\n  (itemSelect)="select($event)"\n  (itemToggle)="toggle($event)"\n/>`;
  readonly routerLinkCode = `readonly navigation: readonly NeuralPanelMenuEntry[] = [
  {
    key: 'installation',
    label: 'Installation',
    iconClass: 'nt nt-download',
    routerLink: ['/docs', 'installation'],
    queryParams: { source: 'panel-menu' },
  },
];

<neural-panel-menu ariaLabel="Documentation" [items]="navigation" />`;
  readonly routerItems: readonly NeuralPanelMenuEntry[] = [
    {
      key: 'installation',
      label: 'Open installation guide',
      iconClass: 'nt nt-download',
      routerLink: ['/docs', 'installation'],
      queryParams: { source: 'panel-menu' },
    },
  ];
  readonly projectedCode = `<neural-panel-menu ariaLabel="Account navigation">\n  <neural-panel-menu-item key="account" label="Account" iconClass="nt nt-user">\n    <neural-panel-menu-item key="notifications" label="Notifications" badge="4" />\n    <neural-panel-menu-separator />\n    <neural-panel-menu-item key="billing" label="Billing" disabled />\n  </neural-panel-menu-item>\n</neural-panel-menu>`;
  readonly unstyledCode = `<neural-panel-menu unstyled multiple [items]="items" [classes]="classes" [(expandedKeys)]="expandedKeys" />`;
  readonly inputs = [
    [
      'items',
      'readonly NeuralPanelMenuEntry[]',
      '[]',
      'Immutable data-driven hierarchy.',
    ],
    [
      'expandedKeys',
      'model<readonly string[]>',
      '[]',
      'Stable keys of expanded branches.',
    ],
    [
      'multiple',
      'boolean',
      'false',
      'Allows several root branches to remain expanded.',
    ],
    ['disabled', 'boolean', 'false', 'Disables the complete hierarchy.'],
    [
      'panelMenuId',
      'string',
      'generated',
      'Stable root ID used by item and group relationships.',
    ],
    ['ariaLabel', 'string | null', 'null', 'Accessible tree name.'],
    [
      'ariaLabelledby',
      'string | null',
      'null',
      'ID of an external accessible label.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['panelMenuClass', 'string', "''", 'Additive class on the tree root.'],
    [
      'classes',
      'NeuralPanelMenuClasses',
      '{}',
      'Typed additive classes for internal slots.',
    ],
  ] as const;
  readonly outputs = [
    [
      'expandedKeysChange',
      'readonly string[]',
      'Implicit model output after expansion changes.',
    ],
    [
      'itemSelect',
      'NeuralPanelMenuSelect',
      'Enabled leaf activation with pointer/keyboard source.',
    ],
    [
      'itemToggle',
      'NeuralPanelMenuToggle',
      'Branch state change with previous and next key sets.',
    ],
  ] as const;
  readonly tokens = [
    '--neural-panel-menu-width',
    '--neural-panel-menu-padding',
    '--neural-panel-menu-color',
    '--neural-panel-menu-background',
    '--neural-panel-menu-border',
    '--neural-panel-menu-radius',
    '--neural-panel-menu-shadow',
    '--neural-panel-menu-list-gap',
    '--neural-panel-menu-item-gap',
    '--neural-panel-menu-item-min-height',
    '--neural-panel-menu-item-padding-block',
    '--neural-panel-menu-item-padding-inline',
    '--neural-panel-menu-level-indent',
    '--neural-panel-menu-item-color',
    '--neural-panel-menu-item-background',
    '--neural-panel-menu-item-color-hover',
    '--neural-panel-menu-item-background-hover',
    '--neural-panel-menu-item-color-expanded',
    '--neural-panel-menu-item-background-expanded',
    '--neural-panel-menu-item-radius',
    '--neural-panel-menu-item-font-size',
    '--neural-panel-menu-item-font-weight',
    '--neural-panel-menu-item-line-height',
    '--neural-panel-menu-item-transition',
    '--neural-panel-menu-disabled-opacity',
    '--neural-panel-menu-focus-ring',
    '--neural-panel-menu-focus-ring-offset',
    '--neural-panel-menu-icon-color',
    '--neural-panel-menu-icon-size',
    '--neural-panel-menu-meta-gap',
    '--neural-panel-menu-meta-color',
    '--neural-panel-menu-badge-min-width',
    '--neural-panel-menu-badge-padding',
    '--neural-panel-menu-badge-color',
    '--neural-panel-menu-badge-background',
    '--neural-panel-menu-badge-radius',
    '--neural-panel-menu-badge-font-size',
    '--neural-panel-menu-shortcut-color',
    '--neural-panel-menu-shortcut-font-size',
    '--neural-panel-menu-indicator-size',
    '--neural-panel-menu-indicator-duration',
    '--neural-panel-menu-indicator-easing',
    '--neural-panel-menu-group-duration',
    '--neural-panel-menu-group-easing',
    '--neural-panel-menu-separator-margin',
    '--neural-panel-menu-separator-color',
  ] as const;
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  select(event: NeuralPanelMenuSelect): void {
    this.lastEvent.set(`${event.item.label} selected by ${event.source}.`);
  }
  toggle(event: NeuralPanelMenuToggle): void {
    this.lastEvent.set(
      `${event.item.label} ${event.expanded ? 'expanded' : 'collapsed'} by ${event.source}.`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/panel-menu${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): PanelMenuDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is PanelMenuDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
