# NeuralNg VirtualScroller

Fixed-size, SSR-safe collection windowing for Angular Signals applications.

Current maturity: **Beta**.

```ts
import { NeuralVirtualScroller, NeuralVirtualScrollerItemTemplate } from '@neural-ng/core/virtual-scroller';
```

```html
<neural-virtual-scroller [items]="records" [itemSize]="48" [viewportSize]="320" [(first)]="first">
  <ng-template [neuralVirtualScrollerItem]="records" let-record let-index="index"> {{ index + 1 }}. {{ record.name }} </ng-template>
</neural-virtual-scroller>
```

`rangeChange` and `lazyLoad` expose `start`/`end` rendered indices and
`visibleStart`/`visibleEnd` viewport indices. Both `end` values are exclusive.
Use `scrollToIndex()` or `scrollToOffset()` for imperative navigation.

Beta supports fixed-size vertical and horizontal items, overscan, controlled
`first`, immutable data, typed item/empty/loading templates, loading overlay,
global or local `unstyled`, typed class slots, native list semantics, and SSR.
Variable-size measurement and two-dimensional grids are intentionally outside
this entry point's beta contract.
