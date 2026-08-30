# NeuralNg Tree

Signal-first hierarchical data foundation for Angular 22+.

```ts
import { NeuralTree, type NeuralTreeNode } from '@neural-ng/core/tree';
```

```html
<neural-tree [value]="nodes" [(expandedKeys)]="expandedKeys" selectionMode="checkbox" [(selectionKeys)]="selectionKeys" (lazyLoad)="loadChildren($event)" />
```

Tree Beta provides immutable data-driven nodes, a flat visible-node controller,
controlled expansion, expand/collapse/toggle events, expand-all/collapse-all,
lazy branch requests, root/node loading, empty state, explicit ARIA hierarchy
metadata, RTL-safe indentation, typed class slots, and controlled single,
multiple, or checkbox selection.

Selection is modeled as an immutable `ReadonlySet<NeuralTreeKey>`. Multiple
mode supports Ctrl/Meta toggling and Shift range selection over visible nodes.
Checkbox mode supports downward and upward propagation, including `mixed` ARIA
state for partially selected branches. Use `selectableNode` or `selectable:
false` to prevent individual nodes from entering a selection.

The rendered hierarchy follows the WAI-ARIA Tree pattern with `tree`,
`treeitem`, and nested `group` roles. A single roving `tabindex` entry owns
focus. Arrow Up/Down navigate visible enabled nodes; Home/End move to the
edges; the logical expand/collapse arrows follow LTR or RTL direction. Enter
and Space select, while printable characters perform locale-aware typeahead.
Collapsing a branch that owns focus restores focus to that branch.

## Filtering and large-data hooks

Bind `[(filterValue)]`, select `filterMode="lenient"` or `"strict"`, and set
`filterFields` to node paths such as `label` or `data.owner.name`. Lenient mode
keeps the complete subtree after a node matches; strict mode continues testing
every descendant. Filtering creates frozen derived branches and never mutates
the source array.

`compact` provides an overlay-ready density. `virtualRange` and `virtualItems`
expose the same fixed-height range contract used by NeuralNg Select and
MultiSelect; configure it with `virtualScroll`, `virtualItemSize`,
`virtualScrollHeight`, and `virtualOverscan` when connecting a scroller.

## Typed templates

Import the template directives you use from `@neural-ng/core/tree`:

```html
<neural-tree [value]="nodes">
  <ng-template neuralTreeNode let-node let-selected="selected"> {{ node.label }} {{ selected ? '(selected)' : '' }} </ng-template>
  <ng-template neuralTreeToggler let-expanded="expanded">...</ng-template>
  <ng-template neuralTreeIcon let-iconClass="iconClass">...</ng-template>
  <ng-template neuralTreeLoading let-label>{{ label }}</ng-template>
  <ng-template neuralTreeEmpty let-label>{{ label }}</ng-template>
</neural-tree>
```

When template code accesses generic `data`, bind a compile-time-only hint such
as `[neuralTreeNode]="workspaceTemplateType"`. This lets Angular infer the
exact data type instead of weakening the context to `any`.

`unstyled`, global unstyled configuration, and `NeuralTreeClasses` preserve
structural hooks while removing NeuralNg visual ownership. Neutral is the
reference theme; Glass, Mist, and Futuristic override component tokens only.

## Shared TreeSelect foundation

`NeuralTreeController` resolves filter, expansion, selection, index, and flat
visible-node state without DOM dependencies. `mapNeuralTreeOptions()` maps
arbitrary nested option paths into immutable Tree nodes, providing the shared
label/value/children contract required by TreeSelect.

Every node requires a stable string or number `key`. Duplicate keys and cyclic
data fail fast. `leaf: false` declares a lazy branch when children are not yet
available. Update `value` immutably after `lazyLoad`.

Set `error` on a lazy node to render a localized retry state. Retry removes the
request guard for that key and emits a fresh `lazyLoad` event.
