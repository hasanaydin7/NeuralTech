import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormField, form, max, min } from '@angular/forms/signals';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  InputNumberComponent,
  type NeuralInputNumberClasses,
} from '@neural-ng/core/input-number';
import { NeuralLocaleService } from '@neural-ng/core/i18n';
import { neuralEn } from '@neural-ng/core/locales/en';
import { neuralTr } from '@neural-ng/core/locales/tr';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-input-number-page',
  imports: [
    CodeExample,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    InputNumberComponent,
  ],
  templateUrl: './input-number.page.html',
  styleUrls: ['./input-number.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberPage {
  readonly locale = inject(NeuralLocaleService);
  readonly order = signal({
    quantity: 4,
    price: 1299.9,
    discount: 12.5,
    custom: 42,
  });
  readonly orderForm = form(this.order, (path) => {
    min(path.quantity, 1);
    max(path.quantity, 20);
  });
  readonly lastCommit = signal('No commit yet');
  readonly headlessClasses: NeuralInputNumberClasses = {
    root: 'docs-number-root',
    input: 'docs-number-input',
    decrementButton: 'docs-number-button',
    incrementButton: 'docs-number-button',
    buttonIcon: 'docs-number-icon',
  };

  readonly importCode = `import {
  InputNumberComponent,
  type NeuralInputNumberCommit,
} from '@neural-ng/core/input-number';`;
  readonly signalFormsCode = `<neural-input-number
  inputId="quantity"
  ariaLabel="Quantity"
  [formField]="orderForm.quantity"
/>`;
  readonly currencyCode = `<neural-input-number
  mode="currency"
  currency="TRY"
  [minFractionDigits]="2"
  [maxFractionDigits]="2"
  [(value)]="price"
/>`;
  readonly headlessCode = `<neural-input-number
  unstyled
  [classes]="{
    root: 'product-number',
    input: 'product-number__input',
    decrementButton: 'product-number__button',
    incrementButton: 'product-number__button'
  }"
/>`;

  switchLocale(): void {
    this.locale.use(this.locale.code() === 'tr-TR' ? neuralEn : neuralTr);
  }

  showCommit(event: { value: number | null; source: string }): void {
    this.lastCommit.set(`${event.value ?? 'null'} via ${event.source}`);
  }
}
