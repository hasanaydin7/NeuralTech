# NeuralNg Radio

Native, Signal-first RadioGroup and Radio components for Angular 22+.

## Import

```ts
import { NeuralRadio, NeuralRadioGroup, type NeuralRadioSelectionChange } from '@neural-ng/core/radio';
```

## Data options

```html
<neural-radio-group [options]="plans" optionLabel="name" optionValue="id" optionDisabled="unavailable" optionIcon="iconClass" [(value)]="planId" (selectionChange)="planSelected($event)" />
```

`options` is the concise path for data-driven interfaces. The property inputs
default to `label`, `value`, `disabled`, and `iconClass`. Primitive options are
also supported.

## Projected options

```html
<neural-radio-group [(value)]="delivery">
  <neural-radio value="standard" iconClass="nt-truck">
    <strong>Standard</strong>
    <small>Three to five days</small>
  </neural-radio>
  <neural-radio value="express">Express</neural-radio>
</neural-radio-group>
```

Use projected `neural-radio` children when a choice needs rich content. Data
options and projected radios are alternatives; when both are present,
`options` wins.

## Angular Forms

`NeuralRadioGroup` implements `FormValueControl<TValue | null>`. Bind the
same nullable `value` model through any Angular Forms adapter:

```html
<!-- Signal Forms -->
<neural-radio-group [options]="plans" [formField]="form.plan" />

<!-- Reactive Forms -->
<neural-radio-group [options]="plans" [formControl]="planControl" />

<!-- Template-driven Forms -->
<neural-radio-group [options]="plans" name="plan" [(ngModel)]="plan" />
```

Programmatic form writes update selection without emitting `selectionChange`.
Only pointer and keyboard selection emit the semantic event. `reset()` restores
`null`, `focus()` targets the roving tab stop, and `touch` is emitted when focus
leaves the group.

## State and events

- `value` is a `TValue | null` model and produces `valueChange` for two-way
  binding.
- `selectionChange` is emitted only for user interaction and contains
  `{ value, previousValue, option, source }`.
- `source` is `pointer` or `keyboard`.
- Selecting the current value again does not clear it or emit a duplicate
  event.

## Native behavior and keyboard

Every choice contains a real `<input type="radio">` and all inputs share a
stable native name. Arrow keys move and select while skipping disabled choices.
Home and End select the first and last enabled choices. Only the selected
choice, or the first enabled choice when empty, participates in the tab order.

`orientation` accepts `vertical` (default) or `horizontal` and is exposed as
`aria-orientation`. Readonly groups remain enabled and keyboard-focusable, expose
`aria-readonly="true"`, and block pointer and keyboard mutation. Disabled
groups use native disabled inputs and leave the tab order.

## Styling

`unstyled` removes NeuralNg visual classes while keeping native inputs,
structural hooks, state, keyboard behavior, and consumer classes. Global and
Field-level unstyled mode are inherited.

Use `radioGroupClass`, the projected radio's `radioClass`, or typed `classes`
slots: `root`, `option`, `input`, `control`, `selectedControl`,
`disabledOption`, `label`, and `optionIcon`.

The neutral theme exposes `--neural-radio-*` and
`--neural-radio-group-*` tokens.

## Field composition

Inside `neural-field`, RadioGroup inherits the deterministic control id,
descriptions, required, invalid, disabled, readonly, fluid, and unstyled state.
Field-provided readonly remains distinct from disabled and preserves the roving
tab stop.

`RadioGroupComponent` and `RadioComponent` remain deprecated compatibility
aliases. New applications should import `NeuralRadioGroup` and `NeuralRadio`.
