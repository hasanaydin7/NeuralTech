import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import {
  RadioComponent,
  RadioGroupComponent,
  type NeuralRadioClasses,
  type NeuralRadioSelectionChange,
} from '@neural-ng/core/radio';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
} from '@neural-ng/core/field';
import { CodeExample } from '../../../shared/code-example/code-example';

interface Plan {
  readonly id: string;
  readonly name: string;
  readonly disabled?: boolean;
  readonly iconClass: string;
}

@Component({
  selector: 'app-radio-page',
  imports: [
    CodeExample,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    FormField,
    FormsModule,
    RadioComponent,
    RadioGroupComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './radio.page.html',
  styleUrls: ['./radio.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioPage {
  readonly plan = signal<string | null>('starter');
  readonly delivery = signal<string | null>('standard');
  readonly contact = signal<string | null>(null);
  readonly readonlyPlan = signal<string | null>('starter');
  readonly formsModel = signal<{ signalPlan: string | null }>({
    signalPlan: 'starter',
  });
  readonly signalForm = form(this.formsModel);
  readonly reactivePlan = new FormControl<string | null>('starter');
  templatePlan: string | null = 'starter';
  readonly headlessValue = signal<string | null>('signals');
  readonly eventStatus = signal('No selection yet.');
  readonly plans: readonly Plan[] = [
    { id: 'starter', name: 'Starter', iconClass: 'nt-user' },
    { id: 'team', name: 'Team', iconClass: 'nt-settings' },
    {
      id: 'enterprise',
      name: 'Enterprise (contact us)',
      disabled: true,
      iconClass: 'nt-home',
    },
  ];
  readonly formOptions = [
    { label: 'Starter', value: 'starter' },
    { label: 'Team', value: 'team' },
  ];
  readonly contactOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
  ];
  readonly headlessOptions = ['signals', 'standalone', 'hydration'];
  readonly headlessClasses: NeuralRadioClasses = {
    root: 'docs-headless-radio-group',
    option: 'docs-headless-radio-option',
    input: 'docs-headless-radio-input',
    control: 'docs-headless-radio-control',
    selectedControl: 'docs-headless-radio-selected',
    label: 'docs-headless-radio-label',
  };

  readonly importCode = `import {
  RadioComponent,
  RadioGroupComponent,
  type NeuralRadioSelectionChange,
} from '@neural-ng/core/radio';`;
  readonly dataCode = `<neural-radio-group
  [options]="plans"
  optionLabel="name"
  optionValue="id"
  optionDisabled="disabled"
  optionIcon="iconClass"
  orientation="horizontal"
  [(value)]="plan"
  (selectionChange)="planChanged($event)"
/>`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-radio-group
  [options]="plans"
  optionLabel="label"
  optionValue="value"
  [formField]="form.plan"
/>

<!-- Reactive Forms -->
<neural-radio-group
  [options]="plans"
  optionLabel="label"
  optionValue="value"
  [formControl]="planControl"
/>

<!-- Template-driven Forms -->
<neural-radio-group
  [options]="plans"
  optionLabel="label"
  optionValue="value"
  name="plan"
  [(ngModel)]="plan"
/>`;
  readonly projectedCode = `<neural-radio-group [(value)]="delivery">
  <neural-radio value="standard">
    <strong>Standard</strong>
    <small>3–5 business days</small>
  </neural-radio>
  <neural-radio value="pickup">
    <strong>Store pickup</strong>
    <small>Ready today</small>
  </neural-radio>
</neural-radio-group>`;
  readonly headlessCode = `<neural-radio-group
  [options]="architectures"
  [(value)]="architecture"
  [classes]="radioClasses"
  unstyled
/>`;

  selectionChanged(event: NeuralRadioSelectionChange<string, Plan>): void {
    this.eventStatus.set(
      `${String(event.previousValue)} → ${event.value} via ${event.source}`,
    );
  }
}
