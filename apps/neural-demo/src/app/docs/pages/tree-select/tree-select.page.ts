import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  NeuralTreeSelect,
  type NeuralTreeSelectChange,
  type NeuralTreeSelectClasses,
  type NeuralTreeSelectValue,
} from '@neural-ng/core/tree-select';
import { CodeView } from '../../../shared/code-view';

interface WorkspaceLocation {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly disabled?: boolean;
  readonly children?: readonly WorkspaceLocation[];
}

@Component({
  selector: 'app-tree-select-page',
  imports: [
    FormField,
    FormsModule,
    ReactiveFormsModule,
    NeuralTreeSelect,
    FieldComponent,
    FieldLabelDirective,
    FieldHintDirective,
    CodeView,
  ],
  templateUrl: './tree-select.page.html',
  styleUrls: ['../shared-doc-page.scss', './tree-select.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TreeSelectPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly locations: readonly WorkspaceLocation[] = [
    {
      id: 'engineering',
      name: 'Engineering',
      icon: 'nt-code',
      children: [
        { id: 'frontend', name: 'Frontend platform', icon: 'nt-browser' },
        { id: 'design-system', name: 'Design system', icon: 'nt-components' },
        {
          id: 'legacy',
          name: 'Legacy runtime',
          icon: 'nt-lock',
          disabled: true,
        },
      ],
    },
    {
      id: 'product',
      name: 'Product',
      icon: 'nt-bulb',
      children: [
        { id: 'discovery', name: 'Discovery', icon: 'nt-search' },
        { id: 'analytics', name: 'Analytics', icon: 'nt-chart-bar' },
      ],
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: 'nt-settings',
      children: [
        { id: 'eu', name: 'Europe cluster', icon: 'nt-world' },
        { id: 'us', name: 'US cluster', icon: 'nt-world' },
      ],
    },
  ];
  readonly formsModel = signal<{
    location: NeuralTreeSelectValue<string>;
  }>({ location: 'frontend' });
  readonly signalForm = form(this.formsModel);
  readonly reactiveLocation = new FormControl<NeuralTreeSelectValue<string>>(
    'analytics',
  );
  templateLocation: NeuralTreeSelectValue<string> = 'eu';
  readonly readonlyLocation =
    signal<NeuralTreeSelectValue<string>>('design-system');
  readonly selected = signal<NeuralTreeSelectValue<string>>('design-system');
  readonly checked = signal<NeuralTreeSelectValue<string>>([
    'frontend',
    'design-system',
  ]);
  readonly headless = signal<NeuralTreeSelectValue<string>>('analytics');
  readonly status = signal('Design system selected.');
  readonly headlessClasses: NeuralTreeSelectClasses = {
    root: 'docs-tree-select-headless',
    trigger: 'docs-tree-select-headless__trigger',
    value: 'docs-tree-select-headless__value',
    clearButton: 'docs-tree-select-headless__action',
    dropdownButton: 'docs-tree-select-headless__action',
    panel: 'docs-tree-select-headless__panel',
    header: 'docs-tree-select-headless__header',
    filter: 'docs-tree-select-headless__filter',
    tree: 'docs-tree-select-headless__tree',
  };
  readonly importCode = `import { NeuralTreeSelect } from '@neural-ng/core/tree-select';`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-tree-select
  [options]="locations"
  optionLabel="name"
  optionValue="id"
  [formField]="signalForm.location"
/>

<!-- Reactive Forms -->
<neural-tree-select
  [options]="locations"
  optionLabel="name"
  optionValue="id"
  [formControl]="reactiveLocation"
/>

<!-- Template-driven Forms -->
<neural-tree-select
  [options]="locations"
  optionLabel="name"
  optionValue="id"
  name="location"
  [(ngModel)]="templateLocation"
/>`;
  readonly basicCode = `<neural-tree-select
  [options]="locations"
  optionLabel="name"
  optionValue="id"
  optionIcon="icon"
  [(value)]="selected"
  fluid
/>`;
  readonly checkboxCode = `<neural-tree-select
  [options]="locations"
  optionLabel="name"
  optionValue="id"
  selectionMode="checkbox"
  [closeOnSelect]="false"
  [(value)]="selected"
  fluid
/>`;
  readonly headlessCode = `<neural-tree-select
  [options]="locations"
  optionLabel="name"
  optionValue="id"
  [(value)]="selected"
  unstyled
  [classes]="classes"
/>`;

  changed(event: NeuralTreeSelectChange<string, WorkspaceLocation>): void {
    this.status.set(
      `${event.option?.name ?? 'Selection'} ${event.selected ? 'selected' : 'removed'} via ${event.source}.`,
    );
  }

  displayValue(value: NeuralTreeSelectValue<string>): string {
    if (typeof value === 'string') {
      return value;
    }

    return value?.join(', ') ?? 'null';
  }
}
