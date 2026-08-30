import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuralInput } from '@neural-ng/core/input';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-input-page',
  imports: [CodeExample, FormField, NeuralInput],
  templateUrl: './input.page.html',
  styleUrls: ['./input.page.scss', '../shared-doc-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputPage {
  readonly model = signal({ query: 'Signals' });
  readonly inputForm = form(this.model);
  readonly importCode =
    "import { NeuralInput } from '@neural-ng/core/input';";
  readonly basicCode = `<label for="search">Search</label>
<input
  neuralInput
  id="search"
  type="search"
  fluid
  [formField]="inputForm.query"
/>`;
  readonly headlessCode = `<input
  neuralInput
  unstyled
  class="product-input"
  placeholder="Consumer-owned styles"
/>`;
}
