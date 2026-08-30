import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
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
import { CodeView } from '../../../shared/code-view';

interface WorkspaceData {
  readonly kind: 'folder' | 'file' | 'remote';
}

@Component({
  selector: 'app-tree-page',
  imports: [
    NeuralButton,
    CodeView,
    NeuralTree,
    NeuralTreeIconTemplate,
    NeuralTreeNodeTemplate,
    NeuralTreeTogglerTemplate,
  ],
  templateUrl: './tree.page.html',
  styleUrls: ['../shared-doc-page.scss', './tree.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TreePage {
  readonly workspaceTemplateType = {} as WorkspaceData;
  readonly tree =
    viewChild.required<NeuralTree<WorkspaceData>>('workspaceTree');
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly expandedKeys = signal<ReadonlySet<NeuralTreeKey>>(new Set(['src']));
  readonly selectionExpandedKeys = new Set<NeuralTreeKey>([
    'src',
    'app',
    'libs',
  ]);
  readonly singleSelection = signal<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly multipleSelection = signal<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly checkboxSelection = signal<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly filterQuery = signal('');
  readonly lastEvent = signal('Ready');
  readonly loadingDemo = signal(false);
  readonly retryAttempts = signal(0);
  readonly failedExpandedKeys = new Set<NeuralTreeKey>(['offline-agent']);
  readonly failedNodes: readonly NeuralTreeNode<WorkspaceData>[] = [
    {
      key: 'offline-agent',
      label: 'Offline agent',
      iconClass: 'nt-alert-circle',
      data: { kind: 'remote' },
      leaf: false,
      error: 'Gateway unavailable. The branch can be retried safely.',
    },
  ];
  readonly nodes = signal<readonly NeuralTreeNode<WorkspaceData>[]>([
    {
      key: 'src',
      label: 'src',
      iconClass: 'nt-folders',
      data: { kind: 'folder' },
      children: [
        {
          key: 'app',
          label: 'app',
          iconClass: 'nt-folders',
          data: { kind: 'folder' },
          children: [
            {
              key: 'app-ts',
              label: 'app.ts',
              iconClass: 'nt-code',
              data: { kind: 'file' },
            },
            {
              key: 'app-html',
              label: 'app.html',
              iconClass: 'nt-file-text',
              data: { kind: 'file' },
            },
          ],
        },
        {
          key: 'styles',
          label: 'styles.scss',
          iconClass: 'nt-code',
          data: { kind: 'file' },
        },
      ],
    },
    {
      key: 'libs',
      label: 'libs',
      iconClass: 'nt-folders',
      data: { kind: 'folder' },
      children: [
        {
          key: 'core',
          label: 'neural-ng',
          iconClass: 'nt-brand-angular',
          data: { kind: 'folder' },
        },
        {
          key: 'icons',
          label: 'neural-icons',
          iconClass: 'nt-sparkles',
          data: { kind: 'folder' },
        },
      ],
    },
    {
      key: 'remote',
      label: 'Remote agents',
      iconClass: 'nt-cloud',
      data: { kind: 'remote' },
      leaf: false,
    },
    {
      key: 'locked',
      label: 'Locked workspace',
      iconClass: 'nt-shield',
      data: { kind: 'folder' },
      leaf: false,
      disabled: true,
    },
  ]);
  readonly headlessClasses: NeuralTreeClasses = {
    root: 'docs-headless-tree',
    list: 'docs-headless-tree__list',
    group: 'docs-headless-tree__list',
    node: 'docs-headless-tree__node',
    nodeContent: 'docs-headless-tree__content',
    toggler: 'docs-headless-tree__toggle',
    togglerIcon: 'docs-headless-tree__toggle-icon',
    nodeIcon: 'docs-headless-tree__icon',
    label: 'docs-headless-tree__label',
  };

  readonly importCode = `import {
  NeuralTree,
  type NeuralTreeNode,
  type NeuralTreeKey,
} from '@neural-ng/core/tree';`;
  readonly basicCode = `<neural-tree
  [value]="nodes"
  [(expandedKeys)]="expandedKeys"
  (nodeToggle)="handleToggle($event)"
/>`;
  readonly lazyCode = `<neural-tree
  [value]="nodes"
  [(expandedKeys)]="expandedKeys"
  (lazyLoad)="loadChildren($event)"
/>

// Declare an unloaded branch with leaf: false.`;
  readonly selectionCode = `<neural-tree
  selectionMode="single"
  [value]="nodes"
  [(selectionKeys)]="singleSelection"
/>

<neural-tree
  selectionMode="multiple"
  [value]="nodes"
  [(selectionKeys)]="multipleSelection"
/>

<neural-tree
  selectionMode="checkbox"
  [value]="nodes"
  [(selectionKeys)]="checkboxSelection"
/>`;
  readonly headlessCode = `<neural-tree
  unstyled
  [value]="nodes"
  [expandedKeys]="expandedKeys"
  [classes]="classes"
/>`;
  readonly customizationCode = `<input
  type="search"
  [value]="filterQuery()"
  (input)="filterQuery.set($any($event.target).value)"
/>

<neural-tree
  compact
  [value]="nodes"
  [(filterValue)]="filterQuery"
  filterMode="strict"
>
  <ng-template neuralTreeNode let-node let-selected="selected">
    <strong>{{ node.label }}</strong>
    <small>{{ node.data.kind }}</small>
  </ng-template>
</neural-tree>`;

  handleLazy(event: NeuralTreeLazyLoadEvent<WorkspaceData>): void {
    this.lastEvent.set(`${event.key} · loading children`);
    this.nodes.update((nodes) =>
      replaceTreeNode(nodes, event.key, (node) => ({ ...node, loading: true })),
    );
    setTimeout(() => {
      this.nodes.update((nodes) =>
        replaceTreeNode(nodes, event.key, (node) => ({
          ...node,
          loading: false,
          children: [
            {
              key: 'agent-eu',
              label: 'Europe agent',
              iconClass: 'nt-cpu',
              data: { kind: 'remote' },
            },
            {
              key: 'agent-us',
              label: 'US agent',
              iconClass: 'nt-cpu',
              data: { kind: 'remote' },
            },
          ],
        })),
      );
      this.lastEvent.set(`${event.key} · children loaded`);
    }, 550);
  }

  toggleRootLoading(): void {
    this.loadingDemo.set(true);
    setTimeout(() => this.loadingDemo.set(false), 700);
  }

  selectionSummary(keys: ReadonlySet<NeuralTreeKey>): string {
    return keys.size ? [...keys].join(', ') : 'None';
  }
}

function replaceTreeNode<T>(
  nodes: readonly NeuralTreeNode<T>[],
  key: NeuralTreeKey,
  update: (node: NeuralTreeNode<T>) => NeuralTreeNode<T>,
): readonly NeuralTreeNode<T>[] {
  return nodes.map((node) => {
    if (node.key === key) return update(node);
    if (!node.children) return node;
    const children = replaceTreeNode(node.children, key, update);
    return children === node.children ? node : { ...node, children };
  });
}
