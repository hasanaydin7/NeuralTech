import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import {
  NeuralTriStateCheckbox,
  type NeuralTriStateCheckboxChange,
  type NeuralTriStateCheckboxClasses,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
} from '@neural-ng/core/field';
import { CodeView } from '../../../shared/code-view';

interface TriStateFormsModel {
  permission: NeuralTriStateCheckboxValue;
}

@Component({
  selector: 'app-tri-state-checkbox-page',
  imports: [
    CodeView,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    FormField,
    FormsModule,
    ReactiveFormsModule,
    NeuralTriStateCheckbox,
  ],
  templateUrl: './tri-state-checkbox.page.html',
  styleUrls: ['./tri-state-checkbox.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriStateCheckboxPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly permission = signal<NeuralTriStateCheckboxValue>(false);
  readonly eventStatus = signal('No user change yet.');
  readonly formsModel = signal<TriStateFormsModel>({ permission: false });
  readonly signalForm = form(this.formsModel);
  readonly reactivePermission = new FormControl<NeuralTriStateCheckboxValue>(
    false,
  );
  templatePermission: NeuralTriStateCheckboxValue = false;
  readonly headlessValue = signal<NeuralTriStateCheckboxValue>(null);
  readonly headlessClasses: NeuralTriStateCheckboxClasses = {
    root: 'docs-headless-tri-state-checkbox',
    input: 'docs-headless-tri-state-checkbox-input',
    control: 'docs-headless-tri-state-checkbox-control',
    checkedControl: 'docs-headless-tri-state-checkbox-checked',
    mixedControl: 'docs-headless-tri-state-checkbox-mixed',
    label: 'docs-headless-tri-state-checkbox-label',
  };

  readonly importCode = `import {
  NeuralTriStateCheckbox,
  type NeuralTriStateCheckboxChange,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';`;

  readonly basicCode = `import { Component, signal } from '@angular/core';
import {
  NeuralTriStateCheckbox,
  type NeuralTriStateCheckboxChange,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';

@Component({
  selector: 'neural-tri-state-checkbox-example',
  imports: [NeuralTriStateCheckbox],
  template: \`
    <neural-tri-state-checkbox
      [(value)]="permission"
      (stateChange)="permissionChanged($event)"
    >
      Inherit permission from parent
    </neural-tri-state-checkbox>
  \`,
})
export class TriStateCheckboxExampleComponent {
  readonly permission = signal<NeuralTriStateCheckboxValue>(false);

  permissionChanged(event: NeuralTriStateCheckboxChange): void {
    console.log(event.previousValue, event.value);
  }
}`;

  readonly formsCode = `<!-- Signal Forms -->
<neural-tri-state-checkbox [formField]="form.permission">
  Signal permission
</neural-tri-state-checkbox>

<!-- Reactive Forms -->
<neural-tri-state-checkbox [formControl]="permissionControl">
  Reactive permission
</neural-tri-state-checkbox>

<!-- Template-driven Forms -->
<neural-tri-state-checkbox name="permission" [(ngModel)]="permission">
  Template permission
</neural-tri-state-checkbox>`;

  readonly statesCode = `<neural-tri-state-checkbox [value]="null" disabled>
  Mixed and disabled
</neural-tri-state-checkbox>

<neural-tri-state-checkbox [value]="null" readonly>
  Mixed and readonly
</neural-tri-state-checkbox>

<neural-field controlId="inherited-access" required invalid fluid>
  <neural-tri-state-checkbox [value]="null">
    Inherited access
  </neural-tri-state-checkbox>
  <small neuralFieldHint>Choose an explicit access policy.</small>
  <small neuralFieldError>Access policy is required.</small>
</neural-field>`;

  readonly headlessCode = `import type { NeuralTriStateCheckboxClasses } from '@neural-ng/core/checkbox';

readonly checkboxClasses: NeuralTriStateCheckboxClasses = {
  root: 'product-tri-state',
  input: 'product-tri-state__input',
  control: 'product-tri-state__control',
  checkedControl: 'product-tri-state__control--checked',
  mixedControl: 'product-tri-state__control--mixed',
  label: 'product-tri-state__label',
};

<neural-tri-state-checkbox
  [(value)]="permission"
  [classes]="checkboxClasses"
  unstyled
>
  Custom visual ownership
</neural-tri-state-checkbox>`;

  readonly migrationCode = `<!-- Before: combined alpha API -->
<neural-checkbox triState [(checked)]="permission">
  Inherit permission
</neural-checkbox>

<!-- After: nullable value contract -->
<neural-tri-state-checkbox [(value)]="permission">
  Inherit permission
</neural-tri-state-checkbox>`;

  stateChanged(event: NeuralTriStateCheckboxChange): void {
    this.eventStatus.set(
      `State changed: ${String(event.previousValue)} → ${String(event.value)}`,
    );
  }

  formatValue(value: NeuralTriStateCheckboxValue): string {
    return value === null ? 'null (mixed)' : String(value);
  }
}
