# TreeSelect

Signal-first hierarchical selection composed from NeuralNg Tree and Popover.

Current maturity: **Beta**.

```ts
import { NeuralTreeSelect, type NeuralTreeSelectValue } from '@neural-ng/core/tree-select';
```

```html
<neural-tree-select [options]="locations" optionLabel="name" optionValue="id" optionChildren="children" [(value)]="locationId" fluid />
```

`selectionMode` accepts `single`, `multiple`, or `checkbox`. Single mode writes
one `TValue | null`; multiple modes write immutable `readonly TValue[]` values.
Use `optionKey` when the form value is an object; otherwise the string or number
`optionValue` is also the stable Tree key.

## Angular Forms

TreeSelect implements
`FormValueControl<NeuralTreeSelectValue<TValue>>`. The same `value` model works
with direct signal binding and every Angular Forms adapter:

```html
<neural-tree-select [(value)]="location" [options]="locations" />
<neural-tree-select [formField]="profileForm.location" [options]="locations" />
<neural-tree-select [formControl]="locationControl" [options]="locations" />
<neural-tree-select name="location" [(ngModel)]="location" [options]="locations" />
```

Programmatic writes and `reset()` synchronize the model without emitting
`selectionChange`, `selected`, or `unselected`. A changed pointer or keyboard
selection emits one semantic event containing the previous value, option, key,
mode, and interaction source. Selecting the current single value again does not
emit a duplicate event. Removing a multiple-value chip emits `selectionChange`
and `unselected`.

Readonly is distinct from disabled. A readonly TreeSelect remains enabled,
focusable, and exposes `aria-readonly="true"`. Its panel may open so users can
filter, navigate, and expand the hierarchy, but tree selection, clear, and chip
removal are blocked. Programmatic form writes and `reset()` remain available.
Disabled TreeSelects leave the tab order and cannot open.

Inside `neural-field`, TreeSelect inherits the effective control id, disabled,
readonly, required, invalid, pending, fluid, and unstyled state.

## Hierarchical behavior

Filtering, expansion, selection, roving focus, RTL arrows, typeahead, and
checkbox propagation are delegated to `@neural-ng/core/tree`. The panel uses
the browser top-layer Popover foundation and always matches the trigger width.
Readonly only disables Tree selection through `selectableNode`; branch expansion
and filter input remain available for inspection.

## Headless API

`unstyled` removes NeuralNg visual classes while keeping structural hooks,
Popover positioning, focus restoration, Forms, and Tree semantics. Typed
`classes` slots own custom visuals. Typed templates are available through
`neuralTreeSelectNode` and `neuralTreeSelectValue`.
