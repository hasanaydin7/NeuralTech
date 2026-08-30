# Skeleton

`NeuralSkeleton` provides a lightweight, decorative placeholder for content
that is still loading.

```ts
import { NeuralSkeleton, type NeuralSkeletonClasses } from '@neural-ng/core/skeleton';
```

```html
<neural-skeleton width="18rem" height="1.25rem" /> <neural-skeleton shape="circle" size="3rem" animation="wave" />
```

## Composition

Skeletons are decorative and always render with `aria-hidden="true"`. Put
`aria-busy="true"` on the region being refreshed and keep its accessible name
stable. Use `LoadingOverlayComponent` when interaction must be blocked.

```html
<article [attr.aria-busy]="loading()">
  @if (loading()) {
  <neural-skeleton shape="rectangle" height="9rem" animation="wave" />
  <neural-skeleton width="72%" />
  } @else {
  <!-- loaded content -->
  }
</article>
```

## API

- `shape`: `rectangle | rounded | circle`; default `rounded`.
- `animation`: `pulse | wave | none`; default `pulse`.
- `width`: CSS length for non-circle shapes; default `100%`.
- `height`: CSS length for non-circle shapes; default `1rem`.
- `size`: CSS length used for both circle dimensions; default `2.5rem`.
- `borderRadius`: optional CSS radius that overrides the selected shape.
- `unstyled`: removes NeuralNg visual classes while preserving structure and
  explicit dimensions.
- `skeletonClass`: consumer class on the root.
- `classes`: typed `root` and `effect` class slots.

The component respects `prefers-reduced-motion`. Theme tokens use the
`--neural-skeleton-*` prefix.

`SkeletonComponent` remains a deprecated compatibility alias. New code should
import `NeuralSkeleton`.
