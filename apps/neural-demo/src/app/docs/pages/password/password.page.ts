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
  PasswordComponent,
  type NeuralPasswordClasses,
  type NeuralPasswordStrengthChange,
} from '@neural-ng/core/password';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-password-page',
  imports: [
    CodeView,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    PasswordComponent,
  ],
  templateUrl: './password.page.html',
  styleUrls: ['../shared-doc-page.scss', './password.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PasswordPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly account = signal({ password: '' });
  readonly accountForm = form(this.account);
  readonly currentPassword = signal('NeuralNg!2026');
  readonly headlessPassword = signal('headless');
  readonly eventStatus = signal('Strength feedback is presentational.');
  readonly headlessClasses: NeuralPasswordClasses = {
    root: 'docs-password-headless',
    inputGroup: 'docs-password-headless__control',
    input: 'docs-password-headless__input',
    toggle: 'docs-password-headless__toggle',
    feedback: 'docs-password-headless__feedback',
    meter: 'docs-password-headless__meter',
    meterBar: 'docs-password-headless__bar',
    strengthLabel: 'docs-password-headless__label',
  };

  readonly importCode = `import { PasswordComponent } from '@neural-ng/core/password';`;
  readonly basicCode = `<neural-field controlId="new-password" fluid>
  <label neuralFieldLabel>New password</label>
  <neural-password
    autocomplete="new-password"
    [formField]="accountForm.password"
    showFeedback
    fluid
  />
</neural-field>`;
  readonly currentCode = `<neural-password
  name="currentPassword"
  autocomplete="current-password"
  [(value)]="currentPassword"
  [showFeedback]="false"
/>`;
  readonly headlessCode = `<neural-password
  [(value)]="password"
  [classes]="passwordClasses"
  showFeedback
  unstyled
/>`;

  strengthChanged(event: NeuralPasswordStrengthChange): void {
    this.eventStatus.set(`${event.strength} · score ${event.score}/4`);
  }
}
