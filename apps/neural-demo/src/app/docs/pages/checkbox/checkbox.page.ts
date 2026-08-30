import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import {
  NeuralCheckbox,
  type NeuralCheckboxChange,
  type NeuralCheckboxClasses,
} from '@neural-ng/core/checkbox';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
} from '@neural-ng/core/field';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-checkbox-page',
  imports: [
    NeuralCheckbox,
    CodeExample,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
  ],
  templateUrl: './checkbox.page.html',
  styleUrls: ['./checkbox.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxPage {
  readonly accepted = signal(false);
  readonly emailUpdates = signal(true);
  readonly productUpdates = signal(false);
  readonly headlessValue = signal(true);
  readonly eventStatus = signal('No user change yet.');
  readonly headlessClasses: NeuralCheckboxClasses = {
    root: 'docs-headless-checkbox',
    input: 'docs-headless-checkbox-input',
    control: 'docs-headless-checkbox-control',
    checkedControl: 'docs-headless-checkbox-checked',
    label: 'docs-headless-checkbox-label',
  };

  readonly importCode = `import {
  NeuralCheckbox,
  type NeuralCheckboxChange,
} from '@neural-ng/core/checkbox';`;
  readonly binaryCode = `<neural-checkbox
  [(checked)]="accepted"
  required
  (stateChange)="acceptedChanged($event)"
>
  I accept the terms
</neural-checkbox>`;
  readonly formsCode = `<neural-checkbox [formField]="form.accepted">
  Signal Forms
</neural-checkbox>

<neural-checkbox [formControl]="acceptedControl">
  Reactive Forms
</neural-checkbox>

<neural-checkbox name="accepted" [(ngModel)]="accepted">
  Template-driven Forms
</neural-checkbox>`;
  readonly headlessCode = `<neural-checkbox
  [(checked)]="enabled"
  unstyled
  checkboxClass="product-checkbox"
  [classes]="checkboxClasses"
>
  Custom visual ownership
</neural-checkbox>`;

  stateChanged(event: NeuralCheckboxChange): void {
    this.eventStatus.set(
      `State changed: ${String(event.previousChecked)} → ${String(event.checked)}`,
    );
  }
}
