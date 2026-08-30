# @neural-ng/core/overlay

Low-level, dependency-free positioning for NeuralNg floating UI. Most
applications should import a consumer such as Tooltip rather than this entry
point directly.

```ts
import { NeuralOverlayPositioner } from '@neural-ng/core/overlay';

const ref = positioner.connect(trigger, floatingElement, {
  placement: 'bottom-start',
  offset: 8,
  viewportPadding: 8,
});

ref.update();
ref.destroy();
```

The positioner prefers CSS Anchor Positioning when available. Its
`getBoundingClientRect()` fallback flips and clamps the overlay within the
viewport and reacts to capture-phase scroll and window resize.
