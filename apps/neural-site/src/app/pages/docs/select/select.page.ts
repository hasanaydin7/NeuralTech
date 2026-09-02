import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  NeuralSelect,
  OptionComponent,
  type NeuralSelectChange,
  type NeuralSelectClasses,
  type NeuralSelectClear,
} from '@neural-ng/core/select';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type SelectDocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface City {
  readonly id: number;
  readonly name: string;
  readonly country: string;
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
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    FormsModule,
    NeuralSelect,
    OptionComponent,
    ReactiveFormsModule,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './select.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly cities: readonly City[] = [
    {
      id: 34,
      name: 'Istanbul',
      country: 'Türkiye',
      iconClass: 'nt nt-building',
    },
    { id: 6, name: 'Ankara', country: 'Türkiye', iconClass: 'nt nt-settings' },
    { id: 35, name: 'Izmir', country: 'Türkiye', iconClass: 'nt nt-sun' },
    {
      id: 16,
      name: 'Bursa',
      country: 'Türkiye',
      iconClass: 'nt nt-user',
      unavailable: true,
    },
  ];
  readonly districts: readonly District[] = [
    { id: 1, cityId: 34, name: 'Kadıköy' },
    { id: 2, cityId: 34, name: 'Beşiktaş' },
    { id: 3, cityId: 6, name: 'Çankaya' },
    { id: 4, cityId: 6, name: 'Keçiören' },
    { id: 5, cityId: 35, name: 'Konak' },
  ];
  readonly largeOptions = Array.from({ length: 1000 }, (_, index) => ({
    id: index + 1,
    label: `Agent ${String(index + 1).padStart(4, '0')}`,
  }));
  readonly selectedCity = signal<number | null>(34);
  readonly selectedDistrict = signal<number | null>(null);
  readonly projectedValue = signal<string | null>('ready');
  readonly primitiveValue = signal<string | null>('Signals');
  readonly readonlyValue = signal<number | null>(6);
  readonly virtualValue = signal<number | null>(500);
  readonly headlessValue = signal<string | null>('standalone');
  readonly eventLog = signal('No semantic event yet.');
  readonly availableDistricts = computed(() =>
    this.districts.filter((item) => item.cityId === this.selectedCity()),
  );
  templateCity: string | null = 'Izmir';
  readonly reactiveCity = new FormControl<string | null>('Ankara');
  readonly formModel = signal({ city: 'Istanbul' as string | null });
  readonly selectForm = form(this.formModel);
  readonly formOptions = ['Istanbul', 'Ankara', 'Izmir'] as const;
  readonly architectureOptions = ['Signals', 'Standalone', 'SSR'] as const;

  readonly selectedView = signal<SelectDocView>(
    resolveSelectDocView(this.router.url),
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
  readonly headlessClasses: NeuralSelectClasses = {
    root: 'w-full max-w-sm',
    trigger:
      'relative flex w-full items-center rounded-xl border border-cyan-400/40 bg-slate-950 px-4 py-3 text-cyan-50 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/15',
    value: 'gap-2 font-mono',
    placeholder: 'text-cyan-700',
    dropdownIcon: 'text-cyan-400',
    clearButton: 'text-cyan-400 hover:text-cyan-200',
    panel:
      'z-[120] mt-2 overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950 p-1 shadow-2xl',
    list: 'max-h-56 overflow-y-auto',
    option:
      'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-cyan-100',
    activeOption: 'bg-cyan-400/15',
    selectedOption: 'bg-cyan-400/25 font-bold text-cyan-200',
    disabledOption: 'cursor-not-allowed opacity-40',
    emptyMessage: 'p-4 text-center text-cyan-700',
    loadingMessage: 'p-4 text-center text-cyan-300',
  };
  readonly pageLinks: Record<
    SelectDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Data options', 'data-options'],
      ['Primitive options', 'primitive-options'],
      ['Declarative options', 'declarative-options'],
      ['Angular Forms', 'forms'],
      ['Chained selects', 'chained'],
      ['States', 'states'],
      ['Append to body', 'append-to'],
      ['Virtual scroll', 'virtual-scroll'],
      ['Events', 'events'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Naming', 'naming'],
      ['Readonly and disabled', 'readonly-disabled'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Option API', 'option-api'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import { NeuralSelect, OptionComponent } from '@neural-ng/core/select';\n\n@Component({ imports: [NeuralSelect, OptionComponent] })`;
  readonly dataCode = `<neural-select\n  [options]="cities"\n  optionLabel="name"\n  optionValue="id"\n  optionDisabled="unavailable"\n  optionIcon="iconClass"\n  [(value)]="cityId"\n  placeholder="Select a city"\n  appendTo="body"\n  clearable\n  (selectionChange)="citySelected($event)"\n  (cleared)="cityCleared($event)"\n/>`;
  readonly primitiveCode = `<neural-select [options]="['Signals', 'Standalone', 'SSR']" [(value)]="architecture" />`;
  readonly projectedCode = `<neural-select [(value)]="status" appendTo="body">\n  <neural-option value="ready" label="Ready" iconClass="nt nt-circle-check">\n    <strong>Ready to ship</strong>\n  </neural-option>\n  <neural-option value="review" label="In review">Waiting for approval</neural-option>\n</neural-select>`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-select [options]="cities" [formField]="form.city" />\n\n<!-- Reactive Forms -->\n<neural-select [options]="cities" [formControl]="cityControl" />\n\n<!-- Template-driven Forms -->\n<neural-select [options]="cities" name="city" [(ngModel)]="city" />`;
  readonly chainedCode = `readonly districts = computed(() =>\n  allDistricts.filter(item => item.cityId === selectedCity()),\n);\n\ncityChanged(event: NeuralSelectChange<number, City>): void {\n  selectedDistrict.set(null);\n}`;
  readonly statesCode = `<neural-select disabled placeholder="Disabled" />\n<neural-select readonly [value]="6" />\n<neural-select loading loadingLabel="Loading cities" />\n<neural-select required invalid pending touched dirty />`;
  readonly appendCode = `<neural-select [options]="cities" appendTo="body" />`;
  readonly virtualCode = `<neural-select\n  [options]="agents" optionLabel="label" optionValue="id"\n  virtualScroll [virtualItemSize]="42" [virtualScrollHeight]="256" [virtualOverscan]="4"\n/>`;
  readonly eventsCode = `<neural-select\n  [(value)]="cityId"\n  (valueChange)="valueChanged($event)"\n  (selectionChange)="selected($event)"\n  (cleared)="cleared($event)"\n  (openChange)="panelChanged($event)"\n  (touch)="touched()"\n/>`;
  readonly unstyledCode = `<neural-select unstyled [options]="architectures" [(value)]="architecture" [classes]="selectClasses" appendTo="body" />`;

  readonly inputs = [
    ['options', 'readonly TOption[]', '[]', 'Data-driven options.'],
    ['optionLabel', 'string', "'label'", 'Display and accessible label path.'],
    ['optionValue', 'string', "'value'", 'Model value path.'],
    ['optionDisabled', 'string', "'disabled'", 'Disabled-state path.'],
    ['optionIcon', 'string', "'iconClass'", 'Option icon path.'],
    ['value', 'TValue | null', 'null', 'Two-way Signal model.'],
    ['compareWith', 'function', 'Object.is', 'Custom value equality.'],
    ['placeholder', 'string', "'Select an option'", 'Empty value label.'],
    ['emptyLabel', 'string', "'No options available'", 'Empty list message.'],
    ['loadingLabel', 'string', "'Loading options'", 'Loading message.'],
    [
      'clearLabel',
      'string',
      "'Clear selection'",
      'Clear button accessible label.',
    ],
    ['ariaLabel', 'string', "''", 'Combobox and listbox label.'],
    ['selectId', 'string', "''", 'Explicit trigger id.'],
    ['iconClass', 'string', "'nt-chevron-down'", 'Dropdown icon.'],
    ['loadingIcon', 'string', "'nt-loader-3 nt-spin'", 'Loading icon.'],
    ['clearable', 'boolean', 'false', 'Shows clear action.'],
    ['disabled', 'boolean', 'false', 'Disables the native trigger.'],
    ['readonly', 'boolean', 'false', 'Focusable inspection without mutation.'],
    ['required / invalid', 'boolean', 'false', 'ARIA and visual field states.'],
    ['pending / touched / dirty', 'boolean', 'false', 'Forms state contract.'],
    ['name', 'string', "''", 'Template-driven name.'],
    ['loading', 'boolean', 'false', 'Blocks interaction and announces busy.'],
    ['virtualScroll', 'boolean', 'false', 'Overscanned visible range.'],
    ['virtualItemSize', 'number', '42', 'Fixed option height.'],
    ['virtualScrollHeight', 'number', '256', 'Viewport height.'],
    ['virtualOverscan', 'number', '3', 'Extra rendered rows.'],
    ['fluid', 'boolean', 'false', 'Fills inline size.'],
    ['appendTo', "'self' | 'body'", "'self'", 'Panel ownership.'],
    ['unstyled', 'boolean', 'false', 'Removes visual classes.'],
    ['selectClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralSelectClasses', '{}', 'Typed slot classes.'],
  ] as const;
  readonly outputs = [
    ['valueChange', 'TValue | null', 'Generated by the value model.'],
    [
      'selectionChange',
      'NeuralSelectChange',
      'User selection with value, previous value, option and source.',
    ],
    ['cleared', 'NeuralSelectClear', 'Explicit clear action.'],
    ['openChange', 'boolean', 'Panel visibility.'],
    ['touch', 'void', 'Focus leaves the closed control.'],
  ] as const;
  readonly methods = [
    ['focus', '(options?: FocusOptions) => void', 'Focuses the trigger.'],
    ['reset', '() => void', 'Closes and restores null.'],
    ['toggle', '() => void', 'Toggles when enabled.'],
  ] as const;
  readonly tokens = [
    '--neural-select-width',
    '--neural-select-min-height',
    '--neural-select-padding',
    '--neural-select-background',
    '--neural-select-background-hover',
    '--neural-select-color',
    '--neural-select-border',
    '--neural-select-border-color-hover',
    '--neural-select-border-color-focus',
    '--neural-select-border-color-invalid',
    '--neural-select-radius',
    '--neural-select-shadow-focus',
    '--neural-select-focus-ring',
    '--neural-select-placeholder-color',
    '--neural-select-panel-background',
    '--neural-select-panel-border',
    '--neural-select-panel-radius',
    '--neural-select-panel-shadow',
    '--neural-select-panel-max-height',
    '--neural-select-option-color',
    '--neural-select-option-background-active',
    '--neural-select-option-background-selected',
    '--neural-select-option-color-selected',
    '--neural-select-option-padding',
    '--neural-select-option-radius',
    '--neural-select-disabled-opacity',
    '--neural-select-z-index',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveSelectDocView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  citySelected(event: NeuralSelectChange<number, City>): void {
    this.selectedDistrict.set(null);
    this.eventLog.set(
      `${event.option?.name ?? event.value} selected by ${event.source}.`,
    );
  }
  cityCleared(event: NeuralSelectClear<number>): void {
    this.selectedDistrict.set(null);
    this.eventLog.set(
      `Selection cleared; previous value was ${event.previousValue}.`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isSelectDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/select${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveSelectDocView(url: string): SelectDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isSelectDocView(value: NeuralTabValue | null): value is SelectDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
