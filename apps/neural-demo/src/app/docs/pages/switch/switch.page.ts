import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import {
  NeuralSwitch,
  type NeuralSwitchChange,
  type NeuralSwitchClasses,
} from '@neural-ng/core/switch';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
} from '@neural-ng/core/field';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-switch-page',
  imports: [
    CodeExample,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    FormField,
    FormsModule,
    ReactiveFormsModule,
    NeuralSwitch,
  ],
  templateUrl: './switch.page.html',
  styleUrls: ['./switch.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchPage {
  readonly notifications = signal(false);
  readonly accountActive = signal(true);
  readonly headlessValue = signal(true);
  readonly eventStatus = signal('No user change yet.');
  readonly formsModel = signal({ signalNotifications: false });
  readonly signalForm = form(this.formsModel);
  readonly reactiveNotifications = new FormControl(false, {
    nonNullable: true,
  });
  templateNotifications = false;
  readonly headlessClasses: NeuralSwitchClasses = {
    root: 'docs-headless-switch',
    input: 'docs-headless-switch-input',
    track: 'docs-headless-switch-track',
    checkedTrack: 'docs-headless-switch-checked',
    thumb: 'docs-headless-switch-thumb',
    label: 'docs-headless-switch-label',
  };

  readonly importCode = `import {
  NeuralSwitch,
  type NeuralSwitchChange,
} from '@neural-ng/core/switch';`;
  readonly basicCode = `<neural-switch
  [(checked)]="notifications"
  (stateChange)="notificationsChanged($event)"
>
  Notifications
</neural-switch>`;
  readonly labelsCode = `<neural-switch
  [(checked)]="active"
  onLabel="On"
  offLabel="Off"
>
  Account status
</neural-switch>`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-switch [formField]="form.notifications">
  Signal notifications
</neural-switch>

<!-- Reactive Forms -->
<neural-switch [formControl]="notificationsControl">
  Reactive notifications
</neural-switch>

<!-- Template-driven Forms -->
<neural-switch name="notifications" [(ngModel)]="notifications">
  Template notifications
</neural-switch>`;
  readonly headlessCode = `<neural-switch
  [(checked)]="enabled"
  [classes]="switchClasses"
  unstyled
>
  Custom visual ownership
</neural-switch>`;

  stateChanged(event: NeuralSwitchChange): void {
    this.eventStatus.set(
      `State changed: ${event.previousChecked} → ${event.checked}`,
    );
  }
}
