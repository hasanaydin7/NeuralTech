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
import { NeuralCheckbox, NeuralTriStateCheckbox } from './checkbox.component';
import type {
  NeuralCheckboxChange,
  NeuralCheckboxClasses,
  NeuralTriStateCheckboxChange,
  NeuralTriStateCheckboxValue,
} from './checkbox.types';

@Component({
  imports: [NeuralCheckbox],
  template: `
    <neural-checkbox
      inputId="terms"
      name="terms"
      inputValue="accepted"
      [(checked)]="checked"
      [indeterminate]="indeterminate()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [unstyled]="unstyled()"
      [classes]="classes"
      checkboxClass="consumer-root"
      inputClass="consumer-input"
      labelClass="consumer-label"
      (stateChange)="events.push($event)"
      (touch)="touches.update((count) => count + 1)"
    >
      Accept terms
    </neural-checkbox>
  `,
})
class CheckboxTestHost {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly unstyled = signal(false);
  readonly events: NeuralCheckboxChange[] = [];
  readonly touches = signal(0);
  readonly classes: NeuralCheckboxClasses = {
    root: 'slot-root',
    input: 'slot-input',
    control: 'slot-control',
    checkedControl: 'slot-checked',
    label: 'slot-label',
  };
}

@Component({
  imports: [NeuralTriStateCheckbox],
  template: `
    <neural-tri-state-checkbox
      inputId="permission"
      name="permission"
      [(value)]="value"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [unstyled]="unstyled()"
      [classes]="classes"
      (stateChange)="events.push($event)"
      (touch)="touches.update((count) => count + 1)"
    >
      Inherit permission
    </neural-tri-state-checkbox>
  `,
})
class TriStateCheckboxTestHost {
  readonly value = signal<NeuralTriStateCheckboxValue>(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly unstyled = signal(false);
  readonly events: NeuralTriStateCheckboxChange[] = [];
  readonly touches = signal(0);
  readonly classes = {
    root: 'slot-root',
    input: 'slot-input',
    control: 'slot-control',
    checkedControl: 'slot-checked',
    mixedControl: 'slot-mixed',
    label: 'slot-label',
  } as const;
}

@Component({
  imports: [
    NeuralCheckbox,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    NeuralTriStateCheckbox,
  ],
  template: `
    <neural-field
      controlId="consent"
      describedBy="external"
      required
      invalid
      fluid
      [disabled]="disabled()"
      [readonly]="readonly()"
    >
      <neural-checkbox>Marketing consent</neural-checkbox>
      <small neuralFieldHint>Choose your preference.</small>
      <small neuralFieldError>Consent is required.</small>
    </neural-field>

    <neural-field controlId="inheritance" pending>
      <neural-tri-state-checkbox>
        Inherit permission
      </neural-tri-state-checkbox>
    </neural-field>
  `,
})
class CheckboxFieldHost {
  readonly disabled = signal(false);
  readonly readonly = signal(false);
}

@Component({
  imports: [
    NeuralCheckbox,
    FormField,
    FormsModule,
    ReactiveFormsModule,
    NeuralTriStateCheckbox,
  ],
  template: `
    <neural-checkbox
      inputId="signal-binary"
      [formField]="signalForm.binary"
      (stateChange)="binaryEvents.push($event)"
    >
      Signal binary
    </neural-checkbox>
    <neural-tri-state-checkbox
      inputId="signal-tri"
      [formField]="signalForm.triState"
      (stateChange)="triStateEvents.push($event)"
    >
      Signal tri-state
    </neural-tri-state-checkbox>

    <neural-checkbox inputId="reactive-binary" [formControl]="reactiveBinary">
      Reactive binary
    </neural-checkbox>
    <neural-tri-state-checkbox
      inputId="reactive-tri"
      [formControl]="reactiveTriState"
    >
      Reactive tri-state
    </neural-tri-state-checkbox>

    <neural-checkbox
      inputId="template-binary"
      name="templateBinary"
      [(ngModel)]="templateBinary"
    >
      Template binary
    </neural-checkbox>
    <neural-tri-state-checkbox
      inputId="template-tri"
      name="templateTriState"
      [(ngModel)]="templateTriState"
    >
      Template tri-state
    </neural-tri-state-checkbox>
  `,
})
class CheckboxFormsHost {
  readonly model = signal<{
    binary: boolean;
    triState: NeuralTriStateCheckboxValue;
  }>({ binary: false, triState: false });
  readonly signalForm = form(this.model);
  readonly reactiveBinary = new FormControl(false, { nonNullable: true });
  readonly reactiveTriState = new FormControl<NeuralTriStateCheckboxValue>(
    false,
  );
  readonly binaryEvents: NeuralCheckboxChange[] = [];
  readonly triStateEvents: NeuralTriStateCheckboxChange[] = [];
  templateBinary = false;
  templateTriState: NeuralTriStateCheckboxValue = false;
}

@Component({
  imports: [NeuralCheckbox, FormField, FormsModule, ReactiveFormsModule],
  template: `
    <neural-checkbox
      inputId="direct-checkbox"
      [(checked)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      (stateChange)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    >
      Direct checkbox
    </neural-checkbox>
    <neural-checkbox
      inputId="signal-checkbox"
      [formField]="signalForm.value"
      (stateChange)="signalEvents.push($event)"
    >
      Signal checkbox
    </neural-checkbox>
    <neural-checkbox
      inputId="reactive-checkbox"
      [formControl]="reactive"
      (stateChange)="reactiveEvents.push($event)"
    >
      Reactive checkbox
    </neural-checkbox>
    <neural-checkbox
      inputId="template-checkbox"
      name="templateCheckbox"
      [(ngModel)]="template"
      (stateChange)="templateEvents.push($event)"
    >
      Template checkbox
    </neural-checkbox>
  `,
})
class CheckboxConformanceHost {
  readonly direct = signal(false);
  readonly model = signal({ value: false });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl(false, { nonNullable: true });
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralCheckboxChange[] = [];
  readonly signalEvents: NeuralCheckboxChange[] = [];
  readonly reactiveEvents: NeuralCheckboxChange[] = [];
  readonly templateEvents: NeuralCheckboxChange[] = [];
  template = false;
}

async function createCheckboxConformanceHarness(): Promise<FormCheckboxControlConformanceHarness> {
  await TestBed.configureTestingModule({
    imports: [CheckboxConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(CheckboxConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(By.directive(NeuralCheckbox))
    .componentInstance as NeuralCheckbox;

  const input = (adapter: FormCheckboxControlAdapter): HTMLInputElement =>
    fixture.nativeElement.querySelector(
      `#${adapter}-checkbox`,
    ) as HTMLInputElement;

  return {
    expectedRole: 'checkbox',
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

describe('NeuralCheckbox', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [CheckboxTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckboxTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('implements a native binary checkbox model', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.type).toBe('checkbox');
    expect(input.id).toBe('terms');
    expect(input.name).toBe('terms');
    expect(input.value).toBe('accepted');
    input.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(fixture.componentInstance.events[0]).toMatchObject({
      checked: true,
      previousChecked: false,
    });
  });

  it('exposes a presentation-only mixed state for collection selection', async () => {
    const fixture = await createHost();
    fixture.componentInstance.indeterminate.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('mixed');
    expect(
      fixture.nativeElement.querySelector('label').getAttribute('data-state'),
    ).toBe('mixed');
    expect(fixture.componentInstance.checked()).toBe(false);
  });

  it('keeps readonly checkboxes focusable without changing state', async () => {
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

  it('emits touch on blur', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.touches()).toBe(1);
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
    const root = fixture.nativeElement.querySelector('.neural-checkbox-root');
    const input = fixture.nativeElement.querySelector('input');
    const control = fixture.nativeElement.querySelector(
      '.neural-checkbox-control-root',
    );

    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-checkbox-base');
    expect(input.classList).toContain('consumer-input');
    expect(input.classList).not.toContain('neural-checkbox-input-base');
    expect(control.classList).toContain('slot-control');
    expect(control.classList).not.toContain('neural-checkbox-control-base');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    expect(
      fixture.nativeElement.querySelector('.neural-checkbox-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-checkbox-input-base'),
    ).toBeNull();
  });
});

describeFormCheckboxControlConformance(
  'NeuralCheckbox',
  createCheckboxConformanceHarness,
);

describe('NeuralTriStateCheckbox', () => {
  async function createHost() {
    await TestBed.configureTestingModule({
      imports: [TriStateCheckboxTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TriStateCheckboxTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('cycles false, true, null, and false through its value model', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const root = fixture.nativeElement.querySelector('.neural-checkbox-root');

    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('true');

    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('mixed');
    expect(root.dataset['state']).toBe('mixed');

    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(false);
    expect(input.indeterminate).toBe(false);
    expect(
      fixture.componentInstance.events.map((event) => event.value),
    ).toEqual([true, null, false]);
  });

  it('keeps readonly tri-state controls focusable and stable', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set(null);
    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.disabled).toBe(false);
    expect(input.indeterminate).toBe(true);
    input.focus();
    expect(document.activeElement).toBe(input);
    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.events).toHaveLength(0);
  });

  it('emits touch on blur', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.touches()).toBe(1);
  });
});

describe('Checkbox Forms Foundation adapters', () => {
  it('supports Signal Forms, Reactive Forms, and ngModel for both contracts', async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxFormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckboxFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.model.set({ binary: true, triState: null });
    fixture.componentInstance.reactiveBinary.setValue(true);
    fixture.componentInstance.reactiveTriState.setValue(null);
    fixture.componentInstance.templateBinary = true;
    fixture.componentInstance.templateTriState = null;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    for (const id of ['signal-binary', 'reactive-binary', 'template-binary']) {
      const input = fixture.nativeElement.querySelector(
        `#${id}`,
      ) as HTMLInputElement;
      expect(input.checked).toBe(true);
    }

    for (const id of ['signal-tri', 'reactive-tri', 'template-tri']) {
      const input = fixture.nativeElement.querySelector(
        `#${id}`,
      ) as HTMLInputElement;
      expect(input.indeterminate).toBe(true);
    }

    expect(fixture.componentInstance.binaryEvents).toHaveLength(0);
    expect(fixture.componentInstance.triStateEvents).toHaveLength(0);
  });

  it('writes user changes back through every forms adapter', async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxFormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckboxFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    for (const id of ['signal-binary', 'reactive-binary', 'template-binary']) {
      const input = fixture.nativeElement.querySelector(
        `#${id}`,
      ) as HTMLInputElement;
      input.click();
    }
    for (const id of ['signal-tri', 'reactive-tri', 'template-tri']) {
      const input = fixture.nativeElement.querySelector(
        `#${id}`,
      ) as HTMLInputElement;
      input.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      input.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    expect(fixture.componentInstance.model()).toEqual({
      binary: true,
      triState: null,
    });
    expect(fixture.componentInstance.reactiveBinary.value).toBe(true);
    expect(fixture.componentInstance.reactiveTriState.value).toBeNull();
    expect(fixture.componentInstance.templateBinary).toBe(true);
    expect(fixture.componentInstance.templateTriState).toBeNull();
  });
});

describe('Checkbox Field composition', () => {
  it('inherits accessible state and layout without folding readonly into disabled', async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxFieldHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CheckboxFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const consent = fixture.nativeElement.querySelector(
      '#consent',
    ) as HTMLInputElement;
    const inheritance = fixture.nativeElement.querySelector(
      '#inheritance',
    ) as HTMLInputElement;

    expect(consent.required).toBe(true);
    expect(consent.getAttribute('aria-invalid')).toBe('true');
    expect(consent.getAttribute('aria-describedby')).toBe(
      'external consent-hint consent-error',
    );
    expect(
      fixture.nativeElement.querySelector('.neural-checkbox-fluid-base'),
    ).not.toBeNull();
    expect(inheritance.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();
    expect(consent.disabled).toBe(false);
    expect(consent.getAttribute('aria-readonly')).toBe('true');

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(consent.disabled).toBe(true);
  });
});
