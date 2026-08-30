import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
  FieldLabelDirective,
} from '../field/field.component';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  describeFormValueControlConformance,
  type FormValueControlAdapter,
  type FormValueControlConformanceHarness,
} from '../testing/form-value-control-conformance';
import { OptionComponent } from './option.component';
import { SelectComponent } from './select.component';
import type {
  NeuralSelectChange,
  NeuralSelectClasses,
  NeuralSelectClear,
} from './select.types';

interface City {
  readonly id: number;
  readonly name: string;
  readonly disabled?: boolean;
  readonly iconClass?: string;
}

const CITIES: readonly City[] = [
  { id: 34, name: 'Istanbul', iconClass: 'nt-building' },
  { id: 6, name: 'Ankara' },
  { id: 35, name: 'Izmir', disabled: true },
];

@Component({
  imports: [SelectComponent, OptionComponent],
  template: `
    <neural-select
      selectId="city"
      ariaLabel="City"
      [options]="cities()"
      optionLabel="name"
      optionValue="id"
      optionDisabled="disabled"
      optionIcon="iconClass"
      [(value)]="value"
      [clearable]="clearable()"
      [disabled]="disabled()"
      [loading]="loading()"
      [appendTo]="appendTo()"
      [unstyled]="unstyled()"
      [classes]="classes"
      (selectionChange)="selectionEvents.push($event)"
      (cleared)="clearEvents.push($event)"
      (openChange)="openEvents.push($event)"
    />

    <neural-select
      selectId="status"
      ariaLabel="Status"
      [(value)]="projectedValue"
    >
      <neural-option
        value="ready"
        label="Ready"
        iconClass="nt-circle-check custom-color"
      >
        <strong>Ready now</strong>
      </neural-option>
      <neural-option value="paused" label="Paused">Paused</neural-option>
    </neural-select>
  `,
})
class SelectTestHost {
  readonly cities = signal(CITIES);
  readonly value = signal<unknown | null>(null);
  readonly projectedValue = signal<unknown | null>(null);
  readonly clearable = signal(true);
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly unstyled = signal(false);
  readonly appendTo = signal<'self' | 'body'>('self');
  readonly selectionEvents: NeuralSelectChange[] = [];
  readonly clearEvents: NeuralSelectClear[] = [];
  readonly openEvents: boolean[] = [];
  readonly classes: NeuralSelectClasses = {
    root: 'slot-root',
    trigger: 'slot-trigger',
    panel: 'slot-panel',
    option: 'slot-option',
    activeOption: 'slot-active',
    selectedOption: 'slot-selected',
  };
}

@Component({
  imports: [
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    FieldLabelDirective,
    SelectComponent,
  ],
  template: `
    <neural-field
      controlId="shipping-city"
      required
      invalid
      readonly
      fluid
      [disabled]="disabled()"
    >
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
      <label neuralFieldLabel>Shipping city</label>
      <neural-select [options]="['Istanbul', 'Ankara']" />
      <small neuralFieldHint>Choose one city.</small>
      <small neuralFieldError>A city is required.</small>
    </neural-field>
  `,
})
class FieldSelectTestHost {
  readonly disabled = signal(false);
}

@Component({
  imports: [SelectComponent],
  template: `<neural-select
    [options]="options"
    optionLabel="meta.label"
    optionValue="meta.id"
    virtualScroll
    [virtualItemSize]="40"
    [virtualScrollHeight]="200"
  />`,
})
class VirtualSelectTestHost {
  readonly options = Array.from({ length: 500 }, (_, index) => ({
    meta: { id: index, label: `Result ${index + 1}` },
  }));
}

@Component({
  imports: [FormField, FormsModule, ReactiveFormsModule, SelectComponent],
  template: `
    <neural-select
      selectId="direct-select"
      ariaLabel="Direct plan"
      [options]="options"
      [(value)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      (selectionChange)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
    <neural-select
      selectId="signal-select"
      ariaLabel="Signal plan"
      [options]="options"
      [formField]="signalForm.plan"
      (selectionChange)="signalEvents.push($event)"
    />
    <neural-select
      selectId="reactive-select"
      ariaLabel="Reactive plan"
      [options]="options"
      [formControl]="reactive"
      (selectionChange)="reactiveEvents.push($event)"
    />
    <neural-select
      selectId="template-select"
      ariaLabel="Template plan"
      [options]="options"
      name="templatePlan"
      [(ngModel)]="template"
      (selectionChange)="templateEvents.push($event)"
    />
  `,
})
class SelectConformanceHost {
  readonly options = ['starter', 'team'] as const;
  readonly direct = signal<string | null>('starter');
  readonly model = signal<{ plan: string | null }>({ plan: 'starter' });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl<string | null>('starter');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralSelectChange<string, unknown>[] = [];
  readonly signalEvents: NeuralSelectChange<string, unknown>[] = [];
  readonly reactiveEvents: NeuralSelectChange<string, unknown>[] = [];
  readonly templateEvents: NeuralSelectChange<string, unknown>[] = [];
  template: string | null = 'starter';
}

async function createSelectConformanceHarness(): Promise<
  FormValueControlConformanceHarness<
    string | null,
    NeuralSelectChange<string, unknown>
  >
> {
  await TestBed.configureTestingModule({
    imports: [SelectConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(SelectConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(By.directive(SelectComponent))
    .componentInstance as SelectComponent<unknown, string>;

  const trigger = (adapter: FormValueControlAdapter): HTMLButtonElement =>
    fixture.nativeElement.querySelector(
      `#${adapter}-select`,
    ) as HTMLButtonElement;
  const events = (
    adapter: FormValueControlAdapter,
  ): readonly NeuralSelectChange<string, unknown>[] => {
    if (adapter === 'direct') return host.directEvents;
    if (adapter === 'signal') return host.signalEvents;
    if (adapter === 'reactive') return host.reactiveEvents;
    return host.templateEvents;
  };

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
      const target = trigger(adapter);
      target.click();
      fixture.detectChanges();
      const option = Array.from(
        target.closest('neural-select')?.querySelectorAll('[role="option"]') ??
          [],
      ).find((candidate) => candidate.textContent?.trim() === value);
      (option as HTMLElement | undefined)?.click();
    },
    events,
    eventValue: (event) => event.value,
    eventPreviousValue: (event) => event.previousValue,
    setReadonly: (value) => host.readonly.set(value),
    setDisabled: (value) => host.disabled.set(value),
    setRequired: (value) => host.required.set(value),
    isReadonly: () =>
      trigger('direct').getAttribute('aria-readonly') === 'true',
    isDisabled: () => trigger('direct').disabled,
    isRequired: () =>
      trigger('direct').getAttribute('aria-required') === 'true',
    touchCount: () => host.touches(),
    blur: () => trigger('direct').dispatchEvent(new FocusEvent('blur')),
    focus: (options) => component.focus(options),
    focusTarget: () => trigger('direct'),
    reset: () => component.reset(),
    stabilize: async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    },
  };
}

describe('SelectComponent', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [SelectTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(SelectTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('maps data options and emits detailed pointer selection', async () => {
    const fixture = await createHost();
    const selects = fixture.nativeElement.querySelectorAll('neural-select');
    const trigger = selects[0].querySelector(
      '[role="combobox"]',
    ) as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    const options = selects[0].querySelectorAll('[role="option"]');

    expect(options).toHaveLength(3);
    expect(options[2].getAttribute('aria-disabled')).toBe('true');
    (options[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(34);
    expect(trigger.textContent).toContain('Istanbul');
    expect(fixture.componentInstance.selectionEvents[0]).toEqual({
      value: 34,
      previousValue: null,
      option: CITIES[0],
      source: 'pointer',
    });
    expect(fixture.componentInstance.openEvents).toEqual([true, false]);
    const icon = trigger.querySelector('.neural-select-option-icon');
    expect(icon?.classList).toContain('nt');
    expect(icon?.classList).toContain('nt-building');
  });

  it('supports projected option content, labels, and icons', async () => {
    const fixture = await createHost();
    const select = fixture.nativeElement.querySelectorAll('neural-select')[1];
    const trigger = select.querySelector(
      '[role="combobox"]',
    ) as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    const options = select.querySelectorAll('[role="option"]');
    expect(options[0].textContent).toContain('Ready now');
    expect(options[0].querySelector('strong')).not.toBeNull();
    expect(options[0].querySelector('i')?.classList).toContain('nt');

    (options[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.projectedValue()).toBe('ready');
    expect(trigger.textContent).toContain('Ready');
  });

  it('uses keyboard navigation, skips disabled options, and selects', async () => {
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      '#city',
    ) as HTMLButtonElement;

    trigger.dispatchEvent(keydown('ArrowUp'));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-activedescendant')).toContain('option-1');

    trigger.dispatchEvent(keydown('Enter'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(6);
    expect(fixture.componentInstance.selectionEvents[0]?.source).toBe(
      'keyboard',
    );
  });

  it('supports typeahead while keeping focus on the combobox', async () => {
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      '#city',
    ) as HTMLButtonElement;
    trigger.focus();
    trigger.dispatchEvent(keydown('a'));
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-activedescendant')).toContain('option-1');
  });

  it('shares nested option resolution and virtual range rendering', async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualSelectTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(VirtualSelectTestHost);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector(
      '[role="listbox"]',
    ) as HTMLElement;
    const options = list.querySelectorAll('[role="option"]');
    expect(options.length).toBeLessThan(20);
    expect(options[0]?.textContent).toContain('Result 1');
    expect(options[0]?.getAttribute('aria-setsize')).toBe('500');
  });

  it('moves an appendTo body panel into the top layer and cleans it up', async () => {
    const showPopover = vi.fn();
    const hidePopover = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: showPopover,
    });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
      configurable: true,
      value: hidePopover,
    });
    const fixture = await createHost();
    fixture.componentInstance.appendTo.set('body');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '#city',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector(
      '.neural-select-panel-root',
    ) as HTMLElement;
    expect(panel.getAttribute('popover')).toBe('manual');
    expect(panel.dataset['neuralAppendTo']).toBe('body');
    expect(showPopover).toHaveBeenCalled();

    trigger.click();
    fixture.detectChanges();
    expect(hidePopover).toHaveBeenCalled();
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });

  it('clears the model and reports the previous value', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set(34);
    fixture.detectChanges();
    const clear = fixture.nativeElement.querySelector(
      '[aria-label="Clear selection"]',
    ) as HTMLButtonElement;

    clear.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.clearEvents).toEqual([
      { previousValue: 34 },
    ]);
  });

  it('keeps structure and consumer slots in unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neural-select-root');
    const trigger = fixture.nativeElement.querySelector('#city');

    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-select-base');
    expect(trigger.classList).toContain('slot-trigger');
    expect(trigger.classList).toContain('neural-select-trigger-root');
    expect(trigger.classList).not.toContain('neural-select-trigger-base');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    expect(
      fixture.nativeElement.querySelector('.neural-select-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-select-trigger-base'),
    ).toBeNull();
  });

  it('inherits accessible state and fluid layout from Field', async () => {
    await TestBed.configureTestingModule({
      imports: [FieldSelectTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FieldSelectTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '[role="combobox"]',
    ) as HTMLButtonElement;
    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;

    expect(trigger.id).toBe('shipping-city');
    expect(label.htmlFor).toBe('shipping-city');
    expect(trigger.getAttribute('aria-required')).toBe('true');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-readonly')).toBe('true');
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-describedby')).toBe(
      'shipping-city-hint shipping-city-error',
    );
    expect(
      fixture.nativeElement.querySelector('.neural-select-fluid-base'),
    ).not.toBeNull();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(trigger.disabled).toBe(true);
  });
});

describeFormValueControlConformance(
  'SelectComponent',
  createSelectConformanceHarness,
);

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
}
