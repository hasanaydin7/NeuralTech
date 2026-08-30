# NeuralNg Select v0.1 Beta

Accessible, Signal-first combobox/listbox for Angular 22+.

Current component maturity: `beta`.

## Import

```ts
import { OptionComponent, NeuralSelect, type NeuralSelectChange } from '@neural-ng/core/select';
```

## Data options

```html
<neural-select [options]="cities" optionLabel="name" optionValue="id" optionDisabled="unavailable" optionIcon="iconClass" [(value)]="cityId" placeholder="Select a city" clearable (selectionChange)="citySelected($event)" (cleared)="cityCleared()" />
```

Primitive arrays work without field mappings:

```html
<neural-select [options]="['Small', 'Medium', 'Large']" [(value)]="size" />
```

## Declarative options

Use projected options when custom option content is needed. `label` remains
required for the selected value, typeahead, and accessible text.

```html
<neural-select [(value)]="status">
  <neural-option value="ready" label="Ready" iconClass="nt-circle-check">
    <strong>Ready</strong>
  </neural-option>
  <neural-option value="paused" label="Paused">Paused</neural-option>
</neural-select>
```

Use either `[options]` or projected `neural-option` children in one Select.
When both are present, `[options]` is authoritative and a development warning
is emitted.

## Angular Forms

`NeuralSelect` implements `FormValueControl<TValue | null>`. Bind the same
nullable `value` model through any Angular Forms adapter:

```html
<!-- Signal Forms -->
<neural-select [options]="cities" [formField]="form.city" />

<!-- Reactive Forms -->
<neural-select [options]="cities" [formControl]="cityControl" />

<!-- Template-driven Forms -->
<neural-select [options]="cities" name="city" [(ngModel)]="city" />
```

Programmatic form writes update selection without emitting `selectionChange`.
Only pointer and keyboard selection emit the semantic event. `reset()` restores
`null`, `focus()` targets the combobox trigger, and `touch` is emitted when
focus leaves the control.

## State and events

- `value` is a `TValue | null` model and produces `valueChange` for two-way
  binding.
- `selectionChange` emits `{ value, previousValue, option, source }` only when
  a user changes the selected value.
- `cleared` emits `{ previousValue }` for an explicit user clear action.
- `openChange` emits the panel state.
- Selecting the current value again closes the panel without a duplicate
  semantic event.

Readonly is distinct from disabled. A readonly Select remains enabled and
focusable, exposes `aria-readonly="true"`, can open for inspection, and blocks
pointer, keyboard, and clear mutations. Disabled Selects use the native disabled
button state and leave the tab order. Programmatic value writes continue to work
in both states.

Use `appendTo="body"` when the Select lives inside an overflow-clipped table,
dialog, or scroll surface. The panel enters the browser top layer and uses the
shared logical Overlay positioner with `bottom-start` placement, viewport
flipping, and automatic resize/scroll updates. The default is
`appendTo="self"`.

## Chained selects

Update or compute the second options array from the first Select's model. Reset
the dependent model when `selectionChange` fires. Use `loading` while async
options are fetched.

## Styling

`unstyled` removes visual classes while retaining structure and behavior.
Global unstyled mode and `neural-field` unstyled mode are inherited. Use
`selectClass` for the root and `classes` for typed slots.

The stable neutral theme exposes `--neural-select-*` tokens. Icons beginning
with `nt-` automatically receive the Neural Icons `nt` base class.

## Accessibility

The trigger uses `role="combobox"` and keeps DOM focus while the active option
is exposed through `aria-activedescendant`. The popup uses listbox/option
semantics. Arrow keys, Home, End, Enter, Space, Escape, Tab, and typeahead are
supported. Disabled options are skipped.

Inside `neural-field`, Select inherits the deterministic control id,
descriptions, required, invalid, disabled, readonly, fluid, and unstyled state.
Field-provided readonly remains distinct from disabled and preserves the
combobox tab stop.

For large fixed-height lists, enable `virtualScroll` and configure
`virtualItemSize`, `virtualScrollHeight`, and `virtualOverscan`. Only the
overscanned viewport is rendered while listbox size and position metadata stay
available to assistive technology. Option paths may be nested, for example
`optionLabel="profile.name"`.
