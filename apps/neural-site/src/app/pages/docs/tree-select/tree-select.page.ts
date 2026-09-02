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
  NeuralField,
  NeuralFieldHint,
  NeuralFieldLabel,
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
import {
  NeuralTreeSelect,
  NeuralTreeSelectNodeTemplate,
  NeuralTreeSelectValueTemplate,
  type NeuralTreeSelectChange,
  type NeuralTreeSelectClasses,
  type NeuralTreeSelectValue,
} from '@neural-ng/core/tree-select';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type DocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface Location {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly disabled?: boolean;
  readonly children?: readonly Location[];
}

@Component({
  selector: 'app-tree-select-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FormField,
    FormsModule,
    ReactiveFormsModule,
    NeuralField,
    NeuralFieldHint,
    NeuralFieldLabel,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    NeuralTreeSelect,
    NeuralTreeSelectNodeTemplate,
    NeuralTreeSelectValueTemplate,
  ],
  templateUrl: './tree-select.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeSelectPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewport = inject(ViewportScroller);
  private readonly destroyRef = inject(DestroyRef);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<DocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly locations: readonly Location[] = [
    {
      id: 'engineering',
      name: 'Engineering',
      icon: 'nt nt-code',
      children: [
        { id: 'frontend', name: 'Frontend platform', icon: 'nt nt-browser' },
        {
          id: 'design-system',
          name: 'Design system',
          icon: 'nt nt-components',
        },
        {
          id: 'legacy',
          name: 'Legacy runtime',
          icon: 'nt nt-lock',
          disabled: true,
        },
      ],
    },
    {
      id: 'product',
      name: 'Product',
      icon: 'nt nt-bulb',
      children: [
        { id: 'discovery', name: 'Discovery', icon: 'nt nt-search' },
        { id: 'analytics', name: 'Analytics', icon: 'nt nt-chart-bar' },
      ],
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: 'nt nt-settings',
      children: [
        { id: 'eu', name: 'Europe cluster', icon: 'nt nt-world' },
        { id: 'us', name: 'US cluster', icon: 'nt nt-world' },
      ],
    },
  ];
  readonly selected = signal<NeuralTreeSelectValue<string>>('design-system');
  readonly multiple = signal<NeuralTreeSelectValue<string>>([
    'frontend',
    'analytics',
  ]);
  readonly readonlyValue = signal<NeuralTreeSelectValue<string>>('frontend');
  readonly headlessValue = signal<NeuralTreeSelectValue<string>>([
    'frontend',
    'eu',
  ]);
  readonly status = signal('No semantic event yet.');
  readonly formsModel = signal<{ location: NeuralTreeSelectValue<string> }>({
    location: 'frontend',
  });
  readonly signalForm = form(this.formsModel);
  readonly reactiveLocation = new FormControl<NeuralTreeSelectValue<string>>(
    'analytics',
  );
  templateLocation: NeuralTreeSelectValue<string> = 'eu';
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralTreeSelectClasses = {
    root: 'w-full',
    trigger:
      'flex min-h-11 w-full items-center overflow-hidden rounded-xl border border-cyan-300/40 bg-slate-950 px-3 text-cyan-50 outline-none focus-within:ring-2 focus-within:ring-cyan-300/30',
    value: 'min-w-0 flex-1',
    placeholder: 'text-slate-400',
    chipList: 'flex flex-wrap gap-1',
    chip: 'inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-1 text-xs',
    chipRemove: 'grid size-5 place-items-center rounded-full hover:bg-white/10',
    clearButton:
      'grid size-9 place-items-center text-slate-400 hover:text-white',
    dropdownButton: 'grid size-9 place-items-center text-cyan-300',
    panel:
      'overflow-hidden rounded-xl border border-cyan-300/30 bg-slate-950 text-slate-100 shadow-2xl',
    header: 'relative flex items-center border-b border-white/10 p-2',
    filter:
      'w-full rounded-lg border border-white/15 bg-slate-900 py-2 pl-9 pr-3 outline-none focus:border-cyan-300',
    tree: 'p-2',
    loading: 'p-4 text-cyan-200',
    empty: 'p-4 text-slate-400',
  };
  readonly pageLinks: Record<DocView, readonly (readonly [string, string])[]> =
    {
      component: [
        ['Import', 'import'],
        ['Basic', 'basic'],
        ['Multiple and checkbox', 'multiple'],
        ['Forms', 'forms'],
        ['States', 'states'],
        ['Templates', 'templates'],
        ['Virtual scroll', 'virtual'],
        ['Unstyled', 'unstyled'],
      ],
      accessibility: [
        ['Combobox and tree', 'semantics'],
        ['Keyboard', 'keyboard'],
        ['Readonly and disabled', 'readonly'],
        ['Focus and overlay', 'focus'],
        ['Forms and SSR', 'forms-ssr'],
      ],
      api: [
        ['Component', 'component-api'],
        ['Models and inputs', 'inputs'],
        ['Events', 'events'],
        ['Methods', 'methods'],
        ['Templates', 'template-api'],
        ['Class slots', 'class-slots'],
        ['Types', 'types'],
        ['Compatibility', 'compatibility'],
      ],
      tokens: [
        ['Sizing', 'sizing-tokens'],
        ['Surface', 'surface-tokens'],
      ],
    };
  readonly importCode = `import { NeuralTreeSelect, type NeuralTreeSelectValue } from '@neural-ng/core/tree-select';\n\n@Component({ imports: [NeuralTreeSelect] })`;
  readonly basicCode = `<neural-tree-select [options]="locations" optionLabel="name" optionValue="id" optionIcon="icon" optionDisabled="disabled" [(value)]="location" fluid />`;
  readonly multipleCode = `<neural-tree-select selectionMode="checkbox" [closeOnSelect]="false" [options]="locations" optionLabel="name" optionValue="id" [(value)]="scopes" fluid />`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-tree-select [formField]="profileForm.location" [options]="locations" optionLabel="name" optionValue="id" />\n<!-- Reactive Forms -->\n<neural-tree-select [formControl]="locationControl" [options]="locations" optionLabel="name" optionValue="id" />\n<!-- Template-driven Forms -->\n<neural-tree-select name="location" [(ngModel)]="location" [options]="locations" optionLabel="name" optionValue="id" />`;
  readonly statesCode = `<neural-tree-select loading [options]="locations" optionLabel="name" optionValue="id" />\n<neural-tree-select readonly [(value)]="location" [options]="locations" optionLabel="name" optionValue="id" />\n<neural-tree-select disabled [options]="locations" optionLabel="name" optionValue="id" />`;
  readonly templatesCode = `<neural-tree-select [options]="locations" optionLabel="name" optionValue="id">\n  <ng-template neuralTreeSelectValue let-labels="labels">{{ labels.join(' / ') }}</ng-template>\n  <ng-template neuralTreeSelectNode let-node let-level="level">{{ level }} · {{ node.label }}</ng-template>\n</neural-tree-select>`;
  readonly virtualCode = `<neural-tree-select virtualScroll [options]="largeHierarchy" optionLabel="name" optionValue="id" />`;
  readonly unstyledCode = `<neural-tree-select unstyled [classes]="classes" [options]="locations" optionLabel="name" optionValue="id" selectionMode="multiple" [closeOnSelect]="false" />`;
  readonly inputs = [
    ['options', 'readonly TOption[]', '[]', 'Immutable hierarchical source.'],
    [
      'optionLabel / optionValue / optionKey',
      'string',
      'label / value / empty',
      'Nested mapping paths for display, form value and stable identity.',
    ],
    [
      'optionChildren / optionDisabled / optionIcon',
      'string',
      'children / disabled / iconClass',
      'Nested structural and visual mappings.',
    ],
    [
      'value',
      'NeuralTreeSelectValue<TValue>',
      'null',
      'Two-way value model; arrays are used for multiple modes.',
    ],
    [
      'expandedKeys',
      'ReadonlySet<NeuralTreeKey>',
      'new Set()',
      'Controlled Tree expansion.',
    ],
    ['filterValue', 'string', `''`, 'Two-way filter query.'],
    [
      'selectionMode',
      `'single' | 'multiple' | 'checkbox'`,
      `'single'`,
      'Selection and value shape contract.',
    ],
    [
      'filter / clearable / closeOnSelect',
      'boolean',
      'true',
      'Filter, clear and close policies.',
    ],
    [
      'loading / disabled / readonly',
      'boolean',
      'false',
      'Independent async and interaction states.',
    ],
    [
      'required / invalid / pending / touched / dirty',
      'boolean',
      'false',
      'Forms and Field composition state.',
    ],
    [
      'name / fluid / unstyled',
      'string / boolean',
      'empty / false',
      'Form name, sizing and visual ownership.',
    ],
    ['virtualScroll', 'boolean', 'false', 'Uses Tree fixed-range rendering.'],
    [
      'placeholder / filterPlaceholder',
      'string',
      'localized English defaults',
      'Empty trigger and filter prompt.',
    ],
    [
      'emptyLabel / loadingLabel',
      'string',
      'English defaults',
      'Panel state labels.',
    ],
    [
      'clearLabel / dropdownLabel',
      'string',
      'English defaults',
      'Accessible action labels.',
    ],
    [
      'ariaLabel / treeSelectId / treeSelectClass',
      'string',
      'empty',
      'Naming, stable identity and additive root class.',
    ],
    [
      'classes',
      'NeuralTreeSelectClasses',
      '{}',
      'Typed additive classes for every slot.',
    ],
    [
      'compareWith',
      '(first, second) => boolean',
      'Object.is',
      'Form-value equality.',
    ],
  ] as const;
  readonly events = [
    [
      'selectionChange',
      'NeuralTreeSelectChange<TValue,TOption>',
      'Changed user selection with previous value and source.',
    ],
    [
      'selected / unselected',
      'NeuralTreeSelectChange<TValue,TOption>',
      'Semantic direction-specific selection event.',
    ],
    [
      'cleared',
      'NeuralTreeSelectClear<TValue>',
      'Explicit clear with previous value.',
    ],
    ['filterChange', 'NeuralTreeSelectFilterEvent', 'User-authored query.'],
    ['opened / closed', 'void', 'Popover visibility lifecycle.'],
    ['touch', 'void', 'Blur or panel-close touch lifecycle.'],
  ] as const;
  readonly methods = [
    ['togglePanel(event?)', 'Opens or closes the top-layer hierarchy.'],
    [
      'closePanel(restoreFocus = true)',
      'Closes and optionally restores trigger focus.',
    ],
    ['focus(options?)', 'Focuses the combobox trigger.'],
    ['reset()', 'Clears filter and restores the empty value for the mode.'],
    ['clear(event?)', 'Clears mutable user selection and emits cleared.'],
    ['remove(key,event)', 'Removes one multiple-value chip.'],
  ] as const;
  readonly templates = [
    [
      'neuralTreeSelectNode',
      'Typed node, flat item, selected, partial, expanded and level context.',
    ],
    ['neuralTreeSelectValue', 'Typed value and resolved labels context.'],
  ] as const;
  readonly types = [
    'NeuralTreeSelectValue<TValue>',
    'NeuralTreeSelectChange<TValue,TOption>',
    'NeuralTreeSelectClear<TValue>',
    'NeuralTreeSelectFilterEvent',
    'NeuralTreeSelectClasses',
    'NeuralTreeSelectValueTemplateContext<TValue>',
  ] as const;
  readonly sizingTokens = [
    '--neural-tree-select-width',
    '--neural-tree-select-panel-max-height',
  ] as const;
  readonly surfaceTokens = [
    '--neural-tree-select-color',
    '--neural-tree-select-background',
  ] as const;
  constructor() {
    const sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/tree-select${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewport.scrollToAnchor(fragment));
  }
  changed(event: NeuralTreeSelectChange<string, Location>): void {
    this.status.set(
      `${event.option?.name ?? 'Selection'} ${event.selected ? 'selected' : 'removed'} via ${event.source}.`,
    );
  }
  display(value: NeuralTreeSelectValue<string>): string {
    return typeof value === 'string' ? value : (value?.join(', ') ?? 'null');
  }
}
function resolveView(url: string): DocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is DocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
