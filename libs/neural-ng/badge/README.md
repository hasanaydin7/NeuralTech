# NeuralNg Badge

Compact status, count, and metadata indicators for Angular 22+.

```ts
import { NeuralBadge, NeuralBadgeDirective, type NeuralBadgeClasses } from '@neural-ng/core/badge';
```

```html
<neural-badge [value]="128" [max]="99" severity="info" />
<neural-badge dot severity="success" ariaLabel="Online" />
<neural-badge severity="success">
  <i class="nt nt-check"></i>
  Verified
</neural-badge>
```

`value` accepts strings and numbers. Numeric values above `max` are visually
capped while the real value remains available through `aria-label`. Zero and
negative values are rendered normally. When `value` is absent, projected
content is displayed.

Semantic severities are `primary`, `secondary`, `neutral`, `info`, `success`,
`warning`, and `error`. Sizes are `small`, `medium`, and `large`. `rounded` defaults to
`true`; `dot` creates a visual-only dot and should be paired with `ariaLabel`
when it conveys meaning. Use `badgeHidden` to hide the badge explicitly without
treating zero as empty. `ariaLive` accepts `off`, `polite`, or `assertive`.

`unstyled` removes NeuralNg visual classes while preserving structural hooks.
Typed class slots are `root`, `value`, and `content`.

## Badge directive

`NeuralBadgeDirective` attaches the real `NeuralBadge` to any suitable anchor:

```html
<button aria-label="Notifications, 8 unread" [neuralBadge]="8" neuralBadgePosition="top-end" neuralBadgeSeverity="error">
  <i class="nt nt-bell" aria-hidden="true"></i>
</button>
```

Available positions are `start`, `end`, `top-start`, `top-end`,
`bottom-start`, and `bottom-end`. Corner positions use logical CSS, follow
RTL automatically, and do not affect layout. `null` and `undefined` remove the
generated Badge host; zero remains visible. A dot can omit a value:

```html
<span neuralBadge="" neuralBadgeDot neuralBadgePosition="bottom-end" neuralBadgeAriaLabel="Online"> Avatar </span>
```

Directive inputs are:

| Input                  | Default   | Purpose                                |
| ---------------------- | --------- | -------------------------------------- |
| `neuralBadge`          | `null`    | String or numeric value.               |
| `neuralBadgePosition`  | `top-end` | Inline or logical-corner placement.    |
| `neuralBadgeSeverity`  | `neutral` | Semantic Badge severity.               |
| `neuralBadgeSize`      | `small`   | Badge size.                            |
| `neuralBadgeMax`       | `null`    | Numeric visual cap.                    |
| `neuralBadgeAriaLabel` | `null`    | Accessible Badge label.                |
| `neuralBadgeAriaLive`  | `off`     | Live-region behavior.                  |
| `neuralBadgeClass`     | `''`      | Consumer class for the Badge root.     |
| `neuralBadgeHostClass` | `''`      | Consumer class for the generated host. |
| `neuralBadgeRounded`   | `true`    | Rounded visual treatment.              |
| `neuralBadgeDot`       | `false`   | Render a dot instead of a value.       |
| `neuralBadgeHidden`    | `false`   | Explicitly remove the generated Badge. |
| `neuralBadgeUnstyled`  | `false`   | Remove the Badge visual layer.         |

The anchor receives the structural `neural-badge-anchor` class. Overlay offset
and stacking are controlled with `--neural-badge-anchor-offset` and
`--neural-badge-anchor-z-index`. Replaced or void elements such as `img` and
`input` should be placed inside a wrapper carrying the directive. The generated
component is attached in Angular's hydration-safe post-render phase so the
server and client never create duplicate Badge nodes.

Button uses this same directive internally through its shorter `badge` inputs:

```html
<neural-button [badge]="12" badgePosition="end" badgeSeverity="error"> Notifications </neural-button>
```

Use Button's integration when Badge belongs to a NeuralNg action, the directive
for arbitrary anchors, and `<neural-badge>` for standalone inline indicators.

## Compatibility aliases

`BadgeComponent` and `BadgeDirective` remain exported as deprecated aliases for
early alpha consumers. New code and generated code must use `NeuralBadge` and
`NeuralBadgeDirective`.

## Beta boundary

Badge Beta includes standalone values, numeric caps, projected content, dots,
semantic severities, three sizes, live-region control, explicit visibility,
typed class slots, global/local unstyled behavior, arbitrary-anchor placement,
logical RTL positions, hydration-safe creation, and Button composition. Badge
does not own anchor interaction, tooltip behavior, or Tag semantics.
