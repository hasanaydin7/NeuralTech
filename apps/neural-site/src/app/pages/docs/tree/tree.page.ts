import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralInput } from '@neural-ng/core/input';
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
  NeuralTree,
  NeuralTreeIconTemplate,
  NeuralTreeNodeTemplate,
  NeuralTreeTogglerTemplate,
  type NeuralTreeClasses,
  type NeuralTreeKey,
  type NeuralTreeLazyLoadEvent,
  type NeuralTreeNode,
} from '@neural-ng/core/tree';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type TreeDocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface WorkspaceData {
  readonly kind: 'folder' | 'file' | 'remote';
  readonly owner?: string;
}

@Component({
  selector: 'app-tree-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralInput,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    NeuralTree,
    NeuralTreeIconTemplate,
    NeuralTreeNodeTemplate,
    NeuralTreeTogglerTemplate,
  ],
  templateUrl: './tree.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewport = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<TreeDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly tree = viewChild<NeuralTree<WorkspaceData>>('workspaceTree');
  readonly templateType = {} as WorkspaceData;
  readonly expandedKeys = signal<ReadonlySet<NeuralTreeKey>>(
    new Set(['src', 'app', 'libs']),
  );
  readonly selectionKeys = signal<ReadonlySet<NeuralTreeKey>>(
    new Set(['app-ts']),
  );
  readonly checkboxKeys = signal<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly filterValue = signal('');
  readonly eventText = signal('Ready.');
  readonly loading = signal(false);
  readonly retryAttempts = signal(0);
  readonly nodes =
    signal<readonly NeuralTreeNode<WorkspaceData>[]>(createNodes());
  readonly errorNodes: readonly NeuralTreeNode<WorkspaceData>[] = [
    {
      key: 'offline',
      label: 'Offline agent',
      iconClass: 'nt nt-alert-circle',
      data: { kind: 'remote' },
      leaf: false,
      error: 'Gateway unavailable.',
    },
  ];
  readonly errorExpanded = new Set<NeuralTreeKey>(['offline']);
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralTreeClasses = {
    root: 'w-full rounded-2xl bg-slate-950 p-3 text-slate-100',
    list: 'grid gap-1',
    group: 'grid gap-1 border-l border-cyan-400/25',
    node: 'outline-none',
    nodeContent:
      'flex min-h-10 items-center gap-2 rounded-xl px-2 hover:bg-cyan-400/10',
    selectedNode: 'bg-cyan-400/15 text-cyan-100',
    toggler: 'grid size-7 place-items-center rounded-lg hover:bg-white/10',
    nodeIcon: 'text-cyan-300',
    label: 'font-semibold',
    checkbox: 'grid size-4 place-items-center rounded border border-cyan-300',
    loading: 'p-4 text-cyan-200',
    empty: 'p-4 text-slate-400',
    error: 'rounded-xl bg-rose-500/10 p-2',
    retry: 'rounded-lg px-2 py-1 text-rose-200 hover:bg-rose-500/20',
  };
  readonly pageLinks: Record<
    TreeDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Hierarchy', 'basic'],
      ['Selection', 'selection'],
      ['Filter and templates', 'filtering'],
      ['Lazy and states', 'lazy'],
      ['Virtual scroll', 'virtual'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['ARIA model', 'aria'],
      ['Keyboard', 'keyboard'],
      ['Focus and RTL', 'focus-rtl'],
      ['Async and SSR', 'async-ssr'],
    ],
    api: [
      ['Component', 'component-api'],
      ['Models and inputs', 'inputs'],
      ['Events', 'events'],
      ['Methods', 'methods'],
      ['Templates', 'templates'],
      ['Class slots', 'class-slots'],
      ['Public types', 'public-types'],
      ['Compatibility', 'compatibility'],
    ],
    tokens: [
      ['Surface', 'surface-tokens'],
      ['Node', 'node-tokens'],
      ['Controls', 'control-tokens'],
      ['Compact', 'compact-tokens'],
    ],
  };
  readonly importCode = `import { NeuralTree, type NeuralTreeNode, type NeuralTreeKey } from '@neural-ng/core/tree';\n\n@Component({ imports: [NeuralTree] })`;
  readonly basicCode = `<neural-tree #tree [value]="nodes" [(expandedKeys)]="expandedKeys" ariaLabel="Workspace files" />\n<neural-button label="Expand all" (clicked)="tree.expandAll()" />`;
  readonly selectionCode = `<neural-tree selectionMode="multiple" [value]="nodes" [(selectionKeys)]="selectionKeys" />\n<neural-tree selectionMode="checkbox" [value]="nodes" [(selectionKeys)]="checkboxKeys" />`;
  readonly filterCode = `<input neuralInput [(value)]="filterValue" />\n<neural-tree [value]="nodes" [(filterValue)]="filterValue" filterMode="strict" [filterFields]="['label', 'data.owner']">\n  <ng-template [neuralTreeNode]="templateType" let-node>{{ node.label }}</ng-template>\n</neural-tree>`;
  readonly lazyCode = `<neural-tree [value]="nodes" (lazyLoad)="loadChildren($event)" />\n// leaf: false declares an unloaded branch. Replace it immutably after loading.`;
  readonly virtualCode = `<neural-tree virtualScroll [virtualItemSize]="40" [virtualScrollHeight]="240" [virtualOverscan]="4" [value]="largeTree" />`;
  readonly unstyledCode = `<neural-tree unstyled [value]="nodes" [expandedKeys]="expandedKeys" [classes]="classes" />`;
  readonly inputs = [
    [
      'value',
      'readonly NeuralTreeNode<T>[]',
      '[]',
      'Immutable hierarchical source.',
    ],
    [
      'expandedKeys',
      'ReadonlySet<NeuralTreeKey>',
      'new Set()',
      'Two-way controlled expansion model.',
    ],
    [
      'selectionKeys',
      'ReadonlySet<NeuralTreeKey>',
      'new Set()',
      'Two-way immutable selection model.',
    ],
    ['filterValue', 'string', `''`, 'Two-way filter query.'],
    [
      'filterMode',
      `'lenient' | 'strict'`,
      `'lenient'`,
      'Matched subtree or descendant-by-descendant filtering.',
    ],
    [
      'filterFields',
      'readonly string[]',
      `['label']`,
      'Nested paths searched by the built-in filter.',
    ],
    [
      'filterPredicate',
      'function | null',
      'null',
      'Custom normalized-query matcher.',
    ],
    [
      'selectionMode',
      `'single' | 'multiple' | 'checkbox' | null`,
      'null',
      'Selection interaction contract.',
    ],
    [
      'metaKeySelection / rangeSelection',
      'boolean',
      'true',
      'Modifier and Shift-range behavior.',
    ],
    [
      'propagateSelectionDown / Up',
      'boolean',
      'true',
      'Checkbox descendant and ancestor normalization.',
    ],
    [
      'selectableNode',
      'NeuralTreeSelectable<T> | null',
      'null',
      'Per-node selection gate.',
    ],
    ['loading', 'boolean', 'false', 'Localized root loading state.'],
    [
      'emptyLabel / loadingLabel / retryLabel',
      'string | null',
      'locale',
      'Component-level state labels.',
    ],
    [
      'ariaLabel / ariaLabelledby',
      'string | null',
      'null',
      'Accessible tree naming.',
    ],
    [
      'trackBy',
      'NeuralTreeTrackBy<T> | null',
      'key',
      'Custom rendering identity.',
    ],
    ['compact', 'boolean', 'false', 'Overlay-ready density.'],
    [
      'virtualScroll',
      'boolean',
      'false',
      'Fixed-height visible-range rendering.',
    ],
    [
      'virtualItemSize / virtualScrollHeight / virtualOverscan',
      'number',
      '40 / 320 / 3',
      'Virtual range geometry.',
    ],
    [
      'unstyled / treeClass / classes',
      'headless inputs',
      'false / empty',
      'Visual ownership and typed classes.',
    ],
  ] as const;
  readonly events = [
    [
      'nodeExpand / nodeCollapse / nodeToggle',
      'NeuralTreeNodeEvent<T>',
      'Expansion lifecycle.',
    ],
    [
      'lazyLoad',
      'NeuralTreeLazyLoadEvent<T>',
      'One request per unloaded branch until retry.',
    ],
    [
      'nodeSelect / nodeUnselect',
      'NeuralTreeSelectionEvent<T>',
      'Selection result and immutable key set.',
    ],
    [
      'virtualRangeChange',
      'NeuralVirtualRange',
      'Rendered range after scrolling.',
    ],
  ] as const;
  readonly methods = [
    ['expandAll()', 'Expands every non-leaf node.'],
    ['collapseAll()', 'Collapses all branches and restores focus.'],
    ['toggleNode(item, event?)', 'Toggles a resolved visible branch.'],
    ['selectNode(item, event)', 'Applies the selection contract.'],
    ['retryLazyLoad(item, event)', 'Re-emits a failed lazy request.'],
    ['visibleNode(key)', 'Returns a current flat visible-node record.'],
  ] as const;
  readonly templates = [
    ['neuralTreeNode', 'NeuralTreeNodeTemplateContext<T>'],
    ['neuralTreeToggler', 'NeuralTreeTogglerTemplateContext<T>'],
    ['neuralTreeIcon', 'NeuralTreeIconTemplateContext<T>'],
    ['neuralTreeEmpty', 'NeuralTreeStateTemplateContext'],
    ['neuralTreeLoading', 'NeuralTreeStateTemplateContext'],
  ] as const;
  readonly publicTypes = [
    'NeuralTreeNode<T>',
    'NeuralTreeKey',
    'NeuralTreeSelectionMode',
    'NeuralTreeCheckboxState',
    'NeuralTreeFilterMode',
    'NeuralTreeFlatNode<T>',
    'NeuralTreeIndexEntry<T>',
    'NeuralTreeState',
    'NeuralResolvedTreeState<T>',
    'NeuralTreeController<T>',
    'NeuralTreeOptionMapping',
  ] as const;
  readonly surfaceTokens = [
    '--neural-tree-color',
    '--neural-tree-background',
    '--neural-tree-border',
    '--neural-tree-radius',
    '--neural-tree-shadow',
    '--neural-tree-padding',
    '--neural-tree-font-family',
  ] as const;
  readonly nodeTokens = [
    '--neural-tree-node-height',
    '--neural-tree-node-gap',
    '--neural-tree-node-padding-block',
    '--neural-tree-node-padding-inline',
    '--neural-tree-node-radius',
    '--neural-tree-node-background-hover',
    '--neural-tree-node-background-selected',
    '--neural-tree-node-background-partial',
    '--neural-tree-node-color-selected',
    '--neural-tree-node-icon-color',
    '--neural-tree-node-icon-size',
    '--neural-tree-match-color',
    '--neural-tree-disabled-opacity',
    '--neural-tree-error-color',
    '--neural-tree-indent',
  ] as const;
  readonly controlTokens = [
    '--neural-tree-toggler-size',
    '--neural-tree-toggler-color',
    '--neural-tree-toggler-color-hover',
    '--neural-tree-toggler-background-hover',
    '--neural-tree-checkbox-size',
    '--neural-tree-checkbox-radius',
    '--neural-tree-checkbox-color',
    '--neural-tree-checkbox-background',
    '--neural-tree-checkbox-background-selected',
    '--neural-tree-checkbox-border-color',
    '--neural-tree-checkbox-border-color-selected',
    '--neural-tree-content-gap',
  ] as const;
  readonly compactTokens = [
    '--neural-tree-compact-node-height',
    '--neural-tree-compact-indent',
    '--neural-tree-compact-toggler-size',
    '--neural-tree-compact-content-gap',
  ] as const;

  constructor() {
    const sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd)
        this.selectedView.set(resolveView(e.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/tree${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewport.scrollToAnchor(fragment));
  }
  selectionSummary(keys: ReadonlySet<NeuralTreeKey>): string {
    return keys.size ? [...keys].join(', ') : 'None';
  }
  setFilter(event: Event): void {
    this.filterValue.set((event.target as HTMLInputElement).value);
  }
  showLoading(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 700);
  }
  handleLazy(event: NeuralTreeLazyLoadEvent<WorkspaceData>): void {
    this.eventText.set(`${event.key} loading…`);
    this.nodes.update((nodes) =>
      replaceNode(nodes, event.key, (node) => ({ ...node, loading: true })),
    );
    setTimeout(() => {
      this.nodes.update((nodes) =>
        replaceNode(nodes, event.key, (node) => ({
          ...node,
          loading: false,
          children: [
            {
              key: `${event.key}-eu`,
              label: 'Europe agent',
              iconClass: 'nt nt-cpu',
              data: { kind: 'remote' },
            },
          ],
        })),
      );
      this.eventText.set(`${event.key} loaded.`);
    }, 500);
  }
}

function createNodes(): readonly NeuralTreeNode<WorkspaceData>[] {
  return [
    {
      key: 'src',
      label: 'src',
      iconClass: 'nt nt-folders',
      data: { kind: 'folder', owner: 'Platform' },
      children: [
        {
          key: 'app',
          label: 'app',
          iconClass: 'nt nt-folders',
          data: { kind: 'folder', owner: 'Frontend' },
          children: [
            {
              key: 'app-ts',
              label: 'app.ts',
              iconClass: 'nt nt-code',
              data: { kind: 'file', owner: 'Ada' },
            },
            {
              key: 'app-html',
              label: 'app.html',
              iconClass: 'nt nt-file-text',
              data: { kind: 'file', owner: 'Grace' },
            },
          ],
        },
        {
          key: 'styles',
          label: 'styles.css',
          iconClass: 'nt nt-code',
          data: { kind: 'file', owner: 'Ada' },
        },
      ],
    },
    {
      key: 'libs',
      label: 'libs',
      iconClass: 'nt nt-folders',
      data: { kind: 'folder', owner: 'Platform' },
      children: [
        {
          key: 'core',
          label: 'neural-ng',
          iconClass: 'nt nt-brand-angular',
          data: { kind: 'folder', owner: 'Core' },
        },
        {
          key: 'icons',
          label: 'neural-icons',
          iconClass: 'nt nt-sparkles',
          data: { kind: 'folder', owner: 'Design' },
        },
      ],
    },
    {
      key: 'remote',
      label: 'Remote agents',
      iconClass: 'nt nt-cloud',
      data: { kind: 'remote', owner: 'Infra' },
      leaf: false,
    },
    {
      key: 'locked',
      label: 'Locked workspace',
      iconClass: 'nt nt-shield',
      data: { kind: 'folder' },
      leaf: false,
      disabled: true,
    },
  ];
}
function replaceNode<T>(
  nodes: readonly NeuralTreeNode<T>[],
  key: NeuralTreeKey,
  update: (node: NeuralTreeNode<T>) => NeuralTreeNode<T>,
): readonly NeuralTreeNode<T>[] {
  return nodes.map((node) =>
    node.key === key
      ? update(node)
      : node.children
        ? { ...node, children: replaceNode(node.children, key, update) }
        : node,
  );
}
function resolveView(url: string): TreeDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is TreeDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
