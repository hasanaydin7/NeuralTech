# NeuralNg ProgressBar

Accessible determinate and indeterminate progress for Angular 22+.

```ts
import { NeuralProgressBar, type NeuralProgressBarClasses } from '@neural-ng/core/progress-bar';
```

## Determinate progress

```html
<neural-progress-bar [value]="42" ariaLabel="Upload progress" />
```

`value` is clamped between `min` and `max` (defaults: `0` and `100`).
Invalid ranges are repaired to a one-unit range. The rendered `progressbar`
exposes `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and an accessible
value description.

Use `label` for visual text and `ariaValueText` when assistive technology
needs a more descriptive or localized value:

```html
<neural-progress-bar [value]="7" [max]="10" label="7 / 10 dosya" ariaValueText="10 dosyanın 7 tanesi tamamlandı" ariaLabel="Dosya yükleme ilerlemesi" />
```

## Buffer and indeterminate modes

```html
<neural-progress-bar [value]="35" [bufferValue]="62" ariaLabel="Video buffer" />

<neural-progress-bar mode="indeterminate" label="Loading" ariaLabel="Loading results" />
```

The buffer is never rendered behind the current value. Indeterminate mode
omits numeric ARIA attributes because no completion value is known.

## Variants

- `size`: `small`, `medium`, `large`
- `severity`: `primary`, `secondary`, `neutral`, `info`, `success`, `warning`, `error`
- `rounded`: rounded track, enabled by default
- `striped`: striped value surface
- `animated`: animates stripes when `striped` is also enabled
- `showValue`: controls only the visible label, not accessible progress

Animations and value transitions stop under `prefers-reduced-motion: reduce`.

## Headless mode

```html
<neural-progress-bar
  [value]="64"
  unstyled
  progressClass="my-progress"
  [classes]="{
    track: 'my-progress__track',
    buffer: 'my-progress__buffer',
    value: 'my-progress__value',
    label: 'my-progress__label'
  }"
/>
```

`unstyled` removes NeuralNg visual classes while retaining semantics and
structural hooks. Global headless mode is available through
`provideNeuralNg({ unstyled: true })`.

The typed `classes` slots are `root`, `track`, `buffer`, `value`, and `label`.
Primary tokens use the `--neural-progress-bar-*` prefix.
