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
  NeuralFieldError,
  NeuralFieldHint,
} from '@neural-ng/core/field';
import {
  NeuralRadio,
  NeuralRadioGroup,
  type NeuralRadioClasses,
  type NeuralRadioSelectionChange,
} from '@neural-ng/core/radio';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type RadioDocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface Plan {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly iconClass: string;
  readonly unavailable?: boolean;
}

@Component({
  selector: 'app-radio-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FormField,
    FormsModule,
    NeuralField,
    NeuralFieldError,
    NeuralFieldHint,
    NeuralRadio,
    NeuralRadioGroup,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './radio.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<RadioDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly plan = signal<string | null>('team');
  readonly delivery = signal<string | null>('standard');
  readonly readonlyPlan = signal<string | null>('starter');
  readonly contact = signal<string | null>(null);
  readonly headlessValue = signal<string | null>('signals');
  readonly eventStatus = signal('No user selection yet.');
  readonly formsModel = signal({ signalPlan: 'starter' as string | null });
  readonly signalForm = form(this.formsModel);
  readonly reactivePlan = new FormControl<string | null>('team');
  templatePlan: string | null = 'starter';
  readonly plans: readonly Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Individual agents',
      iconClass: 'nt-user',
    },
    {
      id: 'team',
      name: 'Team',
      description: 'Shared workspaces',
      iconClass: 'nt-settings',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Contact sales',
      iconClass: 'nt-building',
      unavailable: true,
    },
  ];
  readonly formOptions = [
    { label: 'Starter', value: 'starter' },
    { label: 'Team', value: 'team' },
  ];
  readonly contactOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
  ];
  readonly headlessOptions = ['signals', 'standalone', 'hydration'];
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralRadioClasses = {
    root: 'flex flex-wrap gap-3 rounded-2xl bg-slate-950 p-5',
    option:
      'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-mono text-sm text-slate-200 transition hover:border-cyan-400/60',
    input: 'sr-only peer',
    control:
      "grid size-5 place-items-center rounded-full border-2 border-slate-500 after:size-2 after:rounded-full after:bg-transparent after:content-[''] peer-focus-visible:ring-4 peer-focus-visible:ring-cyan-400/20",
    selectedControl: '!border-cyan-400 after:!bg-cyan-400',
    disabledOption: 'cursor-not-allowed opacity-40',
    label: 'font-bold',
    optionIcon: 'text-cyan-300',
  };
  readonly pageLinks: Record<
    RadioDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Data options', 'data-options'],
      ['Rich options', 'projected'],
      ['Orientations', 'orientations'],
      ['Forms', 'forms'],
      ['States and Field', 'states'],
      ['Events', 'events-demo'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native semantics', 'native'],
      ['Keyboard', 'keyboard'],
      ['Roving focus', 'roving'],
      ['Readonly and disabled', 'readonly-disabled'],
      ['Field state', 'field-state'],
      ['SSR', 'ssr'],
    ],
    api: [
      ['Group inputs', 'group-inputs'],
      ['Radio inputs', 'radio-inputs'],
      ['Models and outputs', 'models'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy aliases', 'aliases'],
    ],
    tokens: [
      ['Layout and typography', 'layout-tokens'],
      ['Control and state', 'state-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };
  readonly importCode = `import { NeuralRadio, NeuralRadioGroup } from '@neural-ng/core/radio';\n\n@Component({ imports: [NeuralRadio, NeuralRadioGroup] })`;
  readonly dataCode = `<neural-radio-group\n  [options]="plans"\n  optionLabel="name"\n  optionValue="id"\n  optionDisabled="unavailable"\n  optionIcon="iconClass"\n  orientation="horizontal"\n  [(value)]="plan"\n  (selectionChange)="planChanged($event)"\n/>`;
  readonly projectedCode = `<neural-radio-group [(value)]="delivery">\n  <neural-radio value="standard">\n    <strong>Standard delivery</strong>\n    <small>3–5 business days · Free</small>\n  </neural-radio>\n  <neural-radio value="express">Express delivery</neural-radio>\n</neural-radio-group>`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-radio-group [options]="plans" [formField]="signalForm.plan" />\n\n<!-- Reactive Forms -->\n<neural-radio-group [options]="plans" [formControl]="planControl" />\n\n<!-- Template-driven Forms -->\n<neural-radio-group [options]="plans" name="plan" [(ngModel)]="plan" />`;
  readonly statesCode = `<neural-radio-group [options]="plans" disabled />\n<neural-radio-group [options]="plans" readonly />\n\n<neural-field required invalid fluid>\n  <neural-radio-group [options]="contactOptions" />\n  <small neuralFieldError>A contact method is required.</small>\n</neural-field>`;
  readonly unstyledCode = `<neural-radio-group\n  unstyled\n  [options]="architectures"\n  [(value)]="architecture"\n  [classes]="radioClasses"\n/>`;
  readonly groupInputs = [
    [
      'options',
      'readonly TOption[]',
      '[]',
      'Data-driven choices; takes precedence over projected radios.',
    ],
    [
      'optionLabel',
      'string',
      "'label'",
      'Property used as visible option text.',
    ],
    [
      'optionValue',
      'string',
      "'value'",
      'Property mapped to the nullable value model.',
    ],
    [
      'optionDisabled',
      'string',
      "'disabled'",
      'Property that disables an individual option.',
    ],
    [
      'optionIcon',
      'string',
      "'iconClass'",
      'Property containing an option icon class.',
    ],
    [
      'orientation',
      "'vertical' | 'horizontal'",
      "'vertical'",
      'Layout and ARIA orientation.',
    ],
    ['disabled', 'boolean', 'false', 'Disables every native radio input.'],
    [
      'readonly',
      'boolean',
      'false',
      'Keeps focus while blocking user mutation.',
    ],
    [
      'required',
      'boolean',
      'false',
      'Marks every native input and group as required.',
    ],
    [
      'invalid',
      'boolean',
      'false',
      'Exposes invalid state for ARIA and styling.',
    ],
    ['pending', 'boolean', 'false', 'Exposes aria-busy on the group.'],
    [
      'touched / dirty',
      'boolean',
      'false',
      'Forms state inputs retained for adapter parity.',
    ],
    [
      'fluid',
      'boolean',
      'false',
      'Expands the group to available inline size.',
    ],
    ['radioGroupId', 'string', "''", 'Explicit stable group id.'],
    [
      'radioName / name',
      'string',
      "''",
      'Shared native input name; name takes precedence.',
    ],
    [
      'ariaLabel / ariaLabelledby',
      'string',
      "''",
      'Accessible naming options for the radiogroup.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['radioGroupClass', 'string', "''", 'Additive consumer root classes.'],
    ['classes', 'NeuralRadioClasses', '{}', 'Typed visual class slots.'],
  ] as const;
  readonly radioInputs = [
    [
      'value',
      'TValue',
      'required',
      'Value committed when the projected option is selected.',
    ],
    ['disabled', 'boolean', 'false', 'Disables this projected option.'],
    [
      'iconClass',
      'string',
      "''",
      'Optional icon; nt base class is normalized automatically.',
    ],
    [
      'radioClass',
      'string',
      "''",
      'Additive classes for this projected option.',
    ],
  ] as const;
  readonly models = [
    [
      'value',
      'model<TValue | null>',
      'Selected value; valueChange supports two-way binding.',
    ],
  ] as const;
  readonly outputs = [
    [
      'selectionChange',
      'NeuralRadioSelectionChange',
      'User-only semantic event with previous value, option and source.',
    ],
    ['touch', 'void', 'Emitted when focus leaves the complete group.'],
  ] as const;
  readonly methods = [
    [
      'focus(options?)',
      'void',
      'Moves focus to the selected or first enabled roving tab stop.',
    ],
    [
      'reset()',
      'void',
      'Restores the nullable value model to null without a user event.',
    ],
  ] as const;
  readonly publicTypes = [
    ['NeuralRadioOrientation', "'horizontal' | 'vertical'"],
    ['NeuralRadioInteractionSource', "'keyboard' | 'pointer'"],
    [
      'NeuralRadioSelectionChange<TValue, TOption>',
      '{ value; previousValue; option; source }',
    ],
    [
      'NeuralRadioClasses',
      'Typed root, option, input, control, state, label and icon slots.',
    ],
  ] as const;
  readonly layoutTokens = [
    '--neural-radio-group-gap',
    '--neural-radio-group-width',
    '--neural-radio-gap',
    '--neural-radio-size',
    '--neural-radio-mark-size',
    '--neural-radio-control-offset',
    '--neural-radio-font-family',
    '--neural-radio-font-size',
    '--neural-radio-line-height',
  ];
  readonly stateTokens = [
    '--neural-radio-background',
    '--neural-radio-background-hover',
    '--neural-radio-border',
    '--neural-radio-border-color-hover',
    '--neural-radio-border-color-focus',
    '--neural-radio-border-color-selected',
    '--neural-radio-border-color-invalid',
    '--neural-radio-color-selected',
    '--neural-radio-mark-color',
    '--neural-radio-label-color',
    '--neural-radio-shadow',
    '--neural-radio-shadow-focus',
    '--neural-radio-focus-ring',
    '--neural-radio-focus-ring-offset',
    '--neural-radio-disabled-opacity',
  ];
  readonly motionTokens = [
    '--neural-radio-transition',
    '--neural-radio-mark-transition',
  ];
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  selectionChanged(event: NeuralRadioSelectionChange<string, Plan>): void {
    this.eventStatus.set(
      `${String(event.previousValue)} → ${event.value} via ${event.source}`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/radio${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): RadioDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is RadioDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
