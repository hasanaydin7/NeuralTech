import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  NeuralAutoComplete,
  NeuralAutoCompleteClearIconTemplate,
  NeuralAutoCompleteDropdownIconTemplate,
  NeuralAutoCompleteEmptyTemplate,
  NeuralAutoCompleteGroupTemplate,
  NeuralAutoCompleteLoadingTemplate,
  NeuralAutoCompleteOptionTemplate,
  type NeuralAutoCompleteClasses,
  type NeuralAutoCompleteClearEvent,
  type NeuralAutoCompleteInvalidInputEvent,
  type NeuralAutoCompleteSearchEvent,
  type NeuralAutoCompleteSelectEvent,
} from '@neural-ng/core/auto-complete';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type AutoCompleteDocView = 'component' | 'accessibility' | 'api' | 'tokens';

interface Place {
  readonly id: string;
  readonly city: string;
  readonly country: string;
  readonly airport: { readonly code: string };
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-auto-complete-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    FormsModule,
    NeuralAutoComplete,
    NeuralAutoCompleteClearIconTemplate,
    NeuralAutoCompleteDropdownIconTemplate,
    NeuralAutoCompleteEmptyTemplate,
    NeuralAutoCompleteGroupTemplate,
    NeuralAutoCompleteLoadingTemplate,
    NeuralAutoCompleteOptionTemplate,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './auto-complete.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoCompletePage implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly places: readonly Place[] = [
    {
      id: 'ist',
      city: 'Istanbul',
      country: 'Türkiye',
      airport: { code: 'IST' },
    },
    { id: 'ank', city: 'Ankara', country: 'Türkiye', airport: { code: 'ESB' } },
    {
      id: 'ams',
      city: 'Amsterdam',
      country: 'Netherlands',
      airport: { code: 'AMS' },
    },
    { id: 'ber', city: 'Berlin', country: 'Germany', airport: { code: 'BER' } },
    {
      id: 'lon',
      city: 'London',
      country: 'United Kingdom',
      airport: { code: 'LHR' },
    },
    {
      id: 'par',
      city: 'Paris',
      country: 'France',
      airport: { code: 'CDG' },
      disabled: true,
    },
  ];
  readonly formOptions = ['Istanbul', 'Ankara', 'Amsterdam'] as const;
  readonly selectedPlace = signal<string | null>(null);
  readonly query = signal('');
  readonly freeText = signal<string | null>('Agent workspace');
  readonly freeTextQuery = signal('Agent workspace');
  readonly readonlyCity = signal<string | null>('Istanbul');
  readonly remoteValue = signal<string | null>(null);
  readonly remoteQuery = signal('');
  readonly remoteOptions = signal<readonly Place[]>([]);
  readonly remoteLoading = signal(false);
  readonly latestRequestId = signal(0);
  readonly eventStatus = signal('Type a city or airport code.');
  readonly headlessValue = signal<string | null>(null);
  readonly headlessQuery = signal('sig');
  readonly formsModel = signal<{ city: string | null }>({ city: 'Istanbul' });
  readonly signalForm = form(this.formsModel);
  readonly reactiveCity = new FormControl<string | null>('Ankara');
  templateCity: string | null = 'Amsterdam';
  private remoteTimer: ReturnType<typeof setTimeout> | undefined;

  readonly selectedView = signal<AutoCompleteDocView>(
    resolveView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralAutoCompleteClasses = {
    root: 'text-cyan-50',
    inputGroup:
      'flex overflow-hidden rounded-xl border border-cyan-300/40 bg-slate-950 shadow-[0_0_0_3px_rgba(34,211,238,.08)]',
    input:
      'min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-cyan-50 outline-none placeholder:text-cyan-100/40',
    clearButton:
      'grid size-11 cursor-pointer place-items-center bg-transparent text-cyan-300 transition hover:bg-cyan-300/10',
    dropdownButton:
      'grid size-11 cursor-pointer place-items-center bg-transparent text-cyan-300 transition hover:bg-cyan-300/10',
    loadingIndicator: 'grid size-11 place-items-center text-cyan-300',
    icon: 'text-base',
    panel:
      'overflow-hidden rounded-xl border border-cyan-300/30 bg-slate-950 p-1.5 text-cyan-50 shadow-2xl',
    list: 'grid max-h-64 gap-1 overflow-auto',
    group:
      'px-3 pb-1 pt-3 text-[.65rem] font-black uppercase tracking-wider text-cyan-300/65',
    option: 'cursor-pointer rounded-lg px-3 py-2 text-sm',
    activeOption: 'bg-cyan-300/15 text-cyan-100',
    selectedOption: 'bg-cyan-300 text-slate-950',
    disabledOption: 'cursor-not-allowed opacity-40',
    emptyMessage: 'px-4 py-6 text-center text-sm text-cyan-100/60',
    loadingMessage: 'px-4 py-6 text-center text-sm text-cyan-100/60',
  };

  readonly pageLinks: Record<
    AutoCompleteDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Local suggestions', 'local'],
      ['Free text', 'free-text'],
      ['Remote data', 'remote'],
      ['Angular Forms', 'forms'],
      ['Templates', 'templates'],
      ['States', 'states'],
      ['Semantic events', 'events'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Focus and IME', 'focus-ime'],
      ['Readonly and disabled', 'readonly-disabled'],
      ['Localization', 'localization'],
    ],
    api: [
      ['Models', 'models'],
      ['Data inputs', 'data-inputs'],
      ['Behavior inputs', 'behavior-inputs'],
      ['State and labels', 'state-inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Templates', 'template-api'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import {
  NeuralAutoComplete,
  NeuralAutoCompleteOptionTemplate,
} from '@neural-ng/core/auto-complete';

@Component({ imports: [NeuralAutoComplete, NeuralAutoCompleteOptionTemplate] })`;
  readonly basicCode = `<neural-auto-complete
  [options]="places"
  optionLabel="city"
  optionValue="id"
  optionDisabled="disabled"
  optionGroup="country"
  filterBy="city,country,airport.code"
  [(value)]="placeId"
  [(query)]="query"
  clearable
  showDropdown
/>`;
  readonly textCode = `<neural-auto-complete
  valueMode="text"
  [forceSelection]="false"
  [options]="suggestions"
  [(value)]="workspace"
  [(query)]="query"
/>`;
  readonly remoteCode = `<neural-auto-complete
  dataMode="remote"
  [options]="results()"
  [loading]="loading()"
  [delay]="300"
  [minLength]="2"
  (search)="load($event)"
/>

load({ query, requestId }: NeuralAutoCompleteSearchEvent): void {
  // Apply the response only while requestId is still current.
}`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-auto-complete [options]="cities" [formField]="profileForm.city" />

<!-- Reactive Forms -->
<neural-auto-complete [options]="cities" [formControl]="cityControl" />

<!-- Template-driven Forms -->
<neural-auto-complete [options]="cities" name="city" [(ngModel)]="city" />`;
  readonly templatesCode = `<neural-auto-complete [options]="places" optionLabel="city">
  <ng-template neuralAutoCompleteGroup let-group>{{ group }}</ng-template>
  <ng-template neuralAutoCompleteOption let-place let-resolved="resolved">
    <strong>{{ place.city }}</strong>
    <small>{{ place.airport.code }} · {{ resolved.group }}</small>
  </ng-template>
  <ng-template neuralAutoCompleteEmpty let-label>{{ label }}</ng-template>
</neural-auto-complete>`;
  readonly eventsCode = `<neural-auto-complete
  [(value)]="value"
  [(query)]="query"
  (search)="searched($event)"
  (selected)="selected($event)"
  (cleared)="cleared($event)"
  (opened)="opened()"
  (closed)="closed()"
  (invalidInput)="invalid($event)"
  (touch)="touched()"
/>`;
  readonly unstyledCode = `<neural-auto-complete
  unstyled
  [classes]="classes"
  [options]="['signals', 'standalone', 'hydration']"
  clearable
  showDropdown
/>`;

  readonly models = [
    [
      'value',
      'TValue | string | null',
      'null',
      'Committed value; creates valueChange.',
    ],
    ['query', 'string', "''", 'Editable input text; creates queryChange.'],
  ] as const;
  readonly dataInputs = [
    [
      'options',
      'readonly TOption[]',
      '[]',
      'Immutable local or remote result source.',
    ],
    [
      'optionLabel',
      'string',
      "'label'",
      'Display label path; nested paths work.',
    ],
    [
      'optionValue',
      'string',
      "'value'",
      'Committed value path; nested paths work.',
    ],
    ['optionDisabled', 'string', "'disabled'", 'Disabled state path.'],
    ['optionGroup', 'string', "''", 'Optional group label path.'],
    [
      'dataMode',
      "'local' | 'remote'",
      "'local'",
      'Own filtering or accept remote results.',
    ],
    [
      'valueMode',
      "'option' | 'text'",
      "'option'",
      'Commit mapped values or free text.',
    ],
    [
      'filterMode',
      "'contains' | 'startsWith' | 'endsWith'",
      "'contains'",
      'Local match strategy.',
    ],
    ['filterBy', 'string', "''", 'Comma-separated searchable property paths.'],
    ['filterLocale', 'string', "''", 'Locale for case folding.'],
    [
      'compareWith',
      'function',
      'Object.is',
      'Custom committed-value equality.',
    ],
    ['limit', 'number', '50', 'Maximum rendered results.'],
  ] as const;
  readonly behaviorInputs = [
    [
      'minLength',
      'number | undefined',
      '1',
      'Minimum query length before search.',
    ],
    ['delay', 'number', '250', 'Debounce time in milliseconds.'],
    [
      'forceSelection',
      'boolean',
      'true',
      'Reject unmatched text in option mode.',
    ],
    [
      'completeOnFocus',
      'boolean',
      'false',
      'Search when input receives focus.',
    ],
    ['showDropdown', 'boolean', 'false', 'Shows the reveal-all button.'],
    [
      'clearable',
      'boolean',
      'false',
      'Shows clear while mutable and non-empty.',
    ],
    ['autoComplete', 'string', "'off'", 'Native autocomplete attribute.'],
  ] as const;
  readonly stateInputs = [
    ['loading', 'boolean', 'false', 'Busy state and loading content.'],
    ['disabled', 'boolean', 'false', 'Native disabled state.'],
    ['readonly', 'boolean', 'false', 'Focusable inspection without mutation.'],
    ['required', 'boolean', 'false', 'Native and Field required state.'],
    ['invalid', 'boolean', 'false', 'Invalid ARIA and visual state.'],
    ['pending', 'boolean', 'false', 'Busy ARIA form state.'],
    ['touched', 'boolean', 'false', 'Forms interaction state.'],
    ['dirty', 'boolean', 'false', 'Forms mutation state.'],
    ['name', 'string', "''", 'Template-driven form name.'],
    ['fluid', 'boolean', 'false', 'Fills available inline size.'],
    [
      'placeholder',
      'string',
      'locale',
      'Localized input placeholder override.',
    ],
    ['emptyLabel', 'string', 'locale', 'Localized empty result override.'],
    ['loadingLabel', 'string', 'locale', 'Localized loading override.'],
    ['clearLabel', 'string', 'locale', 'Clear button accessible label.'],
    ['dropdownLabel', 'string', 'locale', 'Dropdown button accessible label.'],
    ['ariaLabel', 'string', "''", 'Direct combobox accessible name.'],
    ['autoCompleteId', 'string', 'generated', 'Stable control id override.'],
    [
      'dropdownIconClass',
      'string',
      "'nt-chevron-down'",
      'Dropdown Neural Icon class.',
    ],
    ['clearIconClass', 'string', "'nt-x'", 'Clear Neural Icon class.'],
    [
      'loadingIconClass',
      'string',
      "'nt-loader-3 nt-spin'",
      'Busy Neural Icon classes.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['autoCompleteClass', 'string', "''", 'Additive root class.'],
    [
      'classes',
      'NeuralAutoCompleteClasses',
      '{}',
      'Typed additive slot classes.',
    ],
  ] as const;
  readonly outputs = [
    ['valueChange', 'TValue | string | null', 'Committed model changes.'],
    ['queryChange', 'string', 'Editable query changes.'],
    [
      'search',
      'NeuralAutoCompleteSearchEvent',
      'Debounced query, requestId and reason.',
    ],
    [
      'selected',
      'NeuralAutoCompleteSelectEvent',
      'User commit with option, previous value and source.',
    ],
    [
      'cleared',
      'NeuralAutoCompleteClearEvent',
      'Explicit clear with previous value and query.',
    ],
    ['opened / closed', 'void', 'Popover visibility lifecycle.'],
    [
      'invalidInput',
      'NeuralAutoCompleteInvalidInputEvent',
      'Rejected force-selection query.',
    ],
    ['touch', 'void', 'Native input blur.'],
  ] as const;
  readonly methods = [
    [
      'focus',
      '(options?: FocusOptions)',
      'Moves DOM focus to the native input.',
    ],
    [
      'reset',
      '()',
      'Clears value/query, pending search and panel without a user selection event.',
    ],
  ] as const;
  readonly templateDirectives = [
    [
      'neuralAutoCompleteOption',
      '$implicit, option, resolved, label, value, index, active, selected, disabled',
    ],
    ['neuralAutoCompleteGroup', '$implicit, group'],
    ['neuralAutoCompleteEmpty', '$implicit localized label'],
    ['neuralAutoCompleteLoading', '$implicit localized label'],
    ['neuralAutoCompleteDropdownIcon', '$implicit, className'],
    ['neuralAutoCompleteClearIcon', '$implicit, className'],
  ] as const;
  readonly tokens = [
    '--neural-auto-complete-width',
    '--neural-auto-complete-color',
    '--neural-auto-complete-font-family',
    '--neural-auto-complete-border',
    '--neural-auto-complete-radius',
    '--neural-auto-complete-background',
    '--neural-auto-complete-shadow',
    '--neural-auto-complete-backdrop-filter',
    '--neural-auto-complete-panel-max-height',
    '--neural-auto-complete-panel-color',
    '--neural-auto-complete-panel-background',
    '--neural-auto-complete-panel-radius',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  airportCode(value: unknown): string {
    return typeof value === 'object' && value !== null && 'airport' in value
      ? String((value as Place).airport.code)
      : '';
  }
  handleSelected(
    event: NeuralAutoCompleteSelectEvent<string | null, Place>,
  ): void {
    this.eventStatus.set(`${event.option.city} selected by ${event.source}.`);
  }
  handleCleared(event: NeuralAutoCompleteClearEvent<string | null>): void {
    this.eventStatus.set(`Cleared “${event.previousQuery}”.`);
  }
  handleInvalid(event: NeuralAutoCompleteInvalidInputEvent): void {
    this.eventStatus.set(`“${event.query}” is not an available option.`);
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
          `${place.city} ${place.country} ${place.airport.code}`
            .toLocaleLowerCase()
            .includes(query),
        ),
      );
      this.remoteLoading.set(false);
    }, 450);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/auto-complete${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
  ngOnDestroy(): void {
    if (this.remoteTimer) clearTimeout(this.remoteTimer);
  }
}

function resolveView(url: string): AutoCompleteDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is AutoCompleteDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
