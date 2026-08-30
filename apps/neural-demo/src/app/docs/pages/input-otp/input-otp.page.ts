import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  InputOtpComponent,
  type NeuralInputOtpClasses,
  type NeuralInputOtpCompleteEvent,
} from '@neural-ng/core/input-otp';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-input-otp-page',
  imports: [
    CodeView,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    InputOtpComponent,
  ],
  templateUrl: './input-otp.page.html',
  styleUrls: ['../shared-doc-page.scss', './input-otp.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputOtpPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly verification = signal({ code: '' });
  readonly verificationForm = form(this.verification);
  readonly recoveryCode = signal('');
  readonly privateCode = signal('');
  readonly headlessCodeValue = signal('AI2026');
  readonly status = signal('Waiting for the six-digit code.');
  readonly headlessClasses: NeuralInputOtpClasses = {
    root: 'docs-otp-headless',
    group: 'docs-otp-headless__group',
    input: 'docs-otp-headless__input',
    separator: 'docs-otp-headless__separator',
  };

  readonly importCode = `import { InputOtpComponent } from '@neural-ng/core/input-otp';`;
  readonly basicCode = `<neural-field controlId="verification-code" fluid>
  <label neuralFieldLabel>Verification code</label>
  <neural-input-otp
    [formField]="verificationForm.code"
    [length]="6"
    autocomplete="one-time-code"
    (complete)="verify($event.value)"
  />
</neural-field>`;
  readonly variantsCode = `<neural-input-otp
  mode="alphanumeric"
  separator="-"
  [length]="6"
  [(value)]="recoveryCode"
/>

<neural-input-otp mask [(value)]="privateCode" />`;
  readonly headlessCode = `<neural-input-otp
  mode="alphanumeric"
  separator="·"
  [(value)]="code"
  [classes]="otpClasses"
  unstyled
/>`;

  completed(event: NeuralInputOtpCompleteEvent): void {
    this.status.set(`Code ${event.value} is ready for server verification.`);
  }
}
