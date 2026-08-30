# NeuralNg Paginator

Signal-first, standalone, localized, and headless-friendly pagination for
Angular 22+.

## Import

```ts
import { NeuralPaginator } from '@neural-ng/core/paginator';
```

## Basic usage

```html
<neural-paginator [totalItems]="products.length" [(pageIndex)]="pageIndex" [(pageSize)]="pageSize" [pageSizeOptions]="[10, 20, 50]" (pageChange)="loadPage($event)" />
```

`pageIndex` is zero-based. `startIndex` is inclusive and `endIndex` is
exclusive, so the event range can be passed directly to `Array.prototype.slice`.

## Localized information report

The report is enabled by default, announced with `aria-live="polite"`, and
comes from the active NeuralNg locale. Configure the application through
`provideNeuralNg({ locale })` and switch at runtime through
`NeuralLocaleService`.

```html
<neural-paginator [totalItems]="120" reportTemplate="Showing {start}–{end} from {total} products" />
```

## Visual variants

`rounded` makes every navigation and numeric page control circular. `outlined`
removes their visible borders and resting backgrounds for a quieter surface;
hover receives a subtle primary-tinted theme surface and the active page uses
the primary foreground. Button size and focus indication remain intact. The
variants can be combined.

```html
<neural-paginator [totalItems]="120" rounded />
<neural-paginator [totalItems]="120" outlined />
<neural-paginator [totalItems]="120" rounded outlined />
```

Available placeholders are `{start}`, `{end}`, `{total}`, `{page}`, and
`{pageCount}`. Set `[showReport]="false"` to hide the report.

Local `reportTemplate` and partial `labels` inputs override the global locale
for one paginator:

```html
<neural-paginator
  [totalItems]="120"
  [labels]="{
    navigation: 'Product pages',
    previousPage: 'Previous product page',
    nextPage: 'Next product page',
    page: 'Product page {page}',
    pageSize: 'Products per page'
  }"
/>
```

The component uses a native `nav`, list, and buttons. Page-size selection
composes NeuralNg Select so its overlay, keyboard behavior, themes, and
headless contract stay consistent with the rest of the library. The current
page has `aria-current="page"`.

## Page event

```ts
interface NeuralPageChange {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}
```

Only user navigation and page-size changes emit `pageChange`. Updating inputs
does not create a feedback event. A page-size change preserves the first
visible item whenever possible.

## Class slots and unstyled mode

`paginatorClass` is additive on the internal `nav`. Complex parts use typed
class slots:

```html
<neural-paginator
  [totalItems]="120"
  unstyled
  paginatorClass="my-paginator"
  [classes]="{
    pageButton: 'my-page',
    activePageButton: 'my-page-active',
    report: 'my-report',
    pageSizeSelect: 'my-select'
  }"
/>
```

`unstyled` removes visual `*-base` classes while retaining structural classes,
native semantics, and behavior. Global `provideNeuralNg({ unstyled: true })`
is also respected.

## Inputs

| Input              | Default             | Purpose                                          |
| ------------------ | ------------------- | ------------------------------------------------ |
| `totalItems`       | `0`                 | Total collection size                            |
| `pageIndex`        | `0`                 | Zero-based model input                           |
| `pageSize`         | `10`                | Page-size model input                            |
| `pageSizeOptions`  | `[]`                | Positive Select options; empty hides the control |
| `pageLinkCount`    | `5`                 | Maximum numeric links, clamped to at least five  |
| `showFirstLast`    | `true`              | Show first and last navigation buttons           |
| `showReport`       | `true`              | Show the polite information report               |
| `reportTemplate`   | active locale       | Local report text and placeholders               |
| `labels`           | active locale       | Partial accessible-label override                |
| `disabled`         | `false`             | Disable buttons and page-size Select             |
| `rounded`          | `false`             | Render page and navigation controls as circles   |
| `outlined`         | `false`             | Remove visible borders from paginator buttons    |
| `firstPageIcon`    | `nt-chevrons-left`  | First-page icon class                            |
| `previousPageIcon` | `nt-chevron-left`   | Previous-page icon class                         |
| `nextPageIcon`     | `nt-chevron-right`  | Next-page icon class                             |
| `lastPageIcon`     | `nt-chevrons-right` | Last-page icon class                             |
| `ellipsisIcon`     | `nt-dots`           | Truncated page-window icon class                 |
| `unstyled`         | `false`             | Remove visual classes                            |
| `paginatorClass`   | `''`                | Add classes to the internal `nav`                |
| `classes`          | `{}`                | Typed internal class slots                       |

Paginator has no runtime dependency on `@neural-ng/icons`; the default icon
classes render when the Neural Icons stylesheet is installed by the consumer.
