# NeuralNg Breadcrumb

Accessible, Signals-based breadcrumb navigation for Angular 22+.

```ts
import { NeuralBreadcrumb, NeuralBreadcrumbItemComponent, NeuralBreadcrumbSeparatorTemplate, type NeuralBreadcrumbItem } from '@neural-ng/core/breadcrumb';
```

```html
<neural-breadcrumb ariaLabel="Page trail" [items]="items" [maxItems]="3" [overflowTooltipDelay]="100" (itemSelect)="select($event)" />
```

The last item receives `aria-current="page"` unless an item explicitly sets
`current`. Use `routerLink` for Angular navigation or `href` for normal links.
`maxItems >= 2` keeps the first and trailing items visible and moves middle
items into an accessible NeuralNg Menu. `overflowLabel` is used for both the
trigger's accessible name and its hover/focus Tooltip.
`overflowTooltipDelay` controls its delay in milliseconds and defaults to
`100`.

Projected items and a custom separator are also supported:

```html
<neural-breadcrumb>
  <neural-breadcrumb-item key="home" label="Home" routerLink="/" />
  <neural-breadcrumb-item key="current" label="Current" />
  <ng-template neuralBreadcrumbSeparator>/</ng-template>
</neural-breadcrumb>
```

`unstyled` removes NeuralNg visual classes while preserving semantic and
structural classes. Typed class slots are `root`, `list`, `item`, `link`,
`current`, `disabled`, `icon`, `label`, `separator`, `overflowItem`, and
`overflowTrigger`.

## Navigation and selection

Each item requires a stable `key` and visible `label`. `routerLink` supports
string, command-array, or UrlTree values together with `queryParams`,
`fragment`, `queryParamsHandling`, `preserveFragment`, `skipLocationChange`,
`replaceUrl`, `state`, and `target`.
Native `href` items retain `target` and `rel`. Disabled items are readable but
inert. `itemSelect` emits `{ key, item, originalEvent }` for visible and
overflow selections.

## Accessibility

Breadcrumb renders a named `nav` landmark containing an ordered list. The last
item receives `aria-current="page"` unless an explicit current item exists.
The overflow trigger is a native Button and delegates popup keyboard behavior
to NeuralNg Menu. Links retain native or Angular Router keyboard semantics.

## Compatibility aliases

`BreadcrumbComponent`, `BreadcrumbItemComponent`, and
`BreadcrumbSeparatorTemplate` remain deprecated aliases for early alpha
consumers. New code must use `NeuralBreadcrumb`,
`NeuralBreadcrumbItemComponent`, and `NeuralBreadcrumbSeparatorTemplate`.

## Beta boundary

Breadcrumb Beta includes immutable data items, projected items, Router and
native links, current/disabled states, selection events, responsive Menu
overflow, Tooltip delay, icon/template separators, RTL, SSR-safe rendering,
typed class slots, and global/local unstyled behavior. Route construction,
application history, page titles, and navigation authorization remain
application concerns.
