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
  InputMaskComponent,
  type NeuralInputMaskClasses,
  type NeuralInputMaskCompleteEvent,
} from '@neural-ng/core/input-mask';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-input-mask-page',
  imports: [
    CodeView,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    InputMaskComponent,
  ],
  templateUrl: './input-mask.page.html',
  styleUrls: ['../shared-doc-page.scss', './input-mask.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class InputMaskPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly profile = signal({ phone: '' });
  readonly profileForm = form(this.profile);
  readonly card = signal('');
  readonly productCode = signal('');
  readonly headlessValue = signal('AI202601');
  readonly status = signal('Waiting for a complete phone number.');
  readonly headlessClasses: NeuralInputMaskClasses = {
    root: 'docs-mask-headless',
    input: 'docs-mask-headless__input',
  };

  readonly importCode = `import { InputMaskComponent } from '@neural-ng/core/input-mask';`;
  readonly phoneCode = `<neural-field controlId="phone" fluid>
  <label neuralFieldLabel>Phone</label>
  <neural-input-mask
    mask="(999) 999-9999"
    inputMode="tel"
    autocomplete="tel"
    [formField]="profileForm.phone"
    (complete)="savePhone($event)"
    fluid
  />
</neural-field>`;
  readonly patternsCode = `<neural-input-mask
  mask="9999 9999 9999 9999"
  inputMode="numeric"
  [(value)]="card"
/>

<neural-input-mask
  mask="aa-****-99"
  [(value)]="productCode"
  unmask
/>`;
  readonly headlessCode = `<neural-input-mask
  mask="aa-9999-99"
  [(value)]="reference"
  [classes]="maskClasses"
  unstyled
/>`;

  completed(event: NeuralInputMaskCompleteEvent): void {
    this.status.set(`Ready: ${event.formattedValue}`);
  }
}
