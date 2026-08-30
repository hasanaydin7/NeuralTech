import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
} from '../field/field.component';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  describeFormCheckboxControlConformance,
  type FormCheckboxControlAdapter,
  type FormCheckboxControlConformanceHarness,
} from '../testing/form-checkbox-control-conformance';
import { NeuralSwitch } from './switch.component';
import type { NeuralSwitchChange, NeuralSwitchClasses } from './switch.types';

@Component({
  imports: [NeuralSwitch],
  template: `
    <neural-switch
      inputId="notifications"
      name="notifications"
      inputValue="enabled"
      [(checked)]="checked"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [unstyled]="unstyled()"
      [classes]="classes"
      switchClass="consumer-root"
      inputClass="consumer-input"
      labelClass="consumer-label"
      onLabel="On"
      offLabel="Off"
      (stateChange)="events.push($event)"
    >
      Notifications
    </neural-switch>
  `,
})
class SwitchTestHost {
  readonly checked = signal(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly unstyled = signal(false);
  readonly events: NeuralSwitchChange[] = [];
  readonly classes: NeuralSwitchClasses = {
    root: 'slot-root',
    input: 'slot-input',
    track: 'slot-track',
    checkedTrack: 'slot-checked',
    thumb: 'slot-thumb',
    label: 'slot-label',
    onLabel: 'slot-on-label',
    offLabel: 'slot-off-label',
  };
}

@Component({
  imports: [
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    NeuralSwitch,
  ],
  template: `
    <neural-field
      controlId="availability"
      describedBy="external"
      required
      invalid
      readonly
      fluid
    >
      <neural-switch>Available for work</neural-switch>
      <small neuralFieldHint>Controls public availability.</small>
      <small neuralFieldError>Availability is required.</small>
    </neural-field>
  `,
})
class SwitchFieldHost {}

@Component({
  imports: [FormField, FormsModule, ReactiveFormsModule, NeuralSwitch],
  template: `
    <neural-switch
      inputId="direct-switch"
      [(checked)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      (stateChange)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    >
      Direct switch
    </neural-switch>
    <neural-switch
      inputId="signal-switch"
      [formField]="signalForm.value"
      (stateChange)="signalEvents.push($event)"
    >
      Signal switch
    </neural-switch>
    <neural-switch
      inputId="reactive-switch"
      [formControl]="reactive"
      (stateChange)="reactiveEvents.push($event)"
    >
      Reactive switch
    </neural-switch>
    <neural-switch
      inputId="template-switch"
      name="templateSwitch"
      [(ngModel)]="template"
      (stateChange)="templateEvents.push($event)"
    >
      Template switch
    </neural-switch>
  `,
})
class SwitchConformanceHost {
  readonly direct = signal(false);
  readonly model = signal({ value: false });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl(false, { nonNullable: true });
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralSwitchChange[] = [];
  readonly signalEvents: NeuralSwitchChange[] = [];
  readonly reactiveEvents: NeuralSwitchChange[] = [];
  readonly templateEvents: NeuralSwitchChange[] = [];
  template = false;
}

async function createSwitchConformanceHarness(): Promise<FormCheckboxControlConformanceHarness> {
  await TestBed.configureTestingModule({
    imports: [SwitchConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(SwitchConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(By.directive(NeuralSwitch))
    .componentInstance as NeuralSwitch;

  const input = (adapter: FormCheckboxControlAdapter): HTMLInputElement =>
    fixture.nativeElement.querySelector(
      `#${adapter}-switch`,
    ) as HTMLInputElement;

  return {
    expectedRole: 'switch',
    input,
    value: (adapter) => {
      if (adapter === 'direct') return host.direct();
      if (adapter === 'signal') return host.model().value;
      if (adapter === 'reactive') return host.reactive.value;
      return host.template;
    },
    setValue: (adapter, value) => {
      if (adapter === 'direct') host.direct.set(value);
      else if (adapter === 'signal') host.model.set({ value });
      else if (adapter === 'reactive') host.reactive.setValue(value);
      else host.template = value;
    },
    events: (adapter) => {
      if (adapter === 'direct') return host.directEvents;
      if (adapter === 'signal') return host.signalEvents;
      if (adapter === 'reactive') return host.reactiveEvents;
      return host.templateEvents;
    },
    setReadonly: (value) => host.readonly.set(value),
    setDisabled: (value) => host.disabled.set(value),
    setRequired: (value) => host.required.set(value),
    touchCount: () => host.touches(),
    focus: (options) => component.focus(options),
    reset: () => component.reset(),
    stabilize: async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    },
  };
}

describe('NeuralSwitch', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [SwitchTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(SwitchTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('uses a native checkbox with switch semantics and updates its model', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.id).toBe('notifications');
    expect(input.name).toBe('notifications');
    expect(input.value).toBe('enabled');

    input.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('true');
    expect(fixture.componentInstance.events[0]).toMatchObject({
      checked: true,
      previousChecked: false,
    });
  });

  it('activates through its projected label and renders state labels', async () => {
    const fixture = await createHost();
    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;

    expect(label.textContent).toContain('Notifications');
    expect(label.textContent).toContain('On');
    expect(label.textContent).toContain('Off');
    label.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.checked()).toBe(true);
  });

  it('keeps readonly switches focusable without changing state', async () => {
    const fixture = await createHost();
    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.disabled).toBe(false);
    expect(input.getAttribute('aria-readonly')).toBe('true');
    input.focus();
    expect(document.activeElement).toBe(input);
    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.checked()).toBe(false);
    expect(fixture.componentInstance.events).toHaveLength(0);
  });

  it('blocks disabled interaction and exposes native required state', async () => {
    const fixture = await createHost();
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.required.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.checked()).toBe(false);
    expect(fixture.componentInstance.events).toHaveLength(0);
  });

  it('keeps structural and consumer classes in unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neural-switch-root');
    const input = fixture.nativeElement.querySelector('input');
    const track = fixture.nativeElement.querySelector(
      '.neural-switch-track-root',
    );

    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-switch-base');
    expect(input.classList).toContain('consumer-input');
    expect(input.classList).not.toContain('neural-switch-input-base');
    expect(track.classList).toContain('slot-track');
    expect(track.classList).not.toContain('neural-switch-track-base');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    expect(
      fixture.nativeElement.querySelector('.neural-switch-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-switch-track-base'),
    ).toBeNull();
  });

  it('inherits accessible state and layout from Field', async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchFieldHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(SwitchFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.id).toBe('availability');
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(false);
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(
      'external availability-hint availability-error',
    );
    expect(
      fixture.nativeElement.querySelector('.neural-switch-fluid-base'),
    ).not.toBeNull();
  });
});

describeFormCheckboxControlConformance(
  'NeuralSwitch',
  createSwitchConformanceHarness,
);
