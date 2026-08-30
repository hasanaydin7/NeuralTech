import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { FieldComponent, FieldLabelDirective } from '../field/field.component';
import {
  describeFormValueControlConformance,
  type FormValueControlAdapter,
  type FormValueControlConformanceHarness,
} from '../testing/form-value-control-conformance';
import { NeuralTreeSelect } from './tree-select.component';
import type {
  NeuralTreeSelectChange,
  NeuralTreeSelectValue,
} from './tree-select.types';

interface Item {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly Item[];
}

const OPTIONS: readonly Item[] = [
  { id: 'root', name: 'Root', children: [{ id: 'child', name: 'Child' }] },
  { id: 'team', name: 'Team' },
];

@Component({
  imports: [NeuralTreeSelect],
  template: `<neural-tree-select
    [options]="options"
    optionLabel="name"
    optionValue="id"
    [(value)]="value"
    [expandedKeys]="expanded"
    [selectionMode]="mode()"
    [closeOnSelect]="false"
    [readonly]="readonly()"
    [disabled]="disabled()"
    [unstyled]="unstyled()"
    ariaLabel="Workspace"
    fluid
    (selectionChange)="changes.push($event)"
    (unselected)="unselections.push($event)"
  />`,
})
class HostComponent {
  readonly options = OPTIONS;
  readonly value = signal<NeuralTreeSelectValue<string>>(null);
  readonly expanded = new Set(['root']);
  readonly mode = signal<'single' | 'multiple' | 'checkbox'>('single');
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly unstyled = signal(false);
  readonly changes: NeuralTreeSelectChange<string, Item>[] = [];
  readonly unselections: NeuralTreeSelectChange<string, Item>[] = [];
}

@Component({
  imports: [FieldComponent, FieldLabelDirective, NeuralTreeSelect],
  template: `
    <neural-field controlId="field-tree-select" required readonly>
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
      <label neuralFieldLabel>Field tree</label>
      <neural-tree-select
        [options]="options"
        optionLabel="name"
        optionValue="id"
        [(value)]="value"
      />
    </neural-field>
  `,
})
class FieldHostComponent {
  readonly options = OPTIONS;
  readonly value = signal<NeuralTreeSelectValue<string>>('child');
}

@Component({
  imports: [FormField, FormsModule, ReactiveFormsModule, NeuralTreeSelect],
  template: `
    <neural-tree-select
      treeSelectId="direct-tree-select"
      ariaLabel="Direct workspace"
      [options]="options"
      optionLabel="name"
      optionValue="id"
      [(value)]="direct"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
      [filter]="false"
      (selectionChange)="directEvents.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
    <neural-tree-select
      treeSelectId="signal-tree-select"
      ariaLabel="Signal workspace"
      [options]="options"
      optionLabel="name"
      optionValue="id"
      [formField]="signalForm.workspace"
      [filter]="false"
      (selectionChange)="signalEvents.push($event)"
    />
    <neural-tree-select
      treeSelectId="reactive-tree-select"
      ariaLabel="Reactive workspace"
      [options]="options"
      optionLabel="name"
      optionValue="id"
      [formControl]="reactive"
      [filter]="false"
      (selectionChange)="reactiveEvents.push($event)"
    />
    <neural-tree-select
      treeSelectId="template-tree-select"
      ariaLabel="Template workspace"
      [options]="options"
      optionLabel="name"
      optionValue="id"
      name="templateWorkspace"
      [(ngModel)]="template"
      [filter]="false"
      (selectionChange)="templateEvents.push($event)"
    />
  `,
})
class TreeSelectConformanceHost {
  readonly options: readonly Item[] = [
    { id: 'starter', name: 'starter' },
    { id: 'team', name: 'team' },
  ];
  readonly direct = signal<NeuralTreeSelectValue<string>>('starter');
  readonly model = signal<{ workspace: NeuralTreeSelectValue<string> }>({
    workspace: 'starter',
  });
  readonly signalForm = form(this.model);
  readonly reactive = new FormControl<NeuralTreeSelectValue<string>>('starter');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly required = signal(false);
  readonly touches = signal(0);
  readonly directEvents: NeuralTreeSelectChange<string, Item>[] = [];
  readonly signalEvents: NeuralTreeSelectChange<string, Item>[] = [];
  readonly reactiveEvents: NeuralTreeSelectChange<string, Item>[] = [];
  readonly templateEvents: NeuralTreeSelectChange<string, Item>[] = [];
  template: NeuralTreeSelectValue<string> = 'starter';
}

async function createTreeSelectConformanceHarness(): Promise<
  FormValueControlConformanceHarness<
    NeuralTreeSelectValue<string>,
    NeuralTreeSelectChange<string, Item>
  >
> {
  await TestBed.configureTestingModule({
    imports: [TreeSelectConformanceHost],
  }).compileComponents();
  const fixture = TestBed.createComponent(TreeSelectConformanceHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const component = fixture.debugElement.query(By.directive(NeuralTreeSelect))
    .componentInstance as NeuralTreeSelect<Item, string>;

  const trigger = (adapter: FormValueControlAdapter): HTMLElement =>
    fixture.nativeElement.querySelector(
      `#${adapter}-tree-select`,
    ) as HTMLElement;
  const events = (
    adapter: FormValueControlAdapter,
  ): readonly NeuralTreeSelectChange<string, Item>[] => {
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
      if (adapter === 'signal') return host.model().workspace;
      if (adapter === 'reactive') return host.reactive.value;
      return host.template;
    },
    setValue: (adapter, value) => {
      if (adapter === 'direct') host.direct.set(value);
      else if (adapter === 'signal') host.model.set({ workspace: value });
      else if (adapter === 'reactive') host.reactive.setValue(value);
      else host.template = value;
    },
    interact: (adapter, value) => {
      const target = trigger(adapter);
      target.click();
      fixture.detectChanges();
      const item = target
        .closest('neural-tree-select')
        ?.querySelector(`[data-key="${String(value)}"]`);
      (item as HTMLElement | null)?.click();
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

describe('NeuralTreeSelect beta', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('maps nested options and commits a single value', () => {
    const component = fixture.debugElement.query(By.directive(NeuralTreeSelect))
      .componentInstance as NeuralTreeSelect<Item, string>;
    expect(component.nodes()[0].children?.[0].label).toBe('Child');
    const treeItem = fixture.nativeElement.querySelector(
      '[data-key="child"]',
    ) as HTMLElement;
    treeItem.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('child');
  });

  it('writes immutable arrays in checkbox mode and clears them', () => {
    fixture.componentInstance.mode.set('checkbox');
    fixture.detectChanges();
    const treeItem = fixture.nativeElement.querySelector(
      '[data-key="child"]',
    ) as HTMLElement;
    treeItem.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual(['root', 'child']);
    const component = fixture.debugElement.query(By.directive(NeuralTreeSelect))
      .componentInstance as NeuralTreeSelect<Item, string>;
    component.clear();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('opens readonly for inspection while blocking tree, clear, and chip mutations', async () => {
    fixture.componentInstance.mode.set('checkbox');
    fixture.componentInstance.value.set(['child']);
    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '[role="combobox"]',
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-readonly')).toBe('true');
    (
      fixture.nativeElement.querySelector('[data-key="team"]') as HTMLElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '.neural-tree-select-clear-root',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '.neural-tree-select-chip-remove-root',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['child']);
    expect(fixture.componentInstance.changes).toHaveLength(0);
  });

  it('does not emit a duplicate semantic event for the current single value', () => {
    fixture.componentInstance.value.set('team');
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[data-key="team"]') as HTMLElement
    ).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('team');
    expect(fixture.componentInstance.changes).toHaveLength(0);
  });

  it('emits an unselection event when a multiple-value chip is removed', () => {
    fixture.componentInstance.mode.set('multiple');
    fixture.componentInstance.value.set(['child', 'team']);
    fixture.detectChanges();
    const removeButtons = fixture.nativeElement.querySelectorAll(
      '.neural-tree-select-chip-remove-root',
    ) as NodeListOf<HTMLButtonElement>;
    removeButtons[0]?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['team']);
    expect(fixture.componentInstance.unselections[0]).toMatchObject({
      value: ['team'],
      previousValue: ['child', 'team'],
      key: 'child',
      selected: false,
      source: 'pointer',
    });
  });

  it('inherits readonly and required state from Neural Field', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FieldHostComponent],
    }).compileComponents();
    const fieldFixture = TestBed.createComponent(FieldHostComponent);
    fieldFixture.detectChanges();
    const trigger = fieldFixture.nativeElement.querySelector(
      '[role="combobox"]',
    ) as HTMLElement;

    expect(trigger.id).toBe('field-tree-select');
    expect(trigger.getAttribute('aria-readonly')).toBe('true');
    expect(trigger.getAttribute('aria-required')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('0');
  });

  it('keeps structural classes and removes visual classes when unstyled', () => {
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-tree-select-root',
    );
    expect(root.classList.contains('neural-tree-select-base')).toBe(false);
  });
});

describeFormValueControlConformance(
  'TreeSelect',
  createTreeSelectConformanceHarness,
);
