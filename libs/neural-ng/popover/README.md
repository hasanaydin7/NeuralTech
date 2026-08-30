# NeuralNg Popover

`@neural-ng/core/popover` renders arbitrary Angular content in a non-modal,
trigger-anchored top-layer panel. It composes the shared Overlay positioner and
does not impose Menu item or Dialog layout semantics.

## Basic usage

```ts
import { NeuralPopover, NeuralPopoverClose, NeuralPopoverTrigger } from '@neural-ng/core/popover';

@Component({
  imports: [NeuralPopover, NeuralPopoverClose, NeuralPopoverTrigger],
  template: `
    <button type="button" [neuralPopoverTriggerFor]="account" popoverPosition="bottom-end">Account</button>

    <neural-popover #account ariaLabel="Account panel">
      <h2>Neural Admin</h2>
      <button type="button" neuralPopoverClose>Close</button>
    </neural-popover>
  `,
})
export class AccountPanel {}
```

Use an interactive native element such as `button` for the trigger. The
directive synchronizes `aria-controls` and `aria-expanded`.

## Positioning and top layer

Available logical placements are `top`, `top-start`, `top-end`, `bottom`,
`bottom-start`, `bottom-end`, `left`, and `right`. Start and end follow the
trigger's writing direction.

```html
<button [neuralPopoverTriggerFor]="panel" popoverPosition="bottom-end" [popoverOffset]="10" [popoverViewportPadding]="12">Open</button>
```

Popover uses the native HTML Popover top layer where available. It therefore
does not need an `appendTo="body"` API and is not clipped by an ancestor's
overflow or stacking context. `NeuralOverlayPositioner` supplies CSS Anchor
Positioning or a viewport-aware fixed-position fallback with flip, clamp,
scroll, resize, and RTL behavior.

## Controlled and imperative state

```html
<neural-popover #panel [(open)]="open" />
```

```ts
panel.showFor(trigger, { position: 'bottom-end' });
panel.toggleFor(trigger);
panel.hide();
```

`opened` emits the trigger and requested position. `closed` reports one of
`trigger`, `outside`, `escape`, `close-directive`, `api`, or `native`.

## Focus and semantics

Popover is non-modal and does not trap focus. Focus remains on the disclosure
trigger by default:

```html
<neural-popover focusOnOpen="none" />
```

For an interactive panel, explicitly request initial focus:

```html
<button [neuralPopoverTriggerFor]="profile" popoverFocusOnOpen="first">Edit profile</button>

<neural-popover #profile role="dialog" ariaLabel="Edit profile">
  <input neuralPopoverInitialFocus />
</neural-popover>
```

Escape closes the topmost Popover and restores the trigger focus. Outside
pointer dismissal does not steal focus from the newly selected target.
`role="dialog"` and `role="region"` are opt-in because arbitrary disclosure
content does not always have dialog semantics. Label either role with
`ariaLabel` or `ariaLabelledby`.

Use Dialog when content must be modal or focus must remain trapped. Use Menu
for a flat command collection with menu keyboard semantics.

## Inputs

| Input               | Default        | Purpose                                    |
| ------------------- | -------------- | ------------------------------------------ |
| `open`              | `false`        | Controlled Signal model                    |
| `position`          | `bottom-start` | Component-level fallback placement         |
| `offset`            | `8`            | Trigger gap in pixels                      |
| `viewportPadding`   | `8`            | Minimum viewport edge distance             |
| `focusOnOpen`       | `none`         | `none` or first focusable control          |
| `dismissible`       | `true`         | Close on outside pointer interaction       |
| `closeOnEscape`     | `true`         | Close the topmost panel with Escape        |
| `restoreFocus`      | `true`         | Restore trigger for explicit closes        |
| `matchTriggerWidth` | `false`        | Match the active trigger width             |
| `showArrow`         | `false`        | Render the optional structural arrow       |
| `role`              | `null`         | Optional `dialog` or `region` role         |
| `ariaLabel`         | `null`         | Accessible name                            |
| `ariaLabelledby`    | `null`         | Visible accessible-name reference          |
| `ariaDescribedby`   | `null`         | Accessible-description reference           |
| `unstyled`          | `false`        | Remove NeuralNg visual classes             |
| `popoverClass`      | empty          | Consumer class on the panel root           |
| `classes`           | `{}`           | Typed `root`, `content`, and `arrow` slots |

The trigger directive accepts `popoverPosition`, `popoverOffset`,
`popoverViewportPadding`, `popoverFocusOnOpen`, and `popoverDisabled`.

## Styling

Structural classes remain in unstyled mode:

- `neural-popover-root`
- `neural-popover-content-root`
- `neural-popover-arrow-root`

Important tokens include:

```css
--neural-popover-width
--neural-popover-min-width
--neural-popover-max-width
--neural-popover-max-height
--neural-popover-padding
--neural-popover-color
--neural-popover-background
--neural-popover-border
--neural-popover-radius
--neural-popover-shadow
--neural-popover-arrow-size
--neural-popover-enter-duration
--neural-popover-leave-duration
```

Neutral, experimental Glass, and experimental Futuristic themes provide token
values. Reduced-motion preferences collapse animation duration.

## SSR

SSR renders deterministic closed markup without accessing browser globals,
opening the top layer, or connecting the positioner. Opening and positioning
begin only in the browser after the trigger and panel exist.
