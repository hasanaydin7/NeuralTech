# InputNumber

Current component maturity: **beta**.

`NeuralInputNumber` is a locale-aware numeric spinbutton for Angular 22
Signal Forms. Its public value is always `number | null`; formatted text never
leaks into application state.

It implements `FormValueControl<number | null>`, so `[formField]` binds
directly without `ControlValueAccessor`.

When `[formField]` is present, declare `min` and `max` in the Signal Forms
schema; Angular owns those contract inputs. Bind `[min]` and `[max]` directly
only when the component is used without `FormField`.

```ts
import { NeuralInputNumber } from '@neural-ng/core/input-number';
```

```html
<neural-input-number inputId="quantity" ariaLabel="Quantity" [min]="0" [max]="100" [step]="0.25" [(value)]="quantity" />
```

## Localization

The component uses the active `NeuralLocaleService` locale for both
`Intl.NumberFormat` output and typed input parsing. A local `locale` input can
override the application locale.

```ts
provideNeuralNg({ locale: neuralTr });
```

```html
<neural-input-number mode="currency" currency="TRY" [(value)]="price" />
```

Applications can switch locale at runtime with
`inject(NeuralLocaleService).use(neuralTr)`. NeuralNg does not read
`navigator.language`, so SSR and hydration produce the same initial markup.

## Interaction

- `ArrowUp` and `ArrowDown` step the value.
- `Home` and `End` use `min` and `max` when those bounds exist.
- Letters and malformed numeric characters are rejected immediately; valid
  locale digits, separators, and partial sign/decimal editing remain available.
- Blur and Enter clamp typed values to the configured bounds.
- The control exposes `role="spinbutton"` and the corresponding ARIA value
  attributes.
- `valueCommit` reports blur, Enter, keyboard, and button commits. Normal
  two-way binding uses `[(value)]`; the output is not required.

## Styling

Set `unstyled` locally or through `provideNeuralNg({ unstyled: true })`.
Structural hooks remain available. Use `inputNumberClass`, `inputClass`, or
typed `classes` slots (`root`, `input`, `decrementButton`, `incrementButton`,
`buttonIcon`) for complete visual ownership.

The component inherits `controlId`, state, descriptions, and fluid layout when
placed inside `neural-field`.

It also supports application-owned `prefix` and `suffix` text, custom Neural
Icon classes for step buttons, native `autocomplete`/`inputMode` hints, and
bounded button disabling. `InputNumberComponent` remains exported as a
deprecated compatibility alias. New code and generated output must use
`NeuralInputNumber`.

```html
<neural-input-number [formField]="orderForm.quantity" />
<neural-input-number [formControl]="quantity" />
<neural-input-number name="quantity" [(ngModel)]="quantity" />
```
