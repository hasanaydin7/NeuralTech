# NeuralNg Switch

Native, Signal-first boolean switch for Angular 22+.

## Import

```ts
import { NeuralSwitch, type NeuralSwitchChange } from '@neural-ng/core/switch';
```

## Basic usage

```html
<neural-switch [(checked)]="notifications" (stateChange)="notificationsChanged($event)"> Notifications </neural-switch>
```

The component contains a real `<input type="checkbox" role="switch">`.
`checked` is a boolean model and produces `checkedChange` for two-way binding.
`stateChange` emits `{ checked, previousChecked, nativeEvent }` only for user
actions. Programmatic model updates do not emit it.

Switch is deliberately binary. Use `NeuralTriStateCheckbox` when a null or
mixed state is part of the domain.

## Angular Forms

`NeuralSwitch` implements `FormCheckboxControl`. Its single authoritative
model is `checked: boolean`, so Signal Forms, Reactive Forms, and
`ngModel` bind to the same contract.

```html
<neural-switch [formField]="form.notifications"> Signal notifications </neural-switch>
<neural-switch [formControl]="notificationsControl"> Reactive notifications </neural-switch>
<neural-switch name="notifications" [(ngModel)]="notifications"> Template notifications </neural-switch>
```

Programmatic writes update `checked` without emitting `stateChange`. A user
change writes through the active forms adapter and emits one detailed
`stateChange`. The native input emits `touch` on blur.

## State labels

```html
<neural-switch [(checked)]="active" onLabel="On" offLabel="Off" ariaLabel="Account status" />
```

`onLabel` and `offLabel` are optional visual text inside the track and are
hidden from the accessibility tree. Provide projected label content or
`ariaLabel` as the accessible name.

## Readonly

Unlike `disabled`, `readonly` keeps the native input focusable and marks it with
`aria-readonly="true"`, but blocks pointer and keyboard state changes. This
makes an immutable value discoverable in keyboard navigation.

## Native behavior

The native input preserves label activation, Space, focus, disabled, required,
name, input value, constraint validation, and form submission. A checked switch
submits `inputValue`; unchecked switches are omitted by native form submission.

## Styling

`unstyled` removes NeuralNg visual classes while retaining the native input,
structure, state hooks, semantics, and consumer classes. Global and Field-level
unstyled mode are inherited.

Use `switchClass`, `inputClass`, `labelClass`, or typed `classes` slots: `root`,
`input`, `track`, `checkedTrack`, `thumb`, `label`, `onLabel`, and `offLabel`.

The neutral theme exposes `--neural-switch-*` tokens.

## Field composition

Inside `neural-field`, Switch inherits the deterministic control id,
descriptions, required, invalid, disabled, readonly, fluid, and unstyled state.

`SwitchComponent` remains available as a deprecated compatibility alias.
