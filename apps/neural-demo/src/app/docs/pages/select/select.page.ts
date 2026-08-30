import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  OptionComponent,
  SelectComponent,
  type NeuralSelectChange,
  type NeuralSelectClasses,
  type NeuralSelectClear,
} from '@neural-ng/core/select';
import { CodeExample } from '../../../shared/code-example/code-example';

interface City {
  readonly id: number;
  readonly name: string;
  readonly iconClass: string;
  readonly unavailable?: boolean;
}

interface District {
  readonly id: number;
  readonly cityId: number;
  readonly name: string;
}

@Component({
  selector: 'app-select-page',
  imports: [
    CodeExample,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    FormsModule,
    OptionComponent,
    ReactiveFormsModule,
    SelectComponent,
  ],
  templateUrl: './select.page.html',
  styleUrls: ['./select.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPage {
  readonly cities: readonly City[] = [
    { id: 34, name: 'Istanbul', iconClass: 'nt-home' },
    { id: 6, name: 'Ankara', iconClass: 'nt-settings' },
    { id: 35, name: 'Izmir', iconClass: 'nt-sun' },
    {
      id: 16,
      name: 'Bursa',
      iconClass: 'nt-user',
      unavailable: true,
    },
  ];
  readonly allDistricts: readonly District[] = [
    { id: 1, cityId: 34, name: 'Kadıköy' },
    { id: 2, cityId: 34, name: 'Beşiktaş' },
    { id: 3, cityId: 34, name: 'Üsküdar' },
    { id: 4, cityId: 6, name: 'Çankaya' },
    { id: 5, cityId: 6, name: 'Keçiören' },
    { id: 6, cityId: 35, name: 'Konak' },
    { id: 7, cityId: 35, name: 'Karşıyaka' },
  ];

  readonly selectedCityId = signal<unknown | null>(null);
  readonly selectedDistrictId = signal<unknown | null>(null);
  readonly projectedStatus = signal<unknown | null>('ready');
  readonly readonlyCityId = signal<unknown | null>(34);
  readonly formsModel = signal<{ city: string | null }>({ city: 'Istanbul' });
  readonly signalForm = form(this.formsModel);
  readonly reactiveCity = new FormControl<string | null>('Ankara');
  templateCity: string | null = 'Izmir';
  readonly formOptions = ['Istanbul', 'Ankara', 'Izmir'] as const;
  readonly headlessValue = signal<unknown | null>('signals');
  readonly eventStatus = signal('No selection event yet.');
  readonly districts = computed(() =>
    this.allDistricts.filter(
      (district) => district.cityId === Number(this.selectedCityId()),
    ),
  );
  readonly headlessClasses: NeuralSelectClasses = {
    root: 'docs-headless-select',
    trigger: 'docs-headless-select-trigger',
    panel: 'docs-headless-select-panel',
    option: 'docs-headless-select-option',
    activeOption: 'docs-headless-select-active',
    selectedOption: 'docs-headless-select-selected',
  };

  readonly importCode = `import {
  SelectComponent,
  OptionComponent,
  type NeuralSelectChange,
} from '@neural-ng/core/select';`;
  readonly dataCode = `<neural-select
  [options]="cities"
  optionLabel="name"
  optionValue="id"
  optionDisabled="unavailable"
  optionIcon="iconClass"
  [(value)]="selectedCityId"
  placeholder="Select a city"
  clearable
  (selectionChange)="citySelected($event)"
  (cleared)="cityCleared($event)"
/>`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-select
  [options]="cities"
  [formField]="signalForm.city"
/>

<!-- Reactive Forms -->
<neural-select
  [options]="cities"
  [formControl]="cityControl"
/>

<!-- Template-driven Forms -->
<neural-select
  [options]="cities"
  name="city"
  [(ngModel)]="city"
/>`;
  readonly projectedCode = `<neural-select [(value)]="status">
  <neural-option
    value="ready"
    label="Ready"
    iconClass="nt-circle-check"
  >
    <strong>Ready to ship</strong>
  </neural-option>
  <neural-option value="review" label="In review">
    In review
  </neural-option>
</neural-select>`;
  readonly chainCode = `readonly districts = computed(() =>
  this.allDistricts.filter(
    district => district.cityId === this.selectedCityId(),
  ),
);

citySelected(event: NeuralSelectChange<number, City>): void {
  this.selectedDistrictId.set(null);
  // For remote data, set loading and fetch using event.value.
}`;
  readonly headlessCode = `<neural-select
  [options]="frameworks"
  [(value)]="framework"
  unstyled
  selectClass="product-select"
  [classes]="selectClasses"
/>`;

  citySelected(event: NeuralSelectChange): void {
    this.selectedDistrictId.set(null);
    const city = event.option as City;
    this.eventStatus.set(
      `${city.name} selected by ${event.source}; dependent district reset.`,
    );
  }

  cityCleared(event: NeuralSelectClear): void {
    this.selectedDistrictId.set(null);
    this.eventStatus.set(
      `City cleared (previous value: ${event.previousValue}).`,
    );
  }
}
