# NeuralNg Toast v0.1 Beta

Modern Angular 22+ Toast renderer for the headless Signal store in
`@neural-ng/core/message`. Toast is standalone, SSR-safe, direction-aware,
themeable, and fully consumer-stylable.

Current component maturity: `beta`.

## Setup

Register the Message API once. Toast configuration is optional:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast } from '@neural-ng/core/toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({ unstyled: false }),
    provideNeuralMessages(),
    provideNeuralToast({
      position: 'top-end',
      showProgress: true,
    }),
  ],
};
```

`provideNeuralNg()` and `provideNeuralToast()` may be omitted when their defaults
are sufficient. `provideNeuralMessages()` is required because it owns notification
state.

Import the standalone renderer:

```ts
import { Component } from '@angular/core';
import { NeuralToast } from '@neural-ng/core/toast';

@Component({
  imports: [NeuralToast],
  template: `<neural-toast />`,
})
export class App {}
```

The zero-configuration form renders the `global` channel at `top-end`:

```html
<neural-toast />
```

## Send messages

```ts
import { Component, inject } from '@angular/core';
import { NeuralMessageService } from '@neural-ng/core/message';

@Component({
  /* ... */
})
export class SaveAction {
  private readonly messages = inject(NeuralMessageService);

  save(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Saved',
      message: 'Your changes are ready.',
    });
  }
}
```

Button and Toast are intentionally decoupled. Call MessageService from a Button
`clicked` handler or application service; Button never creates notifications by
itself.

## Inputs and defaults

Component inputs override `provideNeuralToast()`, which overrides library defaults.
Global `provideNeuralNg({ unstyled: true })` forces all participating components
into unstyled mode.

| Input                | Effective default          | Purpose                                           |
| -------------------- | -------------------------- | ------------------------------------------------- |
| `channel`            | `'global'`                 | Renders only this Message channel.                |
| `position`           | `'top-end'`                | Selects one of nine logical viewport positions.   |
| `ariaLabel`          | `'Notifications'`          | Labels the Toast region.                          |
| `closeLabel`         | `'Close notification'`     | Prefix for native close-button labels.            |
| `toastClass`         | `''`                       | Adds classes to the fixed outlet.                 |
| `messageClass`       | `''`                       | Adds classes to every rendered message.           |
| `icon`               | `true`                     | Shows the default message icon.                   |
| `iconClass`          | automatic by severity      | Overrides the icon class on every message.        |
| `unstyled`           | global value, then `false` | Removes built-in visual classes and animation.    |
| `pauseOnInteraction` | `true`                     | Pauses finite timers on hover, focus, or swipe.   |
| `showProgress`       | `false`                    | Shows a duration-synchronized progress bar.       |
| `swipeToDismiss`     | `true`                     | Allows touch/pen horizontal dismissal.            |
| `swipeThreshold`     | `72`                       | Required horizontal swipe distance in CSS pixels. |
| `animated`           | `true`                     | Enables modern enter/leave classes.               |

Boolean inputs support attribute syntax:

```html
<neural-toast showProgress />
<neural-toast [swipeToDismiss]="false" />
<neural-toast [icon]="false" />
<neural-toast unstyled />
```

Invalid empty channels, labels, positions, or non-positive swipe thresholds fail
early with a descriptive error.

## Positions and channels

Positions use logical `start` and `end` and therefore follow document direction:

- `top-start`, `top-center`, `top-end`
- `middle-start`, `middle-center`, `middle-end`
- `bottom-start`, `bottom-center`, `bottom-end`

```html
<neural-toast channel="billing" position="middle-center" /> <neural-toast channel="uploads" position="bottom-start" />
```

Use one outlet per channel. Development mode warns when multiple outlets render the
same channel.

## Global and headless styling

Enable unstyled mode application-wide:

```ts
provideNeuralNg({ unstyled: true });
```

Or enable it for one Toast:

```html
<neural-toast unstyled toastClass="fixed right-4 top-4 grid gap-3" messageClass="grid bg-slate-950 text-white" />
```

`unstyled` removes built-in visual message, close, progress, and animation styles.
It preserves state, channel filtering, positioning hooks, timers, swipe, native
controls, live regions, and dismissal behavior.

## Type-safe custom template

Import both standalone declarations when using a template:

```ts
import { NeuralToast, NeuralToastTemplateDirective } from '@neural-ng/core/toast';

@Component({
  imports: [NeuralToast, NeuralToastTemplateDirective],
})
export class App {}
```

```html
<neural-toast channel="custom">
  <ng-template neuralToastTemplate let-message let-dismiss="dismiss" let-paused="paused" let-remaining="remaining" let-progress="progress">
    <article class="my-toast">
      <strong>{{ message.title }}</strong>
      <span>{{ message.message }}</span>
      <span>{{ progress === null ? 'Persistent' : progress }}</span>
      <button type="button" (click)="dismiss()">Close</button>
    </article>
  </ng-template>
</neural-toast>
```

`NeuralToastTemplateContext` exposes:

| Property               | Type                  | Meaning                                       |
| ---------------------- | --------------------- | --------------------------------------------- |
| `$implicit`, `message` | `NeuralMessageRecord` | Current immutable message.                    |
| `dismiss`              | `() => void`          | Dismisses with reason `user`.                 |
| `paused`               | `boolean`             | Current interaction pause state.              |
| `remaining`            | `number \| null`      | Remaining milliseconds at context evaluation. |
| `progress`             | `number \| null`      | Remaining ratio from `0` to `1`.              |

The template replaces default message content, not the structural outlet, timer,
animation, swipe, or accessibility infrastructure.

## Lifetime, progress, and interaction

- Finite timers start only after browser rendering.
- Timer completion dismisses with reason `timeout`.
- Hover, keyboard focus, and an active swipe pause all finite timers together.
- Resume continues from the actual remaining duration.
- `duration: null` is persistent and has no progress bar.
- `pauseOnInteraction="false"` disables interaction pausing.
- Progress uses the same duration and pause state as the JavaScript timer.

Horizontal touch or pen gestures use Pointer Events and pointer capture. Vertical
page scrolling remains available through `touch-action: pan-y`. Swipe never dismisses
a message whose `dismissible` value is false.

## Animation

Toast v0.1 uses Angular's compiler-native `animate.enter` and `animate.leave` with
native CSS keyframes. It does not import the deprecated `@angular/animations`
package and does not require `provideAnimations()`.

Animation direction follows Toast position. CSS respects
`prefers-reduced-motion: reduce`. Disable per outlet when required:

```html
<neural-toast [animated]="false" />
```

## Accessibility

- Polite and assertive live regions exist before messages are inserted.
- `neutral`, `info`, and `success` are announced politely.
- `warning` and `error` are announced assertively.
- Toast never moves focus automatically.
- The default close control is a native `button` with a localized label.
- Focus and hover pause finite content so users have more reading time.
- Persistent messages are supported with `duration: null`.
- Development mode warns about `duration: null` plus `dismissible: false`, because
  that message can only be removed through MessageService.

## SSR, hydration, mobile, and RTL

- Browser timers and outlet registration start with `afterNextRender`.
- No browser global is read during server rendering.
- Logical CSS positions support RTL without a second position API.
- Mobile width adapts below 40rem.
- Insets include CSS safe-area environment values for notched devices.

## Theme tokens

Import the stable neutral theme once:

```css
@import '@neural-ng/core/themes/neutral.css';
```

Toast tokens include size, inset, stack gap, severity-tinted surfaces, borders, accents,
focus ring, progress track, enter/leave duration, and swipe reset duration. Glass
and Futuristic remain experimental token-only overrides. All included themes
respond to the independent `data-neural-mode="light|dark"` contract.

## Icons

Toast shows a decorative severity icon by default:

| Severity  | Default class          |
| --------- | ---------------------- |
| primary   | `nt nt-settings`       |
| secondary | `nt nt-bell`           |
| neutral   | `nt nt-bell`           |
| info      | `nt nt-info-circle`    |
| success   | `nt nt-circle-check`   |
| warning   | `nt nt-alert-triangle` |
| error     | `nt nt-circle-times`   |

Install and import the optional Neural Icons package to render the defaults:

```sh
npm install @neural-ng/icons
```

```css
@import '@neural-ng/icons/icons.css';
```

Disable the icon or replace it per outlet:

```html
<neural-toast [icon]="false" />
<neural-toast iconClass="nt-user" />
<neural-toast iconClass="pi pi-info-circle" />
```

When `iconClass` starts with an `nt-*` class, Toast adds the required `nt` base
class automatically. Other class systems remain unchanged. Icons are
`aria-hidden`; live-region announcements continue to use the message text.
Custom `neuralToastTemplate` content owns its complete visual structure, so the
two icon inputs do not inject content into a custom template.
