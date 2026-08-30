import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  describeFormValueControlConformance,
  type FormValueControlAdapter,
  type FormValueControlConformanceHarness,
} from '../testing/form-value-control-conformance';
import { NeuralAutoComplete } from './auto-complete.component';
import type {
  NeuralAutoCompleteSearchEvent,
  NeuralAutoCompleteSelectEvent,
} from './auto-complete.types';

interface City {
  readonly id: number;
  readonly name: string;
  readonly region: string;
  readonly disabled?: boolean;
}
const CITIES: readonly City[] = [
  { id: 34, name: 'Istanbul', region: 'Marmara' },
  { id: 6, name: 'Ankara', region: 'Central Anatolia' },
  { id: 35, name: 'Izmir', region: 'Aegean', disabled: true },
];

@Component({
  imports: [NeuralAutoComplete],
  template: `<neural-auto-complete
    [options]="cities"
    optionLabel="name"
    optionValue="id"
    optionDisabled="disabled"
    optionGroup="region"
    [(value)]="value"
    [(query)]="query"
    [delay]="0"
    clearable
    showDropdown
    [unstyled]="unstyled()"
    (search)="searches.push($event)"
    (selected)="selections.push($event)"
  />`,
})
class Host {
  readonly cities = CITIES;
  readonly value = signal<number | string | null>(null);
  readonly query = signal('');
  readonly unstyled = signal(false);
  readonly searches: NeuralAutoCompleteSearchEvent[] = [];
  readonly selections: NeuralAutoCompleteSelectEvent[] = [];
}

@Component({
  imports: [NeuralAutoComplete, FormsModule, ReactiveFormsModule, FormField],
  template: `
    <neural-auto-complete
      autoCompleteId="reactive-city"
      [options]="cities"
      [delay]="0"
      [formControl]="reactiveControl"
    />
    <neural-auto-complete
      autoCompleteId="template-city"
      [options]="cities"
      [delay]="0"
      name="templateCity"
      [(ngModel)]="templateValue"
    />
    <neural-auto-complete
      autoCompleteId="signal-city"
      [options]="cities"
      [delay]="0"
      [formField]="signalForm.city"
    />
  `,
})
class FormsHost {
  readonly cities = ['Istanbul', 'Ankara'] as const;
  readonly reactiveControl = new FormControl<string | null>('Ankara');
  templateValue: string | null = 'Istanbul';
  readonly signalModel = signal({ city: 'Ankara' as string | null });
  readonly signalForm = form(this.signalModel);
}

@Component({
  imports: [NeuralAutoComplete, FormsModule, ReactiveFormsModule, FormField],
  template: `
    <neural-auto-complete
      autoCompleteId="direct-auto-complete"
      ariaLabel="Direct plan"
      [options]="options"
      [(value)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [delay]="0"
      showDropdown
      (selected)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
    <neural-auto-complete
      autoCompleteId="signal-auto-complete"
      ariaLabel="Signal plan"
      [options]="options"
      [formField]="signalForm.plan"
      [delay]="0"
      showDropdown
      (selected)="signalEvents.push($event)"
    />
    <neural-auto-complete
      autoCompleteId="reactive-auto-complete"
      ariaLabel="Reactive plan"
      [options]="options"
      [formControl]="reactive"
      [delay]="0"
      showDropdown
      (selected)="reactiveEvents.push($event)"
    />
    <neural-auto-complete
      autoCompleteId="template-auto-complete"
      ariaLabel="Template plan"
      [options]="options"
      name="templatePlan"
      [(ngModel)]="template"
      [delay]="0"
      showDropdown
      (selected)="templateEvents.push($event)"
    />
  `,
})
class AutoCompleteConformanceHost {
  readonly options = ['starter', 'team'] as const;
  readonly direct = signal<string | null>('starter');
  readonly model = signal<{ plan: string | null }>({ plan: 'starter' });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl<string | null>('starter');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralAutoCompleteSelectEvent<string, unknown>[] = [];
  readonly signalEvents: NeuralAutoCompleteSelectEvent<string, unknown>[] = [];
  readonly reactiveEvents: NeuralAutoCompleteSelectEvent<string, unknown>[] =
    [];
  readonly templateEvents: NeuralAutoCompleteSelectEvent<string, unknown>[] =
    [];
  template: string | null = 'starter';
}

async function createAutoCompleteConformanceHarness(): Promise<
  FormValueControlConformanceHarness<
    string | null,
    NeuralAutoCompleteSelectEvent<string, unknown>
  >
> {
  await TestBed.configureTestingModule({
    imports: [AutoCompleteConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(AutoCompleteConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(By.directive(NeuralAutoComplete))
    .componentInstance as NeuralAutoComplete<unknown, string>;

  const input = (adapter: FormValueControlAdapter): HTMLInputElement =>
    fixture.nativeElement.querySelector(
      `#${adapter}-auto-complete`,
    ) as HTMLInputElement;
  const events = (
    adapter: FormValueControlAdapter,
  ): readonly NeuralAutoCompleteSelectEvent<string, unknown>[] => {
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
      const target = input(adapter);
      const control = target.closest('neural-auto-complete');
      (
        control?.querySelector(
          '.neural-auto-complete-dropdown-root',
        ) as HTMLButtonElement | null
      )?.click();
      fixture.detectChanges();
      const option = Array.from(
        control?.querySelectorAll('[role="option"]') ?? [],
      ).find((candidate) => candidate.textContent?.trim() === value);
      (option as HTMLElement | undefined)?.click();
    },
    events,
    eventValue: (event) => event.value as string | null,
    eventPreviousValue: (event) => event.previousValue as string | null,
    setReadonly: (value) => host.readonly.set(value),
    setDisabled: (value) => host.disabled.set(value),
    setRequired: (value) => host.required.set(value),
    isReadonly: () =>
      input('direct').readOnly &&
      input('direct').getAttribute('aria-readonly') === 'true',
    isDisabled: () => input('direct').disabled,
    isRequired: () => input('direct').required,
    touchCount: () => host.touches(),
    blur: () => input('direct').dispatchEvent(new FocusEvent('blur')),
    focus: (options) => component.focus(options),
    focusTarget: () => input('direct'),
    reset: () => component.reset(),
    stabilize: async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    },
  };
}

describe('NeuralAutoComplete', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('filters local options and emits serializable search requests', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'ank';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.searches[0]).toEqual({
      query: 'ank',
      requestId: 1,
      reason: 'input',
    });
    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toContain('Ankara');
  });

  it('keeps DOM focus on the combobox while selecting with the keyboard', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.focus();
    input.value = 'is';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(34);
    expect(fixture.componentInstance.query()).toBe('Istanbul');
    expect(fixture.componentInstance.selections[0]?.source).toBe('keyboard');
    expect(document.activeElement).toBe(input);
  });

  it('does not search while an IME composition is active', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    );
    input.value = 'İs';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.searches).toHaveLength(0);
    input.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true, data: 'İs' }),
    );
    expect(fixture.componentInstance.searches).toHaveLength(1);
  });

  it('clears a non-matching query when forceSelection is enabled', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'Unknown';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('commits a case-insensitive exact label on blur', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'ankara';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(6);
    expect(fixture.componentInstance.selections[0]?.source).toBe('input');
  });

  it('opens the dropdown button from the keyboard', async () => {
    const fixture = await createHost();
    const button = fixture.nativeElement.querySelector(
      '.neural-auto-complete-dropdown-root',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.searches[0]?.reason).toBe('dropdown');
    expect(
      fixture.nativeElement
        .querySelector('input')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('retains structural hooks while removing local and global visual classes', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const root = fixture.nativeElement.querySelector(
      '.neural-auto-complete-root',
    ) as HTMLElement;
    expect(root.classList).not.toContain('neural-auto-complete-base');
    expect(root.querySelector('input')?.classList).toContain(
      'neural-auto-complete-input-root',
    );
    expect(root.querySelector('input')?.classList).not.toContain(
      'neural-auto-complete-input-base',
    );
  });

  it('binds Reactive, template-driven, and Signal Forms through one value model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll(
      'input[role="combobox"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0]?.value).toBe('Ankara');
    expect(inputs[1]?.value).toBe('Istanbul');
    expect(inputs[2]?.value).toBe('Ankara');

    fixture.componentInstance.reactiveControl.setValue('Istanbul');
    fixture.componentInstance.signalModel.set({ city: 'Istanbul' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inputs[0]?.value).toBe('Istanbul');
    expect(inputs[2]?.value).toBe('Istanbul');

    const signalComponent = fixture.debugElement.queryAll(
      By.directive(NeuralAutoComplete),
    )[2]?.componentInstance as NeuralAutoComplete<string, string>;
    const ankara = signalComponent.resolvedOptions()[1];
    expect(ankara).toBeDefined();
    if (ankara) signalComponent.selectOption(ankara, 'pointer');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.signalModel().city).toBe('Ankara');
  });
});

describeFormValueControlConformance(
  'AutoCompleteComponent',
  createAutoCompleteConformanceHarness,
);
