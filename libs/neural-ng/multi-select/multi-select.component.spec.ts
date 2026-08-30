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
import { NeuralMultiSelect } from './multi-select.component';
import type {
  NeuralMultiSelectChange,
  NeuralMultiSelectFilterEvent,
} from './multi-select.types';

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
  imports: [NeuralMultiSelect],
  template: `<neural-multi-select
    [options]="cities"
    optionLabel="name"
    optionValue="id"
    optionDisabled="disabled"
    optionGroup="region"
    [(value)]="value"
    [(filterValue)]="query"
    [filterDelay]="0"
    [selectionLimit]="limit()"
    [unstyled]="unstyled()"
    (selectionChange)="changes.push($event)"
    (filterChange)="filters.push($event)"
  />`,
})
class Host {
  readonly cities = CITIES;
  readonly value = signal<readonly number[]>([34]);
  readonly query = signal('');
  readonly limit = signal(0);
  readonly unstyled = signal(false);
  readonly changes: NeuralMultiSelectChange[] = [];
  readonly filters: NeuralMultiSelectFilterEvent[] = [];
}

@Component({
  imports: [NeuralMultiSelect, FormsModule, ReactiveFormsModule, FormField],
  template: `
    <neural-multi-select [options]="cities" [formControl]="reactiveControl" />
    <neural-multi-select
      [options]="cities"
      name="templateCities"
      [(ngModel)]="templateValue"
    />
    <neural-multi-select [options]="cities" [formField]="signalForm.cities" />
  `,
})
class FormsHost {
  readonly cities = ['Istanbul', 'Ankara'] as const;
  readonly reactiveControl = new FormControl<readonly string[]>(['Ankara'], {
    nonNullable: true,
  });
  templateValue: readonly string[] = ['Istanbul'];
  readonly signalModel = signal({ cities: ['Ankara'] as readonly string[] });
  readonly signalForm = form(this.signalModel);
}

@Component({
  imports: [NeuralMultiSelect, FormsModule, ReactiveFormsModule, FormField],
  template: `
    <neural-multi-select
      multiSelectId="direct-multi-select"
      ariaLabel="Direct capabilities"
      [options]="options"
      [(value)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [filter]="false"
      (selectionChange)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
    <neural-multi-select
      multiSelectId="signal-multi-select"
      ariaLabel="Signal capabilities"
      [options]="options"
      [formField]="signalForm.capabilities"
      [filter]="false"
      (selectionChange)="signalEvents.push($event)"
    />
    <neural-multi-select
      multiSelectId="reactive-multi-select"
      ariaLabel="Reactive capabilities"
      [options]="options"
      [formControl]="reactive"
      [filter]="false"
      (selectionChange)="reactiveEvents.push($event)"
    />
    <neural-multi-select
      multiSelectId="template-multi-select"
      ariaLabel="Template capabilities"
      [options]="options"
      name="templateCapabilities"
      [(ngModel)]="template"
      [filter]="false"
      (selectionChange)="templateEvents.push($event)"
    />
  `,
})
class MultiSelectConformanceHost {
  readonly options = ['starter', 'team'] as const;
  readonly direct = signal<readonly string[]>(['starter']);
  readonly model = signal<{ capabilities: readonly string[] }>({
    capabilities: ['starter'],
  });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl<readonly string[]>(['starter'], {
    nonNullable: true,
  });
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralMultiSelectChange<string, unknown>[] = [];
  readonly signalEvents: NeuralMultiSelectChange<string, unknown>[] = [];
  readonly reactiveEvents: NeuralMultiSelectChange<string, unknown>[] = [];
  readonly templateEvents: NeuralMultiSelectChange<string, unknown>[] = [];
  template: readonly string[] = ['starter'];
}

async function createMultiSelectConformanceHarness(): Promise<
  FormValueControlConformanceHarness<
    readonly string[],
    NeuralMultiSelectChange<string, unknown>
  >
> {
  await TestBed.configureTestingModule({
    imports: [MultiSelectConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(MultiSelectConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(By.directive(NeuralMultiSelect))
    .componentInstance as NeuralMultiSelect<unknown, string>;

  const trigger = (adapter: FormValueControlAdapter): HTMLElement =>
    fixture.nativeElement.querySelector(
      `#${adapter}-multi-select`,
    ) as HTMLElement;
  const events = (
    adapter: FormValueControlAdapter,
  ): readonly NeuralMultiSelectChange<string, unknown>[] => {
    if (adapter === 'direct') return host.directEvents;
    if (adapter === 'signal') return host.signalEvents;
    if (adapter === 'reactive') return host.reactiveEvents;
    return host.templateEvents;
  };

  const hostValue = (adapter: FormValueControlAdapter): readonly string[] => {
    if (adapter === 'direct') return host.direct();
    if (adapter === 'signal') return host.model().capabilities;
    if (adapter === 'reactive') return host.reactive.value;
    return host.template;
  };

  return {
    initialValue: ['starter'],
    programmaticValue: ['team'],
    userValue: ['starter', 'team'],
    resetValue: [],
    value: (adapter) => {
      if (adapter === 'direct') return host.direct();
      if (adapter === 'signal') return host.model().capabilities;
      if (adapter === 'reactive') return host.reactive.value;
      return host.template;
    },
    setValue: (adapter, value) => {
      if (adapter === 'direct') host.direct.set(value);
      else if (adapter === 'signal') host.model.set({ capabilities: value });
      else if (adapter === 'reactive') host.reactive.setValue(value);
      else host.template = value;
    },
    interact: (adapter, value) => {
      const target = trigger(adapter);
      target.click();
      fixture.detectChanges();
      const valueToToggle = value.find(
        (candidate) => !hostValue(adapter).includes(candidate),
      );
      const option = Array.from(
        target
          .closest('neural-multi-select')
          ?.querySelectorAll('[role="option"]') ?? [],
      ).find((candidate) => candidate.textContent?.trim() === valueToToggle);
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
    isDisabled: () =>
      trigger('direct').getAttribute('aria-disabled') === 'true',
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

@Component({
  imports: [NeuralMultiSelect],
  template: `<neural-multi-select
    [options]="options"
    optionLabel="meta.label"
    optionValue="meta.id"
    [filter]="false"
    virtualScroll
    [virtualItemSize]="40"
    [virtualScrollHeight]="200"
  />`,
})
class VirtualHost {
  readonly options = Array.from({ length: 1000 }, (_, index) => ({
    meta: { id: index, label: `Capability ${index + 1}` },
  }));
}

describe('NeuralMultiSelect', () => {
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

  it('opens an aria-multiselectable listbox and toggles values', async () => {
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      '[role="combobox"]',
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(
      fixture.nativeElement
        .querySelector('[role="listbox"]')
        .getAttribute('aria-multiselectable'),
    ).toBe('true');
    const options = fixture.nativeElement.querySelectorAll(
      '[role="option"]',
    ) as NodeListOf<HTMLElement>;
    options[1]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([34, 6]);
    expect(fixture.componentInstance.changes[0]?.source).toBe('pointer');
    options[0]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([6]);
  });

  it('filters locally without mutating source options and emits a request id', async () => {
    const fixture = await createHost();
    (
      fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      'input[type="search"]',
    ) as HTMLInputElement;
    input.value = 'ank';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[role="option"]'),
    ).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('[role="option"]')?.textContent,
    ).toContain('Ankara');
    expect(fixture.componentInstance.filters[0]).toEqual({
      query: 'ank',
      requestId: 1,
    });
    expect(fixture.componentInstance.cities).toBe(CITIES);
  });

  it('honors disabled options and selectionLimit', async () => {
    const fixture = await createHost();
    fixture.componentInstance.limit.set(1);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const options = fixture.nativeElement.querySelectorAll(
      '[role="option"]',
    ) as NodeListOf<HTMLElement>;
    options[1]?.click();
    options[2]?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([34]);
    expect(options[2]?.getAttribute('aria-disabled')).toBe('true');
  });

  it('selects and clears every visible enabled option', async () => {
    const fixture = await createHost();
    (
      fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const toggleAll = fixture.nativeElement.querySelector(
      '.neural-multi-select-select-all-root',
    ) as HTMLButtonElement;
    toggleAll.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([34, 6]);
    expect(
      fixture.componentInstance.changes[
        fixture.componentInstance.changes.length - 1
      ]?.source,
    ).toBe('pointer');
    (
      fixture.nativeElement.querySelector(
        '.neural-multi-select-clear-root',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([]);
    expect(
      fixture.componentInstance.changes[
        fixture.componentInstance.changes.length - 1
      ]?.source,
    ).toBe('pointer');
  });

  it('retains structural hooks while removing visual base classes', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const root = fixture.nativeElement.querySelector(
      '.neural-multi-select-root',
    ) as HTMLElement;
    expect(root.classList).not.toContain('neural-multi-select-base');
    const trigger = root.querySelector(
      '.neural-multi-select-trigger-root',
    ) as HTMLElement;
    expect(trigger.classList).not.toContain('neural-multi-select-trigger-base');
  });

  it('binds Reactive, template-driven, and Signal Forms through the array value model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.reactiveControl.setValue(['Istanbul']);
    fixture.componentInstance.templateValue = ['Ankara'];
    fixture.componentInstance.signalModel.set({ cities: ['Istanbul'] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelectorAll(
      '.neural-multi-select-value-root',
    ) as NodeListOf<HTMLElement>;
    expect(values[0]?.textContent).toContain('Istanbul');
    expect(values[1]?.textContent).toContain('Ankara');
    expect(values[2]?.textContent).toContain('Istanbul');
  });

  it('resolves nested paths and renders only the virtual window', async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(VirtualHost);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector(
      '[role="listbox"]',
    ) as HTMLElement;
    const firstWindow = list.querySelectorAll('[role="option"]');
    expect(firstWindow.length).toBeGreaterThan(0);
    expect(firstWindow.length).toBeLessThan(20);
    expect(firstWindow[0]?.textContent).toContain('Capability 1');
    expect(firstWindow[0]?.getAttribute('aria-setsize')).toBe('1000');

    list.scrollTop = 20_000;
    list.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(list.querySelector('[role="option"]')?.textContent).toContain(
      'Capability 498',
    );
  });
});

describeFormValueControlConformance(
  'NeuralMultiSelect',
  createMultiSelectConformanceHarness,
);
