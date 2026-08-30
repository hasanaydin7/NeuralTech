import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import { NeuralTextarea } from '@neural-ng/core/textarea';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-textarea-page',
  imports: [
    CodeExample,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    NeuralTextarea,
  ],
  templateUrl: './textarea.page.html',
  styleUrls: ['./textarea.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaPage {
  readonly profile = signal({
    biography: '',
    growing:
      'This textarea uses the modern field-sizing property.\nAdd another line to watch it grow.',
  });
  readonly profileForm = form(this.profile, (path) => {
    maxLength(path.biography, 500, {
      message: 'Biography cannot exceed 500 characters.',
    });
  });

  readonly importCode = `import {
  NeuralTextarea,
  type NeuralTextareaResizeMode,
} from '@neural-ng/core/textarea';`;
  readonly basicCode = `<neural-field controlId="biography" fluid>
  <label neuralFieldLabel>Biography</label>
  <textarea
    neuralTextarea
    rows="5"
    [formField]="profileForm.biography"
  ></textarea>
  <small neuralFieldHint>Maximum 500 characters.</small>
</neural-field>`;
  readonly autoResizeCode = `<textarea
  neuralTextarea
  autoResize
  [formField]="profileForm.growing"
></textarea>`;
  readonly resizeCode = `<textarea neuralTextarea resizeMode="vertical"></textarea>
<textarea neuralTextarea resizeMode="horizontal"></textarea>
<textarea neuralTextarea resizeMode="both"></textarea>
<textarea neuralTextarea resizeMode="none"></textarea>`;
  readonly headlessCode = `<textarea
  neuralTextarea
  unstyled
  class="product-textarea"
></textarea>`;
}
