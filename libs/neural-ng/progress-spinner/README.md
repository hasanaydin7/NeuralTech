# NeuralNg ProgressSpinner

Accessible indeterminate SVG progress for Angular 22+.

```ts
import { NeuralProgressSpinner, type NeuralProgressSpinnerClasses } from '@neural-ng/core/progress-spinner';
```

## Basic usage

```html
<neural-progress-spinner />

<neural-progress-spinner size="large" severity="success" label="Uploading..." />

<neural-progress-spinner variant="multicolor" ariaLabel="AI is reasoning" />

<neural-progress-spinner variant="multicolor" dynamicStroke ariaLabel="AI is reasoning" />

<neural-progress-spinner dual ariaLabel="Loading two coordinated tasks" />

<neural-progress-spinner dual reverse ariaLabel="Loading in reverse" />

<neural-progress-spinner dual variant="multicolor" [syncDualColor]="false" ariaLabel="Independent color cycles" />
```

ProgressSpinner is always indeterminate. It renders `role="progressbar"`
without numeric ARIA attributes. The default accessible name comes from the
active `NeuralLocaleService` common loading message, so the concise empty
element remains accessible and follows runtime locale changes.

Override the accessible name when the task is more specific:

```html
<neural-progress-spinner ariaLabel="Loading search results" /> <neural-progress-spinner ariaLabelledBy="results-loading-title" />
```

When `ariaLabelledBy` is set, it owns the accessible name and `ariaLabel` is
not rendered.

## Appearance and motion

- `size`: `small`, `medium`, `large`
- `severity`: `primary`, `secondary`, `neutral`, `info`, `success`, `warning`, `error`
- `variant`: `solid` keeps the selected severity; `multicolor` cycles through
  the theme's five spinner colors
- `dynamicStroke`: grows and contracts the visible arc while it rotates;
  defaults to `false` and composes with either variant
- `dual`: renders a second, counter-rotating inner arc; defaults to `false`
- `reverse`: reverses the primary direction and preserves the opposing
  relationship between dual arcs; defaults to `false`
- `syncDualColor`: keeps both multicolor arcs on the same color while their
  motion stays opposed; defaults to `true`
- `strokeWidth`: SVG stroke width clamped from `1` through `12`
- `speed`: rotation duration in milliseconds clamped from `200` through
  `10000`
- `label`: optional visible text and accessible-name fallback
- `showLabel`: hides or shows an explicit label; defaults to `true`
- `ariaValueText`: optional task-state description

```html
<neural-progress-spinner [strokeWidth]="3" [speed]="1200" severity="warning" ariaLabel="Connecting" />
```

`prefers-reduced-motion: reduce` stops rotation and leaves a recognizable
static progress indicator. ProgressSpinner does not accept a numeric value;
use `NeuralProgressBar` for determinate or buffered progress.

## Headless mode

```html
<neural-progress-spinner
  unstyled
  spinnerClass="my-spinner"
  [classes]="{
    svg: 'my-spinner__svg',
    track: 'my-spinner__track',
    indicator: 'my-spinner__indicator',
    label: 'my-spinner__label'
  }"
  ariaLabel="Loading"
/>
```

`unstyled` removes NeuralNg visual classes while preserving the progressbar,
SVG structure, and structural hooks. Global headless mode is available with
`provideNeuralNg({ unstyled: true })`.

Typed slots are `root`, `svg`, `track`, `indicator`, `inner`, `innerTrack`,
`innerIndicator`, and `label`. Theme tokens use the
`--neural-progress-spinner-*` prefix.

`ProgressSpinnerComponent` remains available as a deprecated compatibility
alias. New code should import `NeuralProgressSpinner`.
