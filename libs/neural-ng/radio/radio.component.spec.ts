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
  describeFormValueControlConformance,
  type FormValueControlAdapter,
  type FormValueControlConformanceHarness,
} from '../testing/form-value-control-conformance';
import { RadioComponent, RadioGroupComponent } from './radio.component';
import type {
  NeuralRadioClasses,
  NeuralRadioSelectionChange,
} from './radio.types';

interface Plan {
  readonly id: string;
  readonly name: string;
  readonly disabled?: boolean;
  readonly iconClass?: string;
}

@Component({
  imports: [RadioGroupComponent],
  template: `
    <neural-radio-group
      radioGroupId="plans"
      radioName="billing-plan"
      [options]="plans"
      optionLabel="name"
      optionValue="id"
      optionDisabled="disabled"
      optionIcon="iconClass"
      [(value)]="value"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [required]="required()"
      [unstyled]="unstyled()"
      [classes]="classes"
      radioGroupClass="consumer-group"
      (selectionChange)="events.push($event)"
    />
  `,
})
class DataRadioHost {
  readonly plans: readonly Plan[] = [
    { id: 'starter', name: 'Starter', iconClass: 'nt-user' },
    { id: 'pro', name: 'Pro', disabled: true },
    { id: 'enterprise', name: 'Enterprise' },
  ];
  readonly value = signal<string | null>(null);
  readonly orientation = signal<'horizontal' | 'vertical'>('vertical');
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly unstyled = signal(false);
  readonly events: NeuralRadioSelectionChange<string, Plan>[] = [];
  readonly classes: NeuralRadioClasses = {
    root: 'slot-root',
    option: 'slot-option',
    input: 'slot-input',
    control: 'slot-control',
    selectedControl: 'slot-selected',
    disabledOption: 'slot-disabled',
    label: 'slot-label',
    optionIcon: 'slot-icon',
  };
}

@Component({
  imports: [RadioComponent, RadioGroupComponent],
  template: `
    <neural-radio-group
      radioGroupId="delivery"
      [(value)]="value"
      (selectionChange)="events.push($event)"
    >
      <neural-radio value="standard" iconClass="nt-truck">
        <strong>Standard delivery</strong>
      </neural-radio>
      <neural-radio value="express" disabled>Express delivery</neural-radio>
      <neural-radio value="pickup">Store pickup</neural-radio>
    </neural-radio-group>
  `,
})
class ProjectedRadioHost {
  readonly value = signal<string | null>('standard');
  readonly events: NeuralRadioSelectionChange[] = [];
}

@Component({
  imports: [
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    RadioGroupComponent,
  ],
  template: `
    <neural-field
      controlId="contact-method"
      describedBy="external"
      required
      invalid
      readonly
      fluid
      [disabled]="disabled()"
    >
      <neural-radio-group
        [options]="options"
        optionLabel="label"
        optionValue="value"
      />
      <small neuralFieldHint>Choose one method.</small>
      <small neuralFieldError>A method is required.</small>
    </neural-field>
  `,
})
class RadioFieldHost {
  readonly disabled = signal(false);
  readonly options = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
  ];
}

@Component({
  imports: [FormField, FormsModule, RadioGroupComponent, ReactiveFormsModule],
  template: `
    <neural-radio-group
      radioGroupId="direct-radio"
      radioName="directRadio"
      ariaLabel="Direct plan"
      [options]="options"
      optionLabel="label"
      optionValue="value"
      [(value)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      (selectionChange)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
    <neural-radio-group
      radioGroupId="signal-radio"
      radioName="signalRadio"
      ariaLabel="Signal plan"
      [options]="options"
      optionLabel="label"
      optionValue="value"
      [formField]="signalForm.plan"
      (selectionChange)="signalEvents.push($event)"
    />
    <neural-radio-group
      radioGroupId="reactive-radio"
      radioName="reactiveRadio"
      ariaLabel="Reactive plan"
      [options]="options"
      optionLabel="label"
      optionValue="value"
      [formControl]="reactive"
      (selectionChange)="reactiveEvents.push($event)"
    />
    <neural-radio-group
      radioGroupId="template-radio"
      radioName="templateRadio"
      ariaLabel="Template plan"
      [options]="options"
      optionLabel="label"
      optionValue="value"
      name="templatePlan"
      [(ngModel)]="template"
      (selectionChange)="templateEvents.push($event)"
    />
  `,
})
class RadioConformanceHost {
  readonly options = [
    { label: 'Starter', value: 'starter' },
    { label: 'Team', value: 'team' },
  ] as const;
  readonly direct = signal<string | null>('starter');
  readonly model = signal<{ plan: string | null }>({ plan: 'starter' });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl<string | null>('starter');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralRadioSelectionChange<string, unknown>[] = [];
  readonly signalEvents: NeuralRadioSelectionChange<string, unknown>[] = [];
  readonly reactiveEvents: NeuralRadioSelectionChange<string, unknown>[] = [];
  readonly templateEvents: NeuralRadioSelectionChange<string, unknown>[] = [];
  template: string | null = 'starter';
}

async function createRadioConformanceHarness(): Promise<
  FormValueControlConformanceHarness<
    string | null,
    NeuralRadioSelectionChange<string, unknown>
  >
> {
  await TestBed.configureTestingModule({
    imports: [RadioConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(RadioConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(
    By.directive(RadioGroupComponent),
  ).componentInstance as RadioGroupComponent<unknown, string>;

  const groupId = (adapter: FormValueControlAdapter): string =>
    `${adapter}-radio`;
  const group = (adapter: FormValueControlAdapter): HTMLElement =>
    fixture.nativeElement.querySelector(`#${groupId(adapter)}`) as HTMLElement;
  const inputs = (adapter: FormValueControlAdapter): HTMLInputElement[] =>
    Array.from(group(adapter).querySelectorAll('input')) as HTMLInputElement[];
  const selectedInput = (adapter: FormValueControlAdapter): HTMLInputElement =>
    inputs(adapter).find((input) => input.tabIndex === 0) ??
    inputs(adapter)[0]!;

  return {
    initialValue: 'starter',
    programmaticValue: 'team',
    userValue: 'team',
    resetValue: null,
    value: (adapter) => {
      if (adapter === 'direct') return host.direct();
      if (adapter === 'signal') return host.model().plan;
      if (adapter === 'reactive') return host.reactive.value;
      return host.template;
    },
    setValue: (adapter, value) => {
      if (adapter === 'direct') host.direct.set(value);
      else if (adapter === 'signal') host.model.set({ plan: value });
      else if (adapter === 'reactive') host.reactive.setValue(value);
      else host.template = value;
    },
    interact: (adapter, value) => {
      const input = inputs(adapter).find(
        (candidate) => candidate.value === value,
      );
      if (!input) throw new Error(`Missing radio option: ${String(value)}`);
      input.click();
    },
    events: (adapter) => {
      if (adapter === 'direct') return host.directEvents;
      if (adapter === 'signal') return host.signalEvents;
      if (adapter === 'reactive') return host.reactiveEvents;
      return host.templateEvents;
    },
    eventValue: (event) => event.value,
    eventPreviousValue: (event) => event.previousValue,
    setReadonly: (value) => host.readonly.set(value),
    setDisabled: (value) => host.disabled.set(value),
    setRequired: (value) => host.required.set(value),
    isReadonly: () => group('direct').getAttribute('aria-readonly') === 'true',
    isDisabled: () => inputs('direct').every((input) => input.disabled),
    isRequired: () => inputs('direct').every((input) => input.required),
    touchCount: () => host.touches(),
    blur: () =>
      group('direct').dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
      ),
    focus: (options) => component.focus(options),
    focusTarget: () => selectedInput('direct'),
    reset: () => component.reset(),
    stabilize: async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    },
  };
}

describe('RadioGroupComponent', () => {
  async function createDataHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [DataRadioHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(DataRadioHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders a native named radio group from options and updates the model', async () => {
    const fixture = await createDataHost();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(inputs).toHaveLength(3);
    expect(inputs.every((input) => input.type === 'radio')).toBe(true);
    expect(inputs.every((input) => input.name === 'billing-plan')).toBe(true);
    expect(inputs[1]?.disabled).toBe(true);

    inputs[0]?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('starter');
    expect(fixture.componentInstance.events[0]).toMatchObject({
      value: 'starter',
      previousValue: null,
      option: fixture.componentInstance.plans[0],
      source: 'pointer',
    });
    expect(inputs[0]?.checked).toBe(true);
  });

  it('normalizes icon classes and applies horizontal orientation', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');
    const icon = fixture.nativeElement.querySelector(
      '.neural-radio-option-icon',
    );

    expect(group.getAttribute('aria-orientation')).toBe('horizontal');
    expect(group.dataset['orientation']).toBe('horizontal');
    expect(icon.classList).toContain('nt');
    expect(icon.classList).toContain('nt-user');
  });

  it('uses roving tabindex and skips disabled options with arrow keys', async () => {
    const fixture = await createDataHost();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(inputs.map((input) => input.tabIndex)).toEqual([0, -1, -1]);
    inputs[0]?.dispatchEvent(keydown('ArrowDown'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('enterprise');
    expect(document.activeElement).toBe(inputs[2]);
    expect(inputs.map((input) => input.tabIndex)).toEqual([-1, -1, 0]);
    expect(fixture.componentInstance.events[0]?.source).toBe('keyboard');

    inputs[2]?.dispatchEvent(keydown('Home'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('starter');
  });

  it('supports projected rich radio content', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectedRadioHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectedRadioHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(inputs).toHaveLength(3);
    expect(inputs[0]?.checked).toBe(true);
    expect(inputs[1]?.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('strong')?.textContent).toBe(
      'Standard delivery',
    );
    expect(fixture.nativeElement.querySelector('.nt-truck')).not.toBeNull();

    inputs[2]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('pickup');
  });

  it('exposes disabled and required through native inputs', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.required.set(true);
    fixture.detectChanges();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');

    expect(inputs.every((input) => input.disabled)).toBe(true);
    expect(inputs.every((input) => input.required)).toBe(true);
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(group.dataset['disabled']).toBe('true');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('label')).every(
        (label) =>
          (label as HTMLElement).classList.contains(
            'neural-radio-option-disabled-base',
          ),
      ),
    ).toBe(true);
    inputs[0]?.click();
    expect(fixture.componentInstance.events).toHaveLength(0);
  });

  it('keeps structural and consumer classes in unstyled mode', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      '.neural-radio-group-root',
    );
    const option = fixture.nativeElement.querySelector(
      '.neural-radio-option-root',
    );
    const input = fixture.nativeElement.querySelector('input');

    expect(group.classList).toContain('consumer-group');
    expect(group.classList).toContain('slot-root');
    expect(group.classList).not.toContain('neural-radio-group-base');
    expect(option.classList).toContain('slot-option');
    expect(option.classList).not.toContain('neural-radio-option-base');
    expect(input.classList).toContain('slot-input');
    expect(input.classList).not.toContain('neural-radio-input-base');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createDataHost([provideNeuralNg({ unstyled: true })]);
    expect(
      fixture.nativeElement.querySelector('.neural-radio-group-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-radio-control-base'),
    ).toBeNull();
  });

  it('inherits accessible state and layout from Field', async () => {
    await TestBed.configureTestingModule({
      imports: [RadioFieldHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(RadioFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(group.id).toBe('contact-method');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-readonly')).toBe('true');
    expect(inputs.every((input) => !input.disabled)).toBe(true);
    expect(group.getAttribute('aria-describedby')).toBe(
      'external contact-method-hint contact-method-error',
    );
    expect(inputs.every((input) => input.required)).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.neural-radio-group-fluid-base'),
    ).not.toBeNull();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(inputs.every((input) => input.disabled)).toBe(true);
  });
});

describeFormValueControlConformance(
  'RadioGroupComponent',
  createRadioConformanceHarness,
);

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
}
