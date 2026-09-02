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
  NeuralInputOtp,
  type NeuralInputOtpClasses,
  type NeuralInputOtpCompleteEvent,
} from '@neural-ng/core/input-otp';
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

type InputOtpDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-input-otp-page',
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
    NeuralInputOtp,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './input-otp.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputOtpPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly verification = signal({ code: '' });
  readonly verificationForm = form(this.verification);
  readonly recoveryCode = signal('AI2026');
  readonly privateCode = signal('');
  readonly styledCode = signal('NG2026');
  readonly reactiveCode = new FormControl('123456', { nonNullable: true });
  templateCode = '654321';
  readonly status = signal('Waiting for the six-digit code.');
  readonly selectedView = signal<InputOtpDocView>(
    resolveInputOtpDocView(this.router.url),
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
    InputOtpDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Verification', 'verification'],
      ['Variants', 'variants'],
      ['Angular Forms', 'forms'],
      ['States and Field', 'states'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Group semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Autofill and paste', 'autofill'],
      ['Security boundary', 'security'],
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
  readonly headlessClasses: NeuralInputOtpClasses = {
    root: 'w-full',
    group: 'flex flex-wrap items-center justify-center gap-2',
    input:
      'size-12 rounded-xl border-2 border-cyan-400/35 bg-slate-950 text-center font-mono font-black text-cyan-100 caret-cyan-300 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/15',
    separator: 'font-black text-cyan-400',
  };
  readonly importCode = `import { NeuralInputOtp } from '@neural-ng/core/input-otp';\n\n@Component({ imports: [NeuralInputOtp] })`;
  readonly verificationCode = `<neural-field controlId="verification-code" fluid>\n  <label neuralFieldLabel for="verification-code">Verification code</label>\n  <neural-input-otp [formField]="verificationForm.code" [length]="6" autocomplete="one-time-code" (complete)="verify($event.value)" />\n  <small neuralFieldHint>Enter the code sent to your device.</small>\n</neural-field>`;
  readonly variantsCode = `<neural-input-otp mode="alphanumeric" separator="-" [(value)]="recoveryCode" />\n<neural-input-otp mask [(value)]="privateCode" />`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-input-otp [formField]="verificationForm.code" />\n\n<!-- Reactive Forms -->\n<neural-input-otp [formControl]="reactiveCode" />\n\n<!-- Template-driven Forms -->\n<neural-input-otp name="code" [(ngModel)]="templateCode" />`;
  readonly statesCode = `<neural-input-otp disabled />\n<neural-input-otp readonly value="123456" />\n<neural-input-otp required invalid />\n<neural-input-otp pending />`;
  readonly unstyledCode = `<neural-input-otp unstyled fluid mode="alphanumeric" separator="·" [classes]="otpClasses" [(value)]="code" />`;
  readonly inputs = [
    ['value', 'string', `''`, 'Canonical complete-code model.'],
    ['length', 'number', '6', 'Positive number of native cells.'],
    [
      'mode',
      `'numeric' | 'alphanumeric'`,
      `'numeric'`,
      'Accepted character grammar.',
    ],
    ['mask', 'boolean', 'false', 'Conceals cells; does not encrypt.'],
    ['separator', 'string', `''`, 'Presentational text between cells.'],
    [
      'autocomplete',
      'string',
      `'one-time-code'`,
      'First-cell autofill purpose.',
    ],
    ['inputMode', 'string', `''`, 'Virtual keyboard override.'],
    ['autoFocus', 'boolean', 'false', 'Focuses first empty cell after render.'],
    ['disabled', 'boolean', 'false', 'Disables all native cells.'],
    [
      'readonly',
      'boolean',
      'false',
      'Prevents editing while remaining focusable.',
    ],
    ['required', 'boolean', 'false', 'Exposes required semantics.'],
    ['invalid', 'boolean', 'false', 'Exposes invalid state.'],
    ['pending', 'boolean', 'false', 'Exposes busy state.'],
    ['touched / dirty', 'boolean', 'false', 'External Forms state hooks.'],
    ['name', 'string', `''`, 'Adds a hidden native form value.'],
    ['inputOtpId', 'string', `''`, 'Stable group and cell ID prefix.'],
    ['ariaLabel', 'string', `''`, 'Accessible group name override.'],
    ['cellAriaLabel', 'string', `''`, 'Localized {current}/{total} template.'],
    ['fluid', 'boolean', 'false', 'Fills available width.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    [
      'inputOtpClass / inputClass',
      'string',
      `''`,
      'Consumer root and cell classes.',
    ],
    ['classes', 'NeuralInputOtpClasses', '{}', 'Typed visual slots.'],
  ] as const;
  readonly events = [
    ['valueChange', 'string', 'Generated model output.'],
    ['complete', 'NeuralInputOtpCompleteEvent', 'Every cell is filled.'],
    ['touch', 'void', 'Focus leaves the complete group.'],
  ] as const;
  readonly methods = [
    ['focus(options?)', 'Focuses the first empty cell, or the last cell.'],
    ['select()', 'Focuses and selects the first cell.'],
    ['reset()', 'Clears the string model.'],
  ] as const;
  readonly tokens = [
    '--neural-input-otp-width',
    '--neural-input-otp-input-size',
    '--neural-input-otp-gap',
    '--neural-input-otp-color',
    '--neural-input-otp-background',
    '--neural-input-otp-background-hover',
    '--neural-input-otp-border',
    '--neural-input-otp-border-color-hover',
    '--neural-input-otp-border-color-focus',
    '--neural-input-otp-border-color-invalid',
    '--neural-input-otp-radius',
    '--neural-input-otp-shadow',
    '--neural-input-otp-shadow-focus',
    '--neural-input-otp-focus-ring',
    '--neural-input-otp-focus-ring-offset',
    '--neural-input-otp-separator-color',
    '--neural-input-otp-disabled-opacity',
    '--neural-input-otp-transition',
  ] as const;
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveInputOtpDocView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  completed(event: NeuralInputOtpCompleteEvent): void {
    this.status.set(`Code ${event.value} is ready for server verification.`);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isInputOtpDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/input-otp${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveInputOtpDocView(url: string): InputOtpDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isInputOtpDocView(
  value: NeuralTabValue | null,
): value is InputOtpDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
