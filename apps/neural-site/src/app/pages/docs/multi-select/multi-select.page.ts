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
  NeuralMultiSelect,
  NeuralMultiSelectEmptyTemplate,
  NeuralMultiSelectFooterTemplate,
  NeuralMultiSelectGroupTemplate,
  NeuralMultiSelectHeaderTemplate,
  NeuralMultiSelectLoadingTemplate,
  NeuralMultiSelectOptionTemplate,
  NeuralMultiSelectValueTemplate,
  type NeuralMultiSelectChange,
  type NeuralMultiSelectClasses,
  type NeuralMultiSelectFilterEvent,
  type NeuralMultiSelectItemEvent,
} from '@neural-ng/core/multi-select';
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

type MultiSelectDocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface Capability {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly iconClass: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-multi-select-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    FormsModule,
    NeuralMultiSelect,
    NeuralMultiSelectEmptyTemplate,
    NeuralMultiSelectFooterTemplate,
    NeuralMultiSelectGroupTemplate,
    NeuralMultiSelectHeaderTemplate,
    NeuralMultiSelectLoadingTemplate,
    NeuralMultiSelectOptionTemplate,
    NeuralMultiSelectValueTemplate,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './multi-select.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly capabilities: readonly Capability[] = [
    {
      id: 'signals',
      name: 'Signals',
      category: 'Angular',
      description: 'Fine-grained reactive state',
      iconClass: 'nt nt-bolt',
    },
    {
      id: 'standalone',
      name: 'Standalone',
      category: 'Angular',
      description: 'No NgModule ownership',
      iconClass: 'nt nt-components',
    },
    {
      id: 'hydration',
      name: 'Hydration',
      category: 'Rendering',
      description: 'SSR-safe client recovery',
      iconClass: 'nt nt-refresh',
    },
    {
      id: 'streaming',
      name: 'Streaming SSR',
      category: 'Rendering',
      description: 'Progressive server output',
      iconClass: 'nt nt-server',
    },
    {
      id: 'legacy',
      name: 'Legacy modules',
      category: 'Architecture',
      description: 'Unavailable for this workspace',
      iconClass: 'nt nt-lock',
      disabled: true,
    },
  ];
  readonly primitiveOptions = [
    'Angular',
    'TypeScript',
    'Signals',
    'SSR',
  ] as const;
  readonly largeOptions = Array.from({ length: 1000 }, (_, index) => ({
    id: index + 1,
    label: `Agent capability ${String(index + 1).padStart(4, '0')}`,
  }));
  readonly selectedCapabilities = signal<readonly string[]>([
    'signals',
    'hydration',
  ]);
  readonly compactValue = signal<readonly string[]>([
    'signals',
    'standalone',
    'hydration',
  ]);
  readonly templateValue = signal<readonly string[]>(['signals']);
  readonly readonlyValue = signal<readonly string[]>(['signals', 'standalone']);
  readonly virtualValue = signal<readonly number[]>([500]);
  readonly headlessValue = signal<readonly string[]>(['signals', 'hydration']);
  readonly remoteOptions = signal<readonly Capability[]>(this.capabilities);
  readonly remoteValue = signal<readonly string[]>([]);
  readonly remoteRequest = signal(0);
  readonly eventLog = signal('No semantic event yet.');
  readonly formModel = signal({
    capabilities: ['Signals'] as readonly string[],
  });
  readonly signalForm = form(this.formModel);
  readonly reactiveCapabilities = new FormControl<readonly string[]>(
    ['TypeScript'],
    { nonNullable: true },
  );
  ngModelCapabilities: readonly string[] = ['SSR'];

  readonly selectedView = signal<MultiSelectDocView>(
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
  readonly headlessClasses: NeuralMultiSelectClasses = {
    root: 'w-full',
    trigger:
      'flex min-h-12 w-full items-center overflow-hidden rounded-2xl border border-cyan-400/35 bg-slate-950 px-2 text-cyan-50 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/15',
    value: 'min-w-0 flex-1 px-2 py-2',
    placeholder: 'text-slate-500',
    chipList: 'flex flex-wrap items-center gap-1.5',
    chip: 'inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-400/10 py-1 pl-2.5 text-xs text-cyan-100',
    chipLabel: 'max-w-32 truncate',
    chipRemove:
      'grid size-6 place-items-center rounded-full text-cyan-300 transition hover:bg-cyan-300/15 hover:text-white',
    clearButton:
      'grid min-h-10 min-w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white',
    dropdownButton: 'grid min-h-10 min-w-10 place-items-center text-cyan-300',
    panel:
      'z-[120] overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950 p-1.5 text-slate-100 shadow-2xl',
    header: 'flex items-center gap-2 border-b border-white/10 p-2',
    filter:
      'min-h-10 w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-400',
    selectAll:
      'grid size-10 place-items-center rounded-xl text-cyan-300 transition hover:bg-cyan-400/10',
    list: 'max-h-60 overflow-y-auto p-1',
    group:
      'px-3 pb-1 pt-3 text-[.65rem] font-black uppercase tracking-widest text-slate-500',
    option:
      'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
    optionLabel: 'min-w-0 flex-1',
    checkbox:
      'grid size-5 place-items-center rounded-md border border-cyan-400/35 text-cyan-300',
    activeOption: 'bg-white/5',
    selectedOption: 'bg-cyan-400/10 text-cyan-100',
    disabledOption: 'cursor-not-allowed opacity-35',
    emptyMessage: 'p-6 text-center text-slate-500',
    loadingMessage: 'flex items-center justify-center gap-2 p-6 text-cyan-300',
    footer: 'border-t border-white/10 px-3 py-2 text-xs text-slate-400',
  };
  readonly pageLinks: Record<
    MultiSelectDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Grouped chips', 'grouped'],
      ['Display and limits', 'display-limits'],
      ['Angular Forms', 'forms'],
      ['Remote filtering', 'remote'],
      ['Templates', 'templates'],
      ['States', 'states'],
      ['Virtual scroll', 'virtual-scroll'],
      ['Events', 'events'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Readonly and disabled', 'readonly-disabled'],
      ['Virtualization', 'virtualization-a11y'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Templates', 'template-api'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };

  readonly importCode = `import { NeuralMultiSelect, NeuralMultiSelectOptionTemplate } from '@neural-ng/core/multi-select';\n\n@Component({ imports: [NeuralMultiSelect, NeuralMultiSelectOptionTemplate] })`;
  readonly groupedCode = `<neural-multi-select\n  [options]="capabilities"\n  optionLabel="name"\n  optionValue="id"\n  optionDisabled="disabled"\n  optionGroup="category"\n  filterBy="name,category,description"\n  [(value)]="selectedCapabilities"\n  display="chip"\n  fluid\n>\n  <ng-template neuralMultiSelectOption let-option let-resolved="resolved">\n    {{ resolved.label }} · {{ option.description }}\n  </ng-template>\n</neural-multi-select>`;
  readonly compactCode = `<neural-multi-select\n  [options]="capabilities" optionLabel="name" optionValue="id"\n  [(value)]="selected" display="comma"\n  [maxSelectedLabels]="2" [selectionLimit]="4" [closeOnSelect]="false"\n/>`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-multi-select [options]="options" [formField]="form.capabilities" />\n\n<!-- Reactive Forms -->\n<neural-multi-select [options]="options" [formControl]="capabilitiesControl" />\n\n<!-- Template-driven Forms -->\n<neural-multi-select [options]="options" name="capabilities" [(ngModel)]="capabilities" />`;
  readonly remoteCode = `<neural-multi-select\n  dataMode="remote" [options]="remoteOptions()"\n  optionLabel="name" optionValue="id" [(value)]="remoteValue"\n  (filterChange)="search($event)"\n/>\n\n// Ignore responses older than event.requestId.`;
  readonly templatesCode = `<neural-multi-select [options]="capabilities" [(value)]="value">\n  <ng-template neuralMultiSelectHeader>Workspace capabilities</ng-template>\n  <ng-template neuralMultiSelectGroup let-group>{{ group }}</ng-template>\n  <ng-template neuralMultiSelectOption let-option>{{ option.name }}</ng-template>\n  <ng-template neuralMultiSelectValue let-labels="labels">{{ labels.join(' · ') }}</ng-template>\n  <ng-template neuralMultiSelectFooter>Selection is saved immediately.</ng-template>\n</neural-multi-select>`;
  readonly statesCode = `<neural-multi-select disabled placeholder="Disabled" />\n<neural-multi-select readonly [value]="['signals']" />\n<neural-multi-select loading loadingLabel="Loading capabilities" />\n<neural-multi-select required invalid pending touched dirty />`;
  readonly virtualCode = `<neural-multi-select\n  [options]="capabilities" optionLabel="label" optionValue="id"\n  virtualScroll [virtualItemSize]="42" [virtualScrollHeight]="252" [virtualOverscan]="4"\n/>`;
  readonly eventsCode = `<neural-multi-select\n  [(value)]="selected"\n  (selectionChange)="changed($event)" (selected)="selected($event)"\n  (removed)="removed($event)" (cleared)="cleared($event)"\n  (selectAllChange)="allChanged($event)" (filterChange)="filtered($event)"\n  (opened)="opened()" (closed)="closed()" (touch)="touched()"\n/>`;
  readonly unstyledCode = `<neural-multi-select\n  unstyled [options]="capabilities" optionLabel="name" optionValue="id"\n  [(value)]="selected" [classes]="multiSelectClasses"\n/>`;

  readonly inputs = [
    ['options', 'readonly TOption[]', '[]', 'Immutable source options.'],
    ['optionLabel', 'string', "'label'", 'Visible and accessible label path.'],
    ['optionValue', 'string', "'value'", 'Model value path.'],
    ['optionDisabled', 'string', "'disabled'", 'Disabled-state path.'],
    ['optionGroup', 'string', "''", 'Optional group label path.'],
    ['value', 'readonly TValue[]', '[]', 'Two-way immutable Signal model.'],
    ['filterValue', 'string', "''", 'Two-way filter query model.'],
    ['display', "'chip' | 'comma'", "'chip'", 'Selected-value presentation.'],
    ['dataMode', "'local' | 'remote'", "'local'", 'Filtering ownership.'],
    [
      'filterMode',
      "'contains' | 'startsWith' | 'endsWith'",
      "'contains'",
      'Local matching strategy.',
    ],
    [
      'filterBy / filterLocale',
      'string',
      "''",
      'Nested paths and matching locale.',
    ],
    ['filter', 'boolean', 'true', 'Shows the filter input.'],
    ['showToggleAll', 'boolean', 'true', 'Shows visible-option select all.'],
    ['clearable', 'boolean', 'true', 'Shows the clear action.'],
    ['closeOnSelect', 'boolean', 'false', 'Closes after each toggle.'],
    ['selectionLimit', 'number', '0', 'Maximum selections; zero is unlimited.'],
    ['maxSelectedLabels', 'number', '3', 'Comma labels before count summary.'],
    ['filterDelay', 'number', '150', 'Debounced filter event delay in ms.'],
    ['virtualScroll', 'boolean', 'false', 'Enables fixed-height windowing.'],
    ['virtualItemSize', 'number', '42', 'Option row height in pixels.'],
    ['virtualScrollHeight', 'number', '256', 'List viewport height in pixels.'],
    ['virtualOverscan', 'number', '3', 'Extra rows around viewport.'],
    ['loading', 'boolean', 'false', 'Shows localized busy content.'],
    ['disabled / readonly', 'boolean', 'false', 'Interaction policies.'],
    ['required / invalid', 'boolean', 'false', 'ARIA and validation states.'],
    ['pending / touched / dirty', 'boolean', 'false', 'Forms state hooks.'],
    ['fluid', 'boolean', 'false', 'Fills available inline size.'],
    [
      'placeholder / filterPlaceholder',
      'string',
      'locale',
      'Trigger and filter labels.',
    ],
    ['emptyLabel / loadingLabel', 'string', 'locale', 'Status labels.'],
    ['selectedItemsLabel', 'string', 'locale', 'Collapsed count pattern.'],
    ['selectAllLabel / clearLabel', 'string', 'locale', 'Action labels.'],
    [
      'dropdownLabel / removeLabel',
      'string',
      'locale',
      'Accessible action patterns.',
    ],
    ['ariaLabel', 'string', "''", 'Combobox and listbox name.'],
    [
      'multiSelectId / name',
      'string',
      "''",
      'Control identity and Forms name.',
    ],
    ['dropdownIconClass', 'string', "'nt-chevron-down'", 'Dropdown glyph.'],
    ['clearIconClass / removeIconClass', 'string', "'nt-x'", 'Removal glyphs.'],
    [
      'searchIconClass / checkIconClass',
      'string',
      'Neural Icons',
      'Filter and selection glyphs.',
    ],
    ['loadingIconClass', 'string', "'nt-loader-3 nt-spin'", 'Busy glyph.'],
    ['compareWith', 'function', 'Object.is', 'Custom value equality.'],
    ['unstyled', 'boolean', 'false', 'Removes visual classes.'],
    ['multiSelectClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralMultiSelectClasses', '{}', 'Typed slot classes.'],
  ] as const;
  readonly outputs = [
    ['valueChange', 'readonly TValue[]', 'Generated by the value model.'],
    ['filterValueChange', 'string', 'Generated by the filter model.'],
    [
      'selectionChange',
      'NeuralMultiSelectChange',
      'Current/previous arrays, option and source.',
    ],
    [
      'selected / removed',
      'NeuralMultiSelectItemEvent',
      'One option was added or removed.',
    ],
    [
      'cleared',
      'NeuralMultiSelectClearEvent',
      'Explicit clear with previous values.',
    ],
    [
      'selectAllChange',
      'NeuralMultiSelectSelectAllEvent',
      'Visible enabled options changed together.',
    ],
    [
      'filterChange',
      'NeuralMultiSelectFilterEvent',
      'Debounced query and monotonic requestId.',
    ],
    ['opened / closed', 'void', 'Popover lifecycle.'],
    ['touch', 'void', 'Completed interaction.'],
  ] as const;
  readonly methods = [
    ['focus', '(options?: FocusOptions)', 'Focuses the combobox trigger.'],
    ['reset', '()', 'Closes, clears filter and restores an empty array.'],
    ['openPanel / closePanel', '()', 'Controls popup visibility.'],
    ['togglePanel', '(event?: Event)', 'Toggles when enabled.'],
    ['clear', '(event?: Event)', 'Clears mutable selections.'],
    ['toggleAll', '(event?: Event)', 'Toggles visible enabled options.'],
  ] as const;
  readonly templates = [
    [
      'neuralMultiSelectOption',
      'option, resolved, label, value, index, active, selected, disabled',
    ],
    ['neuralMultiSelectValue', 'value, labels'],
    ['neuralMultiSelectGroup', 'group'],
    ['neuralMultiSelectHeader', 'No context'],
    ['neuralMultiSelectFooter', 'No context'],
    ['neuralMultiSelectEmpty', '$implicit localized empty label'],
    ['neuralMultiSelectLoading', '$implicit localized loading label'],
  ] as const;
  readonly tokens = [
    ['--neural-multi-select-width', 'Root inline size.'],
    ['--neural-multi-select-background', 'Trigger surface.'],
    ['--neural-multi-select-border', 'Trigger border shorthand.'],
    ['--neural-multi-select-radius', 'Trigger corner radius.'],
    ['--neural-multi-select-color', 'Trigger foreground.'],
    ['--neural-multi-select-panel-background', 'Popup surface.'],
    ['--neural-multi-select-panel-max-height', 'Non-virtual list limit.'],
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
  selectedItem(event: NeuralMultiSelectItemEvent<string, Capability>): void {
    this.eventLog.set(`${event.option.name} selected by ${event.source}.`);
  }
  selectionChanged(event: NeuralMultiSelectChange<string, Capability>): void {
    this.eventLog.set(
      `${event.value.length} selected · source: ${event.source}.`,
    );
  }
  searchRemote(event: NeuralMultiSelectFilterEvent): void {
    this.remoteRequest.set(event.requestId);
    const query = event.query.trim().toLocaleLowerCase();
    this.remoteOptions.set(
      query
        ? this.capabilities.filter((option) =>
            option.name.toLocaleLowerCase().includes(query),
          )
        : this.capabilities,
    );
  }
  capabilityIcon(value: unknown): string {
    return isCapability(value) ? value.iconClass : 'nt nt-components';
  }
  capabilityDescription(value: unknown): string {
    return isCapability(value) ? value.description : '';
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/multi-select${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): MultiSelectDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isDocView(value: NeuralTabValue | null): value is MultiSelectDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}

function isCapability(value: unknown): value is Capability {
  return (
    typeof value === 'object' &&
    value !== null &&
    'iconClass' in value &&
    'description' in value
  );
}
