# NeuralNg DataView

DataView Beta presents an immutable collection as a semantic list or responsive grid with typed templates, controlled Signal state, stable local sorting, remote request state, and Paginator composition.

```ts
import { NeuralDataView, NeuralDataViewGridItemTemplate, NeuralDataViewListItemTemplate } from '@neural-ng/core/data-view';
```

```html
<neural-data-view [value]="products" [(layout)]="layout" [rows]="6">
  <ng-template [neuralDataViewListItem]="products" let-product> {{ product.name }} </ng-template>
  <ng-template [neuralDataViewGridItem]="products" let-product> {{ product.name }} </ng-template>
</neural-data-view>
```

`layout`, `first`, `rows`, `sortField`, and `sortOrder` are controlled models. Local mode performs stable nested-property sorting and paging without mutating `value`. Remote mode never sorts or slices the supplied page; pass `totalRecords` and serialize `stateChange` into an API request.

Semantic events are `layoutChanged`, `sortChange`, `pageChange`, and the unified `stateChange`. Item template contexts expose `$implicit`, `item`, `index`, `originalIndex`, `layout`, `first`, and `last`.

Typed templates are `neuralDataViewListItem`, `neuralDataViewGridItem`, `neuralDataViewHeader`, `neuralDataViewFooter`, `neuralDataViewEmpty`, and `neuralDataViewLoading`.

Loading renders stable skeleton rows or a custom loading template. Empty content has a consumer label and a typed replacement template. `trackBy` preserves item identity and `sortComparator` provides application-owned ordering.

`unstyled` and global unstyled mode remove every NeuralNg visual class while preserving region/list/listitem semantics, state attributes, templates, paging, and structural hooks. `classes` exposes typed additive slots.

`NeuralDataView` is the canonical component symbol. `DataViewComponent` remains a deprecated compatibility alias.

## Beta boundary

DataView Beta owns collection presentation, layout switching, deterministic local paging/sorting, remote state emission, loading/empty presentation, typed templates, Paginator composition, accessibility semantics, headless classes, tokens, and SSR/hydration-safe immutable computation. Selection, editing, filtering, data fetching, and virtual windowing remain application or dedicated component responsibilities.
