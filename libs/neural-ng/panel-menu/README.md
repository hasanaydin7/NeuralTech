# PanelMenu

Signals-first hierarchical navigation and command panels for Angular 22+.
PanelMenu is an inline Accordion + Tree pattern. It is not a Sidebar/Drawer and
does not require a popup trigger.

## Import

```ts
import { NeuralPanelMenu, type NeuralPanelMenuEntry } from '@neural-ng/core/panel-menu';
```

```ts
@Component({ imports: [NeuralPanelMenu] })
export class WorkspaceNavigation {}
```

The legacy `PanelMenuComponent` export remains as a compatibility alias.

## Data-driven usage

```ts
readonly items: readonly NeuralPanelMenuEntry[] = [
  {
    key: 'files',
    label: 'Files',
    iconClass: 'nt nt-folder',
    items: [
      { key: 'documents', label: 'Documents' },
      { key: 'images', label: 'Images', badge: 4 },
    ],
  },
  { separator: true },
  {
    key: 'settings',
    label: 'Settings',
    shortcut: '⌘ ,',
  },
];
```

```html
<neural-panel-menu ariaLabel="Workspace" [items]="items" [(expandedKeys)]="expandedKeys" (itemSelect)="handleSelection($event)" />
```

Every action requires a unique, stable `key`. `expandedKeys` is a Signal model
containing expanded branch keys. Root branches are exclusive by default; add
`multiple` to keep several roots open.

## Projected structure

```html
<neural-panel-menu ariaLabel="Account navigation">
  <neural-panel-menu-item key="account" label="Account" iconClass="nt nt-user">
    <neural-panel-menu-item key="profile" label="Profile" />
    <neural-panel-menu-separator />
    <neural-panel-menu-item key="billing" label="Billing" disabled />
  </neural-panel-menu-item>
</neural-panel-menu>
```

Use either `[items]` or projected items, never both. Use `href`, `target`, and
`rel` for native links or `routerLink` for Angular SPA navigation. Router
entries also accept `queryParams`, `fragment`, `queryParamsHandling`,
`preserveFragment`, `skipLocationChange`, `replaceUrl`, and `state`.

```ts
readonly items: readonly NeuralPanelMenuEntry[] = [
  {
    key: 'profile',
    label: 'Profile',
    routerLink: ['/account', 'profile'],
    queryParams: { source: 'panel' },
  },
];
```

## Events

- `itemSelect`: emitted only when an enabled leaf action is activated.
- `itemToggle`: emitted only when a branch opens or closes. It includes the
  previous and next expanded key arrays and the pointer/keyboard source.

Normal `[(expandedKeys)]` binding does not require importing event interfaces.

## Accessibility and keyboard

The root uses `role="tree"`, branches and leaves use `role="treeitem"`, and
nested collections use `role="group"`. Branches expose `aria-expanded` and
`aria-controls`; collapsed groups are inert.

- Arrow Down / Arrow Up: next or previous visible enabled item.
- Arrow Right: expand a branch or enter its first child.
- Arrow Left: collapse a branch or return to its parent.
- Home / End: first or last visible enabled item.
- Enter / Space: toggle a branch or activate a leaf.
- Typing: moves focus to the next matching visible label.

Provide either `ariaLabel` or `ariaLabelledby`.

## Headless classes

`unstyled` removes NeuralNg visual classes while retaining structural classes,
tree behavior, animation structure, and ARIA. Global
`provideNeuralNg({ unstyled: true })` is also respected.

Typed slots include `root`, `list`, `itemContainer`, `item`, `expandedItem`,
`disabledItem`, `icon`, `label`, `meta`, `badge`, `shortcut`, `indicator`,
`group`, `groupInner`, and `separator`.

## Component boundary

- PanelMenu: inline expandable hierarchy.
- Menu: flat/grouped command list; popup mode belongs to a future Menu package.
- Sidebar/Drawer: layout container that may contain PanelMenu.

Popup triggers, overlay positioning, nested flyout menus, checkbox/radio
items, and lazy remote loading are outside this beta.
