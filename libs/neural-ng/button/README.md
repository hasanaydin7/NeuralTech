# NeuralNg Button

`NeuralButton` is a standalone, signal-based Angular 22+ component available
from the `@neural-ng/core/button` secondary entry point. It renders a native
`<button>` and supports themed, class-driven, and headless usage.

## Setup

Install the package:

```sh
npm install @neural-ng/core
```

Import the neutral reference theme once in the application's global stylesheet:

```css
@import '@neural-ng/core/themes/neutral.css';
```

Import the standalone component directly:

```ts
import { Component } from '@angular/core';
import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';

@Component({
  standalone: true,
  imports: [NeuralButton, NeuralButtonGroup],
  template: ` <neural-button label="Save" icon="nt nt-check" (clicked)="save($event)" /> `,
})
export class SaveActionComponent {
  save(event: MouseEvent): void {
    console.log(event);
  }
}
```

### Experimental Themes

Glass, Mist, and Futuristic are optional token-only presets. Import the desired
stylesheets after the neutral theme and activate it on an application or subtree:

```css
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/experimental/glass.css';
@import '@neural-ng/core/themes/experimental/mist.css';
@import '@neural-ng/core/themes/experimental/futuristic.css';
```

```html
<main data-neural-theme="glass">
  <neural-button>Glass button</neural-button>
</main>

<section data-neural-theme="mist">
  <neural-button>Mist button</neural-button>
</section>

<section data-neural-theme="futuristic">
  <neural-button>Futuristic button</neural-button>
</section>
```

These stylesheets define `--neural-button-*` values only. They do not add
component selectors, markup assumptions, or utility classes. Their values are
experimental and may change before a stable release.

All included themes support `data-neural-mode="light|dark"`. Color mode is
independent from `data-neural-theme`; use the optional
`@neural-ng/core/color-mode` controller or manage the namespaced attribute in
the application.

## Public API

### Inputs

| Input              | Type                                     | Default     | Description                                                                        |
| ------------------ | ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `type`             | `'button' \| 'submit' \| 'reset'`        | `'button'`  | Native button type.                                                                |
| `severity`         | `NeuralButtonSeverity`                   | `'neutral'` | Semantic intent: primary, secondary, neutral, info, success, warning, or error.    |
| `disabled`         | `boolean`                                | `false`     | Applies native disabled semantics.                                                 |
| `loading`          | `boolean`                                | `false`     | Prevents activation while keeping the button focusable.                            |
| `loadingLabel`     | `string`                                 | `'Loading'` | Visible content and accessible name used while loading.                            |
| `ariaLabel`        | `string \| null`                         | `null`      | Accessible name for icon-only buttons. Prefer visible text when possible.          |
| `ariaExpanded`     | `'true' \| 'false' \| null`              | `null`      | Disclosure state forwarded to the native button.                                   |
| `ariaControls`     | `string \| null`                         | `null`      | ID of the disclosure surface controlled by the button.                             |
| `ariaKeyShortcuts` | `string \| null`                         | `null`      | Keyboard shortcuts exposed by a composite control.                                 |
| `title`            | `string`                                 | `''`        | Optional native title, normally supplementary to `ariaLabel`.                      |
| `label`            | `string \| null`                         | `null`      | Visible text. Supports literal and property binding; projection is the fallback.   |
| `icon`             | `string \| null`                         | `null`      | Icon class string, for example `nt nt-check`.                                      |
| `iconPosition`     | `'start' \| 'end'`                       | `'start'`   | Logical icon position around the label.                                            |
| `size`             | `'small' \| 'medium' \| 'large'`         | `'medium'`  | Preset Button size.                                                                |
| `iconSize`         | `'small' \| 'medium' \| 'large' \| null` | `null`      | Icon size override. `null` follows the Button `size`.                              |
| `outlined`         | `boolean`                                | `false`     | Uses a transparent, bordered treatment.                                            |
| `raised`           | `boolean`                                | `false`     | Adds elevation and composes with solid, outlined, or text treatments.              |
| `text`             | `boolean`                                | `false`     | Uses a transparent, borderless treatment.                                          |
| `rounded`          | `boolean`                                | `false`     | Uses the pill-shaped Button radius.                                                |
| `badge`            | `string \| number \| null`               | `null`      | Composes a Badge before or after the projected content.                            |
| `badgePosition`    | `NeuralButtonBadgePosition`              | `'end'`     | Inline or logical-corner Badge position.                                           |
| `badgeSeverity`    | `NeuralBadgeSeverity`                    | `'neutral'` | Badge semantic style.                                                              |
| `badgeSize`        | `NeuralBadgeSize`                        | `'small'`   | Badge size.                                                                        |
| `badgeMax`         | `number \| null`                         | `null`      | Numeric visual cap; the real value remains accessible.                             |
| `badgeAriaLabel`   | `string \| null`                         | `null`      | Optional explicit accessible label forwarded to Badge.                             |
| `badgeClass`       | `string`                                 | `''`        | Consumer classes applied to the Badge root.                                        |
| `buttonClass`      | `string`                                 | `''`        | Classes applied to the inner native `<button>`.                                    |
| `unstyled`         | `boolean`                                | `false`     | Removes the visual component class while retaining behavior and minimal structure. |

### Outputs

| Output          | Payload         | Description                                                   |
| --------------- | --------------- | ------------------------------------------------------------- |
| `clicked`       | `MouseEvent`    | Emits on activation unless the button is disabled or loading. |
| `keyDown`       | `KeyboardEvent` | Native keyboard stream for composite-control integrations.    |
| `pointerDown`   | `PointerEvent`  | Native pointer start for drag/resize integrations.            |
| `pointerMove`   | `PointerEvent`  | Native pointer movement for composite controls.               |
| `pointerUp`     | `PointerEvent`  | Native completed pointer interaction.                         |
| `pointerCancel` | `PointerEvent`  | Native cancelled pointer interaction.                         |

## Loading

```html
<neural-button [loading]="isSaving()" loadingLabel="Saving" (clicked)="save()"> Save changes </neural-button>
```

While loading, the normal content is replaced by the spinner and
`loadingLabel`. The native button remains in the keyboard focus order and has
`aria-busy="true"` and `aria-disabled="true"`. Click and form submission are
prevented until loading finishes.

## Label, Icon, and Size

Literal attributes and Angular bindings use the same typed inputs:

```html
<neural-button label="Create project" icon="nt nt-plus" severity="primary" />
<neural-button [label]="submitLabel()" [icon]="submitIcon()" />
<neural-button label="Continue" icon="nt nt-arrow-right" iconPosition="end" />

<neural-button label="Small" size="small" />
<neural-button label="Default" size="medium" />
<neural-button label="Large" size="large" />
<neural-button label="Compact action" icon="nt nt-check" iconSize="small" />
```

Projected content remains supported for rich labels. When `label` is present,
it is the visible label and replaces projected content. `start` and `end` are
logical positions, so icon order follows the document direction.

When `icon` is present and neither `label` nor projected content is supplied,
the styled Button automatically uses equal inline and block dimensions. Small,
medium, and large default to 2rem, 2.5rem, and 3rem. Customize them with
`--neural-button-small-icon-only-size`, `--neural-button-icon-only-size`, and
`--neural-button-large-icon-only-size`.

`iconSize` controls only the icon glyph and accepts `small`, `medium`, or
`large`. When omitted, it follows `size`; it never changes the Button's hit
target or padding.

## Visual Variants

```html
<neural-button severity="primary" outlined>Outlined</neural-button>
<neural-button severity="primary" raised>Raised</neural-button>
<neural-button severity="primary" text>Text</neural-button>
<neural-button severity="primary" text raised>Text raised</neural-button>
<neural-button severity="primary" rounded>Rounded</neural-button>
```

`raised` and `rounded` are composable modifiers. `text` and `outlined` are
alternative treatments; if both are supplied, `text` takes precedence.

## Button Group

Import and add `NeuralButtonGroup` beside `NeuralButton`, then project Buttons:

```html
<neural-button-group ariaLabel="Text alignment">
  <neural-button icon="nt nt-align-left" ariaLabel="Align left" />
  <neural-button icon="nt nt-align-center" ariaLabel="Align center" />
  <neural-button icon="nt nt-align-right" ariaLabel="Align right" />
</neural-button-group>
```

The group renders `role="group"`, uses logical CSS for RTL, and merges adjacent
borders and radii. Set `orientation="vertical"` for a vertical group. Group
inputs are `orientation`, `ariaLabel`, `groupClass`, and `unstyled`. Global
unstyled configuration removes the visual grouping layer while preserving the
semantic group.

## Badge

```html
<neural-button [badge]="128" [badgeMax]="99" badgePosition="start" badgeSeverity="info"> Inbox </neural-button>
```

Button delegates to the general `NeuralBadgeDirective`; it does not duplicate Badge
styling or accessibility behavior. `start` and `end` are logical positions.
Zero is a visible value. Normal content and its Badge are both replaced by
loading feedback while `loading` is true. Button-level or global `unstyled`
mode also removes the nested Badge visual layer.

Notification-style corner positions are also available:

```html
<neural-button ariaLabel="Notifications, 8 unread" [badge]="8" badgePosition="top-end" badgeSeverity="error">
  <i class="nt nt-bell" aria-hidden="true"></i>
</neural-button>
```

Valid positions are `start`, `end`, `top-start`, `top-end`, `bottom-start`,
and `bottom-end`. Corner positions are absolute and do not change the button's
layout. For icon-only buttons, include meaningful Badge state in `ariaLabel`
when that state must be announced.

## Icon-only Button

```html
<neural-button icon="nt nt-x" ariaLabel="Close dialog" (clicked)="close()" />
```

## Native Form Semantics

The default type is `button` to prevent accidental form submission. Set the
native type explicitly when needed:

```html
<form (submit)="submit($event)">
  <neural-button type="submit">Submit</neural-button>
</form>
```

## Styling Contract

Button styling follows four layers:

1. `.neural-btn-root` provides minimal structural layout and is always present.
2. `.neural-btn-base` consumes Button design tokens and is removed by `unstyled`.
3. Themes define `--neural-button-*` custom properties on `:root` or a theme scope.
4. `buttonClass` applies consumer classes to the native button.

Internal selectors use zero-specificity `:where()` rules, allowing ordinary CSS
and utility classes to override NeuralNg without `!important`.

```html
<neural-button buttonClass="w-full rounded-xl"> Continue </neural-button>

<neural-button [unstyled]="true" buttonClass="my-completely-custom-button"> Fully custom </neural-button>
```

The standard `class` attribute styles the `<neural-button>` host. Use
`buttonClass` to style the inner native button.

Use `provideNeuralNg({ unstyled: true })` from `@neural-ng/core` to remove the
visual layer application-wide. The local `unstyled` input remains available for
component-level control.

## Button Tokens

- `--neural-button-background`
- `--neural-button-background-hover`
- `--neural-button-background-active`
- `--neural-button-color`
- `--neural-button-color-hover`
- `--neural-button-color-active`
- `--neural-button-border-width`
- `--neural-button-border-style`
- `--neural-button-border-color`
- `--neural-button-border-color-hover`
- `--neural-button-border-color-active`
- `--neural-button-radius`
- `--neural-button-rounded-radius`
- `--neural-button-group-radius`
- `--neural-button-shadow`
- `--neural-button-shadow-hover`
- `--neural-button-shadow-active`
- `--neural-button-raised-shadow`
- `--neural-button-raised-shadow-hover`
- `--neural-button-backdrop-filter`
- `--neural-button-padding`
- `--neural-button-gap`
- `--neural-button-font-family`
- `--neural-button-font-size`
- `--neural-button-icon-size`
- `--neural-button-small-padding`
- `--neural-button-small-font-size`
- `--neural-button-small-icon-size`
- `--neural-button-large-padding`
- `--neural-button-large-font-size`
- `--neural-button-large-icon-size`
- `--neural-button-font-weight`
- `--neural-button-line-height`
- `--neural-button-transition`
- `--neural-button-focus-ring`
- `--neural-button-focus-ring-offset`
- `--neural-button-disabled-opacity`
- `--neural-button-badge-overlay-offset`
- `--neural-button-badge-z-index`

## Accessibility

- Uses a native `<button>` with native Enter and Space activation.
- Native disabled buttons leave the keyboard focus order.
- Loading buttons retain focus and expose busy and disabled ARIA states.
- Visible content supplies the accessible name by default.
- `ariaLabel` supports icon-only controls.
- The spinner is hidden from assistive technologies.
- Styled buttons provide a `:focus-visible` ring; unstyled buttons retain the
  browser focus outline unless consumer CSS replaces it.

## SSR

Button does not access `window`, `document`, or other browser-only globals. It is
safe for Angular server rendering and hydration.

## AI Context

Machine-oriented usage rules are available in [llms.txt](./llms.txt).
