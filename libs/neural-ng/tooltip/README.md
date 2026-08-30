# @neural-ng/core/tooltip

Accessible, text-only tooltips for Angular 22+. Beta.

```ts
import { NeuralTooltip, type NeuralTooltipClasses } from '@neural-ng/core/tooltip';
```

```html
<button neuralTooltip="Delete account">Delete</button>

<button neuralTooltip="Saved automatically" tooltipPosition="bottom-start" [showDelay]="150" [hideDelay]="50">Save</button>
```

## API

- `neuralTooltip: string` — plain tooltip text.
- `tooltipPosition` — `top` (default), `top-start`, `top-end`, `bottom`,
  `bottom-start`, `bottom-end`, `left`, or `right`.
- `tooltipDisabled: boolean` — prevents the tooltip from opening.
- `showDelay: number` — defaults to `300` ms.
- `hideDelay: number` — defaults to `80` ms.
- `tooltipId: string` — optional stable accessible ID.
- `tooltipClass: string` — class added to the floating root.
- `classes: NeuralTooltipClasses` — typed `root`, `content`, and `arrow` slots.
- `unstyled: boolean` — removes visual classes while preserving structural
  hooks and behavior. Global `provideNeuralNg({ unstyled: true })` also applies.

`top-start`, `top-end`, `bottom-start`, and `bottom-end` align the matching
logical edges of the tooltip and trigger. Their arrow follows the same corner.
Override `--neural-tooltip-arrow-corner-offset` to adjust the arrow inset.

The directive opens on hover and focus, closes on leave and blur, and dismisses
immediately with Escape. It preserves pre-existing `aria-describedby` tokens.
Tooltip content is descriptive and non-interactive; use Neural Popover for
buttons, links, forms, or rich templates.

Native disabled controls do not emit the pointer/focus events a directive
needs. Put the tooltip on a focusable wrapper when a disabled control requires
an explanation.

The directive also exposes readonly `visible` state and imperative `show()` /
`hide(immediate?)` methods.

`TooltipDirective` remains as a deprecated compatibility alias. New code
should import `NeuralTooltip`.
