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
  MultiSelectComponent,
  NeuralMultiSelectOptionTemplate,
  type NeuralMultiSelectClasses,
  type NeuralMultiSelectFilterEvent,
  type NeuralMultiSelectItemEvent,
} from '@neural-ng/core/multi-select';
import { CodeView } from '../../../shared/code-view';

interface Technology {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly icon: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-multi-select-page',
  imports: [
    FormField,
    FormsModule,
    MultiSelectComponent,
    NeuralMultiSelectOptionTemplate,
    ReactiveFormsModule,
    FieldComponent,
    FieldLabelDirective,
    FieldHintDirective,
    CodeView,
  ],
  templateUrl: './multi-select.page.html',
  styleUrls: ['../shared-doc-page.scss', './multi-select.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MultiSelectPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly technologies: readonly Technology[] = [
    {
      id: 'angular',
      name: 'Angular',
      category: 'Frameworks',
      icon: 'nt-brand-angular',
    },
    {
      id: 'react',
      name: 'React',
      category: 'Frameworks',
      icon: 'nt-brand-react',
    },
    { id: 'vue', name: 'Vue', category: 'Frameworks', icon: 'nt-brand-vue' },
    {
      id: 'signals',
      name: 'Signals',
      category: 'Architecture',
      icon: 'nt-bolt',
    },
    {
      id: 'ssr',
      name: 'SSR & hydration',
      category: 'Architecture',
      icon: 'nt-server',
    },
    {
      id: 'legacy',
      name: 'Legacy modules',
      category: 'Architecture',
      icon: 'nt-lock',
      disabled: true,
    },
  ];
  readonly formOptions = ['Angular', 'React', 'Vue'] as const;
  readonly formsModel = signal<{ capabilities: readonly string[] }>({
    capabilities: ['Angular'],
  });
  readonly signalForm = form(this.formsModel);
  readonly reactiveCapabilities = new FormControl<readonly string[]>(
    ['React'],
    { nonNullable: true },
  );
  templateCapabilities: readonly string[] = ['Vue'];
  readonly readonlyCapabilities = signal<readonly string[]>(['Angular']);
  readonly selected = signal<readonly string[]>(['angular', 'signals']);
  readonly compactSelected = signal<readonly string[]>(['react', 'vue']);
  readonly headlessSelected = signal<readonly string[]>(['angular']);
  readonly virtualSelected = signal<readonly number[]>([]);
  readonly virtualOptions = Array.from({ length: 1000 }, (_, index) => ({
    id: index + 1,
    label: `Capability ${String(index + 1).padStart(4, '0')}`,
  }));
  readonly status = signal('Choose the technologies in your stack.');
  readonly latestRequest = signal(0);
  readonly loading = signal(false);
  readonly headlessClasses: NeuralMultiSelectClasses = {
    root: 'docs-multi-select-headless',
    trigger: 'docs-multi-select-headless__trigger',
    value: 'docs-multi-select-headless__value',
    chipList: 'docs-multi-select-headless__chips',
    chip: 'docs-multi-select-headless__chip',
    chipRemove: 'docs-multi-select-headless__remove',
    clearButton: 'docs-multi-select-headless__action',
    dropdownButton: 'docs-multi-select-headless__action',
    panel: 'docs-multi-select-headless__panel',
    header: 'docs-multi-select-headless__header',
    filter: 'docs-multi-select-headless__filter',
    selectAll: 'docs-multi-select-headless__toggle-all',
    list: 'docs-multi-select-headless__list',
    group: 'docs-multi-select-headless__group',
    option: 'docs-multi-select-headless__option',
    activeOption: 'is-active',
    selectedOption: 'is-selected',
    disabledOption: 'is-disabled',
    checkbox: 'docs-multi-select-headless__checkbox',
  };

  readonly importCode = `import {
  MultiSelectComponent,
  NeuralMultiSelectOptionTemplate,
} from '@neural-ng/core/multi-select';`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-multi-select
  [options]="capabilities"
  [formField]="signalForm.capabilities"
/>

<!-- Reactive Forms -->
<neural-multi-select
  [options]="capabilities"
  [formControl]="reactiveCapabilities"
/>

<!-- Template-driven Forms -->
<neural-multi-select
  [options]="capabilities"
  name="capabilities"
  [(ngModel)]="templateCapabilities"
/>`;
  readonly basicCode = `<neural-multi-select
  [options]="technologies"
  optionLabel="name"
  optionValue="id"
  optionDisabled="disabled"
  optionGroup="category"
  filterBy="name,category"
  [(value)]="selected"
  display="chip"
  fluid
/>`;
  readonly compactCode = `<neural-multi-select
  [options]="technologies"
  optionLabel="name"
  optionValue="id"
  [(value)]="selected"
  display="comma"
  [maxSelectedLabels]="2"
  [selectionLimit]="4"
/>`;
  readonly headlessCode = `<neural-multi-select
  [options]="technologies"
  [(value)]="selected"
  unstyled
  [classes]="classes"
/>`;
  readonly virtualCode = `<neural-multi-select
  [options]="capabilities"
  optionLabel="label"
  optionValue="id"
  [(value)]="selected"
  virtualScroll
  [virtualItemSize]="42"
  [virtualScrollHeight]="252"
  fluid
/>`;

  selectedItem(event: NeuralMultiSelectItemEvent): void {
    this.status.set(
      `${String((event.option as Technology).name)} selected with ${event.source}.`,
    );
  }
  technologyIcon(value: unknown): string {
    return typeof value === 'object' && value !== null && 'icon' in value
      ? String((value as { readonly icon: unknown }).icon)
      : 'nt-components';
  }
  filtered(event: NeuralMultiSelectFilterEvent): void {
    this.latestRequest.set(event.requestId);
  }
}
