import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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
  NeuralAutoComplete,
  NeuralAutoCompleteOptionTemplate,
  type NeuralAutoCompleteClasses,
  type NeuralAutoCompleteSearchEvent,
  type NeuralAutoCompleteSelectEvent,
} from '@neural-ng/core/auto-complete';
import { CodeView } from '../../../shared/code-view';

interface Place {
  readonly id: string;
  readonly city: string;
  readonly country: string;
  readonly code: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-auto-complete-page',
  imports: [
    NeuralAutoComplete,
    FormField,
    FormsModule,
    NeuralAutoCompleteOptionTemplate,
    ReactiveFormsModule,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    CodeView,
  ],
  templateUrl: './auto-complete.page.html',
  styleUrls: ['../shared-doc-page.scss', './auto-complete.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AutoCompletePage implements OnDestroy {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly places: readonly Place[] = [
    { id: 'ist', city: 'Istanbul', country: 'Türkiye', code: 'IST' },
    { id: 'ank', city: 'Ankara', country: 'Türkiye', code: 'ESB' },
    { id: 'ams', city: 'Amsterdam', country: 'Netherlands', code: 'AMS' },
    { id: 'ber', city: 'Berlin', country: 'Germany', code: 'BER' },
    { id: 'lon', city: 'London', country: 'United Kingdom', code: 'LHR' },
    {
      id: 'par',
      city: 'Paris',
      country: 'France',
      code: 'CDG',
      disabled: true,
    },
  ];
  readonly formOptions = ['Istanbul', 'Ankara', 'Amsterdam'] as const;
  readonly formsModel = signal<{ city: string | null }>({ city: 'Istanbul' });
  readonly signalForm = form(this.formsModel);
  readonly reactiveCity = new FormControl<string | null>('Ankara');
  templateCity: string | null = 'Amsterdam';
  readonly readonlyCity = signal<string | null>('Istanbul');
  readonly selectedPlace = signal<string | null>(null);
  readonly query = signal('');
  readonly remoteQuery = signal('');
  readonly remoteValue = signal<string | null>(null);
  readonly remoteOptions = signal<readonly Place[]>([]);
  readonly remoteLoading = signal(false);
  readonly eventStatus = signal('Type a city or airport code.');
  readonly headlessQuery = signal('sig');
  readonly headlessValue = signal<string | null>(null);
  readonly headlessClasses: NeuralAutoCompleteClasses = {
    root: 'docs-autocomplete-headless',
    inputGroup: 'docs-autocomplete-headless__control',
    input: 'docs-autocomplete-headless__input',
    clearButton: 'docs-autocomplete-headless__button',
    dropdownButton: 'docs-autocomplete-headless__button',
    icon: 'docs-autocomplete-headless__icon',
    panel: 'docs-autocomplete-headless__panel',
    list: 'docs-autocomplete-headless__list',
    group: 'docs-autocomplete-headless__group',
    option: 'docs-autocomplete-headless__option',
    activeOption: 'is-active',
    selectedOption: 'is-selected',
    emptyMessage: 'docs-autocomplete-headless__empty',
    loadingMessage: 'docs-autocomplete-headless__empty',
  };
  private remoteTimer: ReturnType<typeof setTimeout> | undefined;
  readonly latestRequestId = signal(0);

  readonly importCode = `import {
  NeuralAutoComplete,
  NeuralAutoCompleteOptionTemplate,
} from '@neural-ng/core/auto-complete';`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-auto-complete
  [options]="cities"
  [formField]="signalForm.city"
/>

<!-- Reactive Forms -->
<neural-auto-complete
  [options]="cities"
  [formControl]="reactiveCity"
/>

<!-- Template-driven Forms -->
<neural-auto-complete
  [options]="cities"
  name="city"
  [(ngModel)]="templateCity"
/>`;
  readonly basicCode = `<neural-auto-complete
  [options]="places"
  optionLabel="city"
  optionValue="id"
  optionDisabled="disabled"
  filterBy="city,code,country"
  [(value)]="selectedPlace"
  [(query)]="query"
  placeholder="Search cities"
  clearable
  showDropdown
/>`;
  readonly remoteCode = `<neural-auto-complete
  dataMode="remote"
  [options]="results()"
  [loading]="loading()"
  [delay]="300"
  [minLength]="2"
  (search)="searchApi($event)"
/>

searchApi({ query, requestId }: NeuralAutoCompleteSearchEvent) {
  // Only apply results when requestId is still current.
}`;
  readonly templateCode = `<neural-auto-complete [options]="places" optionLabel="city">
  <ng-template neuralAutoCompleteOption let-place let-active="active">
    <strong>{{ place.city }}</strong>
    <small>{{ place.code }} · {{ place.country }}</small>
  </ng-template>
</neural-auto-complete>`;
  readonly headlessCode = `<neural-auto-complete
  [options]="frameworks"
  clearable
  showDropdown
  unstyled
  [classes]="classes"
/>`;

  selected(event: NeuralAutoCompleteSelectEvent): void {
    const place = event.option as Place;
    this.eventStatus.set(`${place.city} selected with ${event.source}.`);
  }
  placeCode(value: unknown): string {
    return typeof value === 'object' && value !== null && 'code' in value
      ? String((value as { readonly code: unknown }).code)
      : '';
  }
  searchRemote(event: NeuralAutoCompleteSearchEvent): void {
    this.latestRequestId.set(event.requestId);
    this.remoteLoading.set(true);
    if (this.remoteTimer) clearTimeout(this.remoteTimer);
    this.remoteTimer = setTimeout(() => {
      if (event.requestId !== this.latestRequestId()) return;
      const query = event.query.toLocaleLowerCase();
      this.remoteOptions.set(
        this.places.filter((place) =>
          `${place.city} ${place.code} ${place.country}`
            .toLocaleLowerCase()
            .includes(query),
        ),
      );
      this.remoteLoading.set(false);
    }, 450);
  }
  ngOnDestroy(): void {
    if (this.remoteTimer) clearTimeout(this.remoteTimer);
  }
}
