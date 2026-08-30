import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NeuralField,
  NeuralFieldHint,
  NeuralFieldLabel,
} from '@neural-ng/core/field';
import { NeuralInput } from '@neural-ng/core/input';
import { NeuralSelect } from '@neural-ng/core/select';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-forms-integration-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    FormField,
    FormsModule,
    NeuralField,
    NeuralFieldHint,
    NeuralFieldLabel,
    NeuralInput,
    NeuralSelect,
    ReactiveFormsModule,
  ],
  templateUrl: './forms-integration.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormsIntegrationPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly signalModel = signal({ email: 'agent@neural.ng' });
  readonly signalForm = form(this.signalModel);
  readonly reactiveEmail = new FormControl('reactive@neural.ng', {
    nonNullable: true,
  });
  templateCity: string | null = 'Istanbul';
  readonly cities = ['Istanbul', 'Ankara', 'Amsterdam', 'Berlin'] as const;

  readonly pageLinks = [
    ['Choose an approach', 'approaches'],
    ['Live integration', 'live'],
    ['Control contracts', 'contracts'],
    ['Signal Forms', 'signal-forms'],
    ['Reactive Forms', 'reactive-forms'],
    ['Template-driven Forms', 'template-forms'],
    ['Validation and Field', 'validation'],
    ['Values and events', 'events'],
    ['State and nullability', 'state'],
    ['Submission and reset', 'submission'],
    ['SSR and testing', 'testing'],
  ] as const;

  readonly approaches = [
    [
      'Signal Forms',
      'Recommended for new Signal-first applications',
      'Typed Signal model, schema validation and direct field state.',
    ],
    [
      'Reactive Forms',
      'Excellent for established and complex applications',
      'Explicit controls, synchronous state and Observable integration.',
    ],
    [
      'Template-driven',
      'Best for small and simple forms',
      'Minimal setup through name and two-way ngModel binding.',
    ],
    [
      'Direct models',
      'Useful outside a form boundary',
      'Signal model inputs such as value, checked and their generated change outputs.',
    ],
  ] as const;

  readonly controlGroups = [
    [
      'Native hosts',
      'Input, Textarea',
      'Native input/textarea value accessors and submission semantics remain intact.',
    ],
    [
      'Value controls',
      'AutoComplete, DatePicker, FileUpload, InputMask, InputNumber, InputOtp, MultiSelect, Password, Radio, Select, Slider, TreeSelect, TriStateCheckbox',
      'Implement FormValueControl<T> with one typed value model.',
    ],
    [
      'Checkbox controls',
      'Checkbox, Switch',
      'Implement FormCheckboxControl with one boolean checked model.',
    ],
  ] as const;

  readonly signalCode = `import { Component, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [FormField, NeuralInput] })
export class AccountForm {
  readonly model = signal({ email: '' });
  readonly accountForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });
  });
}

<input neuralInput type="email" [formField]="accountForm.email" />`;

  readonly reactiveCode = `import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NeuralSelect } from '@neural-ng/core/select';

@Component({ imports: [ReactiveFormsModule, NeuralSelect] })
export class ShippingForm {
  readonly city = new FormControl<string | null>(null, Validators.required);
}

<neural-select
  [options]="cities"
  [formControl]="city"
  ariaLabel="Shipping city"
/>`;

  readonly templateCode = `import { FormsModule } from '@angular/forms';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [FormsModule, NeuralInput] })
export class NewsletterForm {
  email = '';
}

<form #newsletter="ngForm" (ngSubmit)="subscribe()">
  <input
    neuralInput
    type="email"
    name="email"
    [(ngModel)]="email"
    required
  />
</form>`;

  readonly fieldCode = `<neural-field
  controlId="work-email"
  required
  [invalid]="accountForm.email().touched() && accountForm.email().invalid()"
  [pending]="accountForm.email().pending()"
>
  <label neuralFieldLabel>Work email</label>
  <input neuralInput type="email" [formField]="accountForm.email" />
  <small neuralFieldHint>Used for account notifications.</small>

  @if (accountForm.email().touched() && accountForm.email().invalid()) {
    <small neuralFieldError>
      {{ accountForm.email().errors()[0]?.message }}
    </small>
  }
</neural-field>`;

  readonly eventsCode = `<neural-select
  [(value)]="city"
  (valueChange)="modelChanged($event)"
  (selectionChange)="userSelected($event)"
/>

<!-- Programmatic writes update value/valueChange through the owning binding.
     selectionChange remains reserved for pointer or keyboard selection. -->`;

  readonly submitCode = `<form (submit)="save($event)" novalidate>
  <neural-field controlId="email">...</neural-field>

  <neural-button type="submit" label="Create account" />
  <neural-button type="reset" label="Reset" severity="secondary" />
</form>`;

  readonly testCode = `it('writes through the form without a semantic user event', async () => {
  cityControl.setValue('Ankara');
  fixture.detectChanges();
  await fixture.whenStable();

  expect(select.value()).toBe('Ankara');
  expect(selectionEvents()).toHaveLength(0);
});

it('marks the control touched when focus leaves', () => {
  trigger.focus();
  trigger.blur();
  expect(cityControl.touched).toBe(true);
});`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
