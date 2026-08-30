import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import {
  NeuralCheckbox,
  NeuralTriStateCheckbox,
} from '../checkbox/checkbox.component';
import { RadioGroupComponent } from '../radio/radio.component';
import { SelectComponent } from '../select/select.component';
import { NeuralSwitch } from '../switch/switch.component';

@Component({
  imports: [
    NeuralCheckbox,
    FormField,
    FormsModule,
    RadioGroupComponent,
    ReactiveFormsModule,
    SelectComponent,
    NeuralSwitch,
    NeuralTriStateCheckbox,
  ],
  template: `
    <neural-select
      ariaLabel="City"
      [options]="cities"
      [formControl]="reactiveCity"
      (touch)="touches.update((count) => count + 1)"
    />
    <neural-radio-group
      ariaLabel="Role"
      [options]="roles"
      [formField]="signalForm.role"
    />
    <neural-checkbox [formField]="signalForm.consent">
      Consent
    </neural-checkbox>
    <neural-tri-state-checkbox [formField]="signalForm.permission">
      Inherit permission
    </neural-tri-state-checkbox>
    <neural-switch name="notifications" [(ngModel)]="templateSwitch">
      Notifications
    </neural-switch>
  `,
})
class FormsFoundationHost {
  readonly cities = ['Istanbul', 'Ankara'] as const;
  readonly roles = ['Admin', 'Editor'] as const;
  readonly reactiveCity = new FormControl<string | null>('Istanbul');
  readonly model = signal({
    role: 'Admin',
    consent: false,
    permission: false as boolean | null,
  });
  readonly signalForm = form(this.model);
  readonly touches = signal(0);
  templateSwitch = false;
}

describe('Forms Foundation', () => {
  it('shares model signals across Reactive, template-driven, and Signal Forms', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsFoundationHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsFoundationHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.reactiveCity.setValue('Ankara');
    fixture.componentInstance.model.set({
      role: 'Editor',
      consent: true,
      permission: null,
    });
    fixture.componentInstance.templateSwitch = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.directive(SelectComponent))
      .componentInstance as SelectComponent<string, string>;
    const radio = fixture.debugElement.query(By.directive(RadioGroupComponent))
      .componentInstance as RadioGroupComponent<string, string>;
    const checkbox = fixture.debugElement.query(By.directive(NeuralCheckbox))
      .componentInstance as NeuralCheckbox;
    const triState = fixture.debugElement.query(
      By.directive(NeuralTriStateCheckbox),
    ).componentInstance as NeuralTriStateCheckbox;
    const toggle = fixture.debugElement.query(By.directive(NeuralSwitch))
      .componentInstance as NeuralSwitch;

    expect(select.value()).toBe('Ankara');
    expect(radio.value()).toBe('Editor');
    expect(checkbox.checked()).toBe(true);
    expect(triState.value()).toBeNull();
    expect(toggle.checked()).toBe(true);
  });

  it('propagates disabled state and emits touch when focus leaves a control', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsFoundationHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsFoundationHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.reactiveCity.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector(
      '[role="combobox"]',
    ) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);

    fixture.componentInstance.reactiveCity.enable();
    fixture.detectChanges();
    await fixture.whenStable();
    trigger.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.touches()).toBe(1);
  });
});
