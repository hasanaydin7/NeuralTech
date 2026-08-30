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
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormField, email, form, required } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  NeuralField,
  NeuralFieldControl,
  NeuralFieldError,
  NeuralFieldHint,
  NeuralFieldLabel,
} from '@neural-ng/core/field';
import { NeuralInput } from '@neural-ng/core/input';
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

type FieldDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-field-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FormField,
    FormsModule,
    NeuralField,
    NeuralFieldControl,
    NeuralFieldError,
    NeuralFieldHint,
    NeuralFieldLabel,
    NeuralInput,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './field.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly profile = signal({ workEmail: '' });
  readonly profileForm = form(this.profile, (path) => {
    required(path.workEmail, { message: 'Work email is required.' });
    email(path.workEmail, { message: 'Enter a valid email address.' });
  });
  templateEmail = 'template@neural.ng';
  readonly reactiveEmail = new FormControl('reactive@neural.ng', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly selectedView = signal<FieldDocView>(
    resolveFieldDocView(this.router.url),
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
    FieldDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic composition', 'basic'],
      ['Angular Forms', 'forms'],
      ['States', 'states'],
      ['Native bridge', 'native-bridge'],
      ['Descriptions', 'descriptions'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Relationships', 'relationships'],
      ['Deterministic IDs', 'deterministic-ids'],
      ['Announcements', 'announcements'],
      ['Responsibility', 'responsibility'],
    ],
    api: [
      ['Declarations', 'declarations'],
      ['Field inputs', 'inputs'],
      ['Directive inputs', 'directive-inputs'],
      ['State hooks', 'state-hooks'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };

  readonly importCode = `import {
  NeuralField,
  NeuralFieldControl,
  NeuralFieldError,
  NeuralFieldHint,
  NeuralFieldLabel,
} from '@neural-ng/core/field';`;

  readonly basicCode = `<neural-field controlId="account-email" required fluid>
  <label neuralFieldLabel>Work email</label>
  <input neuralInput type="email" autocomplete="email" />
  <small neuralFieldHint>Used for account notifications.</small>
</neural-field>`;

  readonly formsCode = `<neural-field
  controlId="signal-email"
  required
  fluid
  [invalid]="profileForm.workEmail().touched() && profileForm.workEmail().invalid()"
>
  <label neuralFieldLabel>Signal Forms</label>
  <input neuralInput type="email" [formField]="profileForm.workEmail" />
  <small neuralFieldHint>Schema validation stays in the form.</small>
  @if (profileForm.workEmail().touched() && profileForm.workEmail().invalid()) {
    <small neuralFieldError>{{ profileForm.workEmail().errors()[0]?.message }}</small>
  }
</neural-field>

<neural-field controlId="reactive-email" fluid>
  <label neuralFieldLabel>Reactive Forms</label>
  <input neuralInput type="email" [formControl]="reactiveEmail" />
</neural-field>

<neural-field controlId="template-email" fluid>
  <label neuralFieldLabel>Template-driven</label>
  <input neuralInput type="email" name="email" [(ngModel)]="templateEmail" />
</neural-field>`;

  readonly statesCode = `<neural-field controlId="required" required>...</neural-field>
<neural-field controlId="invalid" invalid>...</neural-field>
<neural-field controlId="pending" pending>...</neural-field>
<neural-field controlId="readonly" readonly>...</neural-field>
<neural-field controlId="disabled" disabled>...</neural-field>`;

  readonly nativeBridgeCode = `<neural-field controlId="deployment-note" fluid>
  <label neuralFieldLabel>Deployment note</label>
  <textarea neuralFieldControl rows="4"></textarea>
  <small neuralFieldHint>Any compatible native or custom control can participate.</small>
</neural-field>`;

  readonly descriptionsCode = `<p id="slug-policy">Workspace slugs are public.</p>
<neural-field controlId="workspace-slug" describedBy="slug-policy">
  <label neuralFieldLabel>Slug</label>
  <input neuralInput />
  <small neuralFieldHint>Lowercase characters only.</small>
  <small neuralFieldHint>Maximum 48 characters.</small>
  <small neuralFieldError live="polite">This slug is unavailable.</small>
</neural-field>`;

  readonly unstyledCode = `<neural-field
  controlId="agent-key"
  unstyled
  class="grid gap-2 font-mono"
>
  <label neuralFieldLabel class="text-xs font-black uppercase text-cyan-400">
    Agent key
  </label>
  <input
    neuralFieldControl
    class="rounded-xl border-2 border-cyan-400/35 bg-slate-950 px-4 py-3 text-cyan-100"
  />
  <small neuralFieldHint class="text-cyan-300/70">Consumer-owned visuals.</small>
</neural-field>`;

  readonly declarations = [
    ['NeuralField', 'Component', 'Field context and visual state host.'],
    [
      'NeuralFieldLabel',
      'Directive',
      'Connects a visible label to the control.',
    ],
    ['NeuralFieldControl', 'Directive', 'Bridges native/custom controls.'],
    ['NeuralFieldHint', 'Directive', 'Adds a described-by hint slot.'],
    ['NeuralFieldError', 'Directive', 'Adds announced correction feedback.'],
  ] as const;

  readonly inputs = [
    ['controlId', 'string', 'required', 'Stable control and slot ID prefix.'],
    ['describedBy', 'string', `''`, 'External description IDs.'],
    [
      'invalid',
      'boolean',
      'false',
      'Synchronizes invalid presentation and ARIA.',
    ],
    ['required', 'boolean', 'false', 'Adds marker, ARIA and native required.'],
    ['disabled', 'boolean', 'false', 'Disables the participating control.'],
    ['readonly', 'boolean', 'false', 'Marks the control readonly.'],
    ['pending', 'boolean', 'false', 'Exposes busy validation state.'],
    ['fluid', 'boolean', 'false', 'Fills the available inline width.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
  ] as const;

  readonly tokens = [
    '--neural-field-gap',
    '--neural-field-width',
    '--neural-field-color',
    '--neural-field-font-family',
    '--neural-field-label-gap',
    '--neural-field-label-color',
    '--neural-field-label-font-size',
    '--neural-field-label-font-weight',
    '--neural-field-label-line-height',
    '--neural-field-required-color',
    '--neural-field-required-content',
    '--neural-field-message-font-size',
    '--neural-field-message-line-height',
    '--neural-field-hint-color',
    '--neural-field-error-color',
    '--neural-field-error-font-weight',
    '--neural-field-disabled-opacity',
    '--neural-field-pending-cursor',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveFieldDocView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isFieldDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/field${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveFieldDocView(url: string): FieldDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isFieldDocView(value: NeuralTabValue | null): value is FieldDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
