# NeuralNg Menu

Status: **Beta**. Canonical standalone exports are `NeuralMenu`,
`NeuralMenuItem`, `NeuralMenuGroup`, `NeuralMenuSeparatorItem`, and
`NeuralMenuTrigger`; legacy
`*Component` and `*Directive` names remain deprecated compatibility aliases.

Accessible inline and popup command menus for Angular 22+ applications.
Menu actions remain flat by design. Non-interactive category groups may label
related actions; nested navigation belongs to PanelMenu or a future TieredMenu.

## Import

```ts
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralMenu, NeuralMenuGroup, NeuralMenuItem, NeuralMenuSeparatorItem, NeuralMenuTrigger, type NeuralMenuEntry, type NeuralMenuSelect } from '@neural-ng/core/menu';
```

Add only the primitives used by the consuming standalone component to its
`imports` array.

## Data-driven inline menu

```ts
readonly items: readonly NeuralMenuEntry[] = [
  { key: 'profile', label: 'Profile', iconClass: 'nt-user' },
  { key: 'notifications', label: 'Notifications', badge: 4 },
  { separator: true },
  { key: 'logout', label: 'Log out', shortcut: 'Ctrl L' },
];
```

```html
<neural-menu ariaLabel="Account actions" [items]="items" (itemSelect)="run($event)" />
```

## Popup trigger

```html
<neural-button label="Account" [neuralMenuTriggerFor]="accountMenu" />

<neural-menu #accountMenu="neuralMenu" popup [items]="items" [(open)]="menuOpen" (itemSelect)="run($event)" />
```

`neuralMenuTriggerFor` adds `aria-haspopup`, `aria-controls`, and
`aria-expanded`. Click, Enter, Space, ArrowDown, and ArrowUp open the popup.
Escape closes it and restores focus. Outside pointer interaction, Tab, and item
selection dismiss it without trapping focus.

`menuPosition` accepts the shared logical Overlay placements. The default is
`bottom-start`; positioning flips or clamps inside the viewport.

## Category groups

Groups add a visible, non-interactive label without creating a nested menu.
The label is skipped by focus and typeahead while its actions remain part of
the root Menu's ArrowUp/ArrowDown sequence.

```ts
readonly items: readonly NeuralMenuEntry[] = [
  {
    key: 'projects',
    label: 'Projects',
    items: [
      { key: 'overview', label: 'Overview', routerLink: '/projects' },
      { key: 'activity', label: 'Activity', routerLink: '/projects/activity' },
    ],
  },
];
```

```html
<neural-menu ariaLabel="Workspace navigation">
  <neural-menu-group key="projects" label="Projects">
    <neural-menu-item key="overview" label="Overview" routerLink="/projects" />
    <neural-menu-item key="activity" label="Activity" routerLink="/projects/activity" />
  </neural-menu-group>
</neural-menu>
```

## Projected items

```html
<neural-menu ariaLabel="File actions">
  <neural-menu-item key="rename" label="Rename" iconClass="nt-edit" />
  <neural-menu-separator />
  <neural-menu-item key="delete" label="Delete" disabled />
</neural-menu>
```

Use either `[items]` or projected children. When both are supplied, `[items]`
wins. Every action requires a stable, unique `key`.

## Navigation actions

Use `routerLink` for Angular SPA navigation and `href` for native document or
external navigation. Both data-driven and projected items support the same
contract:

```ts
readonly items: readonly NeuralMenuEntry[] = [
  {
    key: 'settings',
    label: 'Settings',
    routerLink: ['/workspace', 'settings'],
    queryParams: { tab: 'profile' },
  },
  { key: 'help', label: 'Help', href: 'https://example.com/help', target: '_blank', rel: 'noopener' },
];
```

Router actions also accept `fragment`, `queryParamsHandling`,
`preserveFragment`, `skipLocationChange`, `replaceUrl`, `state`, and `target`.
`itemSelect` still emits before navigation so analytics and command state can
share one event contract.

## State and events

- `open` is a Signal model and therefore exposes `openChange`.
- `itemSelect` emits `key`, the typed item, interaction `source`, and the
  original DOM event.
- `closeOnSelect` defaults to `true` for popup menus.
- `disabled` disables the complete menu.

## Accessibility

Menu uses `menu`, `group`, `menuitem`, and `separator` roles. Group containers
are labelled by their visible category headings. ArrowUp/ArrowDown wrap,
Home/End move to the edges, typeahead focuses matching enabled items, and
disabled items are skipped.

## Headless styling

Set `unstyled` to retain semantics, behavior, positioning, and structural hooks
while removing NeuralNg visual classes. `menuClass`, item-level `itemClass`,
and the typed `classes` slots remain available. Global unstyled configuration
is honored.

Neutral, experimental Glass, and experimental Futuristic themes all define
Menu tokens.
