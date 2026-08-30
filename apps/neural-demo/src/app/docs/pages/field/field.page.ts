import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import {
  FieldComponent,
  FieldControlDirective,
  FieldErrorDirective,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import { NeuralInput } from '@neural-ng/core/input';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-field-page',
  imports: [
    CodeExample,
    FieldComponent,
    FieldControlDirective,
    FieldErrorDirective,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    NeuralInput,
  ],
  templateUrl: './field.page.html',
  styleUrls: ['./field.page.scss', '../shared-doc-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldPage {
  readonly profile = signal({ email: '' });
  readonly profileForm = form(this.profile, (path) => {
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });
  });
  readonly importCode = `import {
  FieldComponent,
  FieldLabelDirective,
  FieldHintDirective,
  FieldErrorDirective,
} from '@neural-ng/core/field';`;
  readonly basicCode = `<neural-field controlId="work-email" required fluid>
  <label neuralFieldLabel>Work email</label>
  <input neuralInput type="email" [formField]="profileForm.email" />
  <small neuralFieldHint>Used for account notifications.</small>
</neural-field>`;
}
