# InputOtp

Beta one-time-code input for Angular 22+ with one string model, native autofill semantics, paste distribution, deterministic keyboard navigation, localization, SSR-safe IDs, and complete Angular Forms support.

```ts
import { NeuralInputOtp } from '@neural-ng/core/input-otp';
```

```html
<neural-input-otp inputOtpId="verification-code" ariaLabel="Verification code" [length]="6" autocomplete="one-time-code" [(value)]="verificationCode" (complete)="verify($event.value)" />
```

`mode="numeric"` accepts ASCII digits after Unicode normalization. Use `mode="alphanumeric"` for Unicode letters and numbers, `mask` to conceal cells, and `separator="-"` for a visual separator. Masking is only visual; always verify codes and enforce retry and expiry policies on the server.

## Angular Forms

The canonical model is always one string. `NeuralInputOtp` implements `FormValueControl<string>` and supports every modern Angular Forms adapter:

```html
<neural-input-otp [formField]="verificationForm.code" />
<neural-input-otp [formControl]="verificationCode" />
<neural-input-otp name="verificationCode" [(ngModel)]="verificationCode" />
```

The first cell receives `autocomplete="one-time-code"`; remaining cells use `off`. A pasted or autofilled complete code is distributed from the active cell. Backspace, Delete, Arrow Left/Right, Home and End preserve logical focus, including RTL.

`unstyled` removes NeuralNg visual classes while retaining structural hooks, native inputs, Forms behavior and accessibility. `InputOtpComponent` remains as a deprecated compatibility alias; new code should import `NeuralInputOtp`.
