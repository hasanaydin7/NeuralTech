# Slider

Native, accessible numeric slider for Angular 22+ with Signal Forms, Reactive Forms, template-driven Forms, horizontal/vertical orientation, and headless styling.

```ts
import { NeuralSlider } from '@neural-ng/core/slider';
```

```html
<neural-slider [(value)]="volume" [min]="0" [max]="100" [step]="5" showValue />
```

Use `range` with a `[number, number]` value for two-thumb selection. Logical
track clicks follow RTL direction, while native Arrow, Page Up/Down, Home, and
End behavior remains available.

`SliderComponent` remains a deprecated compatibility alias. New code should
import `NeuralSlider`.
