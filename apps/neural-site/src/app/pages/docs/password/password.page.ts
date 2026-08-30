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
  NeuralPassword,
  type NeuralPasswordClasses,
  type NeuralPasswordStrengthChange,
} from '@neural-ng/core/password';
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

type PasswordDocView = 'component' | 'accessibility' | 'api' | 'tokens';
@Component({
  selector: 'app-password-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FormField,
    FormsModule,
    NeuralPassword,
    ReactiveFormsModule,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './password.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<PasswordDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly currentPassword = signal('NeuralNg!2026');
  readonly feedbackPassword = signal('');
  readonly templatePassword = signal('');
  readonly headlessPassword = signal('Headless!2026');
  readonly reactivePassword = new FormControl('', { nonNullable: true });
  readonly account = signal({ password: '' });
  readonly accountForm = form(this.account);
  readonly eventStatus = signal('Strength feedback is presentational.');
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralPasswordClasses = {
    root: 'w-full max-w-md text-slate-100',
    inputGroup:
      'flex min-h-11 overflow-hidden rounded-xl border border-cyan-400/35 bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-300',
    input: 'min-w-0 flex-1 bg-transparent px-4 outline-none',
    toggle:
      'grid size-11 place-items-center text-cyan-300 hover:bg-cyan-400/10',
    toggleIcon: 'text-lg',
    feedback: 'mt-3 grid gap-2',
    meter: 'h-1 overflow-hidden rounded-full bg-slate-800',
    meterBar: 'h-full bg-cyan-300 transition-[width]',
    strengthLabel: 'text-xs text-slate-400',
    capsLock: 'mt-2 text-xs text-amber-300',
  };
  readonly pageLinks: Record<
    PasswordDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Feedback', 'feedback'],
      ['Forms', 'forms'],
      ['States', 'states'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Native semantics', 'native'],
      ['Visibility', 'visibility'],
      ['Security guidance', 'security'],
    ],
    api: [
      ['Inputs and models', 'inputs'],
      ['Events', 'events'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly importCode = `import { NeuralPassword } from '@neural-ng/core/password';\n\n@Component({ imports: [NeuralPassword] })`;
  readonly basicCode = `<neural-password ariaLabel="Current password" autocomplete="current-password" [(value)]="password" fluid />`;
  readonly feedbackCode = `<neural-password autocomplete="new-password" [(value)]="password" showFeedback fluid (strengthChange)="strengthChanged($event)" />`;
  readonly formsCode = `<neural-password [(ngModel)]="templatePassword" name="password" />\n<neural-password [formControl]="reactivePassword" />\n<neural-password [formField]="accountForm.password" />`;
  readonly statesCode = `<neural-password value="Readonly secret" readonly />\n<neural-password disabled />\n<neural-password required invalid touched />`;
  readonly unstyledCode = `<neural-password unstyled showFeedback fluid [(value)]="password" [classes]="classes" />`;
  readonly inputs = [
    [
      'value',
      'model<string>',
      "''",
      'Password value shared by Signals and Angular Forms.',
    ],
    [
      'visible',
      'model<boolean>',
      'false',
      'Current plain-text visibility state.',
    ],
    [
      'toggleVisibility',
      'boolean',
      'true',
      'Shows the accessible visibility control.',
    ],
    [
      'showFeedback',
      'boolean',
      'false',
      'Renders the deterministic strength meter and label.',
    ],
    ['disabled', 'boolean', 'false', 'Disables input and visibility control.'],
    [
      'readonly',
      'boolean',
      'false',
      'Keeps value focusable without allowing edits.',
    ],
    ['required', 'boolean', 'false', 'Applies native required semantics.'],
    ['invalid', 'boolean', 'false', 'Exposes invalid visual and ARIA state.'],
    ['pending', 'boolean', 'false', 'Exposes asynchronous validation state.'],
    ['touched', 'boolean', 'false', 'Form interaction state.'],
    ['dirty', 'boolean', 'false', 'Form modification state.'],
    [
      'minLength',
      'number | undefined',
      'undefined',
      'Native minimum length constraint.',
    ],
    [
      'maxLength',
      'number | undefined',
      'undefined',
      'Native maximum length constraint.',
    ],
    ['name', 'string', "''", 'Native form and password-manager field name.'],
    [
      'autocomplete',
      'string',
      'current-password',
      'Native password-manager autocomplete purpose.',
    ],
    ['inputMode', 'string', "''", 'Native virtual keyboard hint.'],
    ['placeholder', 'string', "''", 'Input placeholder.'],
    [
      'ariaLabel',
      'string',
      "''",
      'Accessible input name when no external label exists.',
    ],
    ['passwordId', 'string', 'generated', 'Native input ID.'],
    [
      'showIconClass',
      'string',
      'nt-eye',
      'Icon used while the value is hidden.',
    ],
    [
      'hideIconClass',
      'string',
      'nt-eye-off',
      'Icon used while the value is visible.',
    ],
    ['showPasswordLabel', 'string', 'locale', 'Visibility control label.'],
    ['hidePasswordLabel', 'string', 'locale', 'Hide control label.'],
    [
      'weakLabel / mediumLabel / strongLabel',
      'string',
      'locale',
      'Component strength-label overrides.',
    ],
    ['capsLockMessage', 'string', 'locale', 'Caps Lock warning override.'],
    ['fluid', 'boolean', 'false', 'Fills the available inline size.'],
    ['unstyled', 'boolean', 'false', 'Removes visual base classes.'],
    [
      'passwordClass / inputClass',
      'string',
      "''",
      'Additive root and native-input classes.',
    ],
    [
      'classes',
      'NeuralPasswordClasses',
      '{}',
      'Typed additive internal classes.',
    ],
  ] as const;
  readonly outputs = [
    ['valueChange', 'string', 'Implicit model output.'],
    ['visibleChange', 'boolean', 'Implicit visibility model output.'],
    ['visibilityChange', 'boolean', 'Semantic user visibility event.'],
    [
      'strengthChange',
      'NeuralPasswordStrengthChange',
      'Value, score and presentation strength.',
    ],
    ['touch', 'void', 'First blur/touch interaction.'],
    ['capsLockChange', 'boolean', 'Implicit Caps Lock model output.'],
  ] as const;
  readonly methods = [
    ['focus(options?)', 'Focuses the native password input.'],
    ['select()', 'Selects the complete native value.'],
    ['reset(value?)', 'Resets value and interaction state.'],
  ] as const;
  readonly classSlots = [
    ['root', 'Component root.'],
    ['inputGroup', 'Input and toggle frame.'],
    ['input', 'Native password input.'],
    ['toggle', 'Visibility button.'],
    ['toggleIcon', 'Visibility Neural icon.'],
    ['feedback', 'Strength feedback wrapper.'],
    ['meter', 'Strength meter track.'],
    ['meterBar', 'Strength meter fill.'],
    ['strengthLabel', 'Localized strength text.'],
    ['capsLock', 'Caps Lock message.'],
  ] as const;
  readonly tokens = [
    '--neural-password-width',
    '--neural-password-input-width',
    '--neural-password-min-height',
    '--neural-password-padding',
    '--neural-password-color',
    '--neural-password-color-readonly',
    '--neural-password-caret-color',
    '--neural-password-background',
    '--neural-password-border',
    '--neural-password-border-color-focus',
    '--neural-password-border-color-invalid',
    '--neural-password-radius',
    '--neural-password-shadow',
    '--neural-password-shadow-focus',
    '--neural-password-shadow-invalid',
    '--neural-password-focus-ring',
    '--neural-password-focus-ring-offset',
    '--neural-password-placeholder-color',
    '--neural-password-placeholder-opacity',
    '--neural-password-toggle-size',
    '--neural-password-toggle-color',
    '--neural-password-toggle-color-hover',
    '--neural-password-toggle-background',
    '--neural-password-toggle-background-hover',
    '--neural-password-meter-background',
    '--neural-password-meter-height',
    '--neural-password-meter-radius',
    '--neural-password-strength-weak',
    '--neural-password-strength-medium',
    '--neural-password-strength-strong',
    '--neural-password-message-color',
    '--neural-password-message-font-size',
    '--neural-password-disabled-opacity',
    '--neural-password-transition',
    '--neural-password-meter-transition',
  ] as const;
  constructor() {
    const sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd)
        this.selectedView.set(resolveView(e.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
  strengthChanged(event: NeuralPasswordStrengthChange): void {
    this.eventStatus.set(`${event.strength} · score ${event.score}/4`);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/password${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): PasswordDocView {
  const p = url.split(/[?#]/, 1)[0];
  if (p.endsWith('/accessibility')) return 'accessibility';
  if (p.endsWith('/api')) return 'api';
  if (p.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is PasswordDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
