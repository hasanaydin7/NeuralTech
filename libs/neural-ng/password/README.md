# Password

Signal-first password control for Angular 22+ with native password-manager
semantics, accessible visibility controls, optional strength feedback, and
headless class ownership.

```ts
import { NeuralPassword } from '@neural-ng/core/password';
```

`PasswordComponent` remains available as a compatibility alias.

```html
<neural-password name="password" autocomplete="new-password" [(value)]="password" showFeedback fluid />
```

The input remains a native `type="password"` control until the user activates
the visibility button. `autocomplete` defaults to `current-password`; use
`new-password` for registration and reset flows. NeuralNg never disables
browser password managers or autofill.

Password implements Angular's `FormValueControl<string>` contract. The same
component supports `[formField]`, `[formControl]`, and `[(ngModel)]` without a
second `ControlValueAccessor`.

`showFeedback` renders a four-step, accessible strength meter. The score is a
deterministic UI hint, not a security policy or validator. Application password
rules belong in the form schema and server. `strengthChange` reports the value,
score, and `empty | weak | medium | strong` presentation state.

Set `unstyled` locally or globally. Structural hooks remain, while the visual
base classes are removed. Use `passwordClass`, `inputClass`, and the typed
`NeuralPasswordClasses` slots for consumer-owned styling.

Public behavior includes `toggleVisibility`, `showFeedback`, `visible`,
`minLength`, `maxLength`, `disabled`, `readonly`, `required`, `invalid`,
`pending`, `touched`, `dirty`, `focus()`, `select()`, and `reset()`.
