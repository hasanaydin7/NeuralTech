# NeuralNg LoadingOverlay

Accessible container and viewport loading blockers for Angular 22+.

```ts
import { NeuralLoadingIndicator, NeuralLoadingOverlay, type NeuralLoadingOverlayClasses } from '@neural-ng/core/loading-overlay';
```

## Container loading

```html
<neural-loading-overlay [active]="loading()" label="Loading products">
  <product-list />
</neural-loading-overlay>
```

Container scope is the default. While active, projected content receives
`aria-busy="true"`. With the default `blockInteraction`, the content also
becomes inert and the overlay captures pointer interaction. The default
indicator is `NeuralProgressSpinner`.

## Viewport loading

```html
<neural-loading-overlay [active]="saving()" scope="viewport" label="Saving changes" lockScroll />
```

Viewport scope uses native modal `<dialog>` top-layer behavior, so the overlay
stays above fixed headers and transformed ancestors. It restores the previous
focus target and safely reference-counts document scroll locks when multiple
viewport loaders overlap. Escape cannot dismiss an active loading operation.

## Timing and interaction

- `delay`: wait before rendering; defaults to `150` milliseconds
- `minimumDuration`: once visible, remain visible for at least `300`
  milliseconds
- `blockInteraction`: defaults to `true`
- `backdrop`: defaults to `true`
- `lockScroll`: defaults to `true` for blocking viewport usage
- `shown` and `hidden`: emit when the rendered overlay actually changes

The busy state starts immediately, even during the visual delay. A request that
finishes before `delay` never flashes an overlay.

Set `blockInteraction="false"` only for background work where continued
interaction is safe. The content still exposes `aria-busy`.

## Labels and spinner

`label` falls back to the active `NeuralLocaleService` common loading message.
`showLabel` controls visible text. The built-in spinner can be adjusted with
`spinnerSize` and `spinnerSeverity`.

```html
<neural-loading-overlay [active]="syncing()" spinnerSize="large" spinnerSeverity="success" label="Syncing workspace" />
```

## Custom indicator

```html
<neural-loading-overlay [active]="thinking()" label="AI is thinking">
  <workspace-view />

  <ng-template neuralLoadingIndicator>
    <div class="ai-loader">NN</div>
  </ng-template>
</neural-loading-overlay>
```

The custom indicator panel receives polite status semantics. Do not add a
second live region unless the custom content needs a distinct announcement.

## Headless mode

```html
<neural-loading-overlay
  [active]="loading()"
  unstyled
  overlayClass="my-loader"
  [classes]="{
    content: 'my-loader__content',
    backdrop: 'my-loader__backdrop',
    panel: 'my-loader__panel',
    indicator: 'my-loader__indicator',
    label: 'my-loader__label'
  }"
>
  <app-content />
</neural-loading-overlay>
```

`unstyled` removes NeuralNg visual classes while retaining blocking behavior,
native semantics, structural positioning, and timing. Global headless mode is
available through `provideNeuralNg({ unstyled: true })`.

Typed slots are `root`, `content`, `backdrop`, `panel`, `indicator`, and
`label`. Theme tokens use the `--neural-loading-overlay-*` prefix.

`LoadingOverlayComponent` and `LoadingIndicatorDirective` remain deprecated
compatibility aliases. New code should use `NeuralLoadingOverlay` and
`NeuralLoadingIndicator`.
