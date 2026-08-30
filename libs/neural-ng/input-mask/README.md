# InputMask

Current component maturity: **beta**.

Native masked input for Angular 22+ with predictable caret and paste behavior, Signal Forms, Reactive Forms, template-driven Forms, and headless styling.

```ts
import { NeuralInputMask } from '@neural-ng/core/input-mask';
```

```html
<neural-input-mask mask="(999) 999-9999" inputMode="tel" [(value)]="phone" (complete)="save($event)" />
```

Mask rules:

- `9`: ASCII digit
- `a`: Unicode letter
- `*`: Unicode letter or number
- `\`: escapes the next mask character

Use `unmask` to expose only slot characters through the model. `clearIncomplete` clears partial values on blur. The component implements `FormValueControl<string>` and uses the same `value` model for every Angular Forms API.

```html
<!-- Signal Forms -->
<neural-input-mask [formField]="profileForm.phone" mask="(999) 999-9999" />

<!-- Reactive Forms -->
<neural-input-mask [formControl]="phone" mask="(999) 999-9999" />

<!-- Template-driven Forms -->
<neural-input-mask name="phone" [(ngModel)]="phone" mask="(999) 999-9999" />
```

`NeuralInputMask` owns deterministic masking only; server-side validation and normalization remain application responsibilities. `InputMaskComponent` remains exported as a deprecated compatibility alias. New code and generated output must use `NeuralInputMask`.
