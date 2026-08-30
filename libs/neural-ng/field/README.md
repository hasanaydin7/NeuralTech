# NeuralNg Field

Composable, form-agnostic field accessibility infrastructure for Angular 22+.

Current component maturity: **beta**.

## Import

```ts
import { NeuralField, NeuralFieldControl, NeuralFieldError, NeuralFieldHint, NeuralFieldLabel } from '@neural-ng/core/field';
```

Import `NeuralInput` separately when the control uses `neuralInput`.

## Canonical Signal Forms example

```html
<neural-field
  controlId="account-email"
  fluid
  required
  [invalid]="
    accountForm.email().touched() && accountForm.email().invalid()
  "
  [pending]="accountForm.email().pending()"
>
  <label neuralFieldLabel>Email</label>
  <input neuralInput type="email" autocomplete="email" [formField]="accountForm.email" />
  <small neuralFieldHint>Use your work address.</small>

  @if (accountForm.email().touched() && accountForm.email().invalid()) {
  <small neuralFieldError> {{ accountForm.email().errors()[0]?.message }} </small>
  }
</neural-field>
```

Field assigns the label's `for`, the control's `id`, and deterministic hint and
error IDs from `controlId`. It keeps the control's `aria-describedby` synchronized
as conditional hint and error content enters or leaves the composition.

`controlId` is required in the beta API. Explicit IDs keep server rendering and
hydration deterministic and make application markup easy to inspect.

## Responsibility boundary

Field handles relationships and presentation state. It does not:

- own the control value;
- execute validation;
- choose when errors become visible;
- translate or invent error messages;
- replace Angular Signal, Reactive, Template-driven, or native forms.

Keep validation in the form schema. The recommended Signal Forms presentation
rule is `touched() && invalid()`.

## Native and custom controls

`neuralInput` consumes Field context automatically. Apply
`neuralFieldControl` when the projected element is another native control or a
custom control that accepts the standard attributes:

```html
<neural-field controlId="profile-note">
  <label neuralFieldLabel>Profile note</label>
  <textarea neuralFieldControl></textarea>
  <small neuralFieldHint>Maximum 500 characters.</small>
</neural-field>
```

The bridge supplies `id`, `aria-describedby`, `aria-invalid`, `aria-busy`,
`aria-required`, and the native `required`, `disabled`, and `readonly`
attributes from Field state.

## Multiple descriptions

More than one hint or error is supported. The first IDs are
`{controlId}-hint` and `{controlId}-error`; subsequent slots receive stable
numeric suffixes. Add application-owned description IDs with `describedBy`:

```html
<neural-field controlId="slug" describedBy="slug-policy">
  <!-- field content -->
</neural-field>
<p id="slug-policy">Workspace slugs are public.</p>
```

Duplicates are removed from the resulting `aria-describedby` value.

## Error announcements

`neuralFieldError` defaults to `aria-live="polite"`. Set `live="assertive"` only
for feedback that genuinely requires immediate announcement, or `live="off"`
when another application-level notification announces the error.

Field does not add `role="alert"` by default.

## State and styling

Field exposes state independently through structural classes and data
attributes:

```text
neural-field-root
neural-field--invalid
neural-field--required
neural-field--disabled
neural-field--readonly
neural-field--pending
```

Slot hooks remain stable:

```text
neural-field__label
neural-field__control
neural-field__hint
neural-field__error
```

Use the normal `class` attribute on `neural-field` and every projected element.
There is no class-object input because consumers already own these hosts.

`unstyled` removes Field and participating Input visual classes while preserving
structural hooks, state classes, IDs, ARIA, and native behavior. Global
`provideNeuralNg({ unstyled: true })` is also respected.

Reference themes expose `--neural-field-*` tokens for spacing, typography,
label, required marker, hint, error, disabled, and pending presentation.

## Public API

| Input         | Default  | Purpose                                  |
| ------------- | -------- | ---------------------------------------- |
| `controlId`   | required | Deterministic control and slot ID prefix |
| `describedBy` | `''`     | Additional external description IDs      |
| `invalid`     | `false`  | Expose invalid state and `aria-invalid`  |
| `required`    | `false`  | Mark and require the projected control   |
| `disabled`    | `false`  | Disable the projected control            |
| `readonly`    | `false`  | Make the projected control readonly      |
| `pending`     | `false`  | Expose pending state and `aria-busy`     |
| `fluid`       | `false`  | Fill the available width in styled mode  |
| `unstyled`    | `false`  | Remove participating visual classes      |

`neuralFieldError` additionally accepts `live: 'off' | 'polite' | 'assertive'`.

Floating labels, input groups, automatic error translation, and form-level
error summaries are intentionally outside this primitive.

The former `FieldComponent` and `Field*Directive` runtime names remain as
deprecated compatibility aliases. New code and generated output must use the
canonical `NeuralField*` names.
