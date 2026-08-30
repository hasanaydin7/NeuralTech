# NeuralNg Appearance

`@neural-ng/core/appearance` is the application-level appearance controller for
NeuralNg. One provider coordinates primary and surface palettes, light/dark/system
mode, logical direction, persistence, cross-tab synchronization, and the DOM
contract consumed by NeuralNg themes.

## Setup

Import the Neutral theme once, then register the core and appearance providers:

```css
@import '@neural-ng/core/themes/neutral.css';
```

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralAppearance } from '@neural-ng/core/appearance';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({
      density: 'comfortable',
      unstyled: false,
    }),
    provideNeuralAppearance({
      primary: 'violet',
      surface: 'ocean-ink',
      mode: 'system',
      direction: 'auto',
      storageKey: 'product-appearance',
    }),
  ],
};
```

Do not also register `provideNeuralColorMode()`. Appearance configures and
exposes the same color-mode controller internally.

## Runtime API

```ts
import { Component, inject } from '@angular/core';
import { NeuralAppearanceService } from '@neural-ng/core/appearance';

@Component({
  selector: 'app-appearance-picker',
  template: `
    <output>
      {{ appearance.primary() }} / {{ appearance.surface() }} /
      {{ appearance.resolvedMode() }}
    </output>
  `,
})
export class AppearancePicker {
  readonly appearance = inject(NeuralAppearanceService);

  useViolet(): void {
    this.appearance.setPrimary('violet');
  }

  useDarkMode(): void {
    this.appearance.setMode('dark');
  }

  useRtl(): void {
    this.appearance.setDirection('rtl');
  }
}
```

| API                       | Meaning                                            |
| ------------------------- | -------------------------------------------------- |
| `primary()`               | Active registered primary palette name             |
| `surface()`               | Active registered surface palette name             |
| `mode()`                  | User preference: `light`, `dark`, or `system`      |
| `resolvedMode()`          | Concrete `light` or `dark` mode                    |
| `isDark()`                | Convenience boolean Signal                         |
| `direction()`             | Configured `auto`, `ltr`, or `rtl` direction       |
| `resolvedDirection()`     | Concrete `ltr` or `rtl` direction                  |
| `snapshot()`              | Computed serializable appearance state             |
| `setPrimary(name)`        | Apply and persist a registered primary palette     |
| `setSurface(name)`        | Apply and persist a registered surface palette     |
| `setMode(mode)`           | Apply and persist color-mode preference            |
| `toggleMode()`            | Toggle the current concrete light/dark mode        |
| `setDirection(direction)` | Apply and persist logical direction                |
| `setRtl(enabled)`         | Boolean direction convenience command              |
| `reset()`                 | Restore provider defaults and clear stored choices |

The exported `NEURAL_PRIMARY_PALETTES` and `NEURAL_SURFACE_PALETTES` arrays can
render an application-owned appearance picker without copying NeuralNg's
catalog.

## Custom palettes

Register custom names at bootstrap before selecting them:

```ts
provideNeuralAppearance({
  primary: 'brand',
  primaryPalettes: [
    {
      value: 'brand',
      label: 'Brand',
      color: '#7c3aed',
    },
  ],
});
```

When a custom primary supplies only `color`, NeuralNg derives steps 50–950 with
CSS `color-mix()`. Supply a complete `NeuralPrimaryScale` when exact brand
values are required. Custom surfaces require a complete
`NeuralSurfaceScale`, including step 0, because surface contrast must remain
deterministic in both modes. A custom palette with the same `value` replaces
the built-in definition.

## DOM and CSS contract

Appearance writes only namespaced state to `document.documentElement`:

```html
<html dir="rtl" data-neural-direction="rtl" data-neural-mode="dark" data-neural-primary="violet" data-neural-surface="ocean-ink"></html>
```

It updates `--neural-color-primary-50..950` and
`--neural-color-surface-0..950`. Neutral semantic and component tokens consume
those primitives automatically. The service does not add a generic `.dark`
class and does not require Tailwind.

For Tailwind CSS v4, opt into the existing bridge:

```css
@import 'tailwindcss';
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/tailwind.css';

@custom-variant dark (
  &:where([data-neural-mode='dark'], [data-neural-mode='dark'] *)
);
```

Utilities such as `bg-primary-500`, `text-surface-950`, and
`dark:bg-surface-900` then follow runtime appearance changes.

## Persistence, SSR, and first paint

The default storage prefix is `neural-appearance`. It creates separate
`-primary`, `-surface`, `-mode`, and `-direction` keys. Set `storageKey: null`
to disable persistence. Valid changes synchronize across browser tabs.

No storage, media-query, or DOM access occurs during server rendering. SSR uses
deterministic provider defaults. If persisted browser choices must be visible
before the first paint, mirror the same keys in an application-owned,
CSP-compatible head bootstrap script; browser-only storage cannot be known by
the server.
