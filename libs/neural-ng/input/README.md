# NeuralNg Input

Native, Signal Forms-ready text input enhancement for Angular 22+.

Current component maturity: `beta`.

## Import

```ts
import { NeuralInput, NeuralInputGroup } from '@neural-ng/core/input';
```

Add `NeuralInput` to the consumer component's `imports` array, then apply
`neuralInput` to a native input:

```html
<label for="email">Email</label> <input neuralInput id="email" name="email" type="email" autocomplete="email" />
```

Despite its Angular class name, Input does not render a custom element or an
inner wrapper. The host remains the real native `<input>`.

## Why a native enhancer

Native input attributes, browser validation, autofill, password managers,
mobile keyboards, labels, form submission, and accessibility semantics remain
available without a forwarding API. Use it with text-like input types such as
`text`, `email`, `password`, `search`, `tel`, and `url`.

Checkbox, radio, range, color, file, date/time, and numeric controls have
different interaction and styling contracts and will receive dedicated
NeuralNg APIs where appropriate.

## Angular Signal Forms

Angular's stable v22 Signal Forms directive binds directly to the native host:

```ts
import { FormField, email, form, required } from '@angular/forms/signals';

readonly model = signal({ email: '' });
readonly accountForm = form(this.model, (path) => {
  required(path.email, { message: 'Email is required.' });
  email(path.email, { message: 'Enter a valid email address.' });
});
```

```html
<label for="account-email">Email</label>
<input
  neuralInput
  id="account-email"
  type="email"
  [formField]="accountForm.email"
  [attr.aria-invalid]="
    accountForm.email().touched() && accountForm.email().invalid()
      ? 'true'
      : null
  "
/>
```

Import `FormField` in the consuming component. NeuralNg does not wrap or
reimplement it. Because the host is native, Reactive Forms, Template-driven
Forms, and plain HTML forms also keep their normal binding behavior.

Signal Forms exposes field state but does not author the application's error
announcement. Bind `aria-invalid` when the field should be presented as
invalid, render a correction message, and include that message ID in
`aria-describedby`.

For automatic label, hint, error, and state wiring, compose Input inside
`FieldComponent` from `@neural-ng/core/field`. A Field supplies Input's `id`,
ARIA relationships, state, fluid width, and inherited unstyled mode without
changing the native host.

## Template-driven and Reactive Forms

Template-driven Forms uses Angular's native input value accessor. Import
`FormsModule` and bind `ngModel` normally:

```ts
import { FormsModule } from '@angular/forms';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [FormsModule, NeuralInput] })
export class ProfileForm {
  displayName = '';
}
```

```html
<input neuralInput name="displayName" [(ngModel)]="displayName" />
```

Reactive Forms works through the same native host and does not require a
NeuralNg ControlValueAccessor:

```ts
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [ReactiveFormsModule, NeuralInput] })
export class ProfileForm {
  readonly displayName = new FormControl('', { nonNullable: true });
}
```

```html
<input neuralInput [formControl]="displayName" />
```

## Fluid width

The default width follows native inline sizing. Add `fluid` for full container
width:

```html
<input neuralInput fluid type="search" />
```

## Start and end icons

Compose the native input inside `NeuralInputGroup`. Logical start/end positions
follow LTR and RTL without changing native Forms, autofill, or accessibility
behavior:

```ts
import { NeuralInput, NeuralInputGroup } from '@neural-ng/core/input';

@Component({ imports: [NeuralInput, NeuralInputGroup] })
export class SearchField {}
```

```html
<neural-input-group startIcon="nt nt-search" endIcon="nt nt-user" fluid>
  <input neuralInput aria-label="Search users" />
</neural-input-group>
```

The decorative icons are hidden from assistive technology. Keep the accessible
name on the native input. `iconClass` adds a class to both icons;
`inputGroupClass` targets the group root. Local and global `unstyled` modes
retain only structural hooks.

## Sizes and variants

`inputSize` changes visual density without consuming the native HTML `size`
attribute. The native attribute remains available for its standard character
width behavior.

```html
<input neuralInput inputSize="small" size="20" aria-label="Small search" />
<input neuralInput inputSize="medium" aria-label="Default search" />
<input neuralInput inputSize="large" aria-label="Large search" />
```

The default `outlined` variant uses the standard bordered surface. Use
`variant="filled"` for a quieter filled surface:

```html
<input neuralInput variant="filled" placeholder="Filled input" />
```

## Accessibility and errors

Input does not invent a label. Use a native `<label for>` or a valid accessible
name. A placeholder is not a replacement for a label.

Connect instructions and error text with `aria-describedby`. Set
`aria-invalid="true"` only when the field is actually invalid; this activates
the theme's invalid state without replacing the error description:

```html
<label for="username">Username</label>
<input neuralInput id="username" aria-invalid="true" aria-describedby="username-error" />
<small id="username-error">Use at least three characters.</small>
```

`disabled` and `readonly` remain distinct native states. Use `readonly` when a
value should remain visible and submitted but not editable.

## Classes, tokens, and unstyled mode

There is no `inputClass` input because the component host is the native input.
Use Angular's normal class APIs directly:

```html
<input neuralInput class="account-field" [class.compact]="compact()" />
```

`unstyled` removes visual `neural-input-base` and fluid classes while retaining
the structural `neural-input-root` hook and native behavior. Global
`provideNeuralNg({ unstyled: true })` is also respected.

```html
<input neuralInput unstyled class="my-complete-input" />
```

Reference themes expose `--neural-input-*` tokens for dimensions, typography,
placeholder, background, border, shadow, hover/focus/invalid/readonly/disabled
states, and motion. `prefers-reduced-motion: reduce` makes transitions
effectively immediate.

## Public API

| Input       | Type                             | Default      | Purpose                                               |
| ----------- | -------------------------------- | ------------ | ----------------------------------------------------- |
| `inputSize` | `'small' \| 'medium' \| 'large'` | `'medium'`   | Select visual density without hijacking native `size` |
| `variant`   | `'outlined' \| 'filled'`         | `'outlined'` | Select the token-driven visual treatment              |
| `fluid`     | `boolean`                        | `false`      | Use full container width in styled mode               |
| `unstyled`  | `boolean`                        | `false`      | Remove NeuralNg visual and fluid classes              |

The exported component instance also provides `focus(options?)` and `select()`
methods that delegate to the native input. Native DOM properties and events
remain available on the element itself.

The entry point also exports `NeuralInputSize` and `NeuralInputVariant`.

`NeuralInputGroup` exports `startIcon`, `endIcon`, `fluid`, `unstyled`,
`inputGroupClass`, and `iconClass` inputs. Clear buttons, masks, and password
visibility controls remain specialized component responsibilities.
