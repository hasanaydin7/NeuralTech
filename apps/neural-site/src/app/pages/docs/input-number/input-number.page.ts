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
  NeuralFieldLabel,
} from '@neural-ng/core/field';
import {
  NeuralInputNumber,
  type NeuralInputNumberClasses,
  type NeuralInputNumberCommit,
} from '@neural-ng/core/input-number';
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

type InputNumberDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-input-number-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FormField,
    FormsModule,
    NeuralField,
    NeuralFieldError,
    NeuralFieldHint,
    NeuralFieldLabel,
    NeuralInputNumber,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './input-number.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly quantity = signal<number | null>(12);
  readonly price = signal<number | null>(1249.9);
  readonly grouped = signal<number | null>(1234567.89);
  readonly bounded = signal<number | null>(5);
  readonly styled = signal<number | null>(42);
  readonly order = signal<{ amount: number | null }>({ amount: 25.5 });
  readonly orderForm = form(this.order);
  readonly reactiveAmount = new FormControl<number | null>(50.25);
  templateAmount: number | null = 75.75;
  readonly lastCommit = signal('No semantic commit yet.');
  readonly selectedView = signal<InputNumberDocView>(
    resolveInputNumberDocView(this.router.url),
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
  readonly pageLinks: Record<
    InputNumberDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Decimal', 'decimal'],
      ['Currency', 'currency'],
      ['Locale and precision', 'locale'],
      ['Bounds and stepping', 'bounds'],
      ['Prefix, suffix and icons', 'adornments'],
      ['Angular Forms', 'forms'],
      ['States and Field', 'states'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Spinbutton semantics', 'spinbutton'],
      ['Keyboard', 'keyboard'],
      ['Naming and states', 'naming'],
      ['Parsing', 'parsing'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Events', 'events'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Value contract', 'value-contract'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly headlessClasses: NeuralInputNumberClasses = {
    root: 'flex overflow-hidden rounded-xl border-2 border-violet-400/40 bg-slate-950 font-mono text-violet-100 focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-400/15',
    input: 'min-w-0 flex-1 bg-transparent px-4 py-3 outline-none',
    decrementButton:
      'grid size-12 place-items-center border-r border-violet-400/20 text-violet-300 hover:bg-violet-400/10',
    incrementButton:
      'grid size-12 place-items-center border-l border-violet-400/20 text-violet-300 hover:bg-violet-400/10',
    buttonIcon: 'text-base',
  };

  readonly importCode = `import { NeuralInputNumber } from '@neural-ng/core/input-number';

@Component({ imports: [NeuralInputNumber] })`;
  readonly decimalCode = `<neural-input-number
  inputId="quantity"
  ariaLabel="Quantity"
  [step]="1"
  [(value)]="quantity"
/>
<output>{{ quantity() }}</output>`;
  readonly currencyCode = `<neural-input-number
  mode="currency"
  currency="TRY"
  currencyDisplay="symbol"
  locale="tr-TR"
  [minFractionDigits]="2"
  [maxFractionDigits]="2"
  [(value)]="price"
/>`;
  readonly localeCode = `<neural-input-number locale="en-US" [useGrouping]="true" [maxFractionDigits]="2" [(value)]="amount" />
<neural-input-number locale="tr-TR" [useGrouping]="true" [maxFractionDigits]="2" [(value)]="amount" />
<neural-input-number locale="de-DE" [useGrouping]="false" [minFractionDigits]="3" [(value)]="amount" />`;
  readonly boundsCode = `<neural-input-number
  [min]="0"
  [max]="10"
  [step]="0.25"
  [(value)]="score"
  (valueCommit)="committed($event)"
/>
<!-- Arrow Up/Down step; Home/End use bounds; Enter/blur commit. -->`;
  readonly adornmentsCode = `<neural-input-number
  prefix="~"
  suffix=" kg"
  decrementIconClass="nt nt-minus"
  incrementIconClass="nt nt-plus"
  incrementAriaLabel="Add one kilogram"
  decrementAriaLabel="Remove one kilogram"
  [(value)]="weight"
/>`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-input-number [formField]="orderForm.amount" />

<!-- Reactive Forms -->
<neural-input-number [formControl]="amount" />

<!-- Template-driven Forms -->
<neural-input-number name="amount" [(ngModel)]="amount" />`;
  readonly statesCode = `<neural-field controlId="budget" required invalid fluid>
  <label neuralFieldLabel>Budget</label>
  <neural-input-number mode="currency" currency="USD" [formField]="orderForm.amount" />
  <small neuralFieldHint>Enter the approved budget.</small>
  <small neuralFieldError>A valid budget is required.</small>
</neural-field>

<neural-input-number disabled />
<neural-input-number readonly [value]="125" />
<neural-input-number pending />
<neural-input-number [showButtons]="false" />`;
  readonly unstyledCode = `<neural-input-number
  unstyled
  fluid
  decrementIconClass="nt nt-minus"
  incrementIconClass="nt nt-plus"
  [classes]="numberClasses"
  [(value)]="amount"
/>`;

  readonly inputs = [
    [
      'value',
      'number | null',
      'null',
      'Canonical numeric model; never localized text.',
    ],
    ['min', 'number | undefined', 'undefined', 'Minimum committed value.'],
    ['max', 'number | undefined', 'undefined', 'Maximum committed value.'],
    ['step', 'number', '1', 'Positive keyboard and button increment.'],
    [
      'mode',
      `'decimal' | 'currency'`,
      `'decimal'`,
      'NumberFormat presentation mode.',
    ],
    ['locale', 'string', `''`, 'Component-level locale override.'],
    ['currency', 'string', `'USD'`, 'ISO 4217 code in currency mode.'],
    [
      'currencyDisplay',
      'Intl currencyDisplay',
      `'symbol'`,
      'Symbol, narrowSymbol, code, or name.',
    ],
    [
      'prefix',
      'string',
      `''`,
      'Application-owned text before formatted value.',
    ],
    ['suffix', 'string', `''`, 'Application-owned text after formatted value.'],
    ['useGrouping', 'boolean', 'true', 'Uses locale grouping separators.'],
    [
      'minFractionDigits',
      'number | null',
      'null',
      'Minimum displayed fraction digits.',
    ],
    [
      'maxFractionDigits',
      'number | null',
      'null',
      'Maximum displayed fraction digits.',
    ],
    [
      'showButtons',
      'boolean',
      'true',
      'Renders decrement and increment controls.',
    ],
    ['disabled', 'boolean', 'false', 'Disables control and stepping.'],
    ['readonly', 'boolean', 'false', 'Keeps value focusable without editing.'],
    ['required', 'boolean', 'false', 'Exposes required semantics.'],
    ['invalid', 'boolean', 'false', 'Exposes application invalid state.'],
    ['pending', 'boolean', 'false', 'Exposes busy state.'],
    ['touched', 'boolean', 'false', 'External Forms state hook.'],
    ['dirty', 'boolean', 'false', 'External Forms state hook.'],
    ['fluid', 'boolean', 'false', 'Fills available width.'],
    ['inputId', 'string', `''`, 'Explicit native input ID.'],
    ['name', 'string', `''`, 'Native form-control name.'],
    ['autocomplete', 'string', `'off'`, 'Native autofill purpose.'],
    ['inputMode', 'string', `'decimal'`, 'Virtual keyboard hint.'],
    ['placeholder', 'string', `''`, 'Native placeholder.'],
    ['ariaLabel', 'string', `''`, 'Accessible name without a visible label.'],
    [
      'incrementAriaLabel',
      'string',
      `''`,
      'Localized increment name override.',
    ],
    [
      'decrementAriaLabel',
      'string',
      `''`,
      'Localized decrement name override.',
    ],
    ['incrementIconClass', 'string', `''`, 'Increment Neural Icon class.'],
    ['decrementIconClass', 'string', `''`, 'Decrement Neural Icon class.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['inputNumberClass', 'string', `''`, 'Consumer root class.'],
    ['inputClass', 'string', `''`, 'Consumer native input class.'],
    ['classes', 'NeuralInputNumberClasses', '{}', 'Typed visual slots.'],
  ] as const;
  readonly events = [
    ['valueChange', 'number | null', 'Generated model output.'],
    [
      'valueCommit',
      'NeuralInputNumberCommit',
      'Blur, Enter, keyboard, or button commit.',
    ],
    ['touch', 'void', 'Native input blurred.'],
  ] as const;
  readonly methods = [
    ['stepBy(direction, source)', 'Steps and emits a semantic commit.'],
    ['commit(source)', 'Parses, clamps, formats, and commits the draft.'],
    ['focus(options?)', 'Focuses the native input.'],
    ['select()', 'Selects the editable text.'],
    ['reset()', 'Clears value and transient parse state.'],
  ] as const;
  readonly tokens = [
    '--neural-input-number-width',
    '--neural-input-number-input-width',
    '--neural-input-number-min-height',
    '--neural-input-number-padding',
    '--neural-input-number-color',
    '--neural-input-number-background',
    '--neural-input-number-border',
    '--neural-input-number-border-color-focus',
    '--neural-input-number-border-color-invalid',
    '--neural-input-number-radius',
    '--neural-input-number-shadow',
    '--neural-input-number-shadow-focus',
    '--neural-input-number-focus-ring',
    '--neural-input-number-focus-ring-offset',
    '--neural-input-number-text-align',
    '--neural-input-number-button-size',
    '--neural-input-number-button-background',
    '--neural-input-number-button-background-hover',
    '--neural-input-number-disabled-opacity',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(
          resolveInputNumberDocView(event.urlAfterRedirects),
        );
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  reportCommit(event: NeuralInputNumberCommit): void {
    this.lastCommit.set(
      `${event.source}: ${event.previousValue ?? 'null'} → ${event.value ?? 'null'}`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isInputNumberDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/input-number${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveInputNumberDocView(url: string): InputNumberDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isInputNumberDocView(
  value: NeuralTabValue | null,
): value is InputNumberDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
