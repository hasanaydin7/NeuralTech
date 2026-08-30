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
  NeuralCheckbox,
  NeuralTriStateCheckbox,
  type NeuralCheckboxClasses,
  type NeuralCheckboxChange,
  type NeuralTriStateCheckboxChange,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';
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

type CheckboxDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-checkbox-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FormField,
    FormsModule,
    NeuralCheckbox,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    NeuralTriStateCheckbox,
    ReactiveFormsModule,
  ],
  templateUrl: './checkbox.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly accepted = signal(false);
  readonly permission = signal<NeuralTriStateCheckboxValue>(null);
  readonly headlessChecked = signal(false);
  readonly directEvent = signal('No user action yet.');
  readonly signalModel = signal({ updates: true });
  readonly signalForm = form(this.signalModel);
  readonly reactiveControl = new FormControl(false, { nonNullable: true });
  templateValue = true;

  readonly selectedView = signal<CheckboxDocView>(
    resolveCheckboxDocView(this.router.url),
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
  readonly headlessClasses: NeuralCheckboxClasses = {
    root: 'inline-flex cursor-pointer select-none items-center gap-3 rounded-xl border border-cyan-300/30 bg-slate-950 px-4 py-3 font-mono text-cyan-50 shadow-[0_16px_45px_rgba(6,182,212,.12)]',
    input: 'sr-only peer',
    control:
      "grid size-5 place-items-center rounded border-2 border-cyan-400 bg-slate-900 transition after:size-2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-transparent after:opacity-0 after:content-[''] peer-focus-visible:ring-4 peer-focus-visible:ring-cyan-400/20",
    checkedControl:
      '!border-cyan-400 !bg-cyan-400 after:!border-slate-950 after:opacity-100',
    label: 'text-sm font-bold',
  };
  readonly pageLinks: Record<
    CheckboxDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Binary model', 'binary'],
      ['Tri-state model', 'tri-state'],
      ['States', 'states'],
      ['Angular Forms', 'forms'],
      ['Events', 'events'],
      ['Field composition', 'field'],
      ['Classes', 'classes'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native semantics', 'native-semantics'],
      ['Names', 'names'],
      ['Keyboard', 'keyboard'],
      ['Mixed state', 'mixed-state'],
      ['Disabled vs readonly', 'disabled-readonly'],
      ['Field state', 'field-state'],
    ],
    api: [
      ['Binary inputs', 'binary-inputs'],
      ['Tri-state inputs', 'tri-inputs'],
      ['Models', 'models'],
      ['Events', 'api-events'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
    ],
    tokens: [
      ['Layout', 'layout-tokens'],
      ['Color and state', 'state-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralCheckbox,
  NeuralTriStateCheckbox,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';

@Component({
  imports: [NeuralCheckbox, NeuralTriStateCheckbox],
})`;
  readonly binaryCode = `<neural-checkbox [(checked)]="accepted">
  I accept the terms
</neural-checkbox>`;
  readonly triStateCode = `<neural-tri-state-checkbox [(value)]="permission">
  Inherit workspace permission
</neural-tri-state-checkbox>`;
  readonly statesCode = `<neural-checkbox [checked]="true">Checked</neural-checkbox>
<neural-checkbox>Unchecked</neural-checkbox>
<neural-checkbox [checked]="true" disabled>Disabled</neural-checkbox>
<neural-checkbox [checked]="true" readonly>Readonly</neural-checkbox>
<neural-checkbox invalid>Invalid</neural-checkbox>
<neural-checkbox pending>Pending validation</neural-checkbox>`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-checkbox [formField]="profileForm.updates">Updates</neural-checkbox>

<!-- Reactive Forms -->
<neural-checkbox [formControl]="updatesControl">Updates</neural-checkbox>

<!-- Template-driven Forms -->
<neural-checkbox name="updates" [(ngModel)]="updates">Updates</neural-checkbox>`;
  readonly eventsCode = `<neural-checkbox
  [(checked)]="accepted"
  (stateChange)="handleChange($event)"
  (touch)="handleTouch()"
>
  Accept terms
</neural-checkbox>`;
  readonly fieldCode = `<neural-field required invalid pending>
  <neural-checkbox>Marketing consent</neural-checkbox>
  <small neuralFieldHint>Choose your preference.</small>
  <small neuralFieldError>Consent is required.</small>
</neural-field>`;
  readonly classesCode = `<neural-checkbox
  checkboxClass="max-w-md"
  inputClass="peer"
  labelClass="font-semibold"
  [classes]="{
    control: 'ring-offset-2',
    checkedControl: 'shadow-sm'
  }"
>
  Additive consumer classes
</neural-checkbox>`;
  readonly unstyledCode = `<neural-checkbox unstyled [(checked)]="checked" [classes]="classes">
  Consumer-owned checkbox
</neural-checkbox>`;

  readonly sharedInputs = [
    [
      'indeterminate (NeuralCheckbox)',
      'boolean',
      'false',
      'Presentation-only mixed state for partial collection selection.',
    ],
    [
      'disabled',
      'boolean',
      'false',
      'Disables the native input and removes interaction.',
    ],
    ['readonly', 'boolean', 'false', 'Keeps focus while preventing mutation.'],
    [
      'required',
      'boolean',
      'false',
      'Applies native and accessible required state.',
    ],
    ['invalid', 'boolean', 'false', 'Exposes invalid visual and ARIA state.'],
    ['pending', 'boolean', 'false', 'Exposes aria-busy during validation.'],
    ['touched', 'boolean', 'false', 'Forms/Field state contract.'],
    ['dirty', 'boolean', 'false', 'Forms/Field state contract.'],
    ['fluid', 'boolean', 'false', 'Fills the available inline width.'],
    ['unstyled', 'boolean', 'false', 'Removes all NeuralNg visual classes.'],
    ['inputId', 'string', "''", 'Native input id; generated when omitted.'],
    ['name', 'string', "''", 'Native form submission name.'],
    ['inputValue', 'string', "'on'", 'Native checked submission value.'],
    [
      'ariaLabel',
      'string',
      "''",
      'Accessible name when no visible label exists.',
    ],
    ['checkboxClass', 'string', "''", 'Additive class on the label root.'],
    ['inputClass', 'string', "''", 'Additive class on the native input.'],
    ['labelClass', 'string', "''", 'Additive class on projected label text.'],
    [
      'classes',
      'NeuralCheckboxClasses | NeuralTriStateCheckboxClasses',
      '{}',
      'Typed additive classes for structure and value states.',
    ],
  ] as const;
  readonly models = [
    [
      'checked',
      'ModelSignal<boolean>',
      'false',
      'Binary value; generates checkedChange.',
    ],
    [
      'value',
      'ModelSignal<boolean | null>',
      'false',
      'Tri-state value; generates valueChange.',
    ],
  ] as const;
  readonly events = [
    [
      'checkedChange',
      'boolean',
      'Generated by the binary checked model for two-way binding.',
    ],
    [
      'valueChange',
      'boolean | null',
      'Generated by the tri-state value model for two-way binding.',
    ],
    [
      'stateChange',
      'NeuralCheckboxChange',
      'Binary user action with current and previous values.',
    ],
    [
      'stateChange',
      'NeuralTriStateCheckboxChange',
      'Tri-state user action with current and previous values.',
    ],
    ['touch', 'void', 'Native input lost focus.'],
  ] as const;
  readonly methods = [
    ['focus', '(options?: FocusOptions) => void', 'Focuses the native input.'],
    ['reset', '() => void', 'Resets binary or tri-state value to false.'],
  ] as const;
  readonly binarySlots = [
    'root',
    'input',
    'control',
    'checkedControl',
    'label',
  ] as const;
  readonly triStateSlots = [...this.binarySlots, 'mixedControl'] as const;
  readonly publicTypes = [
    ['NeuralCheckboxChange', '{ checked, previousChecked, nativeEvent }'],
    ['NeuralTriStateCheckboxValue', 'boolean | null'],
    ['NeuralTriStateCheckboxChange', '{ value, previousValue, nativeEvent }'],
    [
      'NeuralCheckboxClasses',
      '{ root?, input?, control?, checkedControl?, label? }',
    ],
    [
      'NeuralTriStateCheckboxClasses',
      'NeuralCheckboxClasses & { mixedControl? }',
    ],
  ] as const;
  readonly layoutTokens = [
    '--neural-checkbox-gap',
    '--neural-checkbox-width',
    '--neural-checkbox-size',
    '--neural-checkbox-control-offset',
    '--neural-checkbox-radius',
    '--neural-checkbox-font-family',
    '--neural-checkbox-font-size',
    '--neural-checkbox-line-height',
  ] as const;
  readonly stateTokens = [
    '--neural-checkbox-background',
    '--neural-checkbox-background-hover',
    '--neural-checkbox-background-checked',
    '--neural-checkbox-border',
    '--neural-checkbox-border-color-hover',
    '--neural-checkbox-border-color-focus',
    '--neural-checkbox-border-color-checked',
    '--neural-checkbox-border-color-invalid',
    '--neural-checkbox-mark-color',
    '--neural-checkbox-label-color',
    '--neural-checkbox-shadow',
    '--neural-checkbox-shadow-focus',
    '--neural-checkbox-focus-ring',
    '--neural-checkbox-focus-ring-offset',
    '--neural-checkbox-disabled-opacity',
  ] as const;
  readonly motionTokens = [
    '--neural-checkbox-transition',
    '--neural-checkbox-mark-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveCheckboxDocView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  recordBinary(event: NeuralCheckboxChange): void {
    this.directEvent.set(`binary: ${event.previousChecked} → ${event.checked}`);
  }

  recordTriState(event: NeuralTriStateCheckboxChange): void {
    this.directEvent.set(
      `tri-state: ${String(event.previousValue)} → ${String(event.value)}`,
    );
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isCheckboxDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/checkbox${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveCheckboxDocView(url: string): CheckboxDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isCheckboxDocView(
  value: NeuralTabValue | null,
): value is CheckboxDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
