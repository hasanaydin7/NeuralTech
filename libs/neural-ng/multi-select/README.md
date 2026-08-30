# NeuralNg MultiSelect

Signal-first, accessible multiple selection for Angular 22+.

## Import

```ts
import { NeuralMultiSelect } from '@neural-ng/core/multi-select';
```

```html
<neural-multi-select [options]="cities" optionLabel="name" optionValue="id" optionDisabled="disabled" optionGroup="country" filterBy="name,country" [(value)]="cityIds" display="chip" fluid />
```

`value` is always an immutable `readonly TValue[]` array. The component uses a
top-layer popup that matches the trigger width and keeps native multiple
listbox semantics.

## Angular Forms

MultiSelect implements `FormValueControl<readonly TValue[]>`. Direct binding,
Signal Forms, Reactive Forms, and template-driven Forms share the same array
model:

```html
<neural-multi-select [(value)]="cities" [options]="options" />
<neural-multi-select [formField]="profileForm.cities" [options]="options" />
<neural-multi-select [formControl]="citiesControl" [options]="options" />
<neural-multi-select name="cities" [(ngModel)]="cities" [options]="options" />
```

Programmatic writes and `reset()` do not emit `selectionChange`. A changed user
option toggle emits one event with immutable current and previous arrays.

Readonly is distinct from disabled. A readonly trigger remains enabled,
focusable, and exposes `aria-readonly="true"`. The popup may open for
inspection, while option toggles, chip removal, clear, and select-all actions
are blocked. Programmatic form writes and `reset()` remain available.

## Selection

- `display="chip" | "comma"`
- `selectionLimit`, `maxSelectedLabels`, `clearable`, and `closeOnSelect`
- `showToggleAll`, local/remote filtering, grouped and disabled options
- `virtualScroll`, `virtualItemSize`, `virtualScrollHeight`, and
  `virtualOverscan` for fixed-height option windows
- `selectionChange`, `selected`, `removed`, `cleared`, `selectAllChange`,
  `filterChange`, `opened`, and `closed`

All default labels come from `NeuralLocaleService`; each matching label input
remains available as a component-level override.

Virtual scrolling is SSR-safe and keeps `aria-posinset`/`aria-setsize` on the
rendered window. Grouped options currently fall back to the complete list
because group headers have variable geometry.

## Headless

Set `unstyled` locally or configure it globally with `provideNeuralNg`. The
structural classes and ARIA behavior remain. Use the typed `classes` slots and
the option, value, group, header, footer, empty, and loading templates to own
the visual layer.

## Maturity

MultiSelect is **Beta**. `MultiSelectComponent` remains as a deprecated
compatibility alias; new code should import `NeuralMultiSelect`.
