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
  NeuralInputMask,
  type NeuralInputMaskClasses,
  type NeuralInputMaskCompleteEvent,
} from '@neural-ng/core/input-mask';
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

type InputMaskDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-input-mask-page',
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
    NeuralInputMask,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './input-mask.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMaskPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly profile = signal({ phone: '', employeeCode: '' });
  readonly profileForm = form(this.profile);
  readonly basicPhone = signal('');
  readonly rawPhone = signal('');
  readonly policyValue = signal('');
  readonly headlessValue = signal('');
  readonly reactivePhone = new FormControl('(212) 555-0198', {
    nonNullable: true,
  });
  templatePhone = '(312) 555-0107';
  readonly eventStatus = signal('Complete and incomplete events appear here.');
  readonly selectedView = signal<InputMaskDocView>(
    resolveInputMaskDocView(this.router.url),
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
    InputMaskDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Mask grammar', 'grammar'],
      ['Formatted and raw', 'model'],
      ['Editing policy', 'editing'],
      ['Angular Forms', 'forms'],
      ['States and Field', 'states'],
      ['Native configuration', 'native'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Native semantics', 'native-semantics'],
      ['Naming', 'naming'],
      ['Keyboard and paste', 'keyboard'],
      ['Validation', 'validation-a11y'],
      ['International input', 'international'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Events', 'events'],
      ['Methods', 'methods'],
      ['Utilities', 'utilities'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly headlessClasses: NeuralInputMaskClasses = {
    root: 'grid gap-2 font-mono',
    input:
      'w-full rounded-xl border-2 border-cyan-400/35 bg-slate-950 px-4 py-3 text-cyan-100 caret-cyan-300 outline-none transition placeholder:text-cyan-800 hover:border-cyan-400/60 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/15',
  };

  readonly importCode = `import { NeuralInputMask } from '@neural-ng/core/input-mask';

@Component({ imports: [NeuralInputMask] })`;
  readonly basicCode = `<neural-input-mask
  mask="(999) 999-9999"
  inputMode="tel"
  autocomplete="tel"
  ariaLabel="Phone number"
  [(value)]="phone"
/>
<output>{{ phone() }}</output>`;
  readonly grammarCode = `<!-- 9: ASCII digit -->
<neural-input-mask mask="99/99/9999" placeholder="DD/MM/YYYY" />

<!-- a: Unicode letter; *: Unicode letter or number -->
<neural-input-mask mask="aa-***-99" />

<!-- Backslash escapes a rule character -->
<neural-input-mask mask="\\9-99" />`;
  readonly modelCode = `<neural-input-mask
  mask="(999) 999-9999"
  unmask
  [(value)]="phone"
  (complete)="completed($event)"
  (incomplete)="incomplete($event)"
/>
<!-- Model: 2125550198; display: (212) 555-0198 -->`;
  readonly editingCode = `<neural-input-mask
  mask="aa-9999"
  slotChar="•"
  [showMaskOnFocus]="true"
  clearIncomplete
/>
<!-- Caret-aware Backspace, Delete and paste are built in. -->`;
  readonly formsCode = `<!-- Signal Forms -->
<neural-input-mask mask="(999) 999-9999" [formField]="profileForm.phone" />

<!-- Reactive Forms -->
<neural-input-mask mask="(999) 999-9999" [formControl]="phone" />

<!-- Template-driven Forms -->
<neural-input-mask name="phone" mask="(999) 999-9999" [(ngModel)]="phone" />`;
  readonly statesCode = `<neural-field controlId="employee-code" required invalid fluid>
  <label neuralFieldLabel>Employee code</label>
  <neural-input-mask mask="aa-9999" [formField]="profileForm.employeeCode" />
  <small neuralFieldHint>Two letters followed by four digits.</small>
  <small neuralFieldError>Enter the complete employee code.</small>
</neural-field>

<neural-input-mask mask="999-999" disabled />
<neural-input-mask mask="999-999" value="123-456" readonly />
<neural-input-mask mask="999-999" pending />`;
  readonly nativeCode = `<neural-input-mask
  mask="(999) 999-9999"
  name="contactPhone"
  inputMaskId="contact-phone"
  autocomplete="tel"
  inputMode="tel"
  placeholder="(555) 555-5555"
  ariaLabel="Contact phone"
  fluid
/>`;
  readonly unstyledCode = `<neural-input-mask
  mask="aa-9999"
  unstyled
  fluid
  [classes]="maskClasses"
/>`;

  readonly inputs = [
    ['value', 'string', `''`, 'Formatted or raw model, according to unmask.'],
    ['mask', 'string', `''`, 'Deterministic mask grammar.'],
    ['slotChar', 'string', `'_'`, 'First character used for empty slots.'],
    ['unmask', 'boolean', 'false', 'Exposes raw slot characters to the model.'],
    [
      'showMaskOnFocus',
      'boolean',
      'true',
      'Shows literals and empty slots while focused.',
    ],
    ['clearIncomplete', 'boolean', 'false', 'Clears a partial value on blur.'],
    [
      'disabled',
      'boolean',
      'false',
      'Disables native interaction and Forms control.',
    ],
    [
      'readonly',
      'boolean',
      'false',
      'Keeps the value focusable without mutation.',
    ],
    ['required', 'boolean', 'false', 'Exposes native and ARIA required state.'],
    ['invalid', 'boolean', 'false', 'Exposes invalid styling and ARIA.'],
    ['pending', 'boolean', 'false', 'Exposes busy state through aria-busy.'],
    ['touched', 'boolean', 'false', 'External Forms state hook.'],
    ['dirty', 'boolean', 'false', 'External Forms state hook.'],
    ['name', 'string', `''`, 'Native form-control name.'],
    ['autocomplete', 'string', `'off'`, 'Native autofill purpose.'],
    ['inputMode', 'string', `'text'`, 'Native virtual keyboard hint.'],
    [
      'placeholder',
      'string',
      `''`,
      'Native placeholder; never an accessible label.',
    ],
    ['ariaLabel', 'string', `''`, 'Accessible name outside a visible label.'],
    ['inputMaskId', 'string', `''`, 'Explicit native input ID outside Field.'],
    ['fluid', 'boolean', 'false', 'Fills the available inline width.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['inputMaskClass', 'string', `''`, 'Consumer root class.'],
    ['inputClass', 'string', `''`, 'Consumer native input class.'],
    ['classes', 'NeuralInputMaskClasses', '{}', 'Typed root and input slots.'],
  ] as const;
  readonly events = [
    [
      'valueChange',
      'string',
      'Generated model output for every accepted edit.',
    ],
    [
      'complete',
      'NeuralInputMaskCompleteEvent',
      'All mask slots became complete.',
    ],
    [
      'incomplete',
      'NeuralInputMaskCompleteEvent',
      'Partial value blurred without clearing.',
    ],
    ['touch', 'void', 'Native input blurred.'],
  ] as const;
  readonly methods = [
    ['focus(options?)', 'Focuses the native masked input.'],
    ['select()', 'Selects the complete displayed value.'],
    ['reset()', 'Clears raw, formatted and model values.'],
  ] as const;
  readonly utilities = [
    [
      'formatNeuralMask(rawValue, mask, slotChar?)',
      'Formats raw characters with visible slots.',
    ],
    ['unmaskNeuralValue(value, mask)', 'Extracts accepted slot characters.'],
  ] as const;
  readonly tokens = [
    '--neural-input-mask-width',
    '--neural-input-mask-input-width',
    '--neural-input-mask-min-height',
    '--neural-input-mask-padding',
    '--neural-input-mask-color',
    '--neural-input-mask-color-hover',
    '--neural-input-mask-color-focus',
    '--neural-input-mask-color-readonly',
    '--neural-input-mask-caret-color',
    '--neural-input-mask-background',
    '--neural-input-mask-background-hover',
    '--neural-input-mask-background-focus',
    '--neural-input-mask-background-readonly',
    '--neural-input-mask-border',
    '--neural-input-mask-border-color-hover',
    '--neural-input-mask-border-color-focus',
    '--neural-input-mask-border-color-invalid',
    '--neural-input-mask-radius',
    '--neural-input-mask-shadow',
    '--neural-input-mask-shadow-focus',
    '--neural-input-mask-shadow-invalid',
    '--neural-input-mask-focus-ring',
    '--neural-input-mask-focus-ring-offset',
    '--neural-input-mask-placeholder-color',
    '--neural-input-mask-placeholder-opacity',
    '--neural-input-mask-disabled-opacity',
    '--neural-input-mask-font-family',
    '--neural-input-mask-font-size',
    '--neural-input-mask-line-height',
    '--neural-input-mask-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveInputMaskDocView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  reportComplete(event: NeuralInputMaskCompleteEvent): void {
    this.eventStatus.set(
      `Complete · model ${event.value} · raw ${event.rawValue} · formatted ${event.formattedValue}`,
    );
  }
  reportIncomplete(event: NeuralInputMaskCompleteEvent): void {
    this.eventStatus.set(
      `Incomplete · raw ${event.rawValue || 'empty'} · displayed ${event.formattedValue || 'empty'}`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isInputMaskDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/input-mask${suffix}`);
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveInputMaskDocView(url: string): InputMaskDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isInputMaskDocView(
  value: NeuralTabValue | null,
): value is InputMaskDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
